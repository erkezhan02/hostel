const express = require("express");
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
