import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

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

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (err) {
          console.log("xterm fit error", err);
        }
      });
    });
    resizeObserver.observe(terminalRef.current);

    let jshProcess = null;
    let inputWriter = null;

    const initWebContainer = async () => {
      try {
        term.write("Booting WebContainer...\r\n");
        const { getWebContainer } = await import("../services/webcontainer");
        const instance = await getWebContainer();
        
        jshProcess = await instance.spawn("jsh", {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        jshProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        inputWriter = jshProcess.input.getWriter();

        term.onData((data) => {
          if (inputWriter) {
            inputWriter.write(data);
          }
        });
        
        // Handle resizing the WebContainer process terminal
        term.onResize((size) => {
          if (jshProcess) {
            jshProcess.resize({ cols: size.cols, rows: size.rows });
          }
        });
        
        // Handle run code button clicks
        const runCodeHandler = (e) => {
          if (inputWriter) {
            inputWriter.write(e.detail.cmd);
          }
        };
        window.addEventListener('run-code-command', runCodeHandler);
        
        // Expose cleanup
        term._runCodeHandler = runCodeHandler;
        
      } catch (err) {
        term.write(`\r\n\x1b[31mError booting WebContainer: ${err.message}\x1b[0m\r\n`);
      }
    };

    initWebContainer();

    return () => {
      resizeObserver.disconnect();
      if (term._runCodeHandler) {
        window.removeEventListener('run-code-command', term._runCodeHandler);
      }
      if (inputWriter) {
        inputWriter.releaseLock();
      }
      if (jshProcess) {
        jshProcess.kill();
      }
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full overflow-hidden relative"
      style={{ minHeight: 0 }}
    />
  );
}

export default TerminalComponent;