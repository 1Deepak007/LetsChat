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
                ],
                isDeleted:false
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

    const editMessage = async(req,res) => {
        const {messageId,newContent} = req.body;
        try{
            const message = await Message.findById(messageId);
            if(!message){
                return res.status(404).json({message:'Message not found.'})
            }
            const sixHoursAgo = new Date(Date.now() - 6*60*60*100);
            if(message.timestamp < sixHoursAgo){
                return res.status(400).json({message:'Message is too old to edit.'})
            }
            message.content = newContent;
            message.idEdited = true;
            message.lastEditedAt = new Date();
            await message.save();

            // emit edited message to sender and receiver
            io.to(message.sender.toString()).emit('messageEdited',message);
            io.to(message.receiver.toString()).emit('messageEdited',message);
            res.status(200).json({message:'Message edited', data:message})
        }
        catch(err){
            console.error(`Error in editmessage. ${err}`)
            res.status(500).json({message:`Server error : ${err.message}`})
        }
    }


    const deleteMessage = async (req, res) => {
        const { messageId } = req.body;

        try {
            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ message: 'Message not found' });
            }

            // Check if the message is older than 6 hours
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
            if (message.timestamp < sixHoursAgo) {
                return res.status(400).json({ message: 'Message is too old to delete' });
            }

            // Soft delete the message
            message.isDeleted = true;
            await message.save();

            // Emit deleted message to both sender & receiver
            io.to(message.sender.toString()).emit('messageDeleted', message);
            io.to(message.receiver.toString()).emit('messageDeleted', message);

            res.status(200).json({ message: 'Message deleted', data: message });
        } catch (err) {
            console.error('Error in deleteMessage:', err);
            res.status(500).json({ message: `Server error: ${err.message}` });
        }
    };

    return { getMessages, sendMessage, editMessage, deleteMessage };
};
