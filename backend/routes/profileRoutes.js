const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { getUserProfile, updateUserProfile, changePassword } = require('../controllers/profileController');

const router = express.Router();

router.get('/:userId', authenticate, getUserProfile);
router.put('/update', authenticate, updateUserProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;