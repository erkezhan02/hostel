const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const logAction = require("../middlewares/logMiddleware");

router.get("/", logAction, roleController.getRoles);
router.post("/", logAction, roleController.createRole);
router.put("/:id", logAction, roleController.updateRole);
router.delete("/:id", logAction, roleController.deleteRole);

module.exports = router;
