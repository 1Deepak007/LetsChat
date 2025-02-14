const User = require('../models/User')
const bcrypt = require('bcryptjs');

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
        const user = await User.findByIdAndUpdate(req.user.id, { username }, { new: true }).select('-password');
        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// change password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        // console.log('Old Password Hash:', user.password);
        // console.log('New Password Before Hashing:', newPassword);

        user.password = newPassword;
        // user.password = await bcrypt.hash(newPassword, 10);
        // console.log('New Password After Hashing:', user.password);

        await user.save();
        // console.log('New Password After Hashing:', user.password);
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};
