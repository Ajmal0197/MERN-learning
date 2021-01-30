const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
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
        res.status(500).send('Server error');
    }
});


// @route   POST api/profile
// @desc    Create/Update user profile
// @access  Private
router.post('/',
    //for multiple validation wrap in []
    [
        auth, //middleware
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
        ]
    ],
    async (req, res) => {
        try {

            // Check Validation if error return 400 and error body
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // destructure the request
            const {
                company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin, ...rest
            } = req.body;

            //Build profile obj.
            const profileFields = {};
            profileFields.user = req.user.id;
            if (company) profileFields.company = company;
            if (website) profileFields.website = website;
            if (location) profileFields.location = location;
            if (bio) profileFields.bio = bio;
            if (status) profileFields.status = status;
            if (githubusername) profileFields.githubusername = githubusername;
            if (skills) {
                profileFields.skills = skills.split(',').map(skill => skill.trim());  //make array of item, removing whitespaces in item
            }

            //Build Social Obj.
            profileFields.social = {}
            if (youtube) profileFields.social.youtube = youtube;
            if (twitter) profileFields.social.twitter = twitter;
            if (facebook) profileFields.social.facebook = facebook;
            if (linkedin) profileFields.social.linkedin = linkedin;
            if (instagram) profileFields.social.instagram = instagram;


            try {
                let profile = await Profile.findOne({ user: req.user.id });  //we get id from token via auth middleware

                if (profile) {
                    //if found then Update
                    profile = await Profile.findOneAndUpdate(
                        { user: req.user.id },         //find by id
                        { $set: profileFields },      //update
                        { new: true }                  //add new field with value true
                    );
                    return res.json(profile);
                }

                //if not found then Create New
                profile = new Profile(profileFields);
                await profile.save();
                res.json(profile);

                // {
                //     "skills": [
                //         "MERN",
                //         "Java",
                //     ],
                //     "_id": "601519c7daed9206fc12c940",       //profile id
                //     "user": "60145512fe51c83374f37f44",      //user id
                //     "company": "Techahead",
                //     "location": "New Delhi, IN",
                //     "bio": "I am Developer",
                //     "status": "Developer",
                //     "githubusername": "ajmal0197",
                //     "social": {
                //         "twitter": "twitter@gmail.com",
                //         "facebook": "facebook@gmail.com"
                //     },
                //     "experience": [],
                //     "education": [],
                //     "date": "2021-01-30T08:33:11.977Z",
                //     "__v": 0
                // }

            } catch (error) {
                console.error(error.message);
                res.status(500).send('Server Error');
            }

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
