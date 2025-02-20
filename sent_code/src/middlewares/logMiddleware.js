const Log = require("../models/Log");

const logAction = async (req, res, next) => {
    const start = Date.now();

    res.on("finish", async () => {
        const duration = Date.now() - start;

        const logEntry = {
            action: `${req.method} ${req.originalUrl}`,
            endpoint: req.originalUrl,
            method: req.method,
            user: req.user?.email || "Anonymous", // Здесь можно указать пользователя, если он есть
            requestData: req.body,
            responseData: res.locals.responseData || null,
            statusCode: res.statusCode,
            duration
        };

        try {
            await Log.create(logEntry);
            console.log(`📝 Лог записан: ${logEntry.action}`);
        } catch (error) {
            console.error("❌ Ошибка при записи лога:", error.message);
        }
    });

    next();
};

module.exports = logAction;
