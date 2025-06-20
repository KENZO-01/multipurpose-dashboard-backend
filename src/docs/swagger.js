const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Jira Clone API",
      version: "1.0.0",
      description: "API documentation for the Jira Clone project",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./src/routes/*.js", "./src/models/*.js"], // point to your route files for annotations
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
