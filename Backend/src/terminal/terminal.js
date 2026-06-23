import pty from "node-pty";
import path from "path";

export const terminals = new Map();

export const createTerminal = (socket) => {
  const shell =
    process.platform === "win32"
      ? "powershell.exe"
      : "bash";

  // Move one level up from Backend folder
  const projectRoot = path.resolve(process.cwd(), "..");

  const term = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 120,
    rows: 30,
    cwd: projectRoot,
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