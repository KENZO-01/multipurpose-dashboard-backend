const Project = require('../models/Project')
const User = require('../models/User');
const Issue = require('../models/Issue');
const { validationResult } = require('express-validator');

// Middleware to check if user is admin or maintainer
const checkAdminOrMaintainer = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user._id);
    const isGlobalSuperadmin = user?.role === 'superadmin';

    if (!isGlobalSuperadmin && !project.isUserAdminOrMaintainer(req.user._id)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, key, description, columns } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.create({
      name,
      key,
      description,
      columns: columns || undefined, // Use default if not provided
      owner: req.user._id,
      members: [{ userId: req.user._id, role: "project-owner" }],
    });

    res.status(201).json(project);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Project with this key already exists' });
    }
    res.status(500).json({
      status_code: 500,
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get project columns
exports.getColumns = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .select('columns');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project.columns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update project columns
// Only accessible by admin/maintainer
// Expected request body: { columns: [{id, title, order, isDefault?}, ...] }
exports.updateColumns = [
  checkAdminOrMaintainer,
  async (req, res) => {
    try {
      const { columns } = req.body;

      if (!Array.isArray(columns)) {
        return res.status(400).json({ message: 'Columns must be an array' });
      }

      // Validate each column
      for (const [index, col] of columns.entries()) {
        if (!col.id || !col.title || typeof col.order !== 'number') {
          return res.status(400).json({
            message: `Column at index ${index} is missing required fields (id, title, or order)`
          });
        }
      }

      const project = req.project;
      project.columns = columns;
      await project.save();

      res.json({ message: 'Columns updated successfully', columns: project.columns });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// Add a single column
// Only accessible by admin/maintainer
exports.addColumn = [
  checkAdminOrMaintainer,
  async (req, res) => {
    try {
      const { id, title, order } = req.body;

      if (!id || !title || typeof order !== 'number') {
        return res.status(400).json({
          message: 'Missing required fields: id, title, and order are required'
        });
      }

      const project = req.project;

      // Check if column with this ID already exists
      if (project.columns.some(col => col.id === id)) {
        return res.status(400).json({ message: 'A column with this ID already exists' });
      }

      project.columns.push({ id, title, order });
      await project.save();

      res.status(201).json(project.columns[project.columns.length - 1]);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// Update a single column
// Only accessible by admin/maintainer
exports.updateColumn = [
  checkAdminOrMaintainer,
  async (req, res) => {
    try {
      const { columnId } = req.params;
      const { title, order } = req.body;

      const project = req.project;
      const column = project.columns.id(columnId);

      if (!column) {
        return res.status(404).json({ message: 'Column not found' });
      }

      if (title !== undefined) column.title = title;
      if (order !== undefined) column.order = order;

      await project.save();

      res.json(column);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// Delete a column
// Only accessible by admin/maintainer
exports.deleteColumn = [
  checkAdminOrMaintainer,
  async (req, res) => {
    try {
      const { columnId } = req.params;
      const project = req.project;

      const column = project.columns.id(columnId);
      if (!column) {
        return res.status(404).json({ message: 'Column not found' });
      }

      // Prevent deletion of default columns
      if (column.isDefault) {
        return res.status(400).json({ message: 'Cannot delete default columns' });
      }

      // TODO: Handle issues that might be using this column

      project.columns.pull({ _id: column._id });
      await project.save();

      res.json({ message: 'Column deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

exports.AddMembers = async (req, res) => {
  try {
    const { projectId, userId, role } = req.body;

    // Only allow admins/maintainers to add members
    const project = await Project.findById(projectId);
    if (!project.isUserAdminOrMaintainer(req.user._id)) {
      return res.status(403).json({
        message: 'You do not have permission to add members'
      });
    }

    // Check if user is already a member
    const isMember = project.members.some(member =>
      member.userId.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push({ userId, role });
    await project.save();

    res.status(201).json(project);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid project or user ID' });
    }
    res.status(500).json({
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("role");

    let projects;

    if (user?.role === 'superadmin') {
      // Superadmin: fetch all projects
      projects = await Project.find()
      .populate("owner", "username email first_name last_name")
      .populate("members.userId", "userId username email first_name last_name");
    } else {
      // Fetch projects where user is owner or assigned with a valid role
      projects = await Project.find({
        $or: [
          { owner: userId },
          {
            members: {
              $elemMatch: {
                userId,
                role: { $in: ['project-admin', 'project-maintainer', 'project-developer'] },
              },
            },
          },
        ],
      })
      .populate("owner", "username email first_name last_name")
      .populate("members.userId", "userId username email first_name last_name");
    }

    res.json(projects);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


exports.updateProject = [
  checkAdminOrMaintainer,
  async (req, res) => {
    try {
      const { name, key, description, preview, codebase, emailAlertOnDelayedIssue } = req.body;
      const project = req.project;

      // Only superadmin, project-owner, or maintainer allowed to update
      const user = await User.findById(req.user._id);
      const isAllowed = user?.role === 'superadmin' || project.isUserAdminOrMaintainer(req.user._id);
      if (!isAllowed) {
        return res.status(403).json({ message: 'You do not have permission to update this project' });
      }

      if (name) project.name = name;
      if (key) project.key = key;
      if (description) project.description = description;
      if (typeof emailAlertOnDelayedIssue === 'boolean') {
        project.emailAlertOnDelayedIssue = emailAlertOnDelayedIssue;
      }

      if (preview) {
        project.preview = {
          title: preview.title || project.preview?.title,
          url: preview.url || project.preview?.url,
        };
      }

      if (codebase) {
        project.codebase = {
          title: codebase.title || project.codebase?.title,
          url: codebase.url || project.codebase?.url,
        };
      }

      await project.save();

      res.json({ message: 'Project updated successfully', project });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
];


exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const user = await User.findById(req.user._id);

    if (user?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can delete projects' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete related issues
    await Issue.deleteMany({ projectId });

    // Delete the project itself
    await project.deleteOne();

    res.json({ message: 'Project and associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};