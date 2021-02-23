const express = require('express')
const router = express.Router()
const Posts = require('../../model/Posts')
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')
const User = require('../../model/Users')
const Profile = require('../../model/Profile')
//@route  Get post/posts
//Desc    Test route
//@acess  Private

router.post('/', [auth, [
    check('text', 'Text is require').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })

    }
    try {
        const user = await User.findById(req.user.id).select('-password')

        const newPost = new Posts({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })
        const post = await newPost.save()
        res.json(post)
    }
    catch (err) {
        console.log(err);
        res.status(500).json("Server error")
    }

})
//@route  get api/posts
//Desc    Get all  posts
//@acess  Private
router.get('/', [auth],
    async (req, res) => {
        try {
            const post = await Posts.find().sort({ date: -1 })
            if (!post) return res.status(400).json({ error: [{ msg: "There is no posts for this user" }] })
            res.json(post)
        }
        catch (err) {
            console.log(err.message)
            if (err.kind === "ObjectId") {
                return res.status(400).json({ error: [{ msg: "There is no post for this user" }] })
            }
            res.status(500).send('Server Error')
        }
    }
)
//@route  Get api/posts:id
//Desc    Get post  by id
//@acess  Public
router.get('/:id',
    async (req, res) => {
        try {
            const post = await Posts.findById(req.params.id)
            if (!post) return res.status(400).json({ error: [{ msg: "There is no posts for this user" }] })
            res.json(post)
        }
        catch (err) {
            console.log(err.message)
            if (err.kind === "ObjectId") {
                return res.status(400).json({ error: [{ msg: "There is no posts for this user" }] })
            }
            res.status(500).send('Server Error')
        }
    }
)
//@route  delete api/posts:id
//Desc    delete post  by id
//@acess  Private
router.delete('/:id', [auth],
    async (req, res) => {
        try {
            const post = await Posts.findById(req.params.id)
            //no user
            if (!post) {
                return res.status(400).json({ error: [{ msg: "Post not found" }] })
            }
            //check user
            if (post.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: "User not authorized" })
            }
            await post.remove()
            console.log("post removed")
            res.json({ msg: "Post removed" })
        }
        catch (err) {
            console.log(err.message)
            if (err.kind === "ObjectId") {
                return res.status(400).json({ error: [{ msg: "Post not found" }] })
            }
            res.status(500).send('Server Error')
        }
    }
)
//@route  put api/posts/like/:id
//Desc    like a post
//@acess  Private
router.put('/like/:id', [auth],
    async (req, res) => {
        try {
            const post = await Posts.findById(req.params.id)
            if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                return res.json({ msg: "Post  already liked" }).status(400)
            }
            post.likes.unshift({ user: req.user.id })
            await post.save()
            res.json(post.likes)
        }
        catch (err) {
            console.log(err.message)
            if (err.kind === "ObjectId") {
                return res.status(400).json({ error: [{ msg: "Post not found" }] })
            }
            res.status(500).send('Server Error')
        }
    })
//@route  put api/posts/like/:id
//Desc    unlike a post
//@acess  Private
router.put('/unlike/:id', [auth],
    async (req, res) => {
        try {
            const post = await Posts.findById(req.params.id)
            if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                return res.json({ msg: "Post  has not yet been like liked" }).status(400)
            }
            const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)
            post.likes.splice(removeIndex, 1)
            await post.save()
            res.json(post.likes)
        }
        catch (err) {
            console.log(err.message)
            if (err.kind === "ObjectId") {
                return res.status(400).json({ error: [{ msg: "Post not found" }] })
            }
            res.status(500).send('Server Error')
        }
    })
//@route  /post/comments/:id
//Desc    Test route
//@acess  Private

router.post('/comments/:id', [auth, [
    check('text', 'Text is require').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })

    }
    try {
        const user = await User.findById(req.user.id).select('-password')
        const post = await Posts.findById(req.params.id)
        const newComment = ({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })
        post.comments.unshift(newComment)
        await post.save()
        res.json(post.comments)
    }
    catch (err) {
        console.log(err);
        res.status(500).json("Server error")
    }

})
//@route delete  api/posts/comments/:id/:comment_id
//Desc    Test route
//@acess  Private
router.delete('/comments/:id/:comment_id', [auth],
    async (req, res) => {
        try {
            const post = await Posts.findById(req.params.id)
            //take comment
            const comment = post.comments.find(comment => comment.id === req.params.comment_id)
            if (!comment) {
                return res.status(400).json({ msg: "Comments does not exist" })
            }
            //check user
            if (comment.user.toString() !== req.user.id) {
                return res.status(400).json({ msg: "User not authorize to delete comment" })

            }
            const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id)
            post.comments.splice(removeIndex, 1)
            await post.save()
            res.json("Post removed")

        }
        catch (err) {
            console.log(err);
            res.status(500).json("Server error")
        }

    })
module.exports = router