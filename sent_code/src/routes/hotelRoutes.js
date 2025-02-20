const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const Hotel = require("../models/Hotel");

const router = express.Router();

// Подключение к MongoDB
const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "uploads"
    });
});

// Настройка multer для сохранения файлов в памяти
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Маршрут для добавления отеля с изображениями
router.post("/add-hotel", upload.array("images", 5), async (req, res) => {
    try {
        console.log("Request Body:", req.body); // Логирование входящих данных
        console.log("Uploaded Files:", req.files); // Логирование загруженных файлов

        const { name, location, rating, amenities } = req.body;

        if (!name || !location || !rating) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No images uploaded" });
        }

        const imageIds = [];
        for (const file of req.files) {
            const uploadStream = gfs.openUploadStream(file.originalname, {
                contentType: file.mimetype
            });

            await new Promise((resolve, reject) => {
                uploadStream.write(file.buffer, (err) => {
                    if (err) {
                        console.error("Error uploading file:", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                uploadStream.end();
            });

            console.log("Uploaded file ID:", uploadStream.id); // Логирование ID загруженного файла
            imageIds.push(uploadStream.id);
        }

        const hotel = new Hotel({
            name,
            location,
            rating: parseFloat(rating),
            amenities: amenities.split(",").map(amenity => amenity.trim()),
            images: imageIds
        });

        await hotel.save();
        res.status(201).json(hotel);
    } catch (error) {
        console.error("Error creating hotel:", error.message);
        res.status(400).json({ error: error.message });
    }
});

router.get("/image/:id", async (req, res) => {
    try {
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        console.log("Fetching image with ID:", fileId);

        const files = await gfs.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            console.log("File not found in GridFS");
            return res.status(404).json({ error: "File not found" });
        }

        console.log("File found in GridFS:", files[0]);

        // Set proper content type
        res.set('Content-Type', files[0].contentType);

        const readStream = gfs.openDownloadStream(fileId);
        readStream.on('error', (error) => {
            console.error("Error in read stream:", error);
            res.status(500).json({ error: "Error reading file stream" });
        });

        readStream.pipe(res);
    } catch (error) {
        console.error("Error fetching image:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Получить список отелей
router.get("/", async (req, res) => {
    try {
        const hotels = await Hotel.find();
        console.log("Hotels fetched:", hotels); // Логирование полученных отелей
        res.json(hotels);
    } catch (err) {
        console.error("Error fetching hotels:", err.message); // Логирование ошибки
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// search (2 task)
router.get("/search", async (req, res) => {
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 1;
    const maxRating = req.query.maxRating ? parseFloat(req.query.maxRating) : 5;

    try {
        const pipeline = [
            // 1. Match hotels within the rating range
            {
                $match: {
                    rating: { $gte: minRating, $lte: maxRating }
                }
            },

            // 2. Grouping by rating range using updated boundaries
            {
                $bucket: {
                    groupBy: "$rating",
                    boundaries: [0, 1, 2, 3, 4, 5, 6],  // Corrected boundaries
                    default: "5+",
                    output: {
                        count: { $sum: 1 },
                        hotels: { $push: { name: "$name", location: "$location", rating: "$rating" } }
                    }
                }
            },

            // 3. Projecting the final output
            {
                $project: {
                    _id: 0,
                    ratingRange: "$_id",
                    count: 1,
                    hotels: 1
                }
            }
        ];

        const result = await Hotel.aggregate(pipeline);
        res.json(result);
    } catch (err) {
        console.error("Ошибка при поиске отелей:", err);
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

module.exports = router;
