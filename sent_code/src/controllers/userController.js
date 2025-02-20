// 📌 Создать нового пользователя
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Role = require("../models/Role");
const Log = require("../models/Log");

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;

        // Проверка существования email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "❌ Пользователь с таким email уже существует." });
        }

        let assignedRoleId = roleId;
        if (!roleId) {
            const userRole = await Role.findOne({ name: "user" });
            if (!userRole) {
                return res.status(500).json({ message: "❌ Роль 'user' не найдена." });
            }
            assignedRoleId = userRole._id;
        }

        // ❗️ Удаляем лишнее хеширование здесь
        const newUser = new User({
            name,
            email,
            password, // ❗️ Пароль будет хеширован в UserSchema.pre("save")
            roleId: assignedRoleId
        });

        await newUser.save();

        res.status(201).json({ message: "✅ Пользователь успешно создан.", user: newUser });
    } catch (error) {
        console.error("❌ Ошибка при создании пользователя:", error);
        res.status(500).json({ error: error.message });
    }
};



// 📌 Получить всех пользователей с их ролями
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().populate("roleId", "name description");

        // Логирование
        await Log.create({
            action: "GET_USERS",
            endpoint: req.originalUrl,
            method: req.method,
            user: "Admin",
            requestData: {},
            responseData: users,
            statusCode: 200
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("❌ Ошибка при получении пользователей:", error);
        await Log.create({
            action: "GET_USERS_ERROR",
            endpoint: req.originalUrl,
            method: req.method,
            user: "Admin",
            requestData: {},
            responseData: { error: error.message },
            statusCode: 500
        });

        res.status(500).json({ error: error.message });
    }
};
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 🔍 Поиск пользователя
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "❌ Пользователь не найден." });
        }

        // 🔒 Сравнение пароля
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "❌ Неверный пароль." });
        }

        res.status(200).json({ message: "✅ Успешный вход.", user });
    } catch (error) {
        console.error("❌ Ошибка при входе:", error);
        res.status(500).json({ message: error.message });
    }
};

