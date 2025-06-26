const mongoose = require("mongoose");

const IssueStatus = new mongoose.Schema({
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  color: { type: String, required: true },

});

module.exports = mongoose.model("IssueStatus", IssueStatus);
