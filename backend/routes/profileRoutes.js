const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  unfriend,
  rejectFriendRequest,
} = require('../controllers/profileController');
const authenticate = require("../middleware/authMiddleware"); // Import auth middleware

module.exports = (upload) => {
  const router = express.Router();

  router.get('/:userId', getUserProfile); // Can remove auth if you want public profiles
  router.put('/update', authenticate, upload.single('profilePicture'), updateUserProfile); // Auth + upload
  router.put('/change-password', authenticate, changePassword); // Add auth here!
  router.delete('/unfriend/:friendId', authenticate, unfriend); // Add auth here!
  router.put('/reject-request/:requestId', authenticate, rejectFriendRequest); // Add auth here!

  return router;
};