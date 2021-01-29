//creating separate route  in different files to avoid cluttering
const express = require("express");
const router = express.Router();

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get("/", (req, res) => {
  res.send('Auth route.')
});

module.exports = router;
