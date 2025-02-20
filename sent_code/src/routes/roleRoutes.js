const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.get("/", roleController.getRoles);          // Получить все роли
router.post("/", roleController.createRole);       // Создать новую роль
router.put("/:id", roleController.updateRole);     // Обновить роль по _id
router.delete("/:id", roleController.deleteRole);  // Удалить роль по _id

module.exports = router;
