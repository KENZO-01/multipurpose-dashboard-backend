
const Project = require('../models/Project')

exports.create = async (req, res) => {
  try {
    const { name, key, description } = req.body;
    const project = await Project.create({
      name,
      key,
      description,
      owner: req.user._id,
      members: [{ userId: req.user._id, role: "project-owner" }],
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({
      status_code: 500,
      error: "Internal Server Error",
    });
  }
};

exports.AddMembers = async (req, res) => {
  try {
    const { projectId, userId, role } = req.body;
    const project = await Project.findById(projectId);
    project.members.push({ userId, role });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};