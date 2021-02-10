const express = require('express')
const router = express.Router()
const Posts = require('../../model/Posts')
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')
const User = require('../../model/Users')
const Profile = require('../../model/Profile')
//@route  Get api/posts
//Desc    Test route
//@acess  Public

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
//Desc    Get post profile
//@acess  Public
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
//@route  Get api/posts
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
module.exports = router