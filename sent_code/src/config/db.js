const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .then(() => { console.log("Connected to DB") })
    } catch (error) {
        console.error("MongoDB Connection Error:", error)
        process.exit(1);
    }
}

module.exports = connectDB;