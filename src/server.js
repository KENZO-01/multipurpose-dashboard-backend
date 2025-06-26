require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require('multer');

const connectDB = require("./config/db")
const issueRouter = require("./routes/issue")
const userRouters = require("./routes/user")
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const auth = require("./middleware/auth")
const uploadRoute = require("./routes/uploadRoute")
const { ensureBucketExists } = require("./config/minioClient");
const projectRouters = require("./routes/project")

connectDB();
ensureBucketExists();

const app = express()

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', // Use environment variable or default to localhost
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true // Enable this if you need to allow cookies or authentication headers
}));

// Parse JSON bodies (as sent by API clients)
app.use(express.json())

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }))

// For parsing multipart/form-data (file uploads)
app.use(multer().none()) // This handles non-file multipart forms

app.use("/api", uploadRoute);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes
app.use("/api/auth", userRouters);
app.use('/api/issue', auth, issueRouter)
app.use('/api/project', projectRouters)

const port = 5000;
app.listen(port, () => console.log(`Server started on port ${port}`))