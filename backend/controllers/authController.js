const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const redisClient = require('../utils/redis');

exports.register = async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'Username already exists.' });
        user = await User.create({ username, password });
        res.status(201).json({ message: 'User created. ', user })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'User not found.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '6h' });

        const notifications = user.notifications;
        user.notifications = []; // Clear notifications after showing once
        await user.save();


        user.password = undefined; // remove password when sending user in json
        console.log("user : ", user);
        res.json({ user, token, notifications });
    } catch (err) {
        res.status(500).json({ message: `Server error : ${err}` });
    }
}

// Logout API using Redis to store invalid tokens
exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];// Extract token from Authorization header
        if (!token) return res.status(401).json({ message: 'No token found' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store token in Redis with the same expiration time (6 hours)
        await redisClient.setex(`blacklist:${token}`, 6 * 3600, 'logged out');

        res.status(200).json({ message: 'User logged out successfully' });
    }
    catch (err) {
        res.status(500).json({ message: `Server error: ${err}` });
    }
}