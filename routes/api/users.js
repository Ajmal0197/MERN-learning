const express = require('express');
const router = express.Router();
//express-validator used for body validation.
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

/*
const express = require('express'): Imports the Express framework, which is used to create the router.
const router = express.Router(): Creates a new router instance using Express. The router will be used to define routes for specific endpoints.
const { check, validationResult } = require('express-validator'): Imports the check and validationResult functions from the express-validator module. These functions are used for validating and sanitizing request bodies.
const gravatar = require('gravatar'): Imports the gravatar module, which provides an easy way to generate Gravatar URLs based on email addresses.
const bcrypt = require('bcryptjs'): Imports the bcryptjs module, which is used for hashing and comparing passwords securely.
const jwt = require('jsonwebtoken'): Imports the jsonwebtoken module, which provides functions for creating and verifying JSON Web Tokens (JWTs).
const config = require('config'): Imports the config module, which is used to access configuration settings defined in separate configuration files.
*/


// Load User model
const User = require('../../models/User');

// @route   POST api/users
// @desc    User Registration
// @access  Public ie without token
router.post(
  '/',
  check('name', 'Name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter password with 6 or more characters').isLength(
    { min: 6 }
  ),
  async (req, res) => {
    // Check Validation if error return 400 and error body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Find user document by email
      let user = await User.findOne({ email });
      console.log('User_document1', user); // null if document not exist

      //1)See if user exists, return bad request
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      //2)Get user gravatar ie profile image from 'email'
      const avatar = gravatar.url(email, {
        s: '200', //size
        r: 'pg', //rating
        d: 'mm', //default
      });

      //3)Create/Build user instance/object to save to DB
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //4)Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt); //encrypt pw of user instance

      await user.save(); //save user info to db and get same document from mongo

      //5)Return json web token, so that if user registers successfully he logs in right away
      //get the registerd user's _id of mongo DB and make payload like below

      console.log('User_document2', user);
      const payload = {
        user: {
          id: user.id, //id==_id
        },
      };

      //if session expires
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '7 days' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user_id: user.id }); //return 200 with token
        }
      );

      // res.send('User Registered Successfully');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
