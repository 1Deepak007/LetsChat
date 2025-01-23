const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.register = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.create({ username, password });
    res.status(201).json({ message: 'User created. ', user })
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

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

