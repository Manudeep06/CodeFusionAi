import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import fileSystemRoute from "./routes/fileSystem.js";
import executeCodeRoute from "./routes/executeCode.js";
import { connectDB } from "./config/db.js";
import { registerSocketHandlers } from "./controllers/socketController.js";
import aiRoutes from "./routes/aiRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

app.use("/api/ai", aiRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins dynamically to support custom, branch, or deployed URLs
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 1e9, // 1 GB limit for large workspace uploads
});

// Register Socket.io event handlers
registerSocketHandlers(io);

// Register API Routes
app.use("/api/filesystem", fileSystemRoute);
app.use("/api/execute", executeCodeRoute);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});