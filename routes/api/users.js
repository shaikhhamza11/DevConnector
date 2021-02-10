const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const User = require('../../model/Users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('config')
//@route  Get api/users
//Desc    Test route
//@acess  Public
// console.log(config.get('jwtSecret'))
router.post('/', [
    check('name', 'name is Required').not().isEmpty(),
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password length should be greater than 7').isLength({ min: 7 }),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { name, email, password } = req.body
    try {
        //see if exisiting user
        let user = await User.findOne({ email });
        // console.log(user)
        if (user) {
            return res.status(400).json({ error: [{ msg: "User already exists" }] })
        }
        //gravatar
        const avatar = gravatar.url('email', {
            s: "200",
            r: 'pg',
            d: "mm"
        })
        user = new User({
            name,
            email,
            password,
            avatar
        })
        //bcrypt password
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt)
        //save user
        await user.save()
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
        console.log(err.message)
        res.status(400).send('Server Error')
    }



})
module.exports = router