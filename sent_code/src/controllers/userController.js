const User = require("../models/User")

// Create User
exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        res.status(201).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Obtain all users
exports.getUsers = async (req, res) => {
    const users = await User.find()
    res.json(users)
}