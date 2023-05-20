//creating separate route  in different files to avoid cluttering
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); //pass to route to make it protected via token
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const { check, validationResult } = require('express-validator');

// Load User model
const User = require('../../models/User');

// @route   GET api/auth
// @desc    Get user data
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); //check user by getting id from middlware jwt token, dont return password in response
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth
// @desc    Authenticate users & get token
// @access  Public
router.post(
  '/',
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  async (req, res) => {
    // Check Validation if error return 400 and error message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      let user = await User.findOne({ email });

      //1)See if user doesnt exists, return bad request
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      //2)compare inputted pw with encrypted pw ie stored in DB
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      //3)Return json web token
      const payload = {
        user: {
          id: user.id, //id==_id
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token }); //return 200 with token
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
