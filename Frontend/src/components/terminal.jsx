import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { socket } from "../services/socket";

function TerminalComponent() {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
    });

    const fitAddon = new FitAddon();

    term.loadAddon(fitAddon);

    term.open(terminalRef.current);

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.log(err);
      }
    }, 100);

    socket.on("terminal:data", (data) => {
      term.write(data);
    });

    term.onData((data) => {
      socket.emit("terminal:write", data);
    });

    return () => {
      socket.off("terminal:data");
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full"
    />
  );
}

export default TerminalComponent;