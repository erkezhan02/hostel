const express = require("express");
const { createUser, getUsers, loginUser } = require("../controllers/UserController");
const logAction = require("../middlewares/logMiddleware");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Эндпоинты без защиты
router.post("/", logAction, createUser);
router.post("/login", logAction, loginUser);

// Защищенные эндпоинты
router.get("/", verifyToken, logAction, getUsers);
router.delete("/:id", verifyToken, logAction, async (req, res) => {
    // Пример удаления пользователя с проверкой токена
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: " Пользователь не найден." });
        }
        res.json({ message: " Пользователь успешно удален." });
    } catch (error) {
        res.status(500).json({ message: " Ошибка при удалении пользователя." });
    }
});

module.exports = router;
