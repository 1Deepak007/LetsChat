const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const redisClient = require('./utils/redis');
const dotenv = require('dotenv');
const User = require('./models/User');
const authenticateJWT = require('./middleware/authMiddleware');
const cors = require('cors')
const friendRoutes = require('./routes/friendRoutes');

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

app.use(express.json());
app.use(cors())
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateJWT, chatRoutes);
app.use('/api/friends', authenticateJWT, friendRoutes)

app.get('/', (req, res) => {
  res.send('Server is running 🚀')
})

app.get('/getallusers', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  }
  catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error retrieving users' })
  }
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

let connectedUsers = {};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join', (userId) => {
    connectedUsers[userId] = socket.id;
  });

  socket.on('send_message', (data) => {
    const { receiver, message } = data;
    const receiverSocketId = connectedUsers[receiver];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected');
  });
});



server.listen(5000, () => {
  console.log('Server running on port 5000');
});
