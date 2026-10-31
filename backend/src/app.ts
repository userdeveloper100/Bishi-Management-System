import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { swaggerDocs } from "./config/swagger";
import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();

// ---------- Middlewares ----------
app.use(cors()); // Enable CORS for all origins (can configure later)
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ---------- Routes ----------
app.use("/api", routes);


// Swagger docs
swaggerDocs(app as any);

// ---------- Health Check ----------
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Bishi API is running 🚀",
    });
});

// ---------- 404 Handler ----------
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// ---------- Global Error Handler ----------
app.use(errorHandler);

export default app;
