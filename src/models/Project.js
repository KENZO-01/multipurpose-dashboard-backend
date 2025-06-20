const mongoose = require("mongoose")

const Project = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: [
            "superadmin",
            "project-owner",
            "project-maintainer",
            "project-developer",
          ],
          required: true,
        },
      },
    ],
    emailAlertOnDelayedIssue: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", Project);