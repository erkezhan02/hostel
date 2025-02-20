const express = require("express")
const { createUser, getUsers, loginUser } = require("../controllers/UserController")
const router = express.Router()

router.post("/", createUser)
router.get("/", getUsers)
router.post("/login", loginUser);

module.exports = router