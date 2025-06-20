
require("dotenv").config()

const express = require("express")
const cors = require("cors")

const connectDB = require("./config/db")
const issueRouter = require("./routes/issue")
const userRouters = require("./routes/user")
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const auth = require("./middleware/auth")
const uploadRoute = require("./routes/uploadRoute")
// const projectRouters = require("./routes/project")

connectDB();

const app = express()
app.use(cors())

app.use("/api", uploadRoute);

app.use(express.json())

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes
app.use("/api/auth", userRouters);
app.use('/api/issue', auth, issueRouter)
// app.use('/api/project', projectRouters)

const port = 5000;
app.listen(port, () => console.log(`Server started on port ${port}`))