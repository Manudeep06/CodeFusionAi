import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import executeCodeRoute from "./routes/executeCode.js";

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

const roomsCode = new Map();

const broadcastRoomUsers = async (roomId) => {
  try {
    const sockets = await io.in(roomId).fetchSockets();
    const usersList = sockets.map((s) => ({
      userId: s.id,
      username: s.username || "Developer",
      photoURL: s.photoURL || "",
    }));
    io.to(roomId).emit("room-users", usersList);
  } catch (err) {
    console.error("Error broadcasting room users:", err);
  }
};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.emit("welcome", "Socket Connected Successfully");

  // Create Room
  socket.on("create-room", async (data) => {
    let roomId = "";
    let username = "Developer";
    let photoURL = "";

    if (typeof data === "object" && data !== null) {
      roomId = data.roomId;
      username = data.username || "Developer";
      photoURL = data.photoURL || "";
    } else {
      roomId = data;
    }

    socket.join(roomId);
    socket.username = username;
    socket.photoURL = photoURL;
    socket.roomId = roomId;

    console.log(`${username} (${socket.id}) created room ${roomId}`);

    if (!roomsCode.has(roomId)) {
      roomsCode.set(roomId, "// Welcome to CodeFusionAI 🚀\n");
    }

    await broadcastRoomUsers(roomId);

    socket.emit("room-created", roomId);
  });

  // Join Room
  socket.on("join-room", async (data) => {
    let roomId = "";
    let username = "Developer";
    let photoURL = "";

    if (typeof data === "object" && data !== null) {
      roomId = data.roomId;
      username = data.username || "Developer";
      photoURL = data.photoURL || "";
    } else {
      roomId = data;
    }

    socket.join(roomId);
    socket.username = username;
    socket.photoURL = photoURL;
    socket.roomId = roomId;

    console.log(`${username} (${socket.id}) joined room ${roomId}`);

    if (!roomsCode.has(roomId)) {
      roomsCode.set(roomId, "// Welcome to CodeFusionAI 🚀\n");
    }

    await broadcastRoomUsers(roomId);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
      username,
      photoURL,
    });

    // Send current code to the joining user
    socket.emit("receive-code", roomsCode.get(roomId));

    socket.emit("room-joined", roomId);
  });

  // Real-Time Code Synchronization
  socket.on("code-change", ({ roomId, code }) => {
    roomsCode.set(roomId, code);
    socket.to(roomId).emit("receive-code", code);
  });

  // Handle disconnecting before socket leaves rooms to update counts
  socket.on("disconnecting", async () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        const sockets = await io.in(roomId).fetchSockets();
        const usersList = sockets
          .filter((s) => s.id !== socket.id)
          .map((s) => ({
            userId: s.id,
            username: s.username || "Developer",
            photoURL: s.photoURL || "",
          }));

        io.to(roomId).emit("room-users", usersList);

        if (usersList.length === 0) {
          roomsCode.delete(roomId);
        }
      }
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});
app.use("/api/execute", executeCodeRoute);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});