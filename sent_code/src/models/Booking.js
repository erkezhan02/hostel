const mongoose = require("mongoose")
require("dotenv").config();

const bookingSchema = new mongoose.Schema({
    checkInDate: {
        type: String,
        required: true
    },
    checkOutDate: {
        type: String,
        required: true
    },
    numberOfPeople: {
        type: Number,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);