const User = require("../models/User");

// 🛡️ Middleware: Проверка, зарегистрирован ли пользователь
exports.checkUserRegistered = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "❌ Email обязателен." });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "🚫 Пользователь с таким email не зарегистрирован." });
        }

        // ✅ Если пользователь найден, продолжаем
        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Ошибка при проверке регистрации:", error);
        res.status(500).json({ message: "Ошибка сервера." });
    }
};
