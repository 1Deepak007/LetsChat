const jwt = require('jsonwebtoken');
const redisClient = require('../utils/redis');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Extract token after "Bearer "

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // Verify the token
            if (err) {
                return res.sendStatus(403); // Token invalid or expired
            }

            req.user = user; // Add user info to the request
            next(); // Proceed to the next middleware/route handler
        });
    } else {
        res.sendStatus(401); // No token provided
    }
};


module.exports = authenticate;




// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const authenticate = async (req, res, next) => {
//     const token = req.header('Authorization')?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'Access denied. No token provided' });

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (err) {
//         res.status(401).json({ message: 'Invalid token' });
//     }
// };

// module.exports = authenticate;
