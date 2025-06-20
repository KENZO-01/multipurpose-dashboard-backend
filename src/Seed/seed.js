require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Project = require("../models/Project");
const Issue = require("../models/Issue");

const bcrypt = require("bcrypt");


async function seed() {
  await connectDB();

  const passwordHash = await bcrypt.hash("123456", 10);
  // Clear existing data first
  await User.deleteMany({});
  await Project.deleteMany({});
  await Issue.deleteMany({});

  const owner = await User.create({
    first_name: "Alice",
    last_name: "Owner",
    username: "aliceOwner987654",
    email: "alice@example.com",
    passwordHash: passwordHash,
    role: "project-owner",
  });

  const developer = await User.create({
    first_name: "Charlie",
    last_name: "Developer",
    username: "charlieDeveloper3214",
    email: "charlie@example.com",
    passwordHash: passwordHash,
    role: "project-developer",
  });

  // Create a project
  const project = await Project.create({
    name: "Jira clone",
    key: "JIR",
    description: "Jira clone project",
    owner: owner._id,
    members: [
      { userId: owner._id, role: "project-owner" },
      { userId: developer._id, role: "project-developer" },
    ],
    emailAlertsOnDelayedIssue: true,
  });

  // Create an issue
  await Issue.create({
    projectId: project._id,
    title: "Design Database Schema",
    description: "Design the initial database schema",
    assignee: developer._id,
    reporter: owner._id,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // deadline in 7 days
  });

  console.log("✅ Database successfully seeded");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
