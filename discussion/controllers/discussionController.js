const aws = require('aws-sdk');
const axios = require('axios');
const discussionModel = require('../models/discussionModel'); // Adjust the path as necessary

// Configure AWS with your access and secret key.
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
// Create an S3 instance
const s3 = new aws.S3();

exports.createPost = async (req, res) => {
    try {
        let data = req.body;
        let { userId, text, image, hashtags } = data;
        if (typeof hashtags === 'string') {
            hashtags = JSON.parse(hashtags); // Parse if it's a string (assuming it's send formatted)
        }
        // Check if an image file is included in the request
        if (req.file) {
            image = req.file;
        } else if (!image) {
            return res.status(400).send({ status: false, msg: "image is required" });
        }

        // Check for the userId and text
        if (!userId) {
            return res.status(400).send({ status: false, msg: 'please provide user Id' });
        }

        if (!text) {
            return res.status(400).send({ status: false, msg: 'please provide text' });
        }

        // Verify the user exists by calling the user API
        const response = await axios.get(`${process.env.USER_HOST}/api/user/${userId}`);
        if (!response.data.user) {
            return res.status(400).send({ status: false, msg: 'user does not exist' });
        }

        // Upload image to S3 if it's present in the request
        let imageUrl = '';
        if (req.file) {
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `images/${Date.now()}_${image.originalname}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };

            // Uploading the file to the bucket
            const uploadResult = await s3.upload(params).promise();
            imageUrl = uploadResult.Location; // Get the URL of the uploaded image
        }

        // Prepare the data to save in MongoDB
        const discussionData = {
            userId,
            text,
            image: imageUrl,
            hashtags
        };

        // Create a new discussion document
        const discussion = await discussionModel.create(discussionData);
        return res.status(201).send({ success: true, msg: "discussion created successfully", data: discussion });

    } catch (error) {
        console.error("Error creating discussion:", error);
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
}


// modify a post
exports.modifyPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { userId, text, image, hashtags } = req.body;
        if (!userId) {
            return res.status(404).send({ status: false, msg: 'please provide userId' });
        }
        // Find the post by ID
        const post = await discussionModel.findById(({ _id: postId }));
        if (!post) {
            return res.status(404).send({ status: false, msg: 'Post not found' });
        }
        const response = await axios.get(`${process.env.USER_HOST}/api/user/${userId}`);
        if (!response.data.user) {
            return res.status(400).send({ status: false, msg: 'user does not exist' });
        }
        // Check if the user is authorized to modify the post
        if (post.userId.toString() !== userId) {
            return res.status(403).send({ status: false, msg: 'Unauthorized' });
        }

        // Update the post fields
        if (text) post.text = text;
        if (hashtags) post.hashtags = hashtags;
        if (image) post.image = image;

        await post.save();
        return res.status(200).send({ success: true, msg: "Post updated successfully", data: post });

    } catch (error) {
        console.error("Error modifying post:", error);
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
};


exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        // Find the post by ID
        const post = await discussionModel.findById({ _id: postId });
        if (!post) {
            return res.status(404).send({ status: false, msg: 'Post not found' });
        }
        // Delete the post
        const deletePost = await discussionModel.findByIdAndDelete({ _id: postId })
        return res.status(200).send({ success: true, msg: "Post deleted successfully" });

    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
};
// Get list of discussion based on tags
exports.getPostByTags = async (req, res) => {
    try {
        // Extract tags from query parameters
        let { tags } = req.query;

        if (!tags) {
            return res.status(400).send({ status: false, msg: 'Tags are required' });
        }
        if (typeof tags === 'string') {
            tags = JSON.parse(tags);
        }

        if (tags.length === 0) {
            return res.status(400).send({ status: false, msg: 'Please provide at least one tag' });
        }

        // Search for discussions containing any of the provided tags
        const discussions = await discussionModel.find({
            hashtags: {
                $in: tags.map(tag => new RegExp(tag, 'i'))
            }
        });
        // Check if any discussions were found
        if (discussions.length === 0) {
            return res.status(404).send({ status: false, msg: 'No discussions found for the provided tags' });
        }

        return res.status(200).send({ success: true, msg: "Discussions retrieved successfully", data: discussions });

    } catch (error) {
        console.error("Error getting discussions by tags:", error);
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
};

// GET post based on text
exports.findPostByText = async (req, res) => {
    try {
        const searchText = req.query.text; // Get the text query parameter from the request

        if (!searchText) {
            return res.status(400).send({ success: false, msg: 'Text parameter is required' });
        }

        // Query MongoDB using Mongoose
        const discussions = await discussionModel.find({
            text: { $regex: searchText, $options: 'i' } // Case-insensitive search
        });

        if (discussions.length === 0) {
            return res.status(404).send({ success: false, msg: 'No discussions found with the provided text' });
        }

        return res.status(200).send({ success: true, data: discussions });
    } catch (error) {
        console.error('Error fetching discussions:', error);
        return res.status(500).send({ success: false, msg: 'Internal server error' });
    }
}
// like a post 

exports.createDiscussionLike = async (req, res) => {
    try {
        const discussionId = req.params.discussionId
        const { userId } = req.body;
        const discussion = await discussionModel.findById({ _id: discussionId });
        if (!discussion) {
            return res.status(404).send({ success: false, error: 'Discussion not found' });
        }
        const response = await axios.get(`${process.env.USER_HOST}/api/user/${userId}`);
        if (!response.data.user) {
            return res.status(400).send({ status: false, msg: 'user does not exist' });
        }
        // Check if user has already liked the post
        const existingLike = discussion.likes.find(like => like.userId.toString() === userId);
        if (existingLike) {
            return res.status(400).send({ success: false, error: 'User has already liked this discussion' });
        }
        const newLike = { userId: userId, name: response.data.user.name };
        discussion.likes.push(newLike);
        await discussion.save();

        res.status(201).send({ status: true, message: "like is created successfully", like: newLike });
    } catch (error) {
        res.status(500).send({ status: false, error: 'Error liking discussion' });
    }
}

// view count of Post

exports.postViewCount = async (req, res) => {
    try {
        const { postId } = req.params
        if (!postId) {
            return res.status(404).send({ success: false, message: 'Post Id is required' });
        }
        const post = await discussionModel.findOne({ _id: postId });
        post.viewCount += 1
        await post.save()
        res.status(200).send({ status: true, Post: post });
    } catch (error) {
        return res.status(500).send({ success: false, msg: 'Internal server error', error });
    }
}

// show all Posts
exports.findAllPosts = async (req, res) => {
    try {
        const posts = await discussionModel.find()
        res.status(200).send({ status: true, Posts: posts });
    } catch (error) {
        return res.status(500).send({ success: false, msg: 'Internal server error', error });
    }
}
// comment apis
exports.createComment = async (req, res) => {
    try {
        const discussionId = req.params.id;
        const { userId, text } = req.body;

        const discussion = await discussionModel.findById({ _id: discussionId });
        if (!discussion) {
            return res.status(404).send({ error: 'Discussion not found' });
        }
        const response = await axios.get(`${process.env.USER_HOST}/api/user/${userId}`);
        if (!response.data.user) {
            return res.status(400).send({ status: false, msg: 'user does not exist' });
        }
        const newComment = {
            userId: userId,
            text: text,
            likes: [],
            replies: []
        };

        discussion.comments.push(newComment);
        await discussion.save();

        res.status(201).send({ status: true, message: "comment is created successfully", comment: newComment });
    } catch (error) {
        res.status(500).send({ error: 'Error adding comment' });
    }
}

// update comment
exports.updateComment = async (req, res) => {
    try {
        const { discussionId, commentId } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).send({ status: false, message: 'Text is required to update a comment' });
        }

        const discussion = await discussionModel.findById(discussionId);
        if (!discussion) {
            return res.status(404).send({ status: false, message: 'Discussion not found' });
        }

        const comment = discussion.comments.id(commentId);
        if (!comment) {
            return res.status(404).send({ status: false, message: 'Comment not found' });
        }

        // Update the comment's text
        comment.text = text;

        // Save the updated discussion document
        await discussion.save();

        res.status(200).send({ status: true, message: 'Comment updated successfully', comment });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).send({ status: false, message: 'Error updating comment', error: error.message });
    }
}

//  delete a comment
exports.deleteComment = async (req, res) => {
    try {
        const { discussionId, commentId } = req.params;

        // Find the discussion by ID
        const discussion = await discussionModel.findById(discussionId);
        if (!discussion) {
            return res.status(404).send({ status: false, message: 'Discussion not found' });
        }

        //  Find the index of the comment within the discussion's comments array
        const commentIndex = discussion.comments.findIndex(comment => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).send({ status: false, message: 'Comment not found' });
        }

        // Remove the comment from the comments array
        discussion.comments.splice(commentIndex, 1);
        // Save the updated discussion document
        await discussion.save();

        res.status(200).send({ status: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).send({ status: false, message: 'Error deleting comment', error: error.message });
    }
}


// Like a comment or reply
exports.likeCommentOrReply = async (req, res) => {
    try {
        const { discussionId, commentId, replyId, userId } = req.body;

        if (!discussionId || !commentId || !userId) {
            return res.status(400).send({ status: false, msg: 'DiscussionId, CommentId, and UserId are required' });
        }

        // Find the discussion containing the comment
        const discussion = await discussionModel.findById(discussionId);
        if (!discussion) {
            return res.status(404).send({ status: false, msg: 'Discussion not found' });
        }

        // Find the comment in the discussion
        const comment = discussion.comments.id(commentId);
        if (!comment) {
            return res.status(404).send({ status: false, msg: 'Comment not found' });
        }

        // If replyId is provided, like the reply
        if (replyId) {
            const reply = comment.replies.id(replyId);
            if (!reply) {
                return res.status(404).send({ status: false, msg: 'Reply not found' });
            }

            // Check if user has already liked the reply
            const existingLike = reply.likes.some(like => like.userId.toString() === userId);
            if (existingLike) {
                return res.status(400).send({ status: false, msg: 'User has already liked this reply' });
            }

            // Add the like to the reply
            reply.likes.push({ userId });
        } else {
            // Like the comment
            const existingLike = comment.likes.some(like => like.userId.toString() === userId);
            if (existingLike) {
                return res.status(400).send({ status: false, msg: 'User has already liked this comment' });
            }

            // Add the like to the comment
            comment.likes.push({ userId });
        }

        // Save the updated discussion
        await discussion.save();
        return res.status(200).send({ success: true, msg: "Like added successfully" });

    } catch (error) {
        console.error("Error liking comment or reply:", error);
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
};



