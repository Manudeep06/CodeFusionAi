import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../services/socket";

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

function getLangByExt(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return LANGUAGES.find((l) => l.ext.includes(ext)) || null;
}

function getFileColor(filename) {
  const lang = getLangByExt(filename);
  return lang ? lang.color : "#858585";
}

/* ── VS Code colours ── */
const VS = {
  bg:           "#1e1e1e",
  sidebarBg:    "#252526",
  activityBg:   "#333333",
  tabBarBg:     "#2d2d2d",
  tabActive:    "#1e1e1e",
  tabInactive:  "#2d2d2d",
  tabBorder:    "#1e1e1e",
  statusBg:     "#007acc",
  input:        "#3c3c3c",
  border:       "#474747",
  highlight:    "#094771",
  hover:        "#2a2d2e",
  text:         "#cccccc",
  textMuted:    "#858585",
  textDim:      "#6e6e6e",
  accent:       "#007acc",
  green:        "#4ec9b0",
  yellow:       "#dcdcaa",
  red:          "#f44747",
  orange:       "#ce9178",
};

/* ═══════════════════════════════════════
   FILE ICON (SVG dot coloured)
═══════════════════════════════════════ */
function FileIcon({ filename, size = 14 }) {
  const color = getFileColor(filename);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M4 2h5.5L13 5.5V14H4V2z" fill={color + "28"} stroke={color} strokeWidth="0.8" />
      <path d="M9 2v3.5h4" stroke={color} strokeWidth="0.8" fill="none" />
    </svg>
  );
}

function FolderIcon({ open = false, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      {open ? (
        <>
          <path d="M1 4h5l1.5 2H15v7H1V4z" fill="#dcb67a" opacity="0.9" />
          <path d="M1 6h14" stroke="#dcb67a" strokeWidth="0.6" />
        </>
      ) : (
        <path d="M1 4h5l1 2H15v7H1V4z" fill="#dcb67a" opacity="0.75" />
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
      className="w-12 h-12 flex items-center justify-center relative transition-colors duration-100"
      style={{
        color: active ? VS.text : VS.textMuted,
        borderLeft: active ? `2px solid ${VS.text}` : "2px solid transparent",
      }}
    >
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

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-[420px] rounded shadow-2xl"
        style={{ background: "#252526", border: `1px solid ${VS.border}` }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: VS.border }}>
          <span className="text-sm font-semibold" style={{ color: VS.text }}>
            New {isFolder ? "Folder" : "File"}
            {parentPath && <span className="ml-1" style={{ color: VS.textMuted, fontWeight: 400 }}>in {parentPath}</span>}
          </span>
          <button onClick={onCancel} className="text-lg leading-none hover:opacity-70 transition" style={{ color: VS.textMuted }}>×</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="px-4 py-4 flex flex-col gap-3">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: VS.textMuted }}>
              {isFolder ? "Folder" : "File"} Name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={isFolder ? "new-folder" : "filename.js"}
              spellCheck={false}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{
                background: VS.input,
                color: VS.text,
                border: `1px solid ${error ? VS.red : VS.accent}`,
                fontFamily: "'Consolas', monospace",
              }}
            />
            {error && <p className="mt-1.5 text-xs" style={{ color: VS.red }}>⚠ {error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="px-4 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
              style={{ background: VS.hover, color: VS.text, border: `1px solid ${VS.border}` }}>
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-1.5 rounded text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: VS.accent, color: "#fff" }}>
              Create
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-[400px] rounded shadow-2xl" style={{ background: "#252526", border: `1px solid ${VS.border}` }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: VS.border }}>
          <span className="text-sm font-semibold" style={{ color: VS.text }}>Delete {isFolder ? "Folder" : "File"}</span>
          <button onClick={onCancel} className="text-lg leading-none hover:opacity-70" style={{ color: VS.textMuted }}>×</button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: VS.text }}>
            Are you sure you want to delete{" "}
            <span style={{ color: VS.yellow, fontFamily: "Consolas, monospace" }}>{path}</span>?
            {isFolder && " This will recursively delete all files inside."}
            <span style={{ color: VS.textMuted }}> This action cannot be undone.</span>
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-1.5 rounded text-sm hover:opacity-80"
              style={{ background: VS.hover, color: VS.text, border: `1px solid ${VS.border}` }}>
              Cancel
            </button>
            <button onClick={onConfirm} className="px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
              style={{ background: VS.red, color: "#fff" }}>
              Delete
            </button>
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-[420px] rounded shadow-2xl" style={{ background: "#252526", border: `1px solid ${VS.border}` }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: VS.border }}>
          <span className="text-sm font-semibold" style={{ color: VS.text }}>Upload Folder</span>
          <button onClick={onCancel} className="text-lg leading-none hover:opacity-70" style={{ color: VS.textMuted }}>×</button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: VS.text }}>
            <span style={{ color: VS.yellow }}>{fileCount} files</span> detected.
            Uploading will <span style={{ color: VS.red }}>replace your current workspace</span>.
            All existing files will be lost.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-1.5 rounded text-sm hover:opacity-80"
              style={{ background: VS.hover, color: VS.text, border: `1px solid ${VS.border}` }}>
              Cancel
            </button>
            <button onClick={onConfirm} className="px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
              style={{ background: VS.accent, color: "#fff" }}>
              Upload & Replace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Room() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();

  /* ── State ── */
  const [files,           setFiles]           = useState([{
    path: "main.js",
    content: '// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World");\n',
    isFolder: false,
  }]);
  const [code,            setCode]            = useState('// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World");\n');
  const [activeFile,      setActiveFile]      = useState("main.js");
  const [openTabs,        setOpenTabs]        = useState(["main.js"]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [language,        setLanguage]        = useState("javascript");
  const [users,           setUsers]           = useState([]);
  const [output,          setOutput]          = useState("Waiting for code execution...\n");
  const [activePanel,     setActivePanel]     = useState("explorer"); // explorer | users

  /* ── Modal state ── */
  const [newItemModal,  setNewItemModal]  = useState(null);
  const [deleteModal,   setDeleteModal]   = useState(null);
  const [uploadPending, setUploadPending] = useState(null);

  /* ── Refs ── */
  const activeFileRef = useRef("main.js");
  const fileInputRef  = useRef(null);

  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);

  /* ── Socket ── */
  useEffect(() => {
    socket.emit("join-room", roomId);
    socket.on("receive-code", (incomingCode) => {
      try {
        const parsed = JSON.parse(incomingCode);
        if (Array.isArray(parsed)) {
          setFiles((cur) => {
            if (JSON.stringify(cur) === incomingCode) return cur;
            const hit = parsed.find((f) => f.path === activeFileRef.current && !f.isFolder);
            if (hit) setCode(hit.content || "");
            else {
              const first = parsed.find((f) => !f.isFolder);
              setTimeout(() => { setActiveFile(first?.path || ""); setCode(first?.content || ""); }, 0);
            }
            return parsed;
          });
          return;
        }
      } catch (_) { /* legacy */ }
      setCode(incomingCode || "");
      setFiles((prev) => {
        let changed = false;
        const next = prev.map((f) => {
          if (f.path === activeFileRef.current && f.content !== incomingCode) {
            changed = true; return { ...f, content: incomingCode || "" };
          }
          return f;
        });
        return changed ? next : prev;
      });
    });
    socket.on("room-users", setUsers);
    return () => { socket.off("receive-code"); socket.off("room-users"); };
  }, [roomId]);

  /* ── Helpers ── */
  const emitFiles = (upd) => socket.emit("code-change", { roomId, code: JSON.stringify(upd) });

  const openFile = (path, content) => {
    setActiveFile(path);
    setCode(content || "");
    const lang = getLangByExt(path);
    if (lang) setLanguage(lang.id);
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
    const newItem  = { path: itemPath, isFolder, content: isFolder ? undefined : "" };
    const updated  = [...files, newItem];
    setFiles(updated);
    if (!isFolder) openFile(itemPath, "");
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
    setFiles(items);
    const first = items.find((f) => !f.isFolder);
    if (first) openFile(first.path, first.content);
    setOpenTabs(first ? [first.path] : []);
    const exp = {};
    items.forEach((f) => { const p = f.path.split("/"); if (p.length > 1) exp[p[0]] = true; });
    setExpandedFolders(exp);
    emitFiles(items);
    setUploadPending(null);
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

      <div
        className="h-screen flex flex-col overflow-hidden"
        style={{ background: VS.bg, color: VS.text, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: "13px" }}
      >

        {/* ══ TITLE BAR ══ */}
        <div
          className="h-8 flex items-center justify-between px-4 select-none shrink-0"
          style={{ background: "#323233", borderBottom: `1px solid #3c3c3c` }}
        >
          {/* Left – Brand */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold" style={{ color: "#cccccc" }}>
              CodeFusionAI
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#007acc22", color: "#007acc", border: "1px solid #007acc44" }}>
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

          {/* Right – controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "#c42b1c", color: "#fff" }}
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* ══ MAIN BODY ══ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ━━ ACTIVITY BAR ━━ */}
          <div
            className="w-12 shrink-0 flex flex-col items-center pt-1"
            style={{ background: VS.activityBg, borderRight: `1px solid ${VS.border}` }}
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings */}
            <ActivityIcon title="Settings" active={false} onClick={() => {}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </ActivityIcon>
          </div>

          {/* ━━ SIDEBAR PANEL ━━ */}
          {activePanel && (
            <div
              className="w-60 shrink-0 flex flex-col overflow-hidden"
              style={{ background: VS.sidebarBg, borderRight: `1px solid ${VS.border}` }}
            >
              {/* Panel title */}
              <div
                className="h-8 flex items-center justify-between px-3 shrink-0 uppercase text-[10px] font-bold tracking-widest"
                style={{ color: VS.textMuted }}
              >
                <span>{activePanel === "explorer" ? "Explorer" : "Collaborators"}</span>
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
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#424242 transparent" }}>
                  {/* Workspace section title */}
                  <div
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase tracking-wider cursor-default select-none"
                    style={{ color: VS.text }}
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" style={{ fill: VS.text }}>
                      <path d="M2 1l6 4-6 4V1z" />
                    </svg>
                    Workspace
                  </div>
                  <div className="pb-4">
                    {files.length === 0 ? (
                      <p className="px-4 py-3 text-xs italic" style={{ color: VS.textMuted }}>
                        No files. Click + to create one.
                      </p>
                    ) : (
                      renderTree(treeNodes)
                    )}
                  </div>
                </div>
              )}

              {/* ── COLLABORATORS ── */}
              {activePanel === "users" && (
                <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#424242 transparent" }}>
                  {users.length === 0 ? (
                    <p className="px-2 py-3 text-xs italic" style={{ color: VS.textMuted }}>
                      No other collaborators in this room yet.
                    </p>
                  ) : (
                    users.map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1.5 rounded"
                        style={{ background: VS.hover }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: VS.accent, color: "#fff" }}
                        >
                          {(u.username || "U")[0].toUpperCase()}
                        </div>
                        <span className="text-[12px] truncate" style={{ color: VS.text }}>{u.username || "User"}</span>
                        <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: VS.green }} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ━━ EDITOR COLUMN ━━ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* ── TOOLBAR (Run, Language) ── */}
            <div
              className="h-9 shrink-0 flex items-center justify-between px-3 gap-3"
              style={{ background: "#2d2d2d", borderBottom: `1px solid ${VS.border}` }}
            >
              {/* Left: Language dropdown styled like VS Code language selector */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition"
                  style={{ color: VS.textMuted, border: `1px solid ${VS.border}`, background: VS.input }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer text-[12px]"
                    style={{ color: VS.text }}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id} style={{ background: "#1e1e1e" }}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: Run Code */}
              <button
                onClick={() => setOutput(`▶  Running ${language} code...\n\n(Execution engine coming soon)\n`)}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ background: "#388a34", color: "#fff" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="#fff"><path d="M1 1l8 4-8 4V1z" /></svg>
                Run Code
              </button>
            </div>

            {/* ── TAB BAR ── */}
            <div
              className="flex items-end overflow-x-auto shrink-0"
              style={{ background: VS.tabBarBg, borderBottom: `1px solid ${VS.border}`, scrollbarWidth: "none", minHeight: "35px" }}
            >
              {openTabs.map((tab) => {
                const isActive = tab === activeFile;
                const fileItem = files.find((f) => f.path === tab);
                return (
                  <div
                    key={tab}
                    className="flex items-center gap-2 px-3 shrink-0 cursor-pointer group"
                    style={{
                      height: "35px",
                      background: isActive ? VS.tabActive : VS.tabInactive,
                      borderRight: `1px solid ${VS.border}`,
                      borderTop: isActive ? `1px solid ${VS.accent}` : "1px solid transparent",
                      color: isActive ? VS.text : VS.textMuted,
                      minWidth: "100px",
                      maxWidth: "180px",
                    }}
                    onClick={() => { if (fileItem) openFile(tab, fileItem.content); }}
                  >
                    <FileIcon filename={tab.split("/").pop()} size={13} />
                    <span className="text-[12px] truncate flex-1">{tab.split("/").pop()}</span>
                    <button
                      onClick={(e) => closeTab(e, tab)}
                      className="w-4 h-4 flex items-center justify-center rounded text-[11px] opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      style={{ color: VS.textMuted }}
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

            {/* ── TERMINAL / OUTPUT ── */}
            <div
              className="shrink-0 flex flex-col"
              style={{ height: "180px", background: "#1e1e1e", borderTop: `1px solid ${VS.border}` }}
            >
              {/* Terminal title bar */}
              <div
                className="h-8 flex items-center justify-between px-3 shrink-0"
                style={{ background: "#252526", borderBottom: `1px solid ${VS.border}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold" style={{ color: VS.text }}>TERMINAL</span>
                  <span className="text-[10px]" style={{ color: VS.textMuted }}>
                    bash
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOutput("Waiting for code execution...\n")}
                    className="px-2 py-0.5 rounded text-[10px] hover:opacity-80 transition"
                    style={{ color: VS.textMuted, border: `1px solid ${VS.border}` }}
                  >
                    Clear
                  </button>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70"
                    style={{ color: VS.textMuted }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 9l8-8M1 1h8v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Output */}
              <div
                className="flex-1 overflow-auto px-4 py-2"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#424242 transparent" }}
              >
                <pre
                  className="text-[12px] leading-6 whitespace-pre-wrap"
                  style={{ fontFamily: "'Consolas', 'Courier New', monospace", color: "#cccccc" }}
                >
                  <span style={{ color: VS.green }}>user@codefusion</span>
                  <span style={{ color: VS.textMuted }}>:</span>
                  <span style={{ color: "#4ec9b0" }}>~/{activeFile ? activeFile.split("/")[0] : "workspace"}</span>
                  <span style={{ color: VS.textMuted }}>$ </span>
                  <br />
                  {output}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATUS BAR ══ */}
        <div
          className="h-6 shrink-0 flex items-center justify-between px-3 select-none"
          style={{ background: VS.statusBg, color: "#fff", fontSize: "11px" }}
        >
          {/* Left */}
          <div className="flex items-center gap-4">
            {/* Git branch */}
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="5" cy="4" r="2" stroke="white" strokeWidth="1.3" />
                <circle cx="11" cy="4" r="2" stroke="white" strokeWidth="1.3" />
                <circle cx="5" cy="12" r="2" stroke="white" strokeWidth="1.3" />
                <path d="M5 6v4M5 6c0 2 6 2 6-2" stroke="white" strokeWidth="1.3" />
              </svg>
              <span>main</span>
            </div>

            {/* Collab indicator */}
            <div className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="white"><circle cx="5" cy="6" r="2.5" /><path d="M1 14v-1a4 4 0 0 1 8 0v1" /><circle cx="12" cy="6" r="2" /><path d="M15 14v-.5a3 3 0 0 0-3-3" /></svg>
              <span>{users.length + 1} online</span>
            </div>
          </div>

          {/* Centre – room ID */}
          <div className="flex items-center gap-1" style={{ opacity: 0.85 }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="white"><rect x="2" y="4" width="12" height="9" rx="1" stroke="white" strokeWidth="1.3" fill="none" /><path d="M5 4V3a3 3 0 0 1 6 0v1" stroke="white" strokeWidth="1.3" /></svg>
            <span className="font-mono" style={{ letterSpacing: "0.02em" }}>Room: {roomId}</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <span>{LANGUAGES.find((l) => l.id === language)?.label || language}</span>
            <span>UTF-8</span>
            <span>CRLF</span>
            <span>{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: "#4ec9b0" }} />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}