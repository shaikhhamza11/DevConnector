const express = require('express')
const router = express.Router()
const config = require('config')
const auth = require('../../middleware/auth')
const User = require('../../model/Users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')

//@route  Get api/auth
//Desc    Test route
//@acess  Private

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user).status(200)


    }
    catch (err) {
        res.status(401).json({ error: { msg: "Server error" } })
    }

})
//login
//@route  post api/users
//Desc    Test route
//@acess  Public

router.post('/', [
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password is required').exists(),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body
    try {
        //see if exisiting user
        let user = await User.findOne({ email });
        // console.log(user)
        if (!user) {
            return res.status(400).json({ error: [{ msg: "Invalid credentials" }] })
        }

        //check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: [{ msg: "Invalid credentials" }] })

        }


        //res with jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            })

    }
    catch (err) {
        res.status(400).send('Server Error')
    }



})
module.exports = router