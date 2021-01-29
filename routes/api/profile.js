const express = require('express');
const router = express.Router();

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/', (req, res) => res.json({ msg: 'Profile Works' }));

module.exports = router;
