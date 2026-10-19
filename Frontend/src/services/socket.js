import { io } from "socket.io-client";
import { getIdToken } from "./api";

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// autoConnect: false — connect only when explicitly needed (Dashboard/Room call socket.connect())
// Prevents socket.io polling from spawning on the Login page and blocking other network requests
export const socket = io(URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // The server rejects sockets without a valid Firebase ID token.
  auth: (cb) => { getIdToken().then((token) => cb({ token })).catch(() => cb({})); },
});

