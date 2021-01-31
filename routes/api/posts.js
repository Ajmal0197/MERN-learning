const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');


// @route    POST api/posts
// @desc     Create a post
// @access   Private        //since we have to be loggedin to create a post
router.post(
    '/',
    auth,
    check('text', 'Text is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');      //gettinf id from token passed in x-auth-token via middleware

            //create post obj. by instantiating object from modal
            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });

            //save to DB
            const post = await newPost.save();

            //send response in response to client
            res.json(post);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', auth, async (req, res) => {
    try {

        //finds the most recent first due to {date : -1}
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get(
    '/:id',
    auth,
    checkObjectId('id'),        //if 'param id' is not valid 'object type id' then return error
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ msg: 'Post not found' });
            }

            res.json(post);
        } catch (error) {
            console.error(error.message);

            res.status(500).send('Server Error');
        }
    });


// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete(
    '/:id',
    auth,
    checkObjectId('id'),
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ msg: 'Post not found' });
            }

            // Check user if its his post then only he can delete
            //converting object_id to string and matching with id of loggedin user's id
            if (post.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized' });
            }

            await post.remove();

            res.json({ msg: 'Post removed' });
        } catch (error) {
            console.error(error.message);

            res.status(500).send('Server Error');
        }
    });


// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, checkObjectId('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        if (post.likes.some((like) => like.user.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        //push id to front in array
        post.likes.unshift({ user: req.user.id });

        await post.save();

        return res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, checkObjectId('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has not yet been liked
        if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // remove the like //here is user is Object_id
        post.likes = post.likes.filter(
            ({ user }) => user.toString() !== req.user.id
        );

        await post.save();

        return res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
    '/comment/:id',
    auth,
    checkObjectId('id'),
    check('text', 'Text is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.id);

            //create obj to insert in posts comment array
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            post.comments.unshift(newComment);

            await post.save();

            res.json(post.comments);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private

router.delete(
    '/comment/:id/:comment_id',         // postid/commentid
    auth,
    async (req, res) => {
        try {

            //get the post
            const post = await Post.findById(req.params.id);

            // Pull out comment
            const comment = post.comments.find(
                (comment) => comment.id === req.params.comment_id
            );

            // Make sure comment exists
            if (!comment) {
                return res.status(404).json({ msg: 'Comment does not exist' });
            }

            // Check user so that user can only delete his comment by comparing comment's user Object_id to token id
            if (comment.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized' });
            }

            post.comments = post.comments.filter(
                ({ id }) => id !== req.params.comment_id
            );

            await post.save();

            return res.json(post.comments);
        } catch (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }
    });

module.exports = router;