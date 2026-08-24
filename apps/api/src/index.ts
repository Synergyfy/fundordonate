import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import app from "./app";
import { logger } from "./lib/logger";

// Ensure uploads directory exists
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info("Created uploads directory");
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || "development",
    api: `http://localhost:${PORT}/api/v1`,
    health: `http://localhost:${PORT}/health`,
  });
});
