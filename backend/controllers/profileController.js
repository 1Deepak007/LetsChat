const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

// get user profile
exports.getUserProfile = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Assuming your Mongoose model name is User (replace if different)
    const user = await User.findById(userId); // Project to exclude password field
    if (!user) return res.status(404).json({ message: `User not found` });

    res.json(user);
  } catch (err) {
    // console.error('Error in getUserProfile:', err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
};

// update user's profile
exports.updateUserProfile = async (req, res) => {
    try {
      const { username } = req.body;
      const updateData = { username };
  
      if (req.file) {
        updateData.profilePicture = req.file.path; // Or req.file.filename if you prefer
      }
  
      const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
      res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
      console.error("Update profile error:", err); // Improved error logging
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

// change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect old password" });

    // console.log('Old Password Hash:', user.password);
    // console.log('New Password Before Hashing:', newPassword);

    user.password = newPassword;
    // user.password = await bcrypt.hash(newPassword, 10);
    // console.log('New Password After Hashing:', user.password);

    await user.save();
    // console.log('New Password After Hashing:', user.password);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.unfriend = async (req, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.user.id;
  
      // Use MongoDB's $pull operator to efficiently remove the friend
      await User.findByIdAndUpdate(userId, { $pull: { friends: { userId: friendId } } });
      await User.findByIdAndUpdate(friendId, { $pull: { friends: { userId: userId } } });
  
  
      res.json({ message: 'User unfriended successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  
  
  exports.rejectFriendRequest = async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user.id; // User rejecting the request
  
      const receiver = await User.findById(userId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
  
      const request = receiver.friendRequests.find(req => req._id.toString() === requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
  
      const senderId = request.userId; // ID of the user who sent the request
      const sender = await User.findById(senderId);
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" });
      }
  
  
      // 1. Remove request from receiver's friendRequests
      receiver.friendRequests = receiver.friendRequests.filter(req => req._id.toString() !== requestId);
      await receiver.save();
  
      // 2. Send notification to the sender
      sender.notifications.push({
        message: `${receiver.username} rejected your friend request.`,
        type: 'friendRequestRejected', // Add a type for easier handling on the frontend
        relatedUserId: receiver._id,    // Include the receiver's ID
      });
      await sender.save();
  
      // Emit socket.io event for real-time update (Important!)
      io.to(senderId).emit('friendRequestRejected', {
        message: `${receiver.username} rejected your friend request.`,
        relatedUserId: receiver._id,
      });
  
      res.json({ message: 'Friend request rejected' });
    } catch (err) {
      console.error("Reject request error:", err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  