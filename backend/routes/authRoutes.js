const express = require('express')
const { register, login, logout } = require('../controllers/authController')
const router = express.Router()
const authenticateJWT = require('../middleware/authMiddleware')

router.post('/signup', register)
router.post('/login', login)
router.post('/logout', authenticateJWT, logout)

module.exports = router