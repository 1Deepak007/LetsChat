const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          require: true,
        },
        username: {
          type: String,
          requires: true,
        },
      },
    ],
    notifications: [
      {
        notificationType: {
          type: String,
          enum: ["friend_request", "message", "system"],
          required: true,
        },
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    currentLocation: {
      type: String,
      default: "", // Or you could use a GeoJSON point for more precise location
    },
    hometown: {
      type: String,
      default: "",
    },
    profession: {
      type: String,
      default: "",
    },
    hobbies: {
      type: [String], // Array of hobbies (good for multiple entries)
      default: [],
    },
    favoritePlaces: {
      type: [String], // Array of favorite places
      default: [],
    },
    bio: {
      // Optional: Add a bio field
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
