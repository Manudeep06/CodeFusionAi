import { io } from "socket.io-client";

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const socket = io(URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
