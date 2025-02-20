const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const token = req.headers["authorization"]?.split(" ")[1];

            if (!token) {
                return res.status(401).json({ message: " Токен не предоставлен." });
            }

            //  Верификация токена
            jwt.verify(token, process.env.JWT_SECRET || "secretKey", async (err, decoded) => {
                if (err) {
                    return res.status(403).json({ message: " Неверный или истекший токен." });
                }

                const userEmail = decoded.email;
                if (!userEmail) {
                    return res.status(400).json({ message: " Email не найден в токене." });
                }

                const user = await User.findOne({ email: userEmail }).populate("roleId", "name");

                if (!user) {
                    return res.status(404).json({ message: " Пользователь не найден." });
                }

                if (user.roleId?.name !== requiredRole) {
                    return res.status(403).json({
                        message: ` Доступ запрещён. Необходима роль: ${requiredRole}.`
                    });
                }

                req.user = user;
                next();
            });
        } catch (error) {
            console.error("Ошибка в middleware проверки роли:", error);
            res.status(500).json({ message: "Ошибка сервера." });
        }
    };
};
