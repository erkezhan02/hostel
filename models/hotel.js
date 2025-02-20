const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, required: true },
    amenities: { type: [String] },
    createdAt: { type: Date, default: Date.now }
});

// ✅ 1. Составной индекс (по рейтингу и локации)
hotelSchema.index({ rating: 1, location: 1 });

// ✅ 2. Мультиключевой индекс (по массиву удобств)
hotelSchema.index({ amenities: 1 });

// ✅ 3. Оптимизированный текстовый индекс
hotelSchema.index(
    { name: "text" },
    { weights: { name: 5 } }
);


// ✅ 4. TTL-индекс (удаляет документы через 1 час после создания)
hotelSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

console.log("✅ Все индексы успешно пересозданы.");

module.exports = mongoose.model("Hotel", hotelSchema);
