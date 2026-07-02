import { useState, useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

// SVG Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TerminalIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

function SingleTerminalInstance({ id, isActive }) {
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const isActiveRef = useRef(isActive);

  // Keep isActiveRef updated
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        selectionBackground: "rgba(88, 166, 255, 0.3)",
      },
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (err) {
          // ignore fit errors during hidden state
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
            cols: term.cols || 80,
            rows: term.rows || 24,
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
        
        term.onResize((size) => {
          if (jshProcess) {
            jshProcess.resize({ cols: size.cols, rows: size.rows });
          }
        });
        
        const runCodeHandler = (e) => {
          if (isActiveRef.current && inputWriter) {
            inputWriter.write(e.detail.cmd);
          }
        };
        window.addEventListener('run-code-command', runCodeHandler);
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

  // Refit when tab becomes active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          // ignore
        }
      }, 50);
    }
  }, [isActive]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full overflow-hidden relative"
      style={{ minHeight: 0 }}
    />
  );
}

function TerminalComponent() {
  const [terminalsList, setTerminalsList] = useState([
    { id: Date.now(), label: "powershell" }
  ]);
  const [activeId, setActiveId] = useState(terminalsList[0].id);

  const addTerminal = () => {
    const newId = Date.now();
    const newTerm = {
      id: newId,
      label: "powershell"
    };
    setTerminalsList([...terminalsList, newTerm]);
    setActiveId(newId);
  };

  const closeTerminal = (idToClose, e) => {
    if (e) e.stopPropagation();

    const index = terminalsList.findIndex(t => t.id === idToClose);
    const newTerminals = terminalsList.filter(t => t.id !== idToClose);
    setTerminalsList(newTerminals);

    if (newTerminals.length > 0) {
      if (activeId === idToClose) {
        // Focus the adjacent terminal
        const nextActiveIndex = index === 0 ? 0 : index - 1;
        setActiveId(newTerminals[nextActiveIndex].id);
      }
    } else {
      setActiveId(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[#0d1117]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 h-9 bg-[#161b22] border-b border-[#30363d] select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Terminal</span>
        </div>

        {/* Action buttons (Plus and Delete active terminal) */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={addTerminal}
            title="New Terminal"
            className="p-1 rounded-md hover:bg-[#21262d] hover:text-slate-100 transition-colors cursor-pointer"
          >
            <PlusIcon />
          </button>
          <button
            onClick={() => closeTerminal(activeId)}
            disabled={terminalsList.length <= 1}
            title="Delete Terminal"
            className="p-1 rounded-md hover:bg-[#21262d] hover:text-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Terminal bodies */}
        <div className="flex-1 min-h-0 relative bg-[#0d1117] p-3">
          {terminalsList.length > 0 ? (
            terminalsList.map((term) => (
              <div
                key={term.id}
                className="absolute inset-0 p-3"
                style={{
                  visibility: term.id === activeId ? "visible" : "hidden",
                  pointerEvents: term.id === activeId ? "auto" : "none",
                }}
              >
                <SingleTerminalInstance id={term.id} isActive={term.id === activeId} />
              </div>
            ))
          ) : (
            /* Placeholder when no terminals are open */
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <TerminalIcon className="w-10 h-10 text-slate-700" />
              <span className="text-xs font-semibold text-slate-400">No active terminals</span>
              <button
                onClick={addTerminal}
                className="px-3 py-1.5 rounded-md bg-[#21262d] text-slate-200 hover:bg-[#30363d] text-xs font-semibold cursor-pointer border border-[#30363d]"
              >
                New Terminal
              </button>
            </div>
          )}
        </div>

        {/* Right: Vertical terminal tabs list sidebar */}
        {terminalsList.length > 0 && (
          <div className="w-[180px] shrink-0 border-l border-[#30363d] bg-[#161b22]/40 flex flex-col p-2 gap-1 overflow-y-auto no-scrollbar">
            {terminalsList.map((term) => (
              <div
                key={term.id}
                onClick={() => setActiveId(term.id)}
                className={`group relative flex items-center justify-between pl-3 pr-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 ${
                  activeId === term.id
                    ? "bg-[#21262d]/65 text-[#58a6ff]"
                    : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#21262d]/25"
                }`}
              >
                {/* Active Indicator blue line on the left */}
                {activeId === term.id && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#58a6ff] rounded-r" />
                )}

                <div className="flex items-center gap-2 truncate">
                  <TerminalIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{term.label}</span>
                </div>

                {terminalsList.length > 1 && (
                  <button
                    onClick={(e) => closeTerminal(term.id, e)}
                    className="p-0.5 rounded-md hover:bg-[#30363d] text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TerminalComponent;