const User = require('./User');
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,  // Indexing for fast lookups
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,  // Indexing for fast lookups
  },
  content: {
    type: String,
    default: '',
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "audio", "file"],
    required: true,
  },
  fileUrl: { 
    type: String,  // Stores URL/path of media (if messageType is not "text")
  },
  isRead: {
    type: Boolean,
    default: false,  // Track if the receiver has read the message
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,  // Soft delete functionality
  },
}, { timestamps: true });  // Automatically adds createdAt & updatedAt fields

// Index sender and receiver for faster querying
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);


// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   content: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now }  // ✅ Ensure timestamp is set
// });