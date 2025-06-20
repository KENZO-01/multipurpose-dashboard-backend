const cron = require("node-cron");
const Issue = require("../models/Issue");
const Project = require("../models/Project");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Run every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  try {
    const now = new Date();
    const issues = await Issue.find({
      deadline: { $lte: now },
      emailSent: false,
    }).populate("projectId");

    for (const issue of issues) {
      if (issue.projectId.emailAlertsOnDelayedIssue) {
        const project = await Project.findById(issue.projectId).populate(
          "members.userId"
        );
        const recipients = project.members
          .filter((m) =>
            ["project-owner", "project-maintainer"].includes(m.role)
          )
          .map((m) => m.userId.email);

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipients,
          subject: `Issue ${issue.title} crossed deadline`,
          text: `Issue ${issue.title} crossed deadline on ${issue.deadline}`,
        });

        issue.emailSent = true;
        await issue.save();
      }
    }
  } catch (err) {
    console.error(err);
  }
});
