const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes')
const friendRoutes = require('./routes/friendRoutes')
const profileRoutes = require('./routes/profileRoutes')
const redisClient = require('./utils/redis')
const User = require('./models/User')
const authenticateJWT = require('./middleware/authMiddleware')


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000/',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});
// Pass io to chatRoutes
const chatRoutes = require('./routes/chatRoutes')(io);


app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes)
app.use('/api/chat', authenticateJWT, chatRoutes)
app.use('/api/friends', authenticateJWT, friendRoutes)
app.use('/api/profile', authenticateJWT, profileRoutes)

app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

app.get('/getallusers', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

// database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

/**
 * ✅ Socket.IO Connection Handling
 * - Users join a room with their userId (better than storing socketId manually)
 * - Broadcast message only to relevant users
 * - Handle disconnections properly
 */

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle real-time messaging
  socket.on('send_message', ({ sender, receiver, message }) => {
    console.log(`Message from ${sender} to ${receiver}: ${message}`);

    // Emit to the receiver's room
    io.to(receiver).emit('receive_message', { sender, message });

    // Save message in DB (handled in chatController)
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
