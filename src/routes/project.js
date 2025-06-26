const express = require("express");
const { body } = require('express-validator');
const controller = require("../controllers/projectController");
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

router.get("/all", controller.getProjects);

// Project CRUD
router.post(
  "/create",
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('key').notEmpty().withMessage('Key is required'),
    body('description').optional(),
    body('columns')
      .optional()
      .isArray()
      .withMessage('Columns must be an array')
  ],
  controller.create
);

router.put(
  "/update/:projectId",
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('key').optional().notEmpty().withMessage('Key cannot be empty'),
    body('description').optional(),
    body('preview').optional().isObject().withMessage('Preview must be an object'),
    body('preview.title').optional().isString(),
    body('preview.url').optional().isURL(),
    body('codebase').optional().isObject().withMessage('Codebase must be an object'),
    body('codebase.title').optional().isString(),
    body('codebase.url').optional().isURL(),
    body('emailAlertOnDelayedIssue').optional().isBoolean()
  ],
  controller.updateProject
);

router.delete(
  "/delete/:projectId",
  controller.deleteProject
);

// Column management routes
router.get('/:projectId/columns', controller.getColumns);
router.put(
  '/:projectId/columns',
  [
    body('columns')
      .isArray()
      .withMessage('Columns must be an array')
      .custom(columns => {
        if (!Array.isArray(columns)) return false;
        return columns.every(col =>
          col &&
          typeof col === 'object' &&
          'id' in col &&
          'title' in col &&
          'order' in col
        );
      })
      .withMessage('Each column must have id, title, and order')
  ],
  controller.updateColumns
);

router.post(
  '/:projectId/columns',
  [
    body('id').notEmpty().withMessage('Column ID is required'),
    body('title').notEmpty().withMessage('Column title is required'),
    body('order').isNumeric().withMessage('Order must be a number')
  ],
  controller.addColumn
);

router.put(
  '/:projectId/columns/:columnId',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('order').optional().isNumeric().withMessage('Order must be a number')
  ],
  controller.updateColumn
);

router.delete('/:projectId/columns/:columnId', controller.deleteColumn);

// Members management
router.post(
  "/addMember",
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('role')
      .isIn(['project-owner', 'project-maintainer', 'project-developer'])
      .withMessage('Invalid role')
  ],
  controller.AddMembers
);


module.exports = router;
