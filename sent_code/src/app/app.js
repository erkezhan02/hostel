const express = require('express')
const cors = require('cors')
const connectDB = require("../config/db")
const userRoutes = require("../routes/userRoutes")
const hotelsRouter = require("../../../routes/hotels");
const path = require("path");
const roleRoutes = require("../routes/roleRoutes");

require('dotenv').config({ path: '../../../.env' });
connectDB()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static("public"));

app.use("/hotels", hotelsRouter);

// Эндпоинт для index.html
app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/index.html"));
});

app.use(express.static(path.join(__dirname, "../../../public")));

app.get("/welcome_page", (req, res) => {
    res.sendFile(path.join(__dirname, "../sent_code/src/app/public/welcome_page.html"));
});

app.use("/api/users", userRoutes)
app.use("/api/roles", roleRoutes);



const port = process.env.PORT || 5000
app.listen(port, () => { console.log(`Server started on port ${port}`) })