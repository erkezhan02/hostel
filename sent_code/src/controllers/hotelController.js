const Hotel = require("../models/Hotel");

exports.getHotels = async (req, res) => {
    const hotels = await Hotel.find()
    res.json(hotels)
}