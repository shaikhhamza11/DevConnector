const express = require('express')
const router = express.Router()
const Profile = require('../../model/Profile')
const User = require('../../model/Users')
const mongoose = require('mongoose')
const { check, validationResult } = require('express-validator')
const auth = require('../../middleware/auth')
const { findOneAndUpdate, findById } = require('../../model/Profile')
const config = require('config')
const request = require('request')
//@route  Get api/profile/me
//Desc    Get current user
//@acess  Private

router.get('/me', auth, async (req, res) => {
    try {

        const profile = await (await Profile.findOne({ user: req.user.id }))
        if (!profile) {
            return res.status(400).json({ error: [{ msg: "There is no profile for this user" }] })
        }
        res.json(profile)

    }
    catch (err) {
        console.log(err.message)
        res.status(400).json({ error: { msg: "Server Error" } })

    }
})
//@route  Get api/profile
//Desc    Create/update profile
//@acess  Private
router.post('/', [auth, [
    check('status', "status is required").not().isEmpty(),
    check('skills', "skills is required").not().isEmpty()
]
],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })

        }


        let { company,
            website,
            location,
            bio,
            status,
            skills,
            githubusername,
            youtube,
            facebook,
            instagram,
            linkedin,
            twitter
        } = req.body
        //build profile object
        let profileFields = {}
        profileFields.user = req.user.id
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (bio) profileFields.bio = bio;
        if (skills) {
            profileFields.skills = skills.split(',').map((skill) => skill.trim())
        }
        //get socials
        profileFields.socials = {}
        if (instagram) profileFields.socials.instagram = instagram;
        if (youtube) profileFields.socials.youtube = youtube;
        if (linkedin) profileFields.socials.linkedin = linkedin;
        if (facebook) profileFields.socials.facebook = facebook;
        if (twitter) profileFields.socials.twitter = twitter;
        //create or update
        try {
            let profile = await Profile.findOne({ user: req.user.id })
            if (profile) {
                //update
                profile = await Profile.findOneAndUpdate({ user: req.user.id },
                    { $set: profileFields },
                    { new: true })
                return res.json(profile)
            }
            //create
            profile = new Profile(profileFields)
            await profile.save()
            res.json(profile)
        }
        catch (err) {
            console.log(err.message)
            res.status(500).send('Server Error')
        }



    }
)
//@route  Get api/profile
//Desc    Get all profile
//@acess  Public
router.get('/',
    async (req, res) => {
        try {

            const profiles = await Profile.find().populate('user', ['name', 'avatar'])

            res.json(profiles)
        }
        catch (err) {
            console.log(err.message)
            res.status(500).send('Server Error')
        }
    })
//@route  Get api/profile
//Desc    Get me profile
//@acess  Public
router.get('/user/:user_id',
    async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
            if (!profile) return res.status(400).json({ error: [{ msg: "There is no profile for this user" }] })
            res.json(profile)
        }
        catch (err) {
            console.log(err.message)
            if (err.kind === "ObjectId") {
                return res.status(400).json({ error: [{ msg: "There is no profile for this user" }] })
            }
            res.status(500).send('Server Error')
        }
    }
)
//@route  Delete api/profile
//Desc    delete me profile
//@acess  Public
router.delete('/', auth, async (req, res) => {
    try {
        //remove post
        //remove user
        await User.findOneAndRemove({ _id: req.user.id })
        //remove user
        await Profile.findOneAndRemove({ user: req.user.id })
        res.status(200).json("User deleted")

    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})
//@route  Put api/profile/experience
//Desc    update profile experience
//@acess  Private
router.put('/experience', [auth, [
    check('title', 'Title is require').not().isEmpty(),
    check('company', 'Company is require').not().isEmpty(),
    check('from', 'From Date is require').not().isEmpty(),
]],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })

        }
        const {
            title,
            company,
            from,
            to,
            current,
            description
        } = req.body
        const newExp = {
            title,
            company,
            from,
            to,
            current,
            description

        }
        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.experience.unshift(newExp);
            await profile.save()
            res.json(profile)

        }
        catch (err) {
            console.log(err);
            res.status(500).json("Server error")
        }

    })
//@route  Delete api/experience
//Desc    Get me profile
//@acess  Public
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {

        //remove user
        const profile = await Profile.findOne({ user: req.user.id })
        //remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)
        await profile.save()
        res.status(200).json("Experience deleted")


    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})
//@route  Put api/profile/experience
//Desc    update profile education
//@acess  Private
router.put('/education', [auth, [
    check('school', 'School is require').not().isEmpty(),
    check('degree', 'Degree is require').not().isEmpty(),
    check('fieldofstudy', 'Field Of Study is require').not().isEmpty(),
    check('from', 'From Date is require').not().isEmpty()
]],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })

        }
        const {
            school,
            college,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body
        const newExp = {
            school,
            college,
            degree,
            fieldofstudy,
            to,
            current,
            description

        }
        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.education.unshift(newExp);
            await profile.save()
            res.json(profile)

        }
        catch (err) {
            console.log(err);
            res.status(500).json("Server error")
        }

    })
//@route  Delete api/education
//Desc   dlete education field
//@acess  Public
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {

        //remove user
        const profile = await Profile.findOne({ user: req.user.id })
        //remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)
        await profile.save()
        res.status(200).json("Education Field deleted")


    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})
//@route  Get api/profile/github/username
//Desc   get github profile and repo bu username
//@acess  Public
router.get('/github/:username', [auth],
     (req, res) => {
        try {
            const options = {
                uri: `https://api.github.com/users/${req.params.username}/repos?per_page=2&sort=created:asc&client_id=${config.get("githubClientId")}&client_secret=${config.get('githubSecretKey')}`,
                method: "GET",
                headers: { 'user-agent': "node.js" }
            }

            request(options, (error, response, body) => {
                if (error) console.log(error);
                if (response.statusCode !== 200) {
                    res.status(400).json("github profile not found")
                }
                res.json(JSON.parse(body))
            })
        }
        catch (err) {
            console.log(err.message)
            res.status(500).send('Server Error')
        }
    })
module.exports = router