const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

module.exports = (io) => {

    // Fetch chat messages
    const getMessages = async (req, res) => {

        const { sender, receiver } = req.query;   //http://localhost:5000/api/chat/messages?sender=6794c805be2c8c5e3ce3fb3c&receiver=6794c78cbe2c8c5e3ce3fb37
        // const { sender, receiver } = req.body;

        try {
            const senderId = new mongoose.Types.ObjectId(sender);
            const receiverId = new mongoose.Types.ObjectId(receiver);

            // Validate sender
            const senderUser = await User.findById(senderId);
            if (!senderUser) {
                return res.status(404).json({ message: 'Sender user not found' });
            }

            // Ensure sender and receiver are friends
            if (!senderUser.friends.some(friend => friend.toString() === receiver)) {
                return res.status(403).json({ message: 'You are not friends with this user' });
            }

            // Fetch messages sorted by timestamp
            const messages = await Message.find({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId }
                ]
            }).sort({ timestamp: 1 }).lean(); // `lean()` improves performance

            res.json(messages);
        } catch (err) {
            console.error('Error in getMessages:', err);
            res.status(500).json({ message: `Server error: ${err.message}` });
        }
    };

    // Send message and emit real-time event
    const sendMessage = async (req, res) => {
        const { sender, receiver, content } = req.body;

        try {
            const senderId = new mongoose.Types.ObjectId(sender);
            const receiverId = new mongoose.Types.ObjectId(receiver);

            // Validate sender
            const senderUser = await User.findById(senderId);
            if (!senderUser) {
                return res.status(404).json({ message: 'Sender user not found' });
            }

            // Ensure sender and receiver are friends
            if (!senderUser.friends.some(friend => friend.toString() === receiver)) {
                return res.status(403).json({ message: 'You are not friends with this user' });
            }

            // Save message to database
            const message = new Message({ sender: senderId, receiver: receiverId, content });
            await message.save();

            // Emit real-time message to both sender & receiver
            io.to(sender).emit('newMessage', message);
            io.to(receiver).emit('newMessage', message);

            res.status(201).json({ message: 'Message sent', data: message });
        } catch (err) {
            console.error('Error in sendMessage:', err);
            res.status(500).json({ message: `Server error: ${err.message}` });
        }
    };

    return { getMessages, sendMessage };
};
