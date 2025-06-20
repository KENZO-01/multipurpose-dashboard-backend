const mongoose = require("mongoose")

const IssueSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["ToDo", "InProgress", "Done", "Backlog"],
      default: "ToDo",
    },
    issueType: {
      type: String,
      enum: ["Bug", "Story", "Task", "Epic"],
      default: "Task",
    },
    deadline: { type: Date },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);