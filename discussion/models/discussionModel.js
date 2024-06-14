const { default: mongoose } = require("mongoose");

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name:{
        type:String,
        required: true
    }
}, { _id: false });

const replySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    likes: [likeSchema]
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    likes: [likeSchema],
    replies: [replySchema]
}, { timestamps: true });

const discussionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    hashtags: [{ type: String }],
    comments: [commentSchema],
    likes: [likeSchema],
    viewCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('discussions', discussionSchema);
