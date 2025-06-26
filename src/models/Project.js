const mongoose = require("mongoose")

const columnSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const previewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const codebaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

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
    columns: {
      type: [columnSchema],
      default: [
        { id: "todo", title: "Todo", order: 0, isDefault: true },
        { id: "in-progress", title: "In Progress", order: 1, isDefault: true },
        { id: "in-review", title: "In Review", order: 2, isDefault: true },
        { id: "done", title: "Done", order: 3, isDefault: true },
      ]
    },
    preview: {type: previewSchema},
    codebase: {type: codebaseSchema},
    emailAlertOnDelayedIssue: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Add method to check if user has admin or maintainer role
Project.methods.isUserAdminOrMaintainer = function(userId) {
  const member = this.members.find(m => m.userId.equals(userId));
  if (!member) return false;
  return ['superadmin', 'project-owner', 'project-maintainer'].includes(member.role);
};

module.exports = mongoose.model("Project", Project);