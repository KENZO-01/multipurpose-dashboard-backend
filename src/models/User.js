const mongoose = require("mongoose")

const User = new mongoose.Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "superadmin",
        "project-owner",
        "project-maintainer",
        "project-developer",
      ],
      default: "project-developer",
    },
    resetToken: { type: String },
    resetTokenExp: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", User);