const User = require("../models/User")
const Role = require("../models/Role"); // ✅ Добавьте эту строку


// Create User

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;

        // Если roleId не указан, находим ID роли "user"
        let assignedRoleId = roleId;
        if (!roleId) {
            const userRole = await Role.findOne({ name: "user" });
            if (!userRole) {
                return res.status(500).json({ message: "❌ Роль 'user' не найдена в базе данных." });
            }
            assignedRoleId = userRole._id;
        }

        // Проверка существования указанной роли
        const role = await Role.findById(assignedRoleId);
        if (!role) {
            return res.status(404).json({ message: "❌ Указанная роль не найдена." });
        }

        // Создание пользователя
        const newUser = new User({ name, email, password, roleId: assignedRoleId });
        await newUser.save();

        res.status(201).json({ message: "✅ Пользователь успешно создан.", user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Obtain all users
// 📌 Получить всех пользователей с их ролями

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().populate("roleId", "name description");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


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