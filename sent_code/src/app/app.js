const express = require('express')
const cors = require('cors')
const connectDB = require("../config/db")
const userRoutes = require("../routes/userRoutes")

require("dotenv").config()
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

app.use("/api/users", userRoutes)

const port = process.env.PORT || 5000
app.listen(port, () => { console.log(`Server started on port ${port}`) })