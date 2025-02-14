const express = require('express');
const authenticate = require('../middleware/authMiddleware');

module.exports = (io) => {
    const { getMessages, sendMessage, deleteMessage, editMessage } = require('../controllers/chatController')(io);
    const router = express.Router();

    router.get('/messages', authenticate, getMessages);
    router.post('/sendmessage', authenticate, sendMessage);
    router.put('/editmessage', authenticate, editMessage);
    router.delete('/deletemessage', authenticate, deleteMessage);

    return router;
};


