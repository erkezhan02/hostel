require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Подключаем статику

// Подключаемся к MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB подключен"))
    .catch(err => console.error("Ошибка подключения:", err));

// Подключаем маршруты
const hotelRoutes = require("./routes/hotels");
app.use("/hotels", hotelRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
