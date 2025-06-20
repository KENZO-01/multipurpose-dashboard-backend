const express = require("express");
const controller = require("../controllers/issueController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Issue
 *   description: Jira Issues endpoints
 */

/**
 * @swagger
 * /api/issue/create:
 *   post:
 *     summary: create a new issue
 *     tags: [Issue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - title
 *             properties:
 *               projectId:
 *                 type: string
 *               title:
 *                  type: string
 *               description:
 *                 type: string
 *               assignee:
 *                 type: string
 *               reporter:
 *                 type: string
 *               status:
 *                 type: string
 *               issueType:
 *                 type: string
 *               deadline:
 *                 type: string
 *               emailSent:
 *                 type: string
 *     responses:
 *       200:
 *         description: issue registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/create", controller.create);

/**
 * @swagger
 * /api/issue/update/{id}:
 *   put:
 *     summary: Update issue
 *     tags: [Issue]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The issue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignee:
 *                 type: string
 *               reporter:
 *                 type: string
 *               status:
 *                 type: string
 *               issueType:
 *                 type: string
 *               deadline:
 *                 type: string
 *               emailSent:
 *                 type: string
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/update/:id", controller.update);


module.exports = router;
