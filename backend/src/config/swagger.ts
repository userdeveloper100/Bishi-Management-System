import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bishi Management System API",
      version: "1.0.0",
      description:
        "API documentation for Bishi backend (Node.js + Express + PostgreSQL + Sequelize).",
    },
    servers: [
      {
        url: "http://localhost:5000/api", // change if needed
      },
    ],
    // Adds the "Authorize" button in Swagger UI. Paste the token from /auth/verify-otp or /auth/login.
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT from POST /api/auth/verify-otp or POST /api/auth/login. Enter the token without the word Bearer.",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts"], // route + model annotations
};

export const swaggerSpec = swaggerJsdoc(options);

export function swaggerDocs(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📄 Swagger docs available at http://localhost:5000/api-docs");
}
