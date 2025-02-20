const Role = require("../models/Role");



// 📌 Получить все роли
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 📌 Создать новую роль
exports.createRole = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Проверка уникальности имени
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ message: "❌ Роль с таким именем уже существует." });
        }

        // Создание новой роли
        const newRole = new Role({ name, description });
        await newRole.save();

        res.status(201).json({ message: "✅ Роль успешно создана.", role: newRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Обновить роль по roleId
// 📌 Обновить существующую роль по _id
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Проверка на существование роли
        if (name) {
            const existingRole = await Role.findOne({ name });
            if (existingRole && existingRole._id.toString() !== id) {
                return res.status(400).json({ message: "❌ Роль с таким именем уже существует." });
            }
        }

        const updatedRole = await Role.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({ message: "❌ Роль не найдена." });
        }

        res.status(200).json({ message: "✅ Роль успешно обновлена.", role: updatedRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Удалить роль по roleId
// 📌 Удалить роль по _id
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRole = await Role.findByIdAndDelete(id);

        if (!deletedRole) {
            return res.status(404).json({ message: "❌ Роль не найдена." });
        }

        res.status(200).json({ message: "🗑️ Роль успешно удалена.", role: deletedRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

