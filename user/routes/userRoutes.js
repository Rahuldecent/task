const express = require("express")
const router = express.Router()
const { createUser, loginUser, findAllUsers, findUserByName, updateUser, deleteUser, followUser, unfollowUser, findUserById} = require("../controllers/userController")
const { authMiddleware } = require("../middleware/auth")
// user creation route 
router.post("/register", createUser)
// user login routes
router.post("/login", loginUser)

// show all users
router.get("/users/all", findAllUsers);
//Search user based on name
router.get("/user", findUserByName);
// update user
router.put("/update/user/:id", authMiddleware,updateUser);
// delete user
router.delete("/delete/user/:id", deleteUser);

// follow another user
router.post("/follow", followUser);

//Unfollow Another User
router.post("/unfollow", unfollowUser)

router.get("/user/:id",findUserById)
module.exports = router