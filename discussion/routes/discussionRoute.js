const express = require("express")
const router = express.Router()
const { createPost, modifyPost, deletePost, createComment, updateComment, deleteComment, createDiscussionLike, likeCommentOrReply, getPostByTags, findPostByText, postViewCount, findAllPosts } = require("../controllers/discussionController");
const { authMiddleware } = require("../middleware/auth")
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// post routes
router.post('/create-post', upload.single('image'), createPost);

router.put('/post/:id', authMiddleware, upload.single('image'), modifyPost);

router.delete('/post/:id', authMiddleware, deletePost);

// create like for Post 
router.post("/like/:discussionId", createDiscussionLike)

// find post based on tags
router.get('/post/tags', getPostByTags);
// find post based on text
router.get('/post/text', findPostByText);
// find post by id
router.get("/post/:postId", postViewCount);
// find all Posts
router.get("/posts", findAllPosts);

router.post("/:id/likes", createDiscussionLike);

router.post("/:id/comments", createComment);

// Route to update a comment
router.put('/:discussionId/comment/:commentId', authMiddleware, updateComment);

// Route to delete a comment
router.delete('/:discussionId/comment/:commentId', deleteComment);

router.post('/like', likeCommentOrReply);

module.exports = router;