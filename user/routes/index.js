const express = require("express")
const router = express.Router();
const userRoutes = require("./userRoutes")
router.use("/api", userRoutes);


module.exports = router