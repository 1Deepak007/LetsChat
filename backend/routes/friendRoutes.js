const express = require('express');
const User = require('../models/User');
const authenticate = require('../middleware/authMiddleware');
const { sendRequest, acceptRequest, getFriends, getFriendByUsernameId } = require('../controllers/friendController');

const router = express.Router();

// Send Friend Request
router.post('/send-request/:receiverId', authenticate, sendRequest)

// Accept Friend Request
router.post('/accept-request/:senderId', authenticate, acceptRequest)

router.get('/get-friends/:userId', authenticate, getFriends)

router.get('/find-friend-by-username-or-id/:usernameOrId', authenticate, getFriendByUsernameId)



module.exports = router;
