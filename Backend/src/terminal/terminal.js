import pty from "node-pty";
import path from "path";
import fs from "fs";
import os from "os";

export const terminals = new Map();

export const createTerminal = (socket, roomId) => {
  const shell =
    process.platform === "win32"
      ? "powershell.exe"
      : "bash";

  const workspacePath = path.join(os.tmpdir(), "codefusion-workspaces", roomId);
  
  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }

  const term = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 120,
    rows: 30,
    cwd: workspacePath,
    env: process.env,
  });

  terminals.set(socket.id, term);

  term.onData((data) => {
    socket.emit("terminal:data", data);
  });

  socket.on("terminal:write", (data) => {
    term.write(data);
  });

  socket.on("disconnect", () => {
    term.kill();
    terminals.delete(socket.id);
  });
};