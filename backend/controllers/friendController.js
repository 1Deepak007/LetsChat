const User = require('../models/User')

exports.sendRequest = async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user.id;

    try {
        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ message: 'User not found' });

        if (receiver.friendRequests.includes(senderId) || receiver.friends.includes(senderId)) {
            return res.status(400).json({ message: 'Already sent request or already friends' });
        }

        receiver.friendRequests.push(senderId);
        await receiver.save();

        res.json({ message: 'Friend request sent' });
    } catch (err) {
        res.status(500).json({ message: 'Server error : ', err });
    }
}

exports.acceptRequest = async (req, res) => {
    const { senderId } = req.params;
    const receiverId = req.user.id;

    try {
        const receiver = await User.findById(receiverId);
        const sender = await User.findById(senderId);
        if (!receiver || !sender) return res.status(404).json({ message: 'User not found' });

        if (!receiver.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: 'No pending request from this user' });
        }

        // Add to friends list
        receiver.friends.push(senderId);
        sender.friends.push(receiverId);

        // Remove request
        receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);

        // Add notification for sender
        sender.notifications.push(`User ${receiver.username} accepted your friend request.`);

        await receiver.save();
        await sender.save();

        res.json({ message: 'Friend request accepted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error : ', err });
    }
}

exports.getFriends = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).populate('friends', 'username');
        if (!user) {
            return res.status(404).json({ message: "Can't find your profile" });
        }
        const friends = user.friends;
        if (friends.length === 0) {
            res.json({ message: "Sorry! You don't have any friends yet. Make some friends!" });
        } else {
            res.json(friends);
        }
    } catch (err) {
        res.status(500).json({ message: `Server error : ${err}` });
    }
}

exports.getFriendByUsername = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username }, { password: 0, __v: 0 }).populate('friends', 'username');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: `Server error : ${error}` });
    }
}
