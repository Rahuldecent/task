const express = require("express")
const router = express.Router();
const discussionRoute = require("./discussionRoute")


router.use("/discussion", discussionRoute);


module.exports = router