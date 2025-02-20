import mongoose from "mongoose";
require("dotenv").config();

const roomSchema = new mongoose.Schema({
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["available", "booked"], default: "available" }
});