const express = require("express");
const dotenv = require('dotenv');
const Routes = require("./routes/index")
const app = express();
dotenv.config()
const PORT = process.env.PORT || 3000
const { connectDB } = require("./config/db");
connectDB();

app.use('image', express.static('image'))

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
    res.json({ message: "server is working..." })
})
app.use(Routes);
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`))