import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

loader.config({ monaco });

import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import TerminalComponent from "../components/Terminal";
import { syncFilesToWebContainer, onServerReady, shouldRunNpmInstall, recordNpmInstall } from "../services/webcontainer";
import { loadWorkspaceFiles, saveWorkspaceFiles } from "../services/db";
import RoomAIAssist from "../components/AIAssist/RoomAIAssist";

import { LANGUAGES, getLangByExt, getFileColor, VS, BOILERPLATES } from "../components/Room/constants";
import FileIcon from "../components/Room/FileIcon";
import FolderIcon from "../components/Room/FolderIcon";
import ActivityIcon from "../components/Room/ActivityIcon";
import NewItemModal from "../components/Room/NewItemModal";
import DeleteModal from "../components/Room/DeleteModal";
import UploadModal from "../components/Room/UploadModal";
import CopyRoomId from "../components/Room/CopyRoomId";

function CollaboratorAvatar({ photoURL, username }) {
  const [imgError, setImgError] = useState(false);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={username || "User"}
        className="w-7 h-7 rounded-full object-cover shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
      style={{ background: "var(--vs-accent)" }}
    >
      {(username || "U")[0].toUpperCase()}
    </div>
  );
}

export default function Room() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const username    = user?.displayName || user?.email?.split("@")[0] || "Developer";
  const photoURL    = user?.photoURL || "";

  /* ── State ── */
  const [files,           setFiles]           = useState([]);
  const [code,            setCode]            = useState("");
  const [activeFile,      setActiveFile]      = useState(null);
  const [openTabs,        setOpenTabs]        = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [language,        setLanguage]        = useState("javascript");
  const [users,           setUsers]           = useState([]);
  const [selectedCode,    setSelectedCode]    = useState("");
  const roomTheme = "light";
  const [isRunning,       setIsRunning]       = useState(false);
  const [activePanel,     setActivePanel]     = useState("explorer"); // explorer | users | ai

  /* ── Terminal & Sidebar resize ── */
  const [terminalHeight, setTerminalHeight] = useState(250);

  const [previewUrl, setPreviewUrl] = useState("");
  const [rightTab, setRightTab] = useState("preview");
  const isDraggingTerm = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isDraggingSidebar = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(400);
  const isDraggingPreview = useRef(false);
  const dragStartPreviewX = useRef(0);
  const dragStartPreviewW = useRef(0);

  const onDividerMouseDown = (e) => {
    isDraggingTerm.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = terminalHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  const onSidebarDividerMouseDown = (e) => {
    isDraggingSidebar.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const [isDraggingPreviewState, setIsDraggingPreviewState] = useState(false);

  const onPreviewDividerMouseDown = (e) => {
    isDraggingPreview.current = true;
    setIsDraggingPreviewState(true);
    dragStartPreviewX.current = e.clientX;
    dragStartPreviewW.current = previewWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingTerm.current) {
        const delta = dragStartY.current - e.clientY;
        const newH = Math.max(80, Math.min(600, dragStartH.current + delta));
        setTerminalHeight(newH);
      } else if (isDraggingSidebar.current) {
        const delta = e.clientX - dragStartX.current;
        const newW = Math.max(160, Math.min(480, dragStartW.current + delta));
        setSidebarWidth(newW);
      } else if (isDraggingPreview.current) {
        const delta = dragStartPreviewX.current - e.clientX;
        const newW = Math.max(200, Math.min(800, dragStartPreviewW.current + delta));
        setPreviewWidth(newW);
      }
    };
    const onUp = () => {
      if (isDraggingTerm.current || isDraggingSidebar.current || isDraggingPreview.current) {
        if (isDraggingPreview.current) setIsDraggingPreviewState(false);
        isDraggingTerm.current = false;
        isDraggingSidebar.current = false;
        isDraggingPreview.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
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
  
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const remoteCursorsRef = useRef({});
  const contentWidgetsRef = useRef({});
  const nameWidgetTimeoutsRef = useRef({});
  const usersRef = useRef([]);
  const isLoadedFromServerRef = useRef(false);

  const cursorColors = ["#a855f7", "#06b6d4", "#10b981", "#fbbf24", "#ec4899", "#3b82f6"];
  const cursorColorsMap = {
    "#a855f7": "purple",
    "#06b6d4": "cyan",
    "#10b981": "emerald",
    "#fbbf24": "amber",
    "#ec4899": "pink",
    "#3b82f6": "blue"
  };
  const getColorForUser = (userId) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % cursorColors.length;
    return cursorColors[idx];
  };

  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);
  useEffect(() => { usersRef.current = users; }, [users]);

  /* ── Load from IndexedDB ── */
  useEffect(() => {
    if (!roomId) return;
    loadWorkspaceFiles(roomId).then(localFiles => {
      // Prevent slow IndexedDB load from overwriting newer files received from the socket server
      if (isLoadedFromServerRef.current) return;
      
      if (localFiles && localFiles.length > 0) {
        setFiles(localFiles);
        const first = localFiles.find(f => !f.isFolder);
        if (first) {
          setActiveFile(first.path);
          setCode(first.content);
          setLanguage(first.language || getLangByExt(first.path)?.id || "javascript");
          setOpenTabs([first.path]);
        }
      }
    });

    onServerReady((port, url) => {
      setPreviewUrl(url);
      setIsPreviewOpen(true);
      setRightTab("preview");
    });
  }, [roomId]);

  /* ── Sync language whenever active file changes ── */
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("update-presence", { roomId, activeFile });
    }
    if (!activeFile) return;
    const f = files.find((file) => file.path === activeFile);
    if (f && f.language) {
      setLanguage(f.language);
    } else {
      const lang = getLangByExt(activeFile);
      if (lang) setLanguage(lang.id);
    }
  }, [activeFile, files, roomId]);

  /* ── Socket ── */
  useEffect(() => {
    // Ensure the socket is connected
    if (!socket.connected) socket.connect();

    const handleConnect = async () => {
      let currentPhoto = user?.photoURL || "";
      let currentName = user?.displayName || user?.email?.split("@")[0] || "Developer";

      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        if (user?.uid) {
          const res = await fetch(`${baseUrl}/api/users/profile/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.photoURL) currentPhoto = data.photoURL;
            if (data.displayName) currentName = data.displayName;
          }
        }
      } catch (err) {
        console.error("Error fetching joining user profile from MongoDB:", err);
      }

      socket.emit("join-room", { 
        roomId, 
        username: currentName, 
        photoURL: currentPhoto, 
        userId: user?.uid 
      });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    socket.on("room-joined", () => {
      console.log("Room joined successfully:", roomId);
    });

    socket.on("join-error", (errorMessage) => {
      alert(errorMessage || "Failed to join room.");
      navigate("/dashboard");
    });

    socket.on("room-closed", (data) => {
      alert(data.message || "This room has been closed by the owner.");
      navigate("/dashboard");
    });

    socket.on("receive-code", (incomingCode) => {
      isLoadedFromServerRef.current = true;
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

    socket.on("room-users", (userList) => {
      setUsers(userList);
      
      // Cleanup cursors for users who left
      const activeUserIds = new Set(userList.map(u => u.userId));
      
      Object.keys(remoteCursorsRef.current).forEach(userId => {
        if (!activeUserIds.has(userId)) {
          delete remoteCursorsRef.current[userId];
        }
      });
      
      Object.keys(contentWidgetsRef.current).forEach(userId => {
        if (!activeUserIds.has(userId)) {
          if (editorRef.current && window.monaco) {
            editorRef.current.removeContentWidget(contentWidgetsRef.current[userId]);
          }
          delete contentWidgetsRef.current[userId];
          if (nameWidgetTimeoutsRef.current[userId]) {
            clearTimeout(nameWidgetTimeoutsRef.current[userId]);
            delete nameWidgetTimeoutsRef.current[userId];
          }
        }
      });

      // Redraw decorations to clean up left users
      if (editorRef.current && window.monaco) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          Object.entries(remoteCursorsRef.current).map(([id, data]) => {
            const colorHex = getColorForUser(id);
            const colorName = cursorColorsMap[colorHex] || "purple";
            return {
              range: new window.monaco.Range(data.position.lineNumber, data.position.column, data.position.lineNumber, data.position.column),
              options: { className: `remote-cursor-${colorName}`, stickiness: 1 }
            };
          })
        );
      }
    });

    socket.on("cursor-update", ({ userId, position, activeFile: remoteActiveFile }) => {
      if (!editorRef.current || !window.monaco) return;
      
      // Cleanup existing widget
      if (contentWidgetsRef.current[userId]) {
        editorRef.current.removeContentWidget(contentWidgetsRef.current[userId]);
        delete contentWidgetsRef.current[userId];
      }
      
      if (remoteActiveFile !== activeFileRef.current) {
        delete remoteCursorsRef.current[userId];
      } else {
        const remoteUser = usersRef.current.find(u => u.userId === userId);
        const username = remoteUser ? remoteUser.username : "User";
        remoteCursorsRef.current[userId] = { position, username };
        
        // Pick unique color theme matching the user's cursor
        const userColor = getColorForUser(userId);

        // Add new name widget
        const domNode = document.createElement("div");
        domNode.innerHTML = username;
        domNode.style.background = userColor;
        domNode.style.color = "white";
        domNode.style.fontSize = "10px";
        domNode.style.fontWeight = "bold";
        domNode.style.padding = "2px 6px";
        domNode.style.borderRadius = "4px";
        domNode.style.whiteSpace = "nowrap";
        domNode.style.pointerEvents = "none";
        domNode.style.boxShadow = "0 3px 10px rgba(0,0,0,0.3)";
        domNode.style.zIndex = "100";
        domNode.style.border = "1px solid rgba(255,255,255,0.15)";
        domNode.style.opacity = "1";
        domNode.style.transform = "translateY(0)";
        domNode.style.transition = "opacity 0.25s ease-out, transform 0.25s ease-out";
        
        const widget = {
          getId: () => `cursor-widget-${userId}`,
          getDomNode: () => domNode,
          getPosition: () => ({
            position: { lineNumber: position.lineNumber, column: position.column },
            preference: [window.monaco.editor.ContentWidgetPositionPreference.ABOVE]
          })
        };
        
        editorRef.current.addContentWidget(widget);
        contentWidgetsRef.current[userId] = widget;

        // Auto-hide the name tag after 3 seconds of cursor inactivity
        if (nameWidgetTimeoutsRef.current[userId]) {
          clearTimeout(nameWidgetTimeoutsRef.current[userId]);
        }
        nameWidgetTimeoutsRef.current[userId] = setTimeout(() => {
          if (domNode) {
            domNode.style.opacity = "0";
            domNode.style.transform = "translateY(2px)";
          }
        }, 3000);
      }

      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        Object.entries(remoteCursorsRef.current).map(([id, data]) => {
          const colorHex = getColorForUser(id);
          const colorName = cursorColorsMap[colorHex] || "purple";
          return {
            range: new window.monaco.Range(data.position.lineNumber, data.position.column, data.position.lineNumber, data.position.column),
            options: { className: `remote-cursor-${colorName}`, stickiness: 1 }
          };
        })
      );
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("room-joined");
      socket.off("join-error");
      socket.off("room-closed");
      socket.off("receive-code");
      socket.off("room-users");
      socket.off("cursor-update");
    };
  }, [roomId, username, photoURL, user?.uid, navigate]);

  /* ── Sync Files to WebContainer (Debounced) ── */
  useEffect(() => {
    if (files.length === 0) return;
    const timeout = setTimeout(() => {
      syncFilesToWebContainer(files).catch((err) =>
        console.error("Auto-sync WebContainer error:", err)
      );
    }, 1000);
    return () => clearTimeout(timeout);
  }, [files]);

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
    setCode(value);
    setFiles((prev) => prev.map((f) => (f.path === activeFile ? { ...f, content: value } : f)));
    emitFiles(files.map((f) => (f.path === activeFile ? { ...f, content: value } : f)));
  };

  const handleApplyCodeSuggestion = (newContent) => {
    if (!editorRef.current || !activeFile) return;
    const editor = editorRef.current;
    const monacoInstance = window.monaco;
    if (!monacoInstance) {
      handleCodeChange(newContent);
      return;
    }
    const model = editor.getModel();
    const range = model
      ? model.getFullModelRange()
      : new monacoInstance.Range(1, 1, 1, 1);
    const id = { major: 1, minor: 1 };
    const textOp = {
      identifier: id,
      range: range,
      text: newContent,
      forceMoveMarkers: true,
    };
    editor.executeEdits("ai-assist", [textOp]);
    editor.focus();
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    window.monaco = monaco;
    editor.onDidChangeCursorPosition((e) => {
      if (socket && socket.connected) {
        socket.emit("cursor-change", { roomId, position: e.position });
      }
    });
    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (model) {
        const text = model.getValueInRange(e.selection);
        setSelectedCode(text);
      }
    });
  };

  /* ── Create ── */
  const confirmCreate = async (name) => {
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

    if (isFolder) {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        await fetch(`${baseUrl}/api/filesystem/folder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderName: itemPath,
          }),
        });
      } catch (error) {
        console.log(error);
      }
    }

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
      try { 
        if (f.size > 10 * 1024 * 1024) continue; // Skip files > 10MB to avoid crashing
        items.push({ path: f.webkitRelativePath, content: await f.text(), isFolder: false }); 
      }
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

  const runCode = async () => {
    setIsRunning(true);
    try {
      await syncFilesToWebContainer(files);
      let cmd = "";
      
      const pkgFile = files.find(f => f.path.endsWith("package.json"));
      
      if (pkgFile) {
        const parts = pkgFile.path.split("/");
        const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
        const pkgContent = pkgFile.content || "";
        
        const needInstall = await shouldRunNpmInstall(dir, pkgContent);
        if (needInstall) {
          recordNpmInstall(dir, pkgContent);
          if (dir) {
            cmd = `cd "${dir}" && npm install && npm run dev\r`;
          } else {
            cmd = `npm install && npm run dev\r`;
          }
        } else {
          if (dir) {
            cmd = `cd "${dir}" && npm run dev\r`;
          } else {
            cmd = `npm run dev\r`;
          }
        }
      } else if (language === "javascript") {
        cmd = `node "${activeFile}"\r`;
      } else {
        cmd = `echo "Only JavaScript/Node.js is supported in WebContainers natively."\r`;
      }
      
      window.dispatchEvent(new CustomEvent('run-code-command', { detail: { cmd } }));
    } catch (err) {
      console.error("Run code error", err);
    } finally {
      setTimeout(() => setIsRunning(false), 500);
    }
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
              {/* Inline actions */}
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
        .remote-cursor-purple { border-left: 2px solid #a855f7 !important; position: absolute; z-index: 10; margin-left: -1px; }
        .remote-cursor-cyan { border-left: 2px solid #06b6d4 !important; position: absolute; z-index: 10; margin-left: -1px; }
        .remote-cursor-emerald { border-left: 2px solid #10b981 !important; position: absolute; z-index: 10; margin-left: -1px; }
        .remote-cursor-amber { border-left: 2px solid #fbbf24 !important; position: absolute; z-index: 10; margin-left: -1px; }
        .remote-cursor-pink { border-left: 2px solid #ec4899 !important; position: absolute; z-index: 10; margin-left: -1px; }
        .remote-cursor-blue { border-left: 2px solid #3b82f6 !important; position: absolute; z-index: 10; margin-left: -1px; }

        .theme-dark {
          --vs-bg: #0d1117;
          --vs-sidebarBg: #161b22;
          --vs-activityBg: #0d1117;
          --vs-tabBarBg: #161b22;
          --vs-tabActive: #0d1117;
          --vs-tabInactive: #161b22;
          --vs-tabBorder: #30363d;
          --vs-statusBg: #1f2937;
          --vs-input: #21262d;
          --vs-border: #30363d;
          --vs-highlight: #1d4ed840;
          --vs-hover: #1c2128;
          --vs-text: #e6edf3;
          --vs-textMuted: #7d8590;
          --vs-textDim: #484f58;
          --vs-accent: #58a6ff;
          --vs-accentPurple: #a371f7;
          --vs-green: #3fb950;
          --vs-teal: #39d353;
          --vs-yellow: #e3b341;
          --vs-red: #f85149;
          --vs-orange: #f0883e;
          --vs-gradientA: #58a6ff;
          --vs-gradientB: #a371f7;
        }

        .theme-light {
          --vs-bg: #faf9f6;
          --vs-sidebarBg: #f4f3ee;
          --vs-activityBg: #faf9f6;
          --vs-tabBarBg: #f4f3ee;
          --vs-tabActive: #faf9f6;
          --vs-tabInactive: #f4f3ee;
          --vs-tabBorder: rgba(0, 0, 0, 0.08);
          --vs-statusBg: #e2e8f0;
          --vs-input: #ffffff;
          --vs-border: rgba(0, 0, 0, 0.08);
          --vs-highlight: rgba(99, 102, 241, 0.15);
          --vs-hover: rgba(0, 0, 0, 0.03);
          --vs-text: #0f172a;
          --vs-textMuted: #475569;
          --vs-textDim: #94a3b8;
          --vs-accent: #4f46e5;
          --vs-accentPurple: #818cf8;
          --vs-green: #10b981;
          --vs-teal: #0d9488;
          --vs-yellow: #f59e0b;
          --vs-red: #ef4444;
          --vs-orange: #f97316;
          --vs-gradientA: #6366f1;
          --vs-gradientB: #818cf8;
        }

        /* Monaco overrides for light theme */
        .theme-light .monaco-editor, 
        .theme-light .monaco-editor .margin {
          background-color: #faf9f6 !important;
        }
      `}</style>
      <div
        className={`h-screen flex flex-col overflow-hidden theme-${roomTheme}`}
        style={{ background: VS.bg, color: VS.text, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: "13px" }}
      >

        {/* ══ TITLE BAR ══ */}
        <div
          className="h-9 flex items-center justify-between px-4 select-none shrink-0"
          style={{
            background: VS.input,
            borderBottom: `1px solid ${VS.border}`,
          }}
        >
          {/* Left – Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-white"
              style={{ background: "#000" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <span
              className="text-[12px] font-bold tracking-tight"
              style={{ color: "var(--vs-text)" }}
            >
              CodeFusionAI
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--vs-highlight)", color: "var(--vs-accent)", border: "1px solid var(--vs-border)" }}
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

          {/* Right */}
          <div />
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

            {/* AI Assistant */}
            <ActivityIcon
              title="AI Assistant"
              active={activePanel === "ai"}
              accentColor="#a371f7"
              onClick={() => setActivePanel(activePanel === "ai" ? null : "ai")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a1 1 0 0 0-1 1v4.5A1.5 1.5 0 0 1 9.5 10H5a1 1 0 0 0 0 2h4.5a1.5 1.5 0 0 1 1.5 1.5V18a1 1 0 0 0 2 0v-4.5a1.5 1.5 0 0 1 1.5-1.5H20a1 1 0 0 0 0-2h-4.5A1.5 1.5 0 0 1 14 8.5V4a1 1 0 0 0-1-1z" fill="currentColor" fillOpacity="0.1" />
                <path d="M18 16a0.5 0.5 0 0 0-.5.5V18a0.5 0.5 0 0 1-.5.5h-1.5a0.5 0.5 0 0 0 0 1H17a0.5 0.5 0 0 1 .5.5v1.5a0.5 0.5 0 0 0 1 0V21a0.5 0.5 0 0 1 .5-.5h1.5a0.5 0.5 0 0 0 0-1H20a0.5 0.5 0 0 1-.5-.5v-1.5a0.5 0.5 0 0 0-.5-.5z" fill="currentColor" fillOpacity="0.25" />
              </svg>
            </ActivityIcon>

            {/* Spacer */}
            <div className="flex-1" />



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
            <>
              <div
                className="shrink-0 flex flex-col overflow-hidden"
                style={{ width: `${sidebarWidth}px`, background: VS.sidebarBg, borderRight: `1px solid ${VS.border}` }}
              >
              {/* Panel title */}
              <div
                className="h-8 flex items-center justify-between px-3 shrink-0"
                style={{ borderBottom: `1px solid ${VS.border}` }}
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
                        style={{ background: VS.hover, border: `1px solid ${VS.border}` }}
                      >
                        <CollaboratorAvatar photoURL={u.photoURL} username={u.username} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[12px] truncate leading-tight font-bold" style={{ color: VS.text }}>{u.username || "User"}</span>
                          <span className="text-[10px] truncate leading-tight mt-0.5" style={{ color: VS.textMuted }}>{u.activeFile || "Idle"}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--vs-green)" }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── AI ASSISTANT ── */}
              {activePanel === "ai" && (
                <RoomAIAssist
                  code={code}
                  language={language}
                  activeFileName={activeFile}
                  files={files}
                  onApplyCode={handleApplyCodeSuggestion}
                  selectedCode={selectedCode}
                  roomTheme={roomTheme}
                />
              )}

            </div>
              {/* ── HORIZONTAL DRAG DIVIDER ── */}
              <div
                onMouseDown={onSidebarDividerMouseDown}
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: "5px",
                  background: VS.border,
                  cursor: "ew-resize",
                  position: "relative",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = VS.accent}
                onMouseLeave={(e) => e.currentTarget.style.background = VS.border}
                title="Drag to resize sidebar"
              >
                <div style={{ height: "40px", width: "2px", borderRadius: "1px", background: "inherit", opacity: 0.4 }} />
              </div>
            </>
          )}

          {/* ━━ EDITOR COLUMN ━━ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">

            {openTabs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center select-none" style={{ background: VS.bg }}>
                <div className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: "#000" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2 tracking-tight" style={{ color: VS.text }}>CodeFusionAI Workspace</h2>
                <p className="text-[13px] mb-8" style={{ color: VS.textMuted }}>Select a file from the explorer or create a new one to begin.</p>
                
                <div className="flex gap-4">
                  <button onClick={() => setNewItemModal({ parentPath: "", isFolder: false })} className="px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 cursor-pointer" style={{ background: VS.accent, color: "#fff" }}>
                    Create File
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 cursor-pointer" style={{ background: VS.input, color: VS.text, border: `1px solid ${VS.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor=VS.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor=VS.border}>
                    Upload Project
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* ── TOOLBAR ── */}
                <div
                  className="h-9 shrink-0 flex items-center justify-between px-3 gap-3"
                  style={{ background: VS.sidebarBg, borderBottom: `1px solid ${VS.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150"
                      style={{ color: VS.textMuted, border: `1px solid ${VS.border}`, background: VS.bg }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = VS.textDim}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = VS.border}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span
                        className="bg-transparent outline-none text-[12px] font-medium"
                        style={{ color: VS.text, cursor: "default" }}
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
                      background: isRunning ? "#21262d" : "#238636", 
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

                  <button
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    className="flex items-center gap-1.5 h-[28px] px-3.5 text-[11px] font-bold rounded-full transition-all tracking-wide"
                    style={{
                      background: isPreviewOpen ? "#30363d" : "#21262d",
                      color: "#c9d1d9",
                      border: "1px solid #30363d"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#30363d"; }}
                    onMouseLeave={(e) => { if (!isPreviewOpen) e.currentTarget.style.background = "#21262d"; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    Preview
                  </button>
                </div>

                {/* ── TAB BAR ── */}
                <div
                  className="flex items-end overflow-x-auto shrink-0"
                  style={{ background: VS.bg, borderBottom: `1px solid ${VS.border}`, scrollbarWidth: "none", minHeight: "35px" }}
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
                          background: isActive ? VS.sidebarBg : "transparent",
                          borderRight: `1px solid ${VS.border}`,
                          borderTop: isActive ? `1px solid ${fileColor}` : "1px solid transparent",
                          color: isActive ? VS.text : VS.textDim,
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
                    theme={roomTheme === "light" ? "vs" : "vs-dark"}
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorMount}
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
              </div>
            )}

            {/* ── DRAG DIVIDER ── */}
            <div
              onMouseDown={onDividerMouseDown}
              className="shrink-0 flex items-center justify-center"
              style={{
                height: "5px",
                background: VS.border,
                cursor: "ns-resize",
                position: "relative",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = VS.accent}
              onMouseLeave={(e) => e.currentTarget.style.background = VS.border}
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
              <div className="flex-1 overflow-hidden min-h-0">
                <TerminalComponent theme={roomTheme} />
              </div>
            </div>
          </div>

          {/* ━━ PREVIEW PANEL / RIGHT SIDE ━━ */}
          {isPreviewOpen && (
            <>
              {/* Divider for resizing preview */}
              <div
                onMouseDown={onPreviewDividerMouseDown}
                className="flex items-center justify-center z-10"
                style={{
                  width: "5px",
                  background: VS.border,
                  cursor: "ew-resize",
                  position: "relative",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = VS.accent}
                onMouseLeave={(e) => e.currentTarget.style.background = VS.border}
                title="Drag to resize preview panel"
              >
                <div style={{ width: "2px", height: "40px", borderRadius: "1px", background: "inherit", opacity: 0.4 }} />
              </div>

              <div className="shrink-0 flex flex-col" style={{ width: `${previewWidth}px`, background: VS.bg }}>
                <div className="h-[35px] shrink-0 flex items-center px-3 gap-3" style={{ borderBottom: `1px solid ${VS.border}`, background: VS.sidebarBg }}>
                  <span className="text-[11px] font-bold" style={{ color: VS.text }}>Live Preview</span>
                  
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setIsPreviewOpen(false)} title="Close preview" className="flex items-center transition-colors p-1.5 rounded border hover:opacity-80" style={{ color: VS.textMuted, background: VS.input, borderColor: VS.border }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full h-full relative bg-white" style={{ pointerEvents: isDraggingPreviewState ? 'none' : 'auto' }}>
                  {previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title="Live Preview" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs font-medium" style={{ background: VS.bg }}>
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-6 h-6 text-slate-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Waiting for dev server...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ══ STATUS BAR ══ */}
        <div
          className="h-6 shrink-0 flex items-center justify-between px-3 select-none"
          style={{
            background: VS.input,
            borderTop: `1px solid ${VS.border}`,
            color: VS.textMuted,
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
