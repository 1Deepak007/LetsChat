const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");

module.exports = (io) => {
  // Fetch chat messages
  const getMessages = async (req, res) => {
    const { sender, receiver } = req.query;

    try {
      const senderId = new mongoose.Types.ObjectId(sender);
      const receiverId = new mongoose.Types.ObjectId(receiver);

      // Validate sender and receiver
      const [senderUser, receiverUser] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId),
      ]);

      if (!senderUser || !receiverUser) {
        return res
          .status(404)
          .json({ message: "Sender or receiver user not found" });
      }

      // Ensure sender and receiver are friends
      const isFriend = senderUser.friends.some(
        (friend) => friend.userId.toString() === receiver
      );

      if (!isFriend) {
        return res
          .status(403)
          .json({ message: "You are not friends with this user" });
      }

      // Fetch messages sorted by timestamp
      const messages = await Message.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
        isDeleted: false,
      })
        .sort({ timestamp: 1 })
        .lean();

      // If no messages, return a custom response
      if (messages.length === 0) {
        return res.json({ message: "Conversation empty" });
      }

      res.json(messages);
    } catch (err) {
    //   console.error("Error in getMessages:", err);
      res.status(500).json({ message: `Server error: ${err.message}` });
    }
  };

  // Send message and emit real-time event
  const sendMessage = async (req, res) => {
    const { sender, receiver, content } = req.body;

    try {
      const senderId = new mongoose.Types.ObjectId(sender);
      const receiverId = new mongoose.Types.ObjectId(receiver);

      // Validate sender and receiver
      const [senderUser, receiverUser] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId),
      ]);

      if (!senderUser || !receiverUser) {
        return res
          .status(404)
          .json({ message: "Sender or receiver user not found" });
      }

      // Ensure sender and receiver are friends
      const isFriend = senderUser.friends.some(
        (friend) => friend.userId.toString() === receiver
      );

      if (!isFriend) {
        return res
          .status(403)
          .json({ message: "You are not friends with this user" });
      }

      // Save message to database
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
      });
      await message.save();

      // Emit real-time message to both sender & receiver
      io.to(sender).emit("newMessage", message);
      io.to(receiver).emit("newMessage", message);

      res.status(201).json({ message: "Message sent", data: message });
    } catch (err) {
    //   console.error("Error in sendMessage:", err);
      res.status(500).json({ message: `Server error: ${err.message}` });
    }
  };

  const editMessage = async (req, res) => {
    const { messageId, newContent, userId } = req.body; // Add userId to validate sender

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found." });
      }

      // Only the sender can edit the message
      if (message.sender.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to edit this message." });
      }

      // Check if the message is older than 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000); // Fixed typo
      if (message.timestamp < sixHoursAgo) {
        return res.status(400).json({ message: "Message is too old to edit." });
      }

      // Update message content
      message.content = newContent;
      message.isEdited = true; // Fixed typo
      message.lastEditedAt = new Date();
      await message.save();

      // Emit edited message to sender and receiver
      io.to(message.sender.toString()).emit("messageEdited", message);
      io.to(message.receiver.toString()).emit("messageEdited", message);

      res.status(200).json({ message: "Message edited", data: message });
    } catch (err) {
    //   console.error(`Error in editMessage: ${err}`);
      res.status(500).json({ message: `Server error: ${err.message}` });
    }
  };


  // soft deletion : i am not actually deleting the message but turning it to isDeleted = true, which will soft delete the message.
  const deleteMessage = async (req, res) => {
    const { messageId, userId } = req.body; // Add userId to validate sender

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Only the sender can delete the message
      if (message.sender.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete this message." });
      }

      // Check if the message is older than 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      if (message.timestamp < sixHoursAgo) {
        return res
          .status(400)
          .json({ message: "Message is too old to delete" });
      }

      // Soft delete the message
      message.isDeleted = true;
      await message.save();

      // Emit deleted message to both sender & receiver
      io.to(message.sender.toString()).emit("messageDeleted", message);
      io.to(message.receiver.toString()).emit("messageDeleted", message);

      res.status(200).json({ message: "Message deleted", data: message });
    } catch (err) {
    //   console.error("Error in deleteMessage:", err);
      res.status(500).json({ message: `Server error: ${err.message}` });
    }
  };

  return { getMessages, sendMessage, editMessage, deleteMessage };
};
