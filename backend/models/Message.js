const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }  // ✅ Ensure timestamp is set
});


module.exports = mongoose.model('Message', messageSchema);




// const messageSchema = new mongoose.Schema({
//   sender: { type: String, required: true },
//   receiver: { type: String, required: true },
//   content: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now }
// });
