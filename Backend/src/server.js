import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

// Config
import { connectDB } from "./config/db.js";

// Routes
import aiRoutes from "./routes/aiRoutes.js";
import fileSystemRoute from "./routes/fileSystem.js";
import executeCodeRoute from "./routes/executeCode.js";
import roomRoutes from "./routes/roomRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import fileRoutes from "./routes/file.routes.js";

// Controllers
import { registerSocketHandlers } from "./controllers/socketController.js";

// Services
import { startWorkspaceSyncInterval, stopWorkspaceSyncInterval } from "./services/workspace.service.js";

// Middleware (must be imported last, registered after routes)
import errorHandler from "./middleware/errorHandler.js";

// ─── Environment ──────────────────────────────────────────────────────────────
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

// CORS — allow all origins dynamically (supports preview, branch, and deployed URLs)
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/ai", aiRoutes);
app.use("/api/filesystem", fileSystemRoute); // kept for backward compatibility
app.use("/api/execute", executeCodeRoute);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "CodeFusionAI Backend",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Centralized Error Handler (MUST be last middleware) ──────────────────────
app.use(errorHandler);

// ─── HTTP + Socket.IO Server ──────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 1e9, // 1 GB — supports large workspace uploads
});

// Register Socket.IO event handlers
registerSocketHandlers(io);

// ─── Background Services ──────────────────────────────────────────────────────
// Start the periodic dirty-room flusher (Redis → S3 every 30s).
// Previously started inside socketController — moved here for explicit lifecycle control.
startWorkspaceSyncInterval(30000);

// ─── Server Startup ───────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[Server] CodeFusionAI running on port ${PORT} (${NODE_ENV})`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received — shutting down gracefully...`);

  // Stop background sync interval
  stopWorkspaceSyncInterval();

  // Close HTTP server (stop accepting new connections)
  httpServer.close(() => {
    console.log("[Server] HTTP server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));