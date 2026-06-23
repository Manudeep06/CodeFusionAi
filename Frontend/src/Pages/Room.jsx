import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../services/socket";

/* ─────────────────────────────────────────────
   Helper: get icon + monaco language by ext
───────────────────────────────────────────── */
function getFileInfo(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    js:   { icon: "js",   color: "#F7DF1E", lang: "javascript" },
    jsx:  { icon: "jsx",  color: "#61DAFB", lang: "javascript" },
    ts:   { icon: "ts",   color: "#3178C6", lang: "typescript" },
    tsx:  { icon: "tsx",  color: "#3178C6", lang: "typescript" },
    py:   { icon: "py",   color: "#3572A5", lang: "python"     },
    cpp:  { icon: "cpp",  color: "#00599C", lang: "cpp"        },
    c:    { icon: "c",    color: "#A8B9CC", lang: "c"          },
    h:    { icon: "h",    color: "#00599C", lang: "cpp"        },
    java: { icon: "java", color: "#B07219", lang: "java"       },
    json: { icon: "json", color: "#CBCB41", lang: "json"       },
    css:  { icon: "css",  color: "#563D7C", lang: "css"        },
    html: { icon: "html", color: "#E34C26", lang: "html"       },
    md:   { icon: "md",   color: "#083FA1", lang: "markdown"   },
    txt:  { icon: "txt",  color: "#888888", lang: "plaintext"  },
    sh:   { icon: "sh",   color: "#89E051", lang: "shell"      },
    go:   { icon: "go",   color: "#00ADD8", lang: "go"         },
    rs:   { icon: "rs",   color: "#DEA584", lang: "rust"       },
  };
  const info = map[ext] || { icon: ext || "file", color: "#94a3b8", lang: "plaintext" };
  return info;
}

/* ─────────────────────────────────────────────
   Mini Badge: coloured extension badge
───────────────────────────────────────────── */
function ExtBadge({ filename }) {
  const { icon, color } = getFileInfo(filename);
  return (
    <span
      className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded"
      style={{ background: color + "22", color, border: `1px solid ${color}44` }}
    >
      {icon.toUpperCase()}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Modal: New File / Folder name dialog
───────────────────────────────────────────── */
function NewItemModal({ isFolder, parentPath, existingPaths, onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Name cannot be empty."); return; }
    if (trimmed.includes("/")) { setError("Name cannot contain '/'."); return; }
    const fullPath = parentPath ? `${parentPath}/${trimmed}` : trimmed;
    if (existingPaths.includes(fullPath)) { setError("An item with this name already exists here."); return; }
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#13161e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 w-[360px] p-6 flex flex-col gap-5 animate-[fadeSlideUp_0.18s_ease]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
              isFolder
                ? "bg-amber-500/15 text-amber-400"
                : "bg-purple-500/15 text-purple-400"
            }`}
          >
            {isFolder ? "📁" : "📄"}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              New {isFolder ? "Folder" : "File"}
            </h3>
            {parentPath && (
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                inside /{parentPath}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="ml-auto text-slate-500 hover:text-slate-300 transition text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              {isFolder ? "Folder" : "File"} Name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={isFolder ? "e.g. components" : "e.g. index.js"}
              className={`w-full bg-[#1a1f2e] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition duration-200 font-mono ${
                error
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-white/8 focus:border-purple-500/60"
              }`}
            />
            {error && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98] ${
                isFolder
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-900/20"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-900/20"
              }`}
            >
              Create {isFolder ? "Folder" : "File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modal: Delete confirmation
───────────────────────────────────────────── */
function DeleteModal({ path, isFolder, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#13161e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 w-[360px] p-6 flex flex-col gap-5 animate-[fadeSlideUp_0.18s_ease]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center text-lg text-red-400">
            🗑
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Delete {isFolder ? "Folder" : "File"}</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[220px]">
              {path}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed bg-red-500/5 border border-red-500/10 rounded-xl p-3">
          {isFolder
            ? `This will permanently delete the folder and all files inside it. This action cannot be undone.`
            : `This will permanently delete this file. This action cannot be undone.`}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-lg shadow-red-900/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modal: Upload folder replace confirm
───────────────────────────────────────────── */
function UploadConfirmModal({ fileCount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#13161e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 w-[380px] p-6 flex flex-col gap-5 animate-[fadeSlideUp_0.18s_ease]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-lg text-blue-400">
            📤
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Upload Folder</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{fileCount} files detected</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
          ⚠ Uploading this folder will <strong className="text-amber-300">replace your current workspace</strong>. All unsaved content will be lost.
        </p>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Upload & Replace
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN ROOM COMPONENT
═══════════════════════════════════════════════ */
export default function Room() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  /* ── Core state ── */
  const [code, setCode] = useState(
    '// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World");\n'
  );
  const [files, setFiles] = useState([
    {
      path: "main.js",
      content: '// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World");\n',
      isFolder: false,
    },
  ]);
  const [activeFile,       setActiveFile]       = useState("main.js");
  const [expandedFolders,  setExpandedFolders]  = useState({});
  const [language,         setLanguage]         = useState("javascript");
  const [users,            setUsers]            = useState([]);
  const [output,           setOutput]           = useState("Waiting for code execution...\n");

  /* ── Modal state ── */
  const [newItemModal,     setNewItemModal]     = useState(null);  // { parentPath, isFolder }
  const [deleteModal,      setDeleteModal]      = useState(null);  // { path, isFolder }
  const [uploadPending,    setUploadPending]    = useState(null);  // [fileItems]

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
            const activePath = activeFileRef.current;
            const hit = parsed.find((f) => f.path === activePath && !f.isFolder);
            if (hit) {
              setCode(hit.content || "");
            } else {
              const first = parsed.find((f) => !f.isFolder);
              setTimeout(() => {
                setActiveFile(first?.path || "");
                setCode(first?.content || "");
              }, 0);
            }
            return parsed;
          });
          return;
        }
      } catch (_) { /* legacy fallback */ }

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

    return () => {
      socket.off("receive-code");
      socket.off("room-users");
    };
  }, [roomId]);

  /* ── Helpers ── */
  const emitFiles = (updatedFiles) => {
    socket.emit("code-change", { roomId, code: JSON.stringify(updatedFiles) });
  };

  const handleCodeChange = (value) => {
    const updated = files.map((f) =>
      f.path === activeFile ? { ...f, content: value || "" } : f
    );
    setFiles(updated);
    setCode(value || "");
    emitFiles(updated);
  };

  const handleRunCode = () => {
    setOutput(`▶ Running ${language} code...\n\n(Execution engine will be wired here)\n`);
  };

  /* ── Create item flow ── */
  const openNewItemModal = (parentPath = "", isFolder = false) => {
    setNewItemModal({ parentPath, isFolder });
  };

  const confirmCreateItem = (name) => {
    const { parentPath, isFolder } = newItemModal;
    const itemPath = parentPath ? `${parentPath}/${name}` : name;
    const newItem  = { path: itemPath, isFolder, content: isFolder ? undefined : "" };
    const updated  = [...files, newItem];
    setFiles(updated);
    if (!isFolder) { setActiveFile(itemPath); setCode(""); }
    else if (parentPath) setExpandedFolders((p) => ({ ...p, [parentPath]: true }));
    emitFiles(updated);
    setNewItemModal(null);
  };

  /* ── Delete item flow ── */
  const openDeleteModal = (path, isFolder) => setDeleteModal({ path, isFolder });

  const confirmDelete = () => {
    const { path, isFolder } = deleteModal;
    const updated = files.filter((f) =>
      isFolder ? f.path !== path && !f.path.startsWith(`${path}/`) : f.path !== path
    );
    setFiles(updated);
    const stillExists = updated.some((f) => f.path === activeFile && !f.isFolder);
    if (!stillExists) {
      const first = updated.find((f) => !f.isFolder);
      setActiveFile(first?.path || "");
      setCode(first?.content || "");
    }
    emitFiles(updated);
    setDeleteModal(null);
  };

  /* ── Folder upload flow ── */
  const handleFolderUpload = useCallback(async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (!uploadedFiles.length) return;

    const filtered = uploadedFiles.filter((f) => {
      const p = f.webkitRelativePath;
      return (
        !p.includes("/node_modules/") &&
        !p.includes("/.git/") &&
        !p.includes("/dist/") &&
        !p.includes("/build/") &&
        !p.includes("/.next/")
      );
    });

    const items = [];
    for (const file of filtered) {
      try {
        items.push({ path: file.webkitRelativePath, content: await file.text(), isFolder: false });
      } catch (e) {
        console.error("Error reading", file.name, e);
      }
    }

    if (!items.length) return;
    setUploadPending(items);
    event.target.value = "";
  }, []);

  const confirmUpload = () => {
    const items = uploadPending;
    setFiles(items);
    const first = items.find((f) => !f.isFolder);
    setActiveFile(first?.path || "");
    setCode(first?.content || "");
    const expanded = {};
    items.forEach((f) => { const p = f.path.split("/"); if (p.length > 1) expanded[p[0]] = true; });
    setExpandedFolders(expanded);
    emitFiles(items);
    setUploadPending(null);
  };

  /* ── Download ZIP ── */
  const downloadProject = async () => {
    if (!window.JSZip) {
      await new Promise((res) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        s.onload = res;
        document.head.appendChild(s);
      });
    }
    const zip = new window.JSZip();
    files.forEach((f) => { if (!f.isFolder) zip.file(f.path, f.content || ""); });
    const blob = await zip.generateAsync({ type: "blob" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `project-${roomId}.zip` });
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Tree builder ── */
  const buildTree = (filesList) => {
    const root = { name: "root", path: "", isFolder: true, children: [] };
    filesList.forEach((file) => {
      let cur = root, curPath = "";
      file.path.split("/").forEach((part, i, arr) => {
        curPath = curPath ? `${curPath}/${part}` : part;
        let child = cur.children.find((c) => c.name === part);
        if (!child) {
          child = { name: part, path: curPath, isFolder: i < arr.length - 1 || !!file.isFolder, content: i === arr.length - 1 ? file.content : undefined, children: [] };
          cur.children.push(child);
        }
        cur = child;
      });
    });
    const sort = (n) => {
      n.children?.sort((a, b) => {
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
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
          <div key={node.path} className="select-none">
            <div
              className="group flex items-center gap-1.5 py-[5px] pr-2 rounded-md cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-100"
              style={{ paddingLeft: `${depth * 14 + 6}px` }}
              onClick={() => setExpandedFolders((p) => ({ ...p, [node.path]: !p[node.path] }))}
            >
              {/* Chevron */}
              <span className={`text-slate-500 text-[9px] w-3 shrink-0 text-center transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}>
                ▶
              </span>
              {/* Icon */}
              <span className="text-[13px] shrink-0">{isExpanded ? "📂" : "📁"}</span>
              {/* Name */}
              <span className="text-[12px] font-medium truncate flex-1">{node.name}</span>
              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1">
                <button onClick={(e) => { e.stopPropagation(); openNewItemModal(node.path, false); }} title="New File"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-green-400 transition text-[10px]">
                  +
                </button>
                <button onClick={(e) => { e.stopPropagation(); openNewItemModal(node.path, true); }} title="New Folder"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-amber-400 transition text-[10px]">
                  ⊞
                </button>
                <button onClick={(e) => { e.stopPropagation(); openDeleteModal(node.path, true); }} title="Delete"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-red-400 transition text-[11px]">
                  ×
                </button>
              </div>
            </div>
            {isExpanded && node.children && renderTree(node.children, depth + 1)}
          </div>
        );
      }

      // File node
      const { lang } = getFileInfo(node.name);
      return (
        <div
          key={node.path}
          className={`group flex items-center gap-2 py-[5px] pr-2 rounded-md cursor-pointer transition-all duration-100 ${
            isSelected
              ? "bg-purple-500/15 text-white border-l-[2px] border-purple-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-[2px] border-transparent"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => {
            setActiveFile(node.path);
            setCode(node.content || "");
            setLanguage(lang);
          }}
        >
          <ExtBadge filename={node.name} />
          <span className={`text-[12px] truncate flex-1 ${isSelected ? "font-semibold" : "font-normal"}`}>
            {node.name}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); openDeleteModal(node.path, false); }}
            title="Delete"
            className="w-5 h-5 shrink-0 flex items-center justify-center rounded hover:bg-white/10 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-[11px]"
          >
            ×
          </button>
        </div>
      );
    });

  const treeNodes = buildTree(files);
  const existingPaths = files.map((f) => f.path);

  /* ────────────────────────────────
     RENDER
  ──────────────────────────────── */
  return (
    <>
      {/* ── MODALS ── */}
      {newItemModal && (
        <NewItemModal
          isFolder={newItemModal.isFolder}
          parentPath={newItemModal.parentPath}
          existingPaths={existingPaths}
          onConfirm={confirmCreateItem}
          onCancel={() => setNewItemModal(null)}
        />
      )}
      {deleteModal && (
        <DeleteModal
          path={deleteModal.path}
          isFolder={deleteModal.isFolder}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
      {uploadPending && (
        <UploadConfirmModal
          fileCount={uploadPending.length}
          onConfirm={confirmUpload}
          onCancel={() => setUploadPending(null)}
        />
      )}

      {/* ── LAYOUT ── */}
      <div className="h-screen bg-[#080b12] text-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ══ TOP NAVBAR ══ */}
        <header className="h-12 shrink-0 border-b border-white/[0.06] bg-[#0c0f18] flex items-center justify-between px-5 z-20">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-900/30">
              ⚡
            </div>
            <span className="font-extrabold text-[15px] bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
              CodeFusionAI
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Workspace
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5">
            {/* Language selector */}
            <div className="flex items-center gap-2 bg-[#141824] border border-white/[0.07] rounded-lg px-3 py-1.5 h-8">
              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-[12px] font-semibold text-slate-200 outline-none cursor-pointer"
              >
                {["javascript","python","cpp","java","css","html","json","typescript","go","rust","markdown","plaintext"].map((l) => (
                  <option key={l} value={l} className="bg-[#141824] capitalize">{l}</option>
                ))}
              </select>
            </div>

            {/* Run */}
            <button
              onClick={handleRunCode}
              className="h-8 px-4 rounded-lg text-[12px] font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-900/25 hover:scale-105 active:scale-95 transition-all duration-150"
            >
              <span className="text-[10px]">▶</span> Run
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-white/10" />

            {/* Leave */}
            <button
              onClick={() => navigate("/dashboard")}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.07] hover:border-red-500/20 transition-all duration-150"
            >
              <span className="text-[10px]">✕</span> Leave
            </button>
          </div>
        </header>

        {/* ══ BODY ══ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ━━ LEFT SIDEBAR ━━ */}
          <aside className="w-[220px] shrink-0 bg-[#0c0f18] border-r border-white/[0.06] flex flex-col">

            {/* Explorer toolbar */}
            <div className="px-3 pt-3 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Explorer
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openNewItemModal("", false)}
                    title="New File"
                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-white/8 transition text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => openNewItemModal("", true)}
                    title="New Folder"
                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-amber-400 hover:bg-white/8 transition text-xs"
                  >
                    ⊞
                  </button>
                </div>
              </div>

              {/* Upload & ZIP */}
              <div className="grid grid-cols-2 gap-1.5">
                <input type="file" ref={fileInputRef} webkitdirectory="true" directory="true" multiple onChange={handleFolderUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 flex items-center justify-center gap-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:text-white hover:border-white/10 transition"
                >
                  <span className="text-[11px]">↑</span> Upload
                </button>
                <button
                  onClick={downloadProject}
                  className="h-7 flex items-center justify-center gap-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:text-white hover:border-white/10 transition"
                >
                  <span className="text-[11px]">↓</span> ZIP
                </button>
              </div>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto py-2 px-1.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2535 transparent" }}>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
                  <span className="text-2xl opacity-30">📂</span>
                  <p className="text-[10px] text-slate-600">No files yet.<br />Click + to create one.</p>
                </div>
              ) : (
                renderTree(treeNodes)
              )}
            </div>

            {/* ── Connected Users ── */}
            <div className="border-t border-white/[0.06] px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Online — {users.length}
              </p>
              <div className="space-y-1 max-h-24 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2535 transparent" }}>
                {users.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">Waiting for collaborators…</p>
                ) : (
                  users.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-white/5 transition">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                        {(u.username || "U")[0].toUpperCase()}
                      </div>
                      <span className="text-[11px] text-slate-300 truncate">{u.username || "User"}</span>
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Room ID */}
            <div className="border-t border-white/[0.06] px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Room ID</p>
              <p className="text-[10px] font-mono text-purple-400 break-all bg-purple-500/5 border border-purple-500/10 rounded-lg px-2 py-1.5 leading-relaxed">
                {roomId}
              </p>
            </div>
          </aside>

          {/* ━━ EDITOR AREA ━━ */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#080b12]">
            {/* Tab bar */}
            <div className="h-9 bg-[#0c0f18] border-b border-white/[0.06] flex items-end px-3 overflow-x-auto shrink-0"
              style={{ scrollbarWidth: "none" }}>
              {activeFile ? (
                <div className="flex items-center gap-2 px-3 py-1.5 border-t-2 border-purple-500 bg-[#080b12] rounded-t-md text-[11px] text-slate-200 font-medium border-l border-r border-white/[0.06] shrink-0">
                  <ExtBadge filename={activeFile.split("/").pop()} />
                  <span>{activeFile.split("/").pop()}</span>
                  <span className="text-slate-600 text-[10px] font-mono hidden sm:inline">
                    {activeFile.includes("/") ? `· ${activeFile}` : ""}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-600 pb-2">No file open</span>
              )}
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  lineHeight: 22,
                  minimap: { enabled: true, scale: 0.75 },
                  automaticLayout: true,
                  padding: { top: 14, bottom: 14 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  renderLineHighlight: "gutter",
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>

            {/* ── Terminal ── */}
            <div className="h-44 bg-[#070a10] border-t border-white/[0.06] flex flex-col shrink-0">
              <div className="h-8 bg-[#0c0f18] border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  {/* Traffic lights */}
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Terminal
                  </span>
                </div>
                <button
                  onClick={() => setOutput("Waiting for code execution...\n")}
                  className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-white/5 transition"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-auto px-4 py-3" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2535 transparent" }}>
                <pre className="text-[12px] font-mono text-slate-300 whitespace-pre-wrap leading-6">
                  {output}
                </pre>
              </div>
            </div>
          </div>

          {/* ━━ RIGHT SIDEBAR ━━ */}
          <aside className="w-72 shrink-0 bg-[#0c0f18] border-l border-white/[0.06] flex flex-col">
            {/* Header */}
            <div className="h-9 border-b border-white/[0.06] px-4 flex items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <span>✦</span> AI Assistant
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2535 transparent" }}>
              {[
                { icon: "💡", label: "Code Review", desc: "Inspect the current file for optimizations, refactoring tips, and style improvements.", color: "from-amber-500/10 to-yellow-500/5", border: "border-amber-500/10", accent: "text-amber-400" },
                { icon: "🐛", label: "Bug Finder", desc: "Detect runtime exceptions, edge-cases, memory issues, and type mismatches.", color: "from-red-500/10 to-rose-500/5", border: "border-red-500/10", accent: "text-red-400" },
                { icon: "⚡", label: "Optimizer", desc: "Reduce complexity, improve performance, and suggest faster algorithm alternatives.", color: "from-blue-500/10 to-indigo-500/5", border: "border-blue-500/10", accent: "text-blue-400" },
                { icon: "📝", label: "Docs Writer", desc: "Auto-generate JSDoc, docstrings, or inline comments for your functions.", color: "from-purple-500/10 to-violet-500/5", border: "border-purple-500/10", accent: "text-purple-400" },
              ].map(({ icon, label, desc, color, border, accent }) => (
                <div
                  key={label}
                  className={`bg-gradient-to-br ${color} border ${border} rounded-xl p-3.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 group`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{icon}</span>
                    <span className={`text-[12px] font-bold ${accent}`}>{label}</span>
                    <span className="ml-auto text-slate-600 group-hover:text-slate-400 transition text-[11px]">→</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask AI about your code…"
                  className="w-full bg-[#141824] border border-white/[0.07] rounded-xl pl-3 pr-9 py-2.5 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500/40 transition-all duration-200"
                />
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition text-[10px]">
                  ↑
                </button>
              </div>
              <p className="text-[9px] text-slate-700 mt-1.5 text-center">
                AI features coming soon
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Global animation keyframe */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </>
  );
}