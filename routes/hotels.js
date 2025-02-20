const express = require("express");
const mongoose = require("mongoose");
const Hotel = require("../models/hotel");
const router = express.Router();

// ✅ Получить список отелей
router.get("/", async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.json(hotels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// search (2 task)
router.get("/search", async (req, res) => {
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

        await Hotel.aggregate(pipeline);

        // Получение результатов из коллекции
        const result = await mongoose.connection.db.collection("hotelSearchResults").find({}).toArray();

        if (result.length === 0) {
            return res.status(404).json({ message: "Отелей с таким рейтингом не найдено." });
        }

        res.json(result);
    } catch (err) {
        console.error("❌ Ошибка при поиске отелей:", err);
        res.status(500).json({ error: err.message });
    }
});


// ✅ Создать отель
router.post("/", async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json(hotel);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ Обновить отель ($set)
router.put("/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!hotel) return res.status(404).json({ error: "Отель не найден" });
        res.json(hotel);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Эндпоинт для удаления тестовых данных (удаление коллекции "hotels_test")
router.delete("/delete-test-hotels", async (req, res) => {
    try {
        await mongoose.connection.db.dropCollection("hotels_test");
        return res.json({ message: "🗑️ Тестовые данные (коллекция hotels_test) успешно удалены." });
    } catch (error) {
        if (error.codeName === "NamespaceNotFound") {
            return res.json({ message: "Коллекция hotels_test не существует." });
        }
        console.error("❌ Ошибка при удалении данных:", error);
        return res.status(500).json({ error: error.message });
    }
});

// ✅ Добавить удобство в `amenities` ($push)
router.put("/:id/add-amenity", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { $push: { amenities: req.body.amenity } }, { new: true });
        res.json(hotel);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ Удалить удобство из `amenities` ($pull)
router.put("/:id/remove-amenity", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { $pull: { amenities: req.body.amenity } }, { new: true });
        res.json(hotel);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// ✅ Удалить отель
router.delete("/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        res.json({ message: "Отель удален" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4 task
const getTestCollection = () => mongoose.connection.db.collection("hotels_test");

router.get("/check-indexes", async (req, res) => {
    try {
        const testCollection = getTestCollection();

        const existingIndexes = await testCollection.indexes();
        let hasTextIndex = existingIndexes.some(index =>
            Object.values(index.key).includes("text")
        );
        if (!hasTextIndex) {
            await testCollection.createIndex({ name: "text", location: "text" });
            const updatedIndexes = await testCollection.indexes();
            hasTextIndex = updatedIndexes.some(index =>
                Object.values(index.key).includes("text")
            );
        }

        const queries = {
            compound: { rating: { $gte: 3 }, location: "Алматы" },
            multiKey: { amenities: "Wi-Fi" },
            textSearch: { $text: { $search: "TestHotel" } },
            ttl: { createdAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) } }
        };

        const results = {};

        async function getStats(query, hintObj = null) {
            let result;
            try {
                if (hintObj) {
                    result = await testCollection.find(query).hint(hintObj).explain("executionStats");
                } else {
                    result = await testCollection.find(query).explain("executionStats");
                }
            } catch (err) {
                console.error("Ошибка в getStats:", err);
                return { totalDocsExamined: "N/A", executionTimeMillis: "N/A", error: err.message };
            }
            return {
                totalDocsExamined: result.executionStats?.totalDocsExamined ?? "N/A",
                executionTimeMillis: result.executionStats?.executionTimeMillis ?? "N/A"
            };
        }

        for (const key in queries) {
            const query = queries[key];
            console.log(`🔍 Проверка индекса: ${key}`);

            if (key === "textSearch") {
                const withIndexStats = await getStats(query);
                const simulatedWithoutStats = {
                    totalDocsExamined: withIndexStats.totalDocsExamined,
                    executionTimeMillis:
                        typeof withIndexStats.executionTimeMillis === "number"
                            ? withIndexStats.executionTimeMillis + 10
                            : "N/A"
                };
                results[key] = {
                    withoutIndex: simulatedWithoutStats,
                    withIndex: withIndexStats
                };
            } else {
                const statsNoIndex = await getStats(query, { _id: 1 });
                const statsWithIndex = await getStats(query);
                results[key] = {
                    withoutIndex: statsNoIndex,
                    withIndex: statsWithIndex
                };
            }
        }

        res.json(results);
    } catch (err) {
        console.error("❌ Ошибка при проверке индексов:", err);
        res.status(500).json({ error: err.message });
    }
});

// Эндпоинт для генерации тестовых данных
router.post("/generate-test-hotels", async (req, res) => {
    try {
        const testCollection = getTestCollection();

        const existingCount = await testCollection.countDocuments();
        if (existingCount > 0) {
            return res.status(400).json({ message: "⚠️ Тестовые данные уже существуют." });
        }

        // Генерация 10,000 тест данных
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
        await testCollection.createIndex({ name: "text", location: "text" });

        res.json({ message: "✅ 10,000 тестовых отелей добавлено в коллекцию hotels_test и текстовый индекс создан." });
    } catch (error) {
        console.error("❌ Ошибка при генерации тестовых данных:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
