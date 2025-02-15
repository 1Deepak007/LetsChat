const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const socketIo = require("socket.io");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const redisClient = require("./utils/redis");
const User = require("./models/User");
const Message = require("./models/Message");
const authenticateJWT = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Configure Multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profilePictures"); // Create this directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.use("/api/profile", authenticateJWT, profileRoutes(upload));

app.get("/getallusers", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving users" });
  }
});

// database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.join(socket.userId);
    next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.use((socket, next) => {
  // Socket.io middleware for JWT
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.join(socket.userId);
    next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  // This is the crucial block!
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`${socket.id} joined room ${userId}`);
  });

  socket.on("send_message", async ({ sender, receiver, message }) => {
    console.log(`Message from ${sender} to ${receiver}: ${message}`);

    try {
      const savedMessage = await Message.create({
        sender,
        receiver,
        content: message,
      });

      io.to(receiver).emit("newMessage", savedMessage);
      io.to(sender).emit("newMessage", savedMessage); 
    } catch (err) {
      console.error("Message error:", err);
      socket.emit("messageError", { message: "Error sending message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const chatRoutes = require("./routes/chatRoutes")(io);
const friendRoutes = require("./routes/friendRoutes")(io);

app.use("/api/auth", authRoutes);
app.use("/api/chat", authenticateJWT, chatRoutes);
app.use("/api/friends", authenticateJWT, friendRoutes);
app.use("/api/profile", authenticateJWT, profileRoutes);

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
