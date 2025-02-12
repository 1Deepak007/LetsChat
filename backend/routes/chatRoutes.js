const express = require('express');
const authenticate = require('../middleware/authMiddleware');

module.exports = (io) => {
    const { getMessages, sendMessage, deleteMessage, editMessage } = require('../controllers/chatController')(io);
    const router = express.Router();

    router.get('/messages', authenticate, getMessages);
    router.post('/sendmessage', authenticate, sendMessage);
    // router.delete('/deletemessage/:messageId', authenticate, deleteMessage);
    router.put('/editmessage', authenticate, editMessage);
    router.delete('/deletemessage', authenticate, deleteMessage);

    return router;
};



// const express = require('express')
// const { getMessages, sendMessage } = require('../controllers/chatController')
// const authenticate = require('../middleware/authMiddleware')
// const router = express.Router()

// router.get('/messages', authenticate, getMessages)
// router.post('/sendmessage', authenticate, sendMessage)

// module.exports = router