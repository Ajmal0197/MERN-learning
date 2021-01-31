const express = require('express');
const router = express.Router();
//express-validator used for body validation.
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// Load User model
const User = require('../../models/User');

// @route   POST api/users
// @desc    User Registration
// @access  Public ie without token
router.post(
    '/',
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter password with 6 or more characters').isLength({ min: 6 }),
    async (req, res) => {

        // Check Validation if error return 400 and error body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // Find user by email
            let user = await User.findOne({ email });

            //1)See if user exists, return bad request
            if (user) {
                return res.status(400).json({ errors: [{ msg: "User already exists" }] });
            }

            //2)Get user gravatar ie profile image from 'email'
            const avatar = gravatar.url(email, {
                s: '200',    //size
                r: 'pg',     //rating
                d: 'mm'      //default
            })


            //3)Create/Build user instance/object to save to DB
            user = new User({
                name, email, avatar, password
            })


            //4)Encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);      //encrypt pw of user instance

            await user.save();                                      //save user info to db


            //5)Return json web token, so that if user registers successfully he logs in right away
            //get the registerd user's _id of mongo DB and make payload like below
            const payload = {
                user: {
                    id: user.id     //id==_id
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: '7 days' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });        //return 200 with token
                }
            );

            // res.send('User Registered Successfully');
        } catch (error) {
            console.error(error.message)
            res.status(500).send('Server Error');
        }

    });

module.exports = router;
