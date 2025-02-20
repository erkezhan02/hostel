const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.verifyToken = async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "🚫 Токен не предоставлен." });
    }

    jwt.verify(token, process.env.JWT_SECRET || "secretKey", async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "🚫 Неверный или истекший токен." });
        }

        const userEmail = decoded.email;

        if (!userEmail) {
            return res.status(400).json({ message: "❌ Email не найден в токене." });
        }

        try {
            const user = await User.findOne({ email: userEmail });

            if (!user) {
                return res.status(404).json({ message: "❌ Пользователь не найден." });
            }

            // Добавляем информацию о пользователе в req.user
            req.user = user;
            next();
        } catch (error) {
            console.error("❌ Ошибка при проверке пользователя:", error);
            res.status(500).json({ message: "Ошибка сервера." });
        }
    });
};
