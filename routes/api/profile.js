const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('config');
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');
const { check, validationResult } = require('express-validator');

// Load Profile Model
const Profile = require('../../models/Profile');
// Load User Model
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {

        //find user by id from profile model and get name, avatar from user model  
        const profile = await Profile
            .findOne({ user: req.user.id })
            .populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/profile
// @desc    Create/Update user profile
// @access  Private
router.post(
    '/',
    auth, //middleware
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {

        // Check Validation if error return 400 and error body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure the request
        const {
            website,
            skills,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;

        // build a profile
        const profileFields = {
            user: req.user.id,
            skills: Array.isArray(skills)
                ? skills
                : skills.split(',').map((skill) => ' ' + skill.trim()),
            ...rest
        };


        // Build socialFields object
        const socialFields = { youtube, twitter, instagram, linkedin, facebook };

        // add to profileFields
        profileFields.social = socialFields;

        try {
            // Using upsert option (creates new doc if no match is found):
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            return res.json(profile);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }


    });


// @route   GET api/profile
// @desc    Get all profile
// @access  Public
router.get('/', async (req, res) => {
    try {

        //find all profiles from profile model and get name, avatar from user model  
        const profiles = await Profile
            .find()
            .populate('user', ['name', 'avatar']);

        res.json(profiles);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/profile/user/:user_id
// @desc    Get profile by ID
// @access  Public
router.get(
    '/user/:user_id',
    checkObjectId('user_id'),
    async (req, res) => {
        try {

            //find profile from user_id from profile model and get name, avatar from user model  
            const profile = await Profile
                .findOne({ user: req.params.user_id }) //user_id from url
                .populate('user', ['name', 'avatar']);

            if (!profile) {
                return res.status(400).json({ msg: "Profile not found" });
            }

            res.json(profile);

        } catch (error) {
            console.error(error.message);
            if (error.kind == 'ObjectId') { //id is type object id 
                return res.status(400).json({ msg: "Profile not found" });
            }
            res.status(500).send('Server Error');
        }
    });


// @route   DELETE api/profile
// @desc    DELETE profile, user & posts
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {

        // Remove user posts
        // Remove profile
        // Remove user
        await Promise.all([
            Post.deleteMany({ user: req.user.id }),
            Profile.findOneAndRemove({ user: req.user.id }),
            User.findOneAndRemove({ _id: req.user.id })
        ]);

        res.json({ msg: 'User Deleted' });

    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
    '/experience',
    auth,
    check('title', 'Title is required').notEmpty(),
    check('company', 'Company is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
        .notEmpty()
        .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {

        // Check Validation if error return 400 and error body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });  //we get id from token via auth middleware

            //push experience to front in experience array
            profile.experience.unshift(req.body);

            await profile.save();

            res.json(profile);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    });



// @route   DELETE api/profile/experience/:exp_id
// @desc    DELETE experience profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {

        const foundProfile = await Profile.findOne({ user: req.user.id });

        foundProfile.experience = foundProfile.experience.filter(
            (exp) => exp._id.toString() !== req.params.exp_id
        );

        await foundProfile.save();

        return res.status(200).json(foundProfile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
    '/education',
    auth,
    check('school', 'School is required').notEmpty(),
    check('degree', 'Degree is required').notEmpty(),
    check('fieldofstudy', 'Field of study is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
        .notEmpty()
        .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.education.unshift(req.body);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });
        foundProfile.education = foundProfile.education.filter(
            (edu) => edu._id.toString() !== req.params.edu_id
        );
        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server Error' });
    }
});


// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', async (req, res) => {
    try {

        const uri = `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc
        &client_id=${config.get('githubClientId')}
        &client_secret=${config.get('githubSecret')}`

        const headers = { 'user-agent': 'node.js' }

        const gitHubResponse = await axios.get(uri, { headers });

        return res.json(gitHubResponse.data);

    } catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: 'No Github profile found' });
    }
});


module.exports = router;
