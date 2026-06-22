import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.emit("welcome", "Socket Connected Successfully");

  socket.on("create-room", (roomId) => {
    socket.join(roomId);

    console.log(`${socket.id} created room ${roomId}`);

    socket.emit("room-created", roomId);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    console.log(`${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
    });

    socket.emit("room-joined", roomId);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});