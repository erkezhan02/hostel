const express = require("express");
const mongoose = require("mongoose");
const Hotel = require("../models/hotel");
const Log = require("../sent_code/src/models/log");
const { verifyToken } = require("../sent_code/src/middlewares/authMiddleware");
const checkRole = require("../sent_code/src/middlewares/checkRole");

const router = express.Router();

async function logAction(action, req, res, responseData) {
    await Log.create({
        action,
        endpoint: req.originalUrl,
        method: req.method,
        user: req.user?.email || "Anonymous",
        requestData: req.body,
        responseData,
        statusCode: res.statusCode,
        timestamp: new Date()
    });
}

// ✅ Получить список отелей
router.get("/", verifyToken, async (req, res) => {
    try {
        const hotels = await Hotel.find();
        await logAction("GET_HOTELS", req, res, hotels);
        res.json(hotels);
    } catch (err) {
        await logAction("GET_HOTELS_ERROR", req, res, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// search (2 task)
router.get("/search", verifyToken, async (req, res) => {
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 1;
    const maxRating = req.query.maxRating ? parseFloat(req.query.maxRating) : 5;

    try {
        const pipeline = [
            {
                $addFields: {
                    rating: {
                        $cond: {
                            if: { $isNumber: "$rating" },
                            then: "$rating",
                            else: { $toDouble: { $ifNull: ["$rating", 0] } }
                        }
                    }
                }
            },

            {
                $match: {
                    rating: { $exists: true, $gte: minRating, $lte: maxRating }
                }
            },

            {
                $unwind: {
                    path: "$amenities",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    location: { $first: "$location" },
                    rating: { $first: "$rating" },
                    amenities: { $addToSet: "$amenities" }
                }
            },

            {
                $bucket: {
                    groupBy: "$rating",
                    boundaries: [0, 1, 2, 3, 4, 5, 6],
                    default: "5+",
                    output: {
                        count: { $sum: 1 },
                        hotels: {
                            $push: {
                                _id: "$_id",
                                name: "$name",
                                location: "$location",
                                rating: "$rating",
                                amenities: "$amenities"
                            }
                        }
                    }
                }
            },

            {
                $project: {
                    _id: 0,
                    ratingRange: "$_id",
                    count: 1,
                    hotels: 1
                }
            },

            {
                $out: "hotelSearchResults"
            }
        ];

        // Запуск pipeline
        await Hotel.aggregate(pipeline);

        // Получение результатов из коллекции
        const result = await mongoose.connection.db.collection("hotelSearchResults").find({}).toArray();

        // 📝 Логируем результат, а не промежуточные данные
        await logAction("SEARCH_HOTELS", req, res, result);

        if (result.length === 0) {
            return res.status(404).json({ message: "Отелей с таким рейтингом не найдено." });
        }

        res.json(result);
    } catch (err) {
        await logAction("SEARCH_HOTELS_ERROR", req, res, { error: err.message });
        console.error("❌ Ошибка при поиске отелей:", err);
        res.status(500).json({ error: err.message });
    }
});


// ✅ Создать отель
router.post("/", verifyToken,checkRole("admin"),async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        await logAction("CREATE_HOTEL", req, res, hotel);
        res.status(201).json(hotel);
    } catch (err) {
        await logAction("CREATE_HOTEL_ERROR", req, res, { error: err.message });
        res.status(400).json({ error: err.message });
    }
});

// ✅ Обновить отель ($set)
router.put("/:id",verifyToken, checkRole("admin"),async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!hotel) {
            await logAction("UPDATE_HOTEL_NOT_FOUND", req, res, { error: "Отель не найден" });
            return res.status(404).json({ error: "Отель не найден" });
        }
        await logAction("UPDATE_HOTEL", req, res, hotel);
        res.json(hotel);
    } catch (err) {
        await logAction("UPDATE_HOTEL_ERROR", req, res, { error: err.message });
        res.status(400).json({ error: err.message });
    }
});

// Эндпоинт для удаления тестовых данных (удаление коллекции "hotels_test")
router.delete("/delete-test-hotels",async (req, res) => {
    try {
        await mongoose.connection.db.dropCollection("hotels_test");
        await logAction("DELETE_TEST_HOTELS", req, res, { message: "🗑️ Тестовые данные успешно удалены." });
        res.json({ message: "🗑️ Тестовые данные успешно удалены." });
    } catch (error) {
        if (error.codeName === "NamespaceNotFound") {
            await logAction("DELETE_TEST_HOTELS_NOT_FOUND", req, res, { message: "Коллекция hotels_test не существует." });
            return res.json({ message: "Коллекция hotels_test не существует." });
        }
        await logAction("DELETE_TEST_HOTELS_ERROR", req, res, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ✅ Добавить удобство в `amenities` ($push)
router.put("/:id/add-amenity", verifyToken,checkRole("admin"),async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { $push: { amenities: req.body.amenity } }, { new: true });
        await logAction("ADD_AMENITY", req, res, hotel);
        res.json(hotel);
    } catch (err) {
        await logAction("ADD_AMENITY_ERROR", req, res, { error: err.message });
        res.status(400).json({ error: err.message });
    }
});

// ✅ Удалить удобство из `amenities` ($pull)
router.put("/:id/remove-amenity", verifyToken,checkRole("admin"),async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { $pull: { amenities: req.body.amenity } }, { new: true });
        await logAction("REMOVE_AMENITY", req, res, hotel);
        res.json(hotel);
    } catch (err) {
        await logAction("REMOVE_AMENITY_ERROR", req, res, { error: err.message });
        res.status(400).json({ error: err.message });
    }
});

// ✅ Удалить отель
router.delete("/:id", verifyToken,checkRole("admin"),async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        if (!hotel) {
            await logAction("DELETE_HOTEL_NOT_FOUND", req, res, { error: "Отель не найден" });
            return res.status(404).json({ error: "Отель не найден" });
        }
        await logAction("DELETE_HOTEL", req, res, hotel);
        res.json({ message: "Отель удален" });
    } catch (err) {
        await logAction("DELETE_HOTEL_ERROR", req, res, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// Ensure indexes before checking
async function ensureIndexes() {
    const testCollection = mongoose.connection.db.collection("hotels_test");

    try {
        // Drop existing TTL index if exists (avoid conflict)
        const indexes = await testCollection.indexes();
        const ttlIndex = indexes.find(index => index.name === "createdAt_1");

        if (ttlIndex) {
            console.log("⚠️ Dropping existing TTL index due to option conflict...");
            await testCollection.dropIndex("createdAt_1");
        }

        // Recreate all necessary indexes
        await testCollection.createIndex({ rating: 1, location: 1 });      // Compound index
        await testCollection.createIndex({ amenities: 1 });               // Multikey index
        await testCollection.createIndex({ name: "text" });               // Text index
        await testCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL index

        console.log("✅ All necessary indexes ensured.");
    } catch (error) {
        console.error("❌ Error ensuring indexes:", error);
        throw error;
    }
}


// 4 task
router.get("/check-indexes", async (req, res) => {
    try {
        const testCollection = mongoose.connection.db.collection("hotels_test");

        // Ensure indexes before checking
        await ensureIndexes();

        // Queries to check indexes
        const queries = {
            compound: { rating: { $gte: 3 }, location: "Алматы" },
            multiKey: { amenities: "Wi-Fi" },
            textSearch: { $text: { $search: "TestHotel" } },
            ttl: { createdAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) } }
        };

        const results = {};

        // 📊 Function to get detailed query execution stats
        async function getStats(query, indexField = null) {
            let result;
            try {
                const cursor = indexField
                    ? testCollection.find(query).hint(indexField)
                    : testCollection.find(query);

                result = await cursor.explain("executionStats");
            } catch (err) {
                console.error(`❌ Error in getStats for ${JSON.stringify(query)}:`, err);
                return { totalDocsExamined: "N/A", executionTimeMillis: "N/A", error: err.message };
            }

            const executionStats = result.executionStats;

            return {
                query: query,
                totalDocsExamined: executionStats?.totalDocsExamined ?? "N/A",
                nReturned: executionStats?.nReturned ?? "N/A",
                executionTimeMillis: executionStats?.executionTimeMillis ?? "N/A",
                indexUsed: executionStats?.indexBounds ?? "N/A",
                stage: executionStats?.executionStages?.stage ?? "N/A"
            };
        }

        // 🚀 Checking indexes for each query
        for (const key in queries) {
            const query = queries[key];

            if (key === "textSearch") {
                // Text search query with index usage check
                const withIndex = await testCollection.find(query, { score: { $meta: "textScore" } })
                    .project({ name: 1, location: 1, score: { $meta: "textScore" } })
                    .explain("executionStats");

                results[key] = {
                    withoutIndex: await getStats(query),
                    withIndex: {
                        totalDocsExamined: withIndex.executionStats?.totalDocsExamined ?? "N/A",
                        nReturned: withIndex.executionStats?.nReturned ?? "N/A",
                        executionTimeMillis: withIndex.executionStats?.executionTimeMillis ?? "N/A",
                        indexUsed: withIndex.executionStats?.indexBounds ?? "N/A",
                        stage: withIndex.executionStats?.executionStages?.stage ?? "N/A"
                    }
                };
            } else {
                // For non-text queries
                results[key] = {
                    withoutIndex: await getStats(query, { _id: 1 }),
                    withIndex: await getStats(query)
                };
            }
        }

        await logAction("CHECK_INDEXES_SUCCESS", req, res, results);
        res.json(results);
    } catch (err) {
        console.error("❌ Error during index check:", err);
        await logAction("CHECK_INDEXES_ERROR", req, res, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});



// Эндпоинт для генерации тестовых данных
router.post("/generate-test-hotels",async (req, res) => {
// router.post("/generate-test-hotels", verifyToken,async (req, res) => {
    try {
        const testCollection = mongoose.connection.db.collection("hotels_test");

        const existingCount = await testCollection.countDocuments();
        if (existingCount > 0) {
            await logAction("GENERATE_TEST_HOTELS_SKIPPED", req, res, { message: "⚠️ Тестовые данные уже существуют." });
            return res.status(400).json({ message: "⚠️ Тестовые данные уже существуют." });
        }

        const testData = [];
        for (let i = 0; i < 10000; i++) {
            testData.push({
                name: `TestHotel ${i}`,
                location: i % 2 === 0 ? "Алматы" : "Астана",
                rating: Math.floor(Math.random() * 5) + 1,
                amenities: ["Wi-Fi", "Бассейн", "Парковка"],
                createdAt: new Date()
            });
        }

        await testCollection.insertMany(testData);
        await logAction("GENERATE_TEST_HOTELS", req, res, { message: "✅ 10,000 тестовых отелей добавлено." });
        res.json({ message: "✅ 10,000 тестовых отелей добавлено." });
    } catch (error) {
        await logAction("GENERATE_TEST_HOTELS_ERROR", req, res, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
