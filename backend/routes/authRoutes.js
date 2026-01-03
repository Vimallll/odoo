const express = require('express');
const router = express.Router();
const { signup, signin, getCurrentUser } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', auth, getCurrentUser);

module.exports = router;

