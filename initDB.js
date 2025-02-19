require("dotenv").config();
const mongoose = require("mongoose");

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB подключен"))
    .catch(err => console.error("Ошибка подключения:", err));

// Определяем схемы
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ["guest", "admin", "hotel_owner"], required: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ }
});

const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    amenities: { type: [String], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed } // Гибкие JSON-поля
});


const roomSchema = new mongoose.Schema({
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["available", "booked"], default: "available" }
});

const bookingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    check_in: { type: Date, required: true },
    check_out: { type: Date, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" }
});

const reviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 }
});


// Создаем модели
const User = mongoose.model("User", userSchema);
const Hotel = mongoose.model("Hotel", hotelSchema);
const Room = mongoose.model("Room", roomSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const Review = mongoose.model("Review", reviewSchema);

// Функция для инициализации данных
async function initDB() {
    try {
        await User.deleteMany({});
        await Hotel.deleteMany({});
        await Room.deleteMany({});
        await Booking.deleteMany({});
        await Review.deleteMany({});

        const users = await User.insertMany([
            { name: "Алинур", role: "guest", email: "alinurlpv@gmail.com" },
            { name: "Еркежан", role: "admin", email: "erkezhan@gmail.com" },
            { name: "Отель Luxe", role: "hotel_owner", email: "luxe@example.com" }
        ]);

        const hotels = await Hotel.insertMany([
            { 
                name: "Grand Hotel", 
                location: "Алматы", 
                rating: 4.5, 
                amenities: ["Wi-Fi", "Бассейн", "Фитнес"], 
                metadata: { 
                    reviews_count: 120, 
                    special_offers: [
                        { type: "discount", value: 10 },
                        { type: "bonus", description: "Бесплатный завтрак" }
                    ] 
                } 
            },
            { 
                name: "City Inn", 
                location: "Астана", 
                rating: 4.2, 
                amenities: ["Wi-Fi", "Парковка"], 
                metadata: { 
                    reviews_count: 80, 
                    special_offers: [
                        { type: "discount", value: 15 }
                    ] 
                } 
            }
        ]);        

        const rooms = await Room.insertMany([
            { hotel_id: hotels[0]._id, type: "Deluxe", price: 15000, status: "available" },
            { hotel_id: hotels[0]._id, type: "Standard", price: 10000, status: "booked" },
            { hotel_id: hotels[1]._id, type: "Suite", price: 20000, status: "available" }
        ]);

        await Booking.insertMany([
            { user_id: users[0]._id, hotel_id: hotels[0]._id, room_id: rooms[0]._id, check_in: new Date("2024-03-10"), check_out: new Date("2024-03-15"), status: "confirmed" }
        ]);

        await Review.insertMany([
            { user_id: users[0]._id, hotel_id: hotels[0]._id, rating: 5, comment: "Отличный отель, чисто и уютно!" },
            { user_id: users[0]._id, hotel_id: hotels[1]._id, rating: 4, comment: "Неплохое место, но парковка маленькая." }
        ]);

        console.log("База данных инициализирована!");
    } catch (err) {
        console.error("Ошибка инициализации:", err);
    } finally {
        mongoose.connection.close();
    }
}

// Запускаем функцию
initDB();
