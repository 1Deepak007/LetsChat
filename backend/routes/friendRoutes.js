const express = require('express');
const router = express.Router(); // Correct: No io here
const authenticate = require("../middleware/authMiddleware");

const { 
  sendRequest, 
  acceptRequest, 
  rejectFriendRequest, 
  getFriends, 
  getFriendByUsernameId,
  unfriend
} = require('../controllers/friendController');

module.exports = (io) => { // Receive io from server.js
  router.post('/send-request/:receiverId', authenticate, (req, res) => sendRequest(req, res));
  // accept req using sender's userId
  router.post('/accept-request/:senderId', authenticate, (req, res) => acceptRequest(req, res, io)); // Pass io
  router.delete('/reject-request/:requestId', authenticate, (req, res) => rejectFriendRequest(req, res, io)); // Pass io
  router.get('/get-friends/:userId', authenticate, getFriends);
  router.get('/find-friend-by-username-or-id/:usernameOrId', authenticate, getFriendByUsernameId);
  router.delete('/unfriend/:friendId', authenticate, (re,res) => unfriend(re,res,io));


  return router;
};