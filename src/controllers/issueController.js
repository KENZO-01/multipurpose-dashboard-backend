const Issue = require("../models/Issue");

exports.create = async (req, res) => {
  try {
    debugger
    const { projectId, title, description, assignee, deadline } = req.body;
    const issue = await Issue.create({
      projectId,
      title,
      description,
      assignee: assignee || req.user._id,
      reporter: req.user._id,
      deadline,
    });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const issue = await Issue.findByIdAndUpdate(id, update, { new: true });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};
