const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    followers: {
        type: [String],
        trim: true,
    },
    following: {
        type: [String],
        trim: true,
    }
}, { timestamps: true })


module.exports = mongoose.model('users', userSchema)