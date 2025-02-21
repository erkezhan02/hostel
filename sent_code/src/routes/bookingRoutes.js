const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Маршрут для создания нового бронирования
router.post('/book-room', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, numberOfPeople, userEmail, hotelId } = req.body;

        // Создаем новую запись о бронировании
        const newBooking = new Booking({
            checkInDate,
            checkOutDate,
            numberOfPeople,
            userEmail,
            hotelId
        });

        // Сохраняем запись в базу данных
        await newBooking.save();

        res.status(200).json({ message: 'Room booked successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error booking room' });
    }
});

module.exports = router;