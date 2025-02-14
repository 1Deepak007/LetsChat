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

    // Check existing requests
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

    // Add friend request
    receiver.friendRequests.push({
      userId: senderId,
      username: sender.username,
    });

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
    // console.error("Error sending friend request:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.acceptRequest = async (req, res) => {
    const { senderId } = req.params;
    const receiverId = req.user.id;
  
    try {
      // Find receiver and sender
      const receiver = await User.findById(receiverId);
      const sender = await User.findById(senderId);
  
      // Check if users exist
      if (!receiver || !sender) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if the request exists in receiver's friendRequests array
      const requestExists = receiver.friendRequests.some(
        (request) => request.userId.toString() === senderId
      );
  
      if (!requestExists) {
        return res
          .status(400)
          .json({ message: "No pending request from this user" });
      }
  
      // Add to friends list
      receiver.friends.push({ userId: senderId, username: sender.username });
      sender.friends.push({ userId: receiverId, username: receiver.username });
  
      // Remove request from receiver's friendRequests array
      receiver.friendRequests = receiver.friendRequests.filter(
        (request) => request.userId.toString() !== senderId
      );
  
      // Add notification for sender
      sender.notifications.push({
        message: `User ${receiver.username} accepted your friend request.`,
      });
  
      // Save changes
      await receiver.save();
      await sender.save();
  
      res.json({ message: "Friend request accepted" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };

exports.getFriends = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate("friends", "username");
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

// exposts.getFriendRequests = async(req,res) => {
//     const {userId} = req.params;

//     try{
//         const query = {
//             $pr:[
//                 {}
//             ]
//         }
//     }
// }
