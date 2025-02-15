const mongoose = require("mongoose");
const User = require("../models/User");

exports.sendRequest = async (req, res) => {
  const { receiverId } = req.params;
  const senderId = req.user.id;

  try {
    const [receiver, sender] = await Promise.all([
      User.findById(receiverId),
      User.findById(senderId),
    ]);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check existing requests and friends
    const existingRequest = receiver.friendRequests.some(
      (request) => request.userId.toString() === senderId.toString()
    );

    const isFriend = receiver.friends.some(
      (friend) => friend.userId.toString() === senderId.toString()
    );

    if (existingRequest || isFriend) {
      return res
        .status(400)
        .json({ message: "Already sent request or already friends" });
    }

    const newFriendRequest = {
      userId: senderId,
      username: sender.username,
      _id: new mongoose.Types.ObjectId(), // Explicitly create ObjectId
    };

    receiver.friendRequests.push(newFriendRequest); // Correct: Push directly

    // Add notification
    receiver.notifications.push({
      message: `${sender.username} sent you a friend request`,
    });

    await receiver.save();

    res.json({
      message: "Friend request sent",
      sender: {
        id: senderId,
        username: sender.username,
      },
    });
  } catch (err) {
    console.error("Error sending friend request:", err); // Log the error!
    res.status(500).json({
      message: "Server error",
      error: err.message, // Send the error message for debugging
    });
  }
};

exports.acceptRequest = async (req, res, io) => {
  const { senderId } = req.params;
  const receiverId = req.user.id;

  try {
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = receiver.friendRequests.find(
      (req) => req.userId.toString() === senderId
    );

    if (!request) {
      return res
        .status(400)
        .json({ message: "No pending request from this user" });
    }

    receiver.friends.push({
      userId: senderId,
      username: sender.username,
      profilePicture: sender.profilePicture,
    });
    sender.friends.push({
      userId: receiverId,
      username: receiver.username,
      profilePicture: receiver.profilePicture,
    });

    receiver.friendRequests = receiver.friendRequests.filter(
      (req) => req._id.toString() !== request._id.toString()
    );

    sender.notifications.push({
      message: `${receiver.username} accepted your friend request.`,
      type: "friendRequestAccepted",
      relatedUserId: receiver._id,
    });

    await receiver.save();
    await sender.save();

    io.to(senderId).emit("friendRequestAccepted", {
      message: `${receiver.username} accepted your friend request.`,
      relatedUserId: receiver._id,
    });

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Accept Request Error:", err); // Log the error!
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// use _id of the friend request
exports.rejectFriendRequest = async (req, res, io) => {
  try {
    const { requestId } = req.params; // This is the _id of the request
    const userId = req.user.id; // User rejecting the request

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const request = receiver.friendRequests.find(
      (req) => req._id.toString() === requestId
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const senderId = request.userId;
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    receiver.friendRequests = receiver.friendRequests.filter(
      (req) => req._id.toString() !== request._id.toString()
    );
    await receiver.save();

    sender.notifications.push({
      message: `${receiver.username} rejected your friend request.`,
      type: "friendRequestRejected",
      relatedUserId: receiver._id,
    });
    await sender.save();

    io.to(senderId).emit("friendRequestRejected", {
      message: `${receiver.username} rejected your friend request.`,
      relatedUserId: receiver._id,
    });

    res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Reject request error:", err); // Log the error!
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getFriends = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate(
      "friends",
      "username profilePicture"
    ); // Populate profilePicture
    if (!user) {
      return res.status(404).json({ message: "Can't find your profile" });
    }
    const friends = user.friends;
    if (friends.length === 0) {
      res.json({
        message: "Sorry! You don't have any friends yet. Make some friends!",
      });
    } else {
      res.json(friends);
    }
  } catch (err) {
    res.status(500).json({ message: `Server error : ${err}` });
  }
};

exports.getFriendByUsernameId = async (req, res) => {
  const { usernameOrId } = req.params;

  try {
    // Check if the search term is a valid ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(usernameOrId);

    // Build the query
    const query = {
      $or: [
        { username: { $regex: usernameOrId, $options: "i" } }, // Case-insensitive regex for username
      ],
    };

    // Add _id to the query only if the search term is a valid ObjectId
    if (isObjectId) {
      query.$or.push({ _id: new mongoose.Types.ObjectId(usernameOrId) }); // Cast to ObjectId
    }

    // Find the user(s) matching the query
    const users = await User.find(query)
      .select("-password -__v") // Exclude sensitive fields
      .populate("friends", "username"); // Populate friends with only the username field

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Always return an array, even if it contains a single user
    res.status(200).json(users);
  } catch (error) {
    // console.error("Error finding user:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
