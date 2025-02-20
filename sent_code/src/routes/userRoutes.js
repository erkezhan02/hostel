const express = require("express");
const { createUser, getUsers, loginUser } = require("../controllers/UserController");
const logAction = require("../middlewares/logMiddleware");
const router = express.Router();

router.post("/", logAction, createUser);
router.get("/", logAction, getUsers);
router.post("/login", logAction, loginUser);

module.exports = router;
