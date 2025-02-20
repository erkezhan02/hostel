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

// User authentication
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя по email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Проверка пароля
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Возвращаем данные пользователя
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};