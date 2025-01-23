const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose')

// http://localhost:5000/api/chat/messages?sender=6792114fdf921a9b0673a782&receiver=67921154df921a9b0673a784
exports.getMessages = async (req, res) => {
    const { sender, receiver } = req.query;

    try {
        // Convert sender & receiver to ObjectId
        const senderId = new mongoose.Types.ObjectId(sender);

        console.log("Received sender:", sender);
        console.log("Converted senderId:", senderId);

        const senderUser = await User.findById(senderId);

        if (!senderUser) {
            return res.status(404).json({ message: 'Sender user not found' });
        }

        if (!senderUser.friends.some(friend => friend.toString() === receiver)) {
            return res.status(403).json({ message: 'You are not friends with this user' });
        }

        const messages = await Message.find({
            $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error in getMessages:', err);
        res.status(500).json({ message: `Server error : ${err}` });
    }
};

// http://localhost:5000/api/chat/sendmessage       
// Payload (raw json) : { "sender":"6792114fdf921a9b0673a782",  "receiver":"67921154df921a9b0673a784",  "content":"Hello from root to root1" }

exports.sendMessage = async (req, res) => {
    const { sender, receiver, content } = req.body;

    try {
        // Ensure sender is an ObjectId
        const senderId = new mongoose.Types.ObjectId(sender);

        const senderUser = await User.findById(senderId);
        if (!senderUser) {
            return res.status(404).json({ message: 'Sender user not found' });
        }

        if (!senderUser.friends.includes(receiver)) {
            return res.status(403).json({ message: 'You are not friends with this user' });
        }

        const message = new Message({ sender, receiver, content });
        await message.save();

        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        res.status(500).json({ message: `Server error : ${err}` });
    }
};