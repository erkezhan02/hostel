    const mongoose = require('mongoose')
    const dotenv = require("dotenv")
    dotenv.config();

    const hotelSchema = new mongoose.Schema({
        name: { type: String, required: true },
        location: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5 },
        amenities: { type: [String], default: [] },
        images: [{ type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }], // Ссылки на файлы в GridFS
        metadata: { type: mongoose.Schema.Types.Mixed } // Гибкие JSON-поля
    });

    module.exports = mongoose.model("Hotel", hotelSchema);