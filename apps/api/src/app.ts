import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { apiRouter } from "./routes";
import { logger } from "./lib/logger";

const app = express();

// =============================================================================
// Security
// =============================================================================
app.use(helmet());

// =============================================================================
// CORS
// =============================================================================
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin) || corsOrigins.includes("*")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// =============================================================================
// Compression
// =============================================================================
app.use(compression());

// =============================================================================
// Body Parsing
// =============================================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =============================================================================
// Request Logging
// =============================================================================
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
});

// =============================================================================
// Rate Limiting
// =============================================================================
app.use("/api/", apiLimiter);

// =============================================================================
// Static Files
// =============================================================================
app.use("/uploads", express.static("uploads"));

// =============================================================================
// Health Check
// =============================================================================
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// =============================================================================
// API Info
// =============================================================================
app.get("/api", (_req, res) => {
  res.json({
    name: "FundorDonate API",
    version: "1.0.0",
    description: "Crowdfunding & Donation Platform API",
    docs: "/api/docs",
    endpoints: {
      auth: "/api/v1/auth",
      campaigns: "/api/v1/campaigns",
      donations: "/api/v1/donations",
      pledges: "/api/v1/pledges",
      funds: "/api/v1/funds",
      users: "/api/v1/users",
    },
  });
});

// =============================================================================
// API Routes
// =============================================================================
app.use("/api/v1", apiRouter);

// =============================================================================
// 404 Handler
// =============================================================================
app.use(notFoundHandler);

// =============================================================================
// Error Handler
// =============================================================================
app.use(errorHandler);

export default app;
