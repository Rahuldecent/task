const jwt = require('jsonwebtoken');
const usermodel = require('../models/userModel');
const bcrypt = require("bcrypt");
const { validateEmail, validateMobile } = require("../validator/validate")


exports.createUser = async (req, res) => {
    try {
        const data = req.body
        let { name, email, password, mobile, followers, following } = data
        if (!name) {
            return res.send({ error: "name is required" });
        } if (!email) {
            return res.send({ error: "email is required" })
        } if (!password) {
            return res.send({ error: "password is required" })
        } if (!mobile) {
            return res.send({ error: "mobile is required" })
        }
        if (!validateEmail(email)) {
            return res.status(400).send({ status: false, message: `${email} is not a valid email Id` });
        }
        if (!validateMobile(mobile)) {
            return res.status(400).send({ status: false, message: `${mobile} is not a valid mobile number` });
        }
        // check existing user
        const existingEmail = await usermodel.findOne({ email })
        if (existingEmail) {
            return res.status(200).send({ success: true, msg: "already Register please login" })
        }
        const existingPhone = await usermodel.findOne({ mobile })
        if (existingPhone) {
            return res.status(200).send({ success: true, msg: "Mobile should be unique" })
        }
        const salt = bcrypt.genSaltSync(10)
        password = bcrypt.hashSync(password, salt)
        data.password = password
        // create user 
        const user = await usermodel.create(data)
        return res.status(201).send({ success: true, msg: "user register successfully", data: user });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            msg: "error in registration",
            error
        })
    }
};


// login user
exports.loginUser = async (req, res) => {
    try {
        let data = req.body
        let { email, password } = data
        if (!email || !password) {
            return res.status(404).send({ success: false, msg: "invalid email or password" })
        }
        const user = await usermodel.findOne({ email })
        if (!user) {
            return res.status(404).send({
                status: false,
                msg: "email is not register"
            })
        } else {
            if (!bcrypt.compareSync(password, user.password)) {
                return res.status(401).send({ status: false, Message: "Invalid Credantials" })
            }
        }

        // token 
        const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(200).send({
            success: true,
            message: "login successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            msg: "error in login",
            error
        })
    }

}

// Show list of users
exports.findAllUsers = async (req, res) => {
    try {
        const users = await usermodel.find()
        return res.status(200).send({ status: true, users: users })
    } catch (error) {
        res.status(500).send({ success: false, msg: "something went wrong", error })
    }
}

//Search user based on name
exports.findUserByName = async (req, res) => {
    try {
        const userName = req.query.name;
        if (!userName) {
            return res.status(400).send({ status: false, msg: 'plese provide userName' })
        }
        // Use a regular expression for case-insensitive search
        const regex = new RegExp(userName, 'i');

        // Search for users where the name matches the regex
        const users = await usermodel.find({ name: regex });
        return res.status(200).send({ status: true, users: users })
    } catch (error) {
        res.status(500).send({ success: false, msg: "something went wrong", error })
    }
}

// Update user

exports.updateUser = async (req, res) => {
    try {
        let userId = req.params.id
        const data = req.body
        let { name, email, password, mobile, followers, following } = data
        if (!userId) {
            return res.status(400).send({ status: false, msg: 'plese provide user Id' })
        }
        const isUserExist = await usermodel.findById({ _id: userId })
        if (!isUserExist) {
            return res.status(400).send({ status: false, msg: 'user does not exist' })
        }
        const user = await usermodel.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    name: name,
                    email: email,
                    password: password,
                    mobile: mobile,
                }
            }, { new: true });
        return res.status(200).send({ status: true, msg: "successfully updated", data: user });
    } catch (error) {
        res.status(500).send({ success: false, msg: "something went wrong", error });
    }
}

// delete user

exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(404).send({ status: false, msg: 'please enter Id' })
        }
        const findUser = await usermodel.findOne({ _id: id })
        if (!findUser) {
            return res.status(400).send({ status: false, msg: "User does not exist" })
        }
        const userDelete = await usermodel.findOneAndDelete({ _id: id })
        return res.status(200).send({ status: true, msg: "User successfully deleted", data: userDelete })
    } catch (error) {
        res.status(500).send({ success: false, msg: "something went wrong", error });
    }


}

// follow another user
exports.followUser = async function (req, res) {
    let data = req.body
    let { userId, followUserId } = data

    if (userId === followUserId) {
        return res.status(400).json({ error: "You cannot follow yourself" });
    }

    try {
        const user = await usermodel.findById({ _id: userId });
        const followUser = await usermodel.findById({ _id: followUserId });
        if (!user && !followUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already following
        if (user.following.includes(followUserId)) {
            return res.status(400).json({ error: "You are already following this user" });
        }
        // Add followUser  to user's following list
        user.following.push(followUser.name);
        await user.save();

        // Add user  to followUser's followers list
        followUser.followers.push(user.name);
        await followUser.save();

        res.status(200).json({ message: "Successfully followed the user" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


// Unfollow Another User
exports.unfollowUser = async function (req, res) {
    let data = req.body
    let { userId, unfollowUserId } = data

    if (userId === unfollowUserId) {
        return res.status(400).json({ error: "You cannot unfollow yourself" });
    }

    try {
        const user = await usermodel.findById({ _id: userId });
        const followUser = await usermodel.findById({ _id: unfollowUserId });
        if (!user && !followUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already following
        if (!user.following.includes(followUser.name)) {
            return res.status(400).json({ error: "You are not following this user" });
        }
        // remove followUserId to user's following list
        let indexOfFollowing = user.following.indexOf(followUser.name)
        if (indexOfFollowing != -1) user.following.splice(indexOfFollowing, 1)
        await user.save();

        // remove userId to followUser's followers list
        let indexOfFollowers = followUser.followers.indexOf(user.name)
        if (indexOfFollowers != -1) followUser.followers.splice(indexOfFollowers, 1)
        await followUser.save();

        res.status(200).json({ message: "Successfully unfollowed the user" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}




// get user by userId

exports.findUserById = async (req, res) => {
    try {
        const id = req.params.id
        const user = await usermodel.findOne({ _id: id })
        return res.status(200).send({ user: user })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}