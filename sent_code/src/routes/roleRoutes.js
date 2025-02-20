const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const logAction = require("../middlewares/logMiddleware");
const checkRole = require("../middlewares/checkRole");

router.get("/",checkRole("admin"), logAction, roleController.getRoles);
router.post("/", checkRole("admin"),logAction, roleController.createRole);
router.put("/:id",checkRole("admin"), logAction, roleController.updateRole);
router.delete("/:id", checkRole("admin"),logAction, roleController.deleteRole);

module.exports = router;
