import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import app from "./app";
import { logger } from "./lib/logger";
import { initializeGateways } from "./services/gateway.service";

// Ensure uploads directory exists
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info("Created uploads directory");
}

const PORT = process.env.PORT || 3001;

async function startServer() {
  // Initialize payment gateways
  try {
    await initializeGateways();
    logger.info("Payment gateways initialized");
  } catch (error) {
    logger.error("Failed to initialize payment gateways", { error: String(error) });
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
      environment: process.env.NODE_ENV || "development",
      api: `http://localhost:${PORT}/api/v1`,
      health: `http://localhost:${PORT}/health`,
    });
  });
}

startServer();
