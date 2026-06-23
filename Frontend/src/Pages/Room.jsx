import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import TerminalComponent from "../components/Terminal";

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */
const LANGUAGES = [
  { id: "javascript", label: "JavaScript",  ext: ["js", "jsx"],  color: "#c8a64b" },
  { id: "python",     label: "Python",       ext: ["py"],         color: "#4c8eda" },
  { id: "cpp",        label: "C++",          ext: ["cpp","h","c"],color: "#6c8fca" },
  { id: "java",       label: "Java",         ext: ["java"],       color: "#d68a3a" },
  { id: "css",        label: "CSS",          ext: ["css"],        color: "#9b8cd4" },
  { id: "html",       label: "HTML",         ext: ["html","htm"], color: "#e37933" },
  { id: "json",       label: "JSON",         ext: ["json"],       color: "#cbcb41" },
];

const BOILERPLATES = {
  javascript: '// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World!");\n',
  python: '# Welcome to CodeFusionAI 🚀\n\nprint("Hello World!")\n',
  cpp: '// Welcome to CodeFusionAI 🚀\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World!" << std::endl;\n    return 0;\n}\n',
  java: '// Welcome to CodeFusionAI 🚀\n\npublic class temp_run {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}\n',
  css: '/* Welcome to CodeFusionAI 🚀 */\n\nbody {\n    margin: 0;\n    padding: 0;\n}\n',
  html: '<!-- Welcome to CodeFusionAI 🚀 -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>\n',
  json: '{\n  "message": "Hello World!"\n}\n'
};

function getLangByExt(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return LANGUAGES.find((l) => l.ext.includes(ext)) || null;
}

function getFileColor(filename) {
  const lang = getLangByExt(filename);
  return lang ? lang.color : "#858585";
}

/* ── Enhanced VS Code colour palette ── */
const VS = {
  bg:           "#0d1117",
  sidebarBg:    "#161b22",
  activityBg:   "#0d1117",
  tabBarBg:     "#161b22",
  tabActive:    "#0d1117",
  tabInactive:  "#161b22",
  tabBorder:    "#30363d",
  statusBg:     "#1f2937",
  input:        "#21262d",
  border:       "#30363d",
  highlight:    "#1d4ed840",
  hover:        "#1c2128",
  text:         "#e6edf3",
  textMuted:    "#7d8590",
  textDim:      "#484f58",
  accent:       "#58a6ff",
  accentPurple: "#a371f7",
  green:        "#3fb950",
  teal:         "#39d353",
  yellow:       "#e3b341",
  red:          "#f85149",
  orange:       "#f0883e",
  gradientA:    "#58a6ff",
  gradientB:    "#a371f7",
};

/* ═══════════════════════════════════════
   FILE ICON (SVG coloured by language)
═══════════════════════════════════════ */
function FileIcon({ filename, size = 14 }) {
  const color = getFileColor(filename);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M4 2h5.5L13 5.5V14H4V2z" fill={color + "20"} stroke={color} strokeWidth="1" />
      <path d="M9 2v3.5h4" stroke={color} strokeWidth="1" fill="none" />
      <path d="M6 8h4M6 10h3" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function FolderIcon({ open = false, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      {open ? (
        <>
          <path d="M1 5h4.5l1.5 2H15v7H1V5z" fill="#e3b34120" stroke="#e3b341" strokeWidth="0.9" />
          <path d="M1 7h14" stroke="#e3b341" strokeWidth="0.7" opacity="0.5" />
        </>
      ) : (
        <path d="M1 5h4.5l1 2H15v7H1V5z" fill="#e3b34118" stroke="#e3b341" strokeWidth="0.9" />
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════
   ACTIVITY BAR ICON
═══════════════════════════════════════ */
function ActivityIcon({ title, active, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-12 h-12 flex items-center justify-center relative group transition-all duration-150"
      style={{
        color: active ? "#e6edf3" : "#484f58",
        borderLeft: active ? "2px solid #58a6ff" : "2px solid transparent",
        background: active ? "#1c2128" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "#7d8590";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "#484f58";
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
          style={{ background: "linear-gradient(180deg, #58a6ff, #a371f7)" }}
        />
      )}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════
   MODAL — NEW FILE / FOLDER
═══════════════════════════════════════ */
function NewItemModal({ isFolder, parentPath, existingPaths, onConfirm, onCancel }) {
  const [name,  setName]  = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 40); }, []);

  const submit = (e) => {
    e.preventDefault();
    const t = name.trim();
    if (!t)               return setError("A file name must be provided.");
    if (t.includes("/"))  return setError("The name may not contain '/'.");
    const full = parentPath ? `${parentPath}/${t}` : t;
    if (existingPaths.includes(full)) return setError("A file or folder with that name already exists.");
    onConfirm(t);
  };

  const accentColor = isFolder ? "#e3b341" : "#58a6ff";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[440px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          boxShadow: `0 0 0 1px #30363d, 0 24px 48px #00000080, 0 0 60px ${accentColor}18`,
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >


        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: accentColor + "18", border: `1px solid ${accentColor}30` }}
          >
            {isFolder ? "📁" : "📄"}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
              New {isFolder ? "Folder" : "File"}
            </h3>
            {parentPath && (
              <p className="text-[11px] mt-0.5" style={{ color: "#7d8590", fontFamily: "Consolas, monospace" }}>
                inside / {parentPath}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none transition-colors"
            style={{ color: "#484f58" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#484f58"}
          >×</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="px-5 pb-5 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#7d8590" }}>
              {isFolder ? "Folder" : "File"} Name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={isFolder ? "e.g.  components" : "e.g.  index.js"}
              spellCheck={false}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-150"
              style={{
                background: "#0d1117",
                color: "#e6edf3",
                border: `1px solid ${error ? "#f85149" : accentColor + "60"}`,
                fontFamily: "'Consolas', monospace",
                boxShadow: error ? "0 0 0 3px #f8514920" : `0 0 0 3px ${accentColor}12`,
              }}
            />
            {error && (
              <p className="mt-2 text-[11px] flex items-center gap-1.5" style={{ color: "#f85149" }}>
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button" onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ background: "#21262d", color: "#7d8590", border: "1px solid #30363d" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#7d8590"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all duration-150"
              style={{ background: accentColor, color: "#fff" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Create {isFolder ? "Folder" : "File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MODAL — DELETE CONFIRM
═══════════════════════════════════════ */
function DeleteModal({ path, isFolder, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[420px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          boxShadow: "0 0 0 1px #30363d, 0 24px 48px #00000080, 0 0 60px #f8514918",
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #f85149, #ff6b6b)" }} />

        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "#f8514918", border: "1px solid #f8514930" }}>
            🗑
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Delete {isFolder ? "Folder" : "File"}</h3>
            <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: "#7d8590" }}>{path}</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
            style={{ color: "#484f58" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#484f58"}
          >×</button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#f8514910", border: "1px solid #f8514920", color: "#e6edf3" }}>
            {isFolder
              ? "This will permanently delete the folder and all files inside it."
              : "This will permanently delete this file."}{" "}
            <span style={{ color: "#7d8590" }}>This action cannot be undone.</span>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "#21262d", color: "#7d8590", border: "1px solid #30363d" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#7d8590"}
            >Cancel</button>
            <button onClick={onConfirm}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: "linear-gradient(135deg, #f85149, #ff6b6b)", color: "#fff", boxShadow: "0 4px 14px #f8514930" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MODAL — UPLOAD CONFIRM
═══════════════════════════════════════ */
function UploadModal({ fileCount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[440px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          boxShadow: "0 0 0 1px #30363d, 0 24px 48px #00000080, 0 0 60px #58a6ff18",
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #58a6ff, #a371f7)" }} />
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "#58a6ff18", border: "1px solid #58a6ff30" }}>📤</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Upload Folder</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#7d8590" }}>{fileCount} files ready to import</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
            style={{ color: "#484f58" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#484f58"}
          >×</button>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#e3b34110", border: "1px solid #e3b34120", color: "#e6edf3" }}>
            ⚠ Uploading will <span style={{ color: "#f85149", fontWeight: 600 }}>replace your current workspace</span>. All existing files will be lost.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "#21262d", color: "#7d8590", border: "1px solid #30363d" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#7d8590"}
            >Cancel</button>
            <button onClick={onConfirm}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: "linear-gradient(135deg, #58a6ff, #a371f7)", color: "#fff", boxShadow: "0 4px 14px #58a6ff30" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >Upload & Replace</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COPY ROOM ID BUTTON
═══════════════════════════════════════ */
function CopyRoomId({ roomId }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy Room ID"
      className="flex items-center justify-center w-4 h-4 rounded transition-all duration-150"
      style={{ color: copied ? "#3fb950" : "#7d8590" }}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = "#a371f7"; }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = "#7d8590"; }}
    >
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l4 4 6-6" stroke="#3fb950" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="1" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 5v9a1 1 0 0 0 1 1h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Room() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const username    = user?.displayName || user?.email?.split("@")[0] || "Developer";
  const photoURL    = user?.photoURL || "";

  /* ── State ── */
  const [files,           setFiles]           = useState([{
    path: "main.js",
    content: BOILERPLATES.javascript,
    isFolder: false,
    language: "javascript",
  }]);
  const [code,            setCode]            = useState(BOILERPLATES.javascript);
  const [activeFile,      setActiveFile]      = useState("main.js");
  const [openTabs,        setOpenTabs]        = useState(["main.js"]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [language,        setLanguage]        = useState("javascript");
  const [users,           setUsers]           = useState([]);
  const [isRunning,       setIsRunning]       = useState(false);
  const [activePanel,     setActivePanel]     = useState("explorer"); // explorer | users | ai
  const [aiInput,         setAiInput]         = useState("");
  const [aiMessages,      setAiMessages]      = useState([
    { role: "assistant", text: "Hi! I'm your AI coding assistant. Ask me anything about your code, algorithms, or debugging." },
  ]);
  const [aiLoading,       setAiLoading]       = useState(false);
  const aiBottomRef = useRef(null);

  /* ── Terminal resize ── */
  const [terminalHeight, setTerminalHeight] = useState(185);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const onDividerMouseDown = (e) => {
    isDragging.current  = true;
    dragStartY.current  = e.clientY;
    dragStartH.current  = terminalHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const delta  = dragStartY.current - e.clientY;
      const newH   = Math.max(80, Math.min(600, dragStartH.current + delta));
      setTerminalHeight(newH);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  /* ── Modal state ── */
  const [newItemModal,  setNewItemModal]  = useState(null);
  const [deleteModal,   setDeleteModal]   = useState(null);
  const [uploadPending, setUploadPending] = useState(null);

  /* ── Refs ── */
  const activeFileRef = useRef("main.js");
  const fileInputRef  = useRef(null);

  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);

  /* ── Sync language whenever active file changes ── */
  useEffect(() => {
    if (!activeFile) return;
    const f = files.find((file) => file.path === activeFile);
    if (f && f.language) {
      setLanguage(f.language);
    } else {
      const lang = getLangByExt(activeFile);
      if (lang) setLanguage(lang.id);
    }
  }, [activeFile, files]);

  /* ── Socket ── */
  useEffect(() => {
    // Ensure the socket is connected
    if (!socket.connected) socket.connect();

    socket.emit("join-room", { roomId, username, photoURL });

    // Sync current files to disk immediately after joining (handles server restarts)
    socket.on("room-joined", () => {
      setFiles((currentFiles) => {
        if (currentFiles.length > 0) {
          socket.emit("sync-workspace", { roomId, code: JSON.stringify(currentFiles) });
        }
        return currentFiles;
      });
    });

    socket.on("receive-code", (incomingCode) => {
      try {
        const parsed = JSON.parse(incomingCode);
        if (Array.isArray(parsed)) {
          setFiles((cur) => {
            if (JSON.stringify(cur) === incomingCode) return cur;
            const hit = parsed.find((f) => f.path === activeFileRef.current && !f.isFolder);
            if (hit) {
              setCode(hit.content || "");
              setLanguage(hit.language || getLangByExt(hit.path)?.id || "javascript");
            } else {
              const first = parsed.find((f) => !f.isFolder);
              if (first) {
                setTimeout(() => {
                  setActiveFile(first.path);
                  setCode(first.content || "");
                  setLanguage(first.language || getLangByExt(first.path)?.id || "javascript");
                }, 0);
              }
            }
            return parsed;
          });
          return;
        }
      } catch (_) { /* legacy plain string */ }
      // Legacy plain-string code
      setCode(incomingCode || "");
      setFiles((prev) => {
        let changed = false;
        const next = prev.map((f) => {
          if (f.path === activeFileRef.current && f.content !== incomingCode) {
            changed = true;
            return { ...f, content: incomingCode || "" };
          }
          return f;
        });
        return changed ? next : prev;
      });
    });

    socket.on("room-users", setUsers);

    socket.on("run-code-finished", () => {
      setIsRunning(false);
    });

    return () => {
      socket.off("room-joined");
      socket.off("receive-code");
      socket.off("room-users");
      socket.off("run-code-finished");
    };
  }, [roomId]);

  /* ── Helpers ── */
  const emitFiles = (upd) => socket.emit("code-change", { roomId, code: JSON.stringify(upd) });

  const openFile = (path, content) => {
    setActiveFile(path);
    setCode(content || "");
    const fileItem = files.find((f) => f.path === path);
    if (fileItem && fileItem.language) {
      setLanguage(fileItem.language);
    } else {
      const lang = getLangByExt(path);
      if (lang) setLanguage(lang.id);
    }
    setOpenTabs((t) => t.includes(path) ? t : [...t, path]);
  };

  const closeTab = (e, path) => {
    e.stopPropagation();
    const next = openTabs.filter((t) => t !== path);
    setOpenTabs(next);
    if (activeFile === path) {
      const newActive = next[next.length - 1] || "";
      const f = files.find((f) => f.path === newActive);
      setActiveFile(newActive);
      setCode(f?.content || "");
    }
  };

  const handleCodeChange = (value) => {
    const updated = files.map((f) => f.path === activeFile ? { ...f, content: value || "" } : f);
    setFiles(updated); setCode(value || ""); emitFiles(updated);
  };

  /* ── Create ── */
  const confirmCreate = (name) => {
    const { parentPath, isFolder } = newItemModal;
    const itemPath = parentPath ? `${parentPath}/${name}` : name;
    const lang = getLangByExt(name);
    const langId = lang ? lang.id : "javascript";
    const initialContent = isFolder ? undefined : (BOILERPLATES[langId] || "");
    const newItem  = { 
      path: itemPath, 
      isFolder, 
      content: initialContent, 
      language: langId 
    };
    const updated  = [...files, newItem];
    setFiles(updated);
    if (!isFolder) openFile(itemPath, initialContent);
    else if (parentPath) setExpandedFolders((p) => ({ ...p, [parentPath]: true }));
    emitFiles(updated);
    setNewItemModal(null);
  };

  /* ── Delete ── */
  const confirmDelete = () => {
    const { path, isFolder } = deleteModal;
    const updated = files.filter((f) => isFolder ? f.path !== path && !f.path.startsWith(`${path}/`) : f.path !== path);
    setFiles(updated);
    const tabs = openTabs.filter((t) => isFolder ? t !== path && !t.startsWith(`${path}/`) : t !== path);
    setOpenTabs(tabs);
    if (!tabs.includes(activeFile)) {
      const f = updated.find((f) => !f.isFolder);
      setActiveFile(f?.path || ""); setCode(f?.content || "");
    }
    emitFiles(updated);
    setDeleteModal(null);
  };

  /* ── Upload ── */
  const handleFolderUpload = useCallback(async (e) => {
    const all = Array.from(e.target.files).filter((f) => {
      const p = f.webkitRelativePath;
      return !p.includes("/node_modules/") && !p.includes("/.git/") && !p.includes("/dist/") && !p.includes("/build/");
    });
    const items = [];
    for (const f of all) {
      try { items.push({ path: f.webkitRelativePath, content: await f.text(), isFolder: false }); }
      catch (err) { console.error(err); }
    }
    if (items.length) setUploadPending(items);
    e.target.value = "";
  }, []);

  const confirmUpload = () => {
    const items = uploadPending;

    // Build explicit folder entries from all path segments
    const folderSet = new Set();
    items.forEach((f) => {
      const parts = f.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        folderSet.add(parts.slice(0, i).join("/"));
      }
    });
    const folderEntries = Array.from(folderSet).map((p) => ({ path: p, isFolder: true, content: undefined }));
    const allItems = [...folderEntries, ...items];

    setFiles(allItems);
    const first = items.find((f) => !f.isFolder);
    if (first) openFile(first.path, first.content);
    setOpenTabs(first ? [first.path] : []);
    const exp = {};
    items.forEach((f) => { const p = f.path.split("/"); if (p.length > 1) exp[p[0]] = true; });
    setExpandedFolders(exp);
    emitFiles(allItems);
    setUploadPending(null);
  };

  const runCode = () => {
    setIsRunning(true);
    socket.emit("run-code", {
      code,
      language,
    });
  };



  /* ── ZIP Download ── */
  const downloadZip = async () => {
    if (!window.JSZip) {
      await new Promise((res) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        s.onload = res; document.head.appendChild(s);
      });
    }
    const zip = new window.JSZip();
    files.forEach((f) => { if (!f.isFolder) zip.file(f.path, f.content || ""); });
    const blob = await zip.generateAsync({ type: "blob" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `workspace-${roomId}.zip` }).click();
    URL.revokeObjectURL(url);
  };

  /* ── Tree builder ── */
  const buildTree = (list) => {
    const root = { children: [] };
    list.forEach((file) => {
      let cur = root, curPath = "";
      file.path.split("/").forEach((part, i, arr) => {
        curPath = curPath ? `${curPath}/${part}` : part;
        let child = cur.children?.find((c) => c.name === part);
        if (!child) {
          child = { name: part, path: curPath, isFolder: i < arr.length - 1 || !!file.isFolder, content: i === arr.length - 1 ? file.content : undefined, children: [] };
          cur.children.push(child);
        }
        cur = child;
      });
    });
    const sort = (n) => {
      n.children?.sort((a, b) => a.isFolder !== b.isFolder ? (a.isFolder ? -1 : 1) : a.name.localeCompare(b.name));
      n.children?.forEach(sort);
    };
    sort(root);
    return root.children;
  };

  /* ── Tree renderer ── */
  const renderTree = (nodes, depth = 0) =>
    nodes.map((node) => {
      const isExpanded = !!expandedFolders[node.path];
      const isSelected = activeFile === node.path;

      if (node.isFolder) {
        return (
          <div key={node.path}>
            <div
              className="group flex items-center gap-1.5 cursor-pointer select-none"
              style={{
                paddingLeft: `${depth * 12 + 8}px`,
                paddingRight: "4px",
                paddingTop: "2px",
                paddingBottom: "2px",
                background: "transparent",
                color: VS.text,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = VS.hover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => setExpandedFolders((p) => ({ ...p, [node.path]: !p[node.path] }))}
            >
              {/* Chevron */}
              <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", fill: VS.textMuted }}>
                <path d="M3 1l4 4-4 4" stroke={VS.textMuted} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <FolderIcon open={isExpanded} size={15} />
              <span className="text-[13px] flex-1 truncate" style={{ color: VS.text }}>{node.name}</span>
              {/* Inline actions (show on hover via CSS trick with opacity on the group) */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  title="New File"
                  onClick={(e) => { e.stopPropagation(); setNewItemModal({ parentPath: node.path, isFolder: false }); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs hover:opacity-80"
                  style={{ color: VS.textMuted }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M9 2H4v12h8V6.5L9 2zm0 0v4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8 9v4M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                </button>
                <button
                  title="New Folder"
                  onClick={(e) => { e.stopPropagation(); setNewItemModal({ parentPath: node.path, isFolder: true }); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs hover:opacity-80"
                  style={{ color: VS.textMuted }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 4h5l1 2h8v7H1V4z" stroke="#dcb67a" strokeWidth="1.2" fill="none" /><path d="M8 8v4M6 10h4" stroke={VS.textMuted} strokeWidth="1.2" strokeLinecap="round" /></svg>
                </button>
                <button
                  title="Delete Folder"
                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ path: node.path, isFolder: true }); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs hover:opacity-80"
                  style={{ color: VS.textMuted }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
            {isExpanded && node.children && renderTree(node.children, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          className="group flex items-center gap-1.5 cursor-pointer select-none"
          style={{
            paddingLeft: `${depth * 12 + 22}px`,
            paddingRight: "4px",
            paddingTop: "2px",
            paddingBottom: "2px",
            background: isSelected ? VS.highlight : "transparent",
            color: isSelected ? "#fff" : VS.text,
          }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = VS.hover; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
          onClick={() => openFile(node.path, node.content)}
        >
          <FileIcon filename={node.name} size={15} />
          <span className="text-[13px] flex-1 truncate">{node.name}</span>
          <button
            title="Delete"
            onClick={(e) => { e.stopPropagation(); setDeleteModal({ path: node.path, isFolder: false }); }}
            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80"
            style={{ color: VS.textMuted }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      );
    });

  const treeNodes     = buildTree(files);
  const existingPaths = files.map((f) => f.path);
  const fileCount     = files.filter((f) => !f.isFolder).length;

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <>
      {/* ── MODALS ── */}
      {newItemModal  && <NewItemModal  {...newItemModal}  existingPaths={existingPaths} onConfirm={confirmCreate} onCancel={() => setNewItemModal(null)} />}
      {deleteModal   && <DeleteModal   {...deleteModal}   onConfirm={confirmDelete}     onCancel={() => setDeleteModal(null)} />}
      {uploadPending && <UploadModal   fileCount={uploadPending.length}                 onConfirm={confirmUpload}            onCancel={() => setUploadPending(null)} />}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
      `}</style>
      <div
        className="h-screen flex flex-col overflow-hidden"
        style={{ background: VS.bg, color: VS.text, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: "13px" }}
      >

        {/* ══ TITLE BAR ══ */}
        <div
          className="h-9 flex items-center justify-between px-4 select-none shrink-0"
          style={{
            background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)",
            borderBottom: "1px solid #21262d",
          }}
        >
          {/* Left – Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-black shrink-0"
              style={{ background: "linear-gradient(135deg, #58a6ff, #a371f7)", boxShadow: "0 0 10px #58a6ff40" }}
            >
              ⚡
            </div>
            <span
              className="text-[12px] font-bold tracking-tight"
              style={{ background: "linear-gradient(90deg, #58a6ff, #a371f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              CodeFusionAI
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: "#58a6ff12", color: "#58a6ff", border: "1px solid #58a6ff25" }}
            >
              Collaborative IDE
            </span>
          </div>

          {/* Centre – active file breadcrumb */}
          <div className="flex items-center gap-1 text-[11px]" style={{ color: VS.textMuted }}>
            {activeFile && (
              <>
                <span>{activeFile.split("/").slice(0, -1).join(" › ")}</span>
                {activeFile.includes("/") && <span style={{ color: VS.textDim }}> › </span>}
                <span style={{ color: VS.text }}>{activeFile.split("/").pop()}</span>
              </>
            )}
          </div>

          {/* Right – nothing here now; Leave is in activity bar */}
          <div />
        </div>

        {/* ══ MAIN BODY ══ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ━━ ACTIVITY BAR ━━ */}
          <div
            className="w-12 shrink-0 flex flex-col items-center pt-1"
            style={{ background: "#0d1117", borderRight: "1px solid #21262d" }}
          >
            {/* Explorer */}
            <ActivityIcon
              title="Explorer"
              active={activePanel === "explorer"}
              onClick={() => setActivePanel(activePanel === "explorer" ? null : "explorer")}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="2" width="11" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
                <path d="M9 2v14" stroke="currentColor" strokeWidth="1.4" />
                <rect x="6" y="8" width="13" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" fill={VS.activityBg} />
              </svg>
            </ActivityIcon>

            {/* Search */}
            <ActivityIcon title="Search" active={false} onClick={() => {}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </ActivityIcon>

            {/* Users */}
            <ActivityIcon
              title="Collaborators"
              active={activePanel === "users"}
              onClick={() => setActivePanel(activePanel === "users" ? null : "users")}
            >
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="19" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M22 21v-.5a5 5 0 0 0-5-5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                {users.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-bold"
                    style={{ background: VS.accent, color: "#fff" }}
                  >
                    {users.length}
                  </span>
                )}
              </div>
            </ActivityIcon>

            {/* AI Assistant */}
            <ActivityIcon
              title="AI Assistant"
              active={activePanel === "ai"}
              onClick={() => setActivePanel(activePanel === "ai" ? null : "ai")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a5 5 0 0 1 5 5c0 2-1 3.5-2.5 4.5L16 21H8l1.5-9.5C8 10.5 7 9 7 7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M9 21h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="12" cy="7" r="1.5" fill="currentColor" opacity="0.6" />
              </svg>
            </ActivityIcon>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings */}
            <ActivityIcon title="Settings" active={false} onClick={() => {}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </ActivityIcon>

            {/* Leave Room */}
            <button
              title="Leave Room"
              onClick={() => navigate("/dashboard")}
              className="w-12 h-12 flex items-center justify-center relative transition-all duration-150 group"
              style={{ color: "#484f58", borderLeft: "2px solid transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f85149"; e.currentTarget.style.background = "#f8514912"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#484f58"; e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ━━ SIDEBAR PANEL ━━ */}
          {activePanel && (
            <div
              className="w-60 shrink-0 flex flex-col overflow-hidden"
              style={{ background: "#161b22", borderRight: "1px solid #21262d" }}
            >
              {/* Panel title */}
              <div
                className="h-8 flex items-center justify-between px-3 shrink-0"
                style={{ borderBottom: "1px solid #21262d" }}
              >
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: "#7d8590" }}
                >{
                  activePanel === "explorer" ? "Explorer"
                  : activePanel === "users" ? "Collaborators"
                  : "AI Assistant"
                }</span>
                {activePanel === "explorer" && (
                  <div className="flex items-center gap-0.5">
                    {/* New file */}
                    <button
                      title="New File"
                      onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}
                      className="w-6 h-6 flex items-center justify-center rounded hover:opacity-80"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9 2H4v12h8V6.5L9 2zm0 0v4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8 9v4M6 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                    {/* New folder */}
                    <button
                      title="New Folder"
                      onClick={() => setNewItemModal({ parentPath: "", isFolder: true })}
                      className="w-6 h-6 flex items-center justify-center rounded hover:opacity-80"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 4h5l1 2h8v7H1V4z" stroke="#dcb67a" strokeWidth="1.2" fill="none" /><path d="M8 8v4M6 10h4" stroke={VS.textMuted} strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                    {/* Upload */}
                    <input type="file" ref={fileInputRef} webkitdirectory="true" directory="true" multiple onChange={handleFolderUpload} className="hidden" />
                    <button
                      title="Upload Folder"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-6 h-6 flex items-center justify-center rounded hover:opacity-80"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 11V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                    {/* Download ZIP */}
                    <button
                      title="Download as ZIP"
                      onClick={downloadZip}
                      className="w-6 h-6 flex items-center justify-center rounded hover:opacity-80"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* ── EXPLORER ── */}
              {activePanel === "explorer" && (
                <div className="flex-1 overflow-y-auto">
                  {/* Workspace section */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest cursor-default select-none"
                    style={{ color: "#484f58" }}
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" style={{ fill: "#484f58" }}>
                      <path d="M2 1l6 4-6 4V1z" />
                    </svg>
                    Workspace
                  </div>
                  <div className="pb-4">
                    {files.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <div className="text-3xl mb-2" style={{ opacity: 0.15 }}>📂</div>
                        <p className="text-xs italic" style={{ color: "#484f58" }}>No files yet. Click + to create one.</p>
                      </div>
                    ) : (
                      renderTree(treeNodes)
                    )}
                  </div>
                </div>
              )}

              {/* ── COLLABORATORS ── */}
              {activePanel === "users" && (
                <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
                  {users.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <div className="text-3xl mb-2" style={{ opacity: 0.15 }}>👥</div>
                      <p className="text-xs italic" style={{ color: "#484f58" }}>No collaborators yet.</p>
                    </div>
                  ) : (
                    users.map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
                        style={{ background: "#1c2128", border: "1px solid #21262d" }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg, #58a6ff, #a371f7)", color: "#fff", boxShadow: "0 0 8px #58a6ff30" }}
                        >
                          {(u.username || "U")[0].toUpperCase()}
                        </div>
                        <span className="text-[12px] truncate" style={{ color: "#e6edf3" }}>{u.username || "User"}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#3fb950", boxShadow: "0 0 4px #3fb950" }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── AI ASSISTANT ── */}
              {activePanel === "ai" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black"
                              style={{ background: "linear-gradient(135deg, #a371f7, #58a6ff)", color: "#fff" }}
                            >✦</div>
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#a371f7" }}>AI</span>
                          </div>
                        )}
                        <div
                          className="max-w-full rounded-lg px-3 py-2 text-[12px] leading-5 whitespace-pre-wrap break-words"
                          style={{
                            background: msg.role === "user"
                              ? "linear-gradient(135deg, #58a6ff22, #a371f722)"
                              : "#1c2128",
                            border: msg.role === "user"
                              ? "1px solid #58a6ff30"
                              : "1px solid #21262d",
                            color: "#e6edf3",
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[8px]" style={{ background: "linear-gradient(135deg, #a371f7, #58a6ff)", color: "#fff" }}>✦</div>
                        <div className="flex gap-1">
                          {[0,1,2].map((j) => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: "#a371f7", animation: `pulse 1s ${j * 0.2}s infinite` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={aiBottomRef} />
                  </div>

                  {/* Quick prompts */}
                  <div className="px-3 pb-2 flex flex-col gap-1.5">
                    <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#484f58" }}>Quick Prompts</p>
                    <div className="flex flex-col gap-1">
                      {[
                        "Explain this code",
                        "Find bugs",
                        "Optimize performance",
                        "Add comments",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => {
                            const msg = `${prompt}: \n\`\`\`\n${code.slice(0, 400)}${code.length > 400 ? "..." : ""}\n\`\`\``;
                            setAiMessages((prev) => [...prev, { role: "user", text: prompt }]);
                            setAiLoading(true);
                            setTimeout(() => {
                              setAiMessages((prev) => [...prev, {
                                role: "assistant",
                                text: `Here's my analysis for "${prompt}":\n\nThis is a ${language} file. I can see ${files.filter(f=>!f.isFolder).length} file(s) in your workspace.\n\n💡 Connect a real AI API (OpenAI / Gemini) to get live responses!`,
                              }]);
                              setAiLoading(false);
                              setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                            }, 1200);
                          }}
                          className="text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150"
                          style={{ background: "#1c2128", color: "#7d8590", border: "1px solid #21262d" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a371f740"; e.currentTarget.style.color = "#e6edf3"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#21262d"; e.currentTarget.style.color = "#7d8590"; }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="px-3 pb-3">
                    <div
                      className="flex items-end gap-2 rounded-xl p-2"
                      style={{ background: "#0d1117", border: "1px solid #30363d" }}
                    >
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!aiInput.trim() || aiLoading) return;
                            const userText = aiInput.trim();
                            setAiMessages((prev) => [...prev, { role: "user", text: userText }]);
                            setAiInput("");
                            setAiLoading(true);
                            setTimeout(() => {
                              setAiMessages((prev) => [...prev, {
                                role: "assistant",
                                text: `Thanks for your question about "${userText.slice(0, 60)}"!\n\n💡 Connect a real AI API (OpenAI / Gemini) to get live intelligent responses here.`,
                              }]);
                              setAiLoading(false);
                              setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                            }, 1000);
                          }
                        }}
                        placeholder="Ask AI anything... (Enter to send)"
                        rows={2}
                        className="flex-1 bg-transparent outline-none resize-none text-[12px] leading-5"
                        style={{ color: "#e6edf3", fontFamily: "'Segoe UI', sans-serif" }}
                      />
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-150"
                        style={{
                          background: aiInput.trim() && !aiLoading
                            ? "linear-gradient(135deg, #a371f7, #58a6ff)"
                            : "#21262d",
                          color: aiInput.trim() && !aiLoading ? "#fff" : "#484f58",
                        }}
                        onClick={() => {
                          if (!aiInput.trim() || aiLoading) return;
                          const userText = aiInput.trim();
                          setAiMessages((prev) => [...prev, { role: "user", text: userText }]);
                          setAiInput("");
                          setAiLoading(true);
                          setTimeout(() => {
                            setAiMessages((prev) => [...prev, {
                              role: "assistant",
                              text: `Thanks for your question about "${userText.slice(0, 60)}"!\n\n💡 Connect a real AI API (OpenAI / Gemini) to get live intelligent responses here.`,
                            }]);
                            setAiLoading(false);
                            setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                          }, 1000);
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          )}

          {/* ━━ EDITOR COLUMN ━━ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* ── TOOLBAR ── */}
            <div
              className="h-9 shrink-0 flex items-center justify-between px-3 gap-3"
              style={{ background: "#161b22", borderBottom: "1px solid #21262d" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150"
                  style={{ color: "#7d8590", border: "1px solid #30363d", background: "#0d1117" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#484f58"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#30363d"}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span
                    className="bg-transparent outline-none text-[12px] font-medium"
                    style={{ color: "#e6edf3", cursor: "default" }}
                  >
                    {LANGUAGES.find(l => l.id === language)?.label || "Text"}
                  </span>
                </div>
              </div>
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150"
                style={{ 
                  background: isRunning ? "#21262d" : "linear-gradient(135deg, #238636, #2ea043)", 
                  color: isRunning ? "#858585" : "#fff", 
                  boxShadow: isRunning ? "none" : "0 2px 8px #23863640",
                  cursor: isRunning ? "not-allowed" : "pointer"
                }}
                onMouseEnter={(e) => { if (!isRunning) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { if (!isRunning) e.currentTarget.style.opacity = "1"; }}
              >
                {isRunning ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="#fff"><path d="M1 1l8 4-8 4V1z" /></svg>
                    Run Code
                  </>
                )}
              </button>
            </div>

            {/* ── TAB BAR ── */}
            <div
              className="flex items-end overflow-x-auto shrink-0"
              style={{ background: "#0d1117", borderBottom: "1px solid #21262d", scrollbarWidth: "none", minHeight: "35px" }}
            >
              {openTabs.map((tab) => {
                const isActive = tab === activeFile;
                const fileItem = files.find((f) => f.path === tab);
                const fileColor = getFileColor(tab.split("/").pop());
                return (
                  <div
                    key={tab}
                    className="flex items-center gap-2 px-3.5 shrink-0 cursor-pointer group transition-colors duration-100"
                    style={{
                      height: "35px",
                      background: isActive ? "#161b22" : "transparent",
                      borderRight: "1px solid #21262d",
                      borderTop: isActive ? `1px solid ${fileColor}` : "1px solid transparent",
                      color: isActive ? "#e6edf3" : "#484f58",
                      minWidth: "110px",
                      maxWidth: "190px",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#7d8590"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#484f58"; }}
                    onClick={() => { if (fileItem) openFile(tab, fileItem.content); }}
                  >
                    <FileIcon filename={tab.split("/").pop()} size={13} />
                    <span className="text-[12px] truncate flex-1 font-medium">{tab.split("/").pop()}</span>
                    <button
                      onClick={(e) => closeTab(e, tab)}
                      className="w-4 h-4 flex items-center justify-center rounded text-[12px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      style={{ color: "#7d8590" }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── MONACO EDITOR ── */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  fontLigatures: true,
                  lineHeight: 22,
                  minimap: { enabled: true, scale: 0.8 },
                  automaticLayout: true,
                  padding: { top: 10 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "blink",
                  renderLineHighlight: "line",
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                  overviewRulerLanes: 0,
                }}
              />
            </div>

            {/* ── DRAG DIVIDER ── */}
            <div
              onMouseDown={onDividerMouseDown}
              className="shrink-0 flex items-center justify-center"
              style={{
                height: "5px",
                background: "#21262d",
                cursor: "ns-resize",
                position: "relative",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#58a6ff"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#21262d"}
              title="Drag to resize terminal"
            >
              <div style={{ width: "40px", height: "2px", borderRadius: "1px", background: "inherit", opacity: 0.4 }} />
            </div>

            {/* ── TERMINAL / OUTPUT ── */}
            <div
              className="shrink-0 flex flex-col"
              style={{ height: `${terminalHeight}px`, background: "#0d1117" }}
            >


              {/* Output */}
              <div className="flex-1 overflow-hidden px-4 py-2.5">
                <TerminalComponent />
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATUS BAR ══ */}
        <div
          className="h-6 shrink-0 flex items-center justify-between px-3 select-none"
          style={{
            background: "linear-gradient(90deg, #1f2937 0%, #111827 50%, #1f2937 100%)",
            borderTop: "1px solid #21262d",
            color: "#7d8590",
            fontSize: "11px",
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Git branch */}
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors duration-150 cursor-pointer"
              style={{ color: "#58a6ff" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#58a6ff18"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <circle cx="5" cy="4" r="2" stroke="#58a6ff" strokeWidth="1.3" />
                <circle cx="11" cy="4" r="2" stroke="#58a6ff" strokeWidth="1.3" />
                <circle cx="5" cy="12" r="2" stroke="#58a6ff" strokeWidth="1.3" />
                <path d="M5 6v4M5 6c0 2 6 2 6-2" stroke="#58a6ff" strokeWidth="1.3" />
              </svg>
              <span className="font-medium">main</span>
            </div>

            {/* Online */}
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer transition-colors duration-150"
              onMouseEnter={(e) => e.currentTarget.style.background = "#3fb95018"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#3fb950", boxShadow: "0 0 4px #3fb950" }} />
              <span style={{ color: "#3fb950" }} className="font-medium">{users.length} online</span>
            </div>
          </div>

          {/* Centre – room ID + copy */}
          <div className="flex items-center gap-1.5" style={{ color: "#a371f7" }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1" stroke="#a371f7" strokeWidth="1.3" fill="none" /><path d="M5 4V3a3 3 0 0 1 6 0v1" stroke="#a371f7" strokeWidth="1.3" /></svg>
            <span className="font-mono font-medium" style={{ letterSpacing: "0.03em" }}>Room: {roomId}</span>
            <CopyRoomId roomId={roomId} />
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className="px-1.5 py-0.5 rounded cursor-pointer transition-colors duration-150"
              style={{ color: LANGUAGES.find((l) => l.id === language)?.color || "#7d8590" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#ffffff10"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >{LANGUAGES.find((l) => l.id === language)?.label || language}</span>
            <span>UTF-8</span>
            <span>CRLF</span>
            <span>{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#3fb950", boxShadow: "0 0 4px #3fb950" }} />
              <span style={{ color: "#3fb950" }}>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}