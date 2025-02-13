const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friends: [{
      _id: false,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String
    }],
    friendRequests: [{
      _id: false,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String
    }],
    notifications: [{
      message: String,
      createdAt: { type: Date, default: Date.now }
    }]
  });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema);