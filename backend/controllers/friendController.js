const mongoose = require("mongoose");
const User = require("../models/User");
const Message = require("../models/Message");

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
      (friendId) => friendId.toString() === senderId.toString()
    );

    if (existingRequest || isFriend) {
      return res
        .status(400)
        .json({ message: "Already sent request or already friends" });
    }

    // Add sender's userId and username to receiver's friendRequests array
    receiver.friendRequests.push({
      userId: senderId,
      name: `${sender.firstname} ${sender.lastname}`, // Use firstname and lastname
      username: sender.username,
    });

    // Add notification
    receiver.notifications.push({
      notificationType: "friend_request",
      message: `${sender.username} sent you a friend request`,
    });

    await receiver.save();

    res.json({
      message: "Friend request sent",
      sender: {
        id: senderId,
        name: `${sender.firstname} ${sender.lastname}`, // Use firstname and lastname
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

// accept req using sender's userId
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
          (req) => req.userId.toString() === senderId // Correct comparison
      );

      if (!request) {
          return res.status(400).json({ message: "No pending request from this user" });
      }

      
      

      receiver.friends.push(senderId); // Push the sender's _id
      sender.friends.push(receiverId); // Push the receiver's _id

      receiver.friendRequests = receiver.friendRequests.filter(
          (req) => req.userId.toString() !== senderId // Correct filtering
      );

      sender.notifications.push({
          message: `${receiver.username} accepted your friend request.`,
          notificationType: "friend_request",
          relatedUserId: receiver._id, // Keep _id here
      });

      await receiver.save();
      await sender.save();

      io.to(senderId).emit("friendRequestAccepted", {
          message: `${receiver.username} accepted your friend request.`,
          relatedUserId: receiver._id, // Keep _id here
      });

      res.json({ message: "Friend request accepted" });
  } catch (err) {
      console.error("Accept Request Error:", err);
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
      type: "friend_request",
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
      const user = await User.findById(userId).populate({
          path: 'friends',
          select: 'username firstname lastname _id profilePicture', // Select the fields you need
      }).populate("friendRequests.userId", "username"); // Populate friend requests if needed

      if (!user) {
          return res.status(404).json({ message: "Can't find your profile" });
      }

      res.json(user.friends); // Send the *populated* friends array
  } catch (err) {
      console.error("Error in getFriends:", err); // Log the error!
      res.status(500).json({ message: `Server error : ${err.message}` }); // Send error message
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

exports.unfriend = async (req, res, io) => {
  try {
      const userId = req.user.id;
      const friendId = req.params.friendId;

      const user = await User.findById(userId);
      const friend = await User.findById(friendId);

      if (!user || !friend) {
          return res.status(404).json({ message: "User or friend not found" });
      }

      // Correct way to filter: compare ObjectIds directly
      user.friends = user.friends.filter(f => f.toString() !== friendId);
      friend.friends = friend.friends.filter(f => f.toString() !== userId);


      await user.save();
      await friend.save();

      await Message.deleteMany({
          $or: [
              { sender: userId, receiver: friendId },
              { sender: friendId, receiver: userId },
          ],
      });

      io.to(friendId).emit("unfriended", { userId });

      res.json({ message: "User unfriended" });

  } catch (err) {
      console.error("Unfriend error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
  }
};