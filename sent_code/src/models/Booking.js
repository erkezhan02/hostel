import mongoose from "mongoose";
require("dotenv").config();

const bookingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    check_in: { type: Date, required: true },
    check_out: { type: Date, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" }
});