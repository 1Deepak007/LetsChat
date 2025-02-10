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


// router.post('/send-request/:receiverId', authenticate, async (req, res) => {
//     const { receiverId } = req.params;
//     const senderId = req.user.id;

//     try {
//         const receiver = await User.findById(receiverId);
//         if (!receiver) return res.status(404).json({ message: 'User not found' });

//         if (receiver.friendRequests.includes(senderId) || receiver.friends.includes(senderId)) {
//             return res.status(400).json({ message: 'Already sent request or already friends' });
//         }

//         receiver.friendRequests.push(senderId);
//         await receiver.save();

//         res.json({ message: 'Friend request sent' });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// Accept Friend Request

// router.post('/accept-request/:senderId', authenticate,async (req, res) => {
//         const { senderId } = req.params;
//         const receiverId = req.user.id;

//         try {
//             const receiver = await User.findById(receiverId);
//             const sender = await User.findById(senderId);
//             if (!receiver || !sender) return res.status(404).json({ message: 'User not found' });

//             if (!receiver.friendRequests.includes(senderId)) {
//                 return res.status(400).json({ message: 'No pending request from this user' });
//             }

//             // Add to friends list
//             receiver.friends.push(senderId);
//             sender.friends.push(receiverId);

//             // Remove request
//             receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);

//             // Add notification for sender
//             sender.notifications.push(`User ${receiver.username} accepted your friend request.`);

//             await receiver.save();
//             await sender.save();

//             res.json({ message: 'Friend request accepted' });
//         } catch (err) {
//             res.status(500).json({ message: 'Server error' });
//         }
// });

// Get Friends List

// router.get('/friends', authenticate, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).populate('friends', 'username');
//         res.json(user.friends);
//     } catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

module.exports = router;
