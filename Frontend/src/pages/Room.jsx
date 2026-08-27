import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

loader.config({ monaco });

import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import TerminalComponent from "../components/Room/Terminal";
import { syncFilesToWebContainer, onServerReady, shouldRunNpmInstall, recordNpmInstall } from "../services/webcontainer";
import { loadWorkspaceFiles } from "../services/db";
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
  const [activePanel,     setActivePanel]     = useState("explorer"); // explorer | search | users | ai
  const [searchQuery,     setSearchQuery]     = useState("");
  const [contextMenu,     setContextMenu]     = useState(null); // { x, y, node }

  /* ── Token Bucket S3 Save State ── */
  const [saveStatus,    setSaveStatus]    = useState("saved"); // "saved" | "unsaved" | "saving"
  const [lastSavedTime, setLastSavedTime] = useState(null);

  /* ── Close context menu on global click ── */
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  /* ── Terminal & Sidebar resize ── */
  const [terminalHeight, setTerminalHeight] = useState(250);

  const [previewUrl, setPreviewUrl] = useState("");
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
    });
  }, [roomId]);

  /* ── Sync language whenever active file changes ── */
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("update-presence", { roomId, activeFile });
    }
  }, [activeFile, roomId]);

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

    socket.on("workspace-saved", ({ success, timestamp }) => {
      if (success) {
        setSaveStatus("saved");
        setLastSavedTime(timestamp || Date.now());
      } else {
        setSaveStatus("unsaved");
      }
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
              // Try to find App.jsx or src/App.jsx first, then fallback to App.js or main.js, and finally any file that is not a folder
              const first = parsed.find((f) => !f.isFolder && (f.path === "src/App.jsx" || f.path === "App.jsx"))
                            || parsed.find((f) => !f.isFolder && f.path.toLowerCase().endsWith("app.jsx"))
                            || parsed.find((f) => !f.isFolder && (f.path === "src/App.js" || f.path === "App.js" || f.path === "src/index.js" || f.path === "src/main.jsx"))
                            || parsed.find((f) => !f.isFolder);
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
      } catch { /* legacy plain string */ }
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
  const emitFiles = (upd) => {
    setSaveStatus("unsaved");
    socket.emit("code-change", { roomId, code: JSON.stringify(upd) });
  };

  const forceFlushToS3 = () => {
    if (!socket.connected) return;
    setSaveStatus("saving");
    socket.emit("save-workspace");
  };

  /* ── Keyboard Shortcuts (Ctrl+S / Cmd+S to Save) ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        forceFlushToS3();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

    // Helper to format code
    const formatCode = (model) => {
      try {
        const text = model.getValue();
        const langId = model.getLanguageId();
        if (langId === "json") {
          const parsed = JSON.parse(text);
          return [{ range: model.getFullModelRange(), text: JSON.stringify(parsed, null, 2) }];
        }
        let indent = 0;
        const lines = text.split("\n");
        const formatted = lines.map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          if (trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith(")") || trimmed.startsWith("</")) {
            indent = Math.max(0, indent - 1);
          }
          const result = "  ".repeat(indent) + trimmed;
          if (
            (trimmed.endsWith("{") || trimmed.endsWith("[") || trimmed.endsWith("(") || (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>") && !trimmed.includes("</"))) &&
            !trimmed.startsWith("//") && !trimmed.startsWith("/*")
          ) {
            indent++;
          }
          return result;
        }).join("\n");
        return [{ range: model.getFullModelRange(), text: formatted }];
      } catch {
        return [];
      }
    };

    // Register Document & Range Formatting Providers for Monaco
    const supportedLangs = ["javascript", "typescript", "json", "html", "css", "cpp", "java", "python"];
    supportedLangs.forEach((lang) => {
      monaco.languages.registerDocumentFormattingEditProvider(lang, {
        provideDocumentFormattingEdits(model) {
          return formatCode(model);
        }
      });
      monaco.languages.registerDocumentRangeFormattingEditProvider(lang, {
        provideDocumentRangeFormattingEdits(model, range) {
          const text = model.getValueInRange(range);
          let indent = 0;
          const formatted = text.split("\n").map((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("}") || trimmed.startsWith("]")) indent = Math.max(0, indent - 1);
            const res = "  ".repeat(indent) + trimmed;
            if (trimmed.endsWith("{") || trimmed.endsWith("[")) indent++;
            return res;
          }).join("\n");
          return [{ range, text: formatted }];
        }
      });
    });

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

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 200),
      node,
    });
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
              className="group flex items-center gap-1.5 cursor-pointer select-none mx-1 px-2 py-1 rounded-md transition-colors duration-150"
              style={{
                paddingLeft: `${depth * 12 + 6}px`,
                background: "transparent",
                color: VS.text,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = VS.hover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => setExpandedFolders((p) => ({ ...p, [node.path]: !p[node.path] }))}
              onContextMenu={(e) => handleContextMenu(e, node)}
            >
              {/* Chevron */}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className="shrink-0 transition-transform duration-150"
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  fill: VS.textMuted,
                }}
              >
                <path d="M3 1l4 4-4 4" stroke={VS.textMuted} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <FolderIcon open={isExpanded} size={15} />
              <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: VS.text }}>{node.name}</span>
              {/* Inline actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  title="New File"
                  onClick={(e) => { e.stopPropagation(); setNewItemModal({ parentPath: node.path, isFolder: false }); }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-500/20 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M9 2H4v12h8V6.5L9 2zm0 0v4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8 9v4M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                </button>
                <button
                  title="New Folder"
                  onClick={(e) => { e.stopPropagation(); setNewItemModal({ parentPath: node.path, isFolder: true }); }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-500/20 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 4h5l1 2h8v7H1V4z" stroke="#dcb67a" strokeWidth="1.2" fill="none" /><path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </button>
                <button
                  title="Delete Folder"
                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ path: node.path, isFolder: true }); }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
            {isExpanded && node.children && (
              <div className="relative border-l border-slate-200/60 dark:border-slate-800 ml-3.5 pl-0.5">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          className="group flex items-center gap-1.5 cursor-pointer select-none mx-1 px-2 py-1 rounded-md transition-all duration-150"
          style={{
            paddingLeft: `${depth * 12 + 10}px`,
            background: isSelected ? "rgba(79, 70, 229, 0.12)" : "transparent",
            color: isSelected ? "var(--vs-accent)" : VS.text,
            fontWeight: isSelected ? "600" : "400",
            border: isSelected ? "1px solid rgba(79, 70, 229, 0.25)" : "1px solid transparent",
            boxShadow: isSelected ? "0 1px 4px rgba(79, 70, 229, 0.1)" : "none",
          }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = VS.hover; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
          onClick={() => openFile(node.path, node.content)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <FileIcon filename={node.name} size={15} />
          <span className="text-[13px] flex-1 truncate">{node.name}</span>
          <button
            title="Delete File"
            onClick={(e) => { e.stopPropagation(); setDeleteModal({ path: node.path, isFolder: false }); }}
            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20 text-slate-400 hover:text-rose-600"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      );
    });

  const treeNodes     = buildTree(files);
  const existingPaths = files.map((f) => f.path);

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
          className="h-9 flex items-center justify-between px-3 select-none shrink-0"
          style={{
            background: VS.sidebarBg,
            borderBottom: `1px solid ${VS.border}`,
          }}
        >
          {/* Left – Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-white shadow-xs"
              style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <span className="text-[12px] font-bold tracking-tight" style={{ color: "var(--vs-text)" }}>
              CodeFusionAI
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400"
              style={{ background: "var(--vs-highlight)", border: "1px solid var(--vs-border)" }}
            >
              IDE
            </span>
          </div>

          {/* Centre – active file breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md" style={{ background: "var(--vs-hover)", border: `1px solid ${VS.border}`, color: VS.textMuted }}>
            {activeFile ? (
              <>
                <FileIcon filename={activeFile.split("/").pop()} size={13} />
                <span className="font-medium" style={{ color: VS.textMuted }}>{activeFile.split("/").slice(0, -1).join(" / ")}</span>
                {activeFile.includes("/") && <span style={{ color: VS.textDim }}> / </span>}
                <span className="font-semibold" style={{ color: VS.text }}>{activeFile.split("/").pop()}</span>
              </>
            ) : (
              <span style={{ color: VS.textDim }} className="italic">No file open</span>
            )}
          </div>

          {/* Right – S3 Storage Status & Save Button */}
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 select-none cursor-default"
              style={{
                background: saveStatus === "saved" ? "rgba(16, 185, 129, 0.1)" : saveStatus === "saving" ? "rgba(99, 102, 241, 0.1)" : "rgba(245, 158, 11, 0.1)",
                border: `1px solid ${saveStatus === "saved" ? "rgba(16, 185, 129, 0.25)" : saveStatus === "saving" ? "rgba(99, 102, 241, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
                color: saveStatus === "saved" ? "#059669" : saveStatus === "saving" ? "#4f46e5" : "#d97706",
              }}
              title={
                saveStatus === "saved"
                  ? `All workspace edits synced to AWS S3${lastSavedTime ? ` (Last saved at ${new Date(lastSavedTime).toLocaleTimeString()})` : ""}`
                  : saveStatus === "saving"
                  ? "Flushing workspace edits to AWS S3..."
                  : "Unsaved edits buffered in Redis"
              }
            >
              {saveStatus === "saving" ? (
                <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: saveStatus === "saved" ? "#10b981" : "#f59e0b",
                    boxShadow: saveStatus === "saved" ? "0 0 5px #10b981" : "0 0 5px #f59e0b"
                  }}
                />
              )}
              <span className="font-semibold">
                {saveStatus === "saved"
                  ? "Saved to S3"
                  : saveStatus === "saving"
                  ? "Saving..."
                  : "Unsaved"}
              </span>
            </div>

            {/* Save Button */}
            <button
              onClick={forceFlushToS3}
              disabled={saveStatus === "saving"}
              title="Save changes and flush Redis cache to AWS S3 immediately"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold text-white transition-all duration-150 shadow-xs active:scale-[0.97] disabled:opacity-50 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                boxShadow: "0 1px 3px rgba(79, 70, 229, 0.25)",
              }}
            >
              {saveStatus === "saving" ? (
                <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              <span>{saveStatus === "saving" ? "Saving..." : "Save"}</span>
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
                <rect x="6" y="8" width="13" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" fill="var(--vs-activityBg)" />
              </svg>
            </ActivityIcon>

            {/* Search */}
            <ActivityIcon
              title="Search"
              active={activePanel === "search"}
              onClick={() => setActivePanel(activePanel === "search" ? null : "search")}
            >
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
              {/* Panel title header */}
              <div
                className="h-9 flex items-center justify-between px-3 shrink-0 select-none"
                style={{ borderBottom: `1px solid ${VS.border}`, background: VS.input }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: VS.text }}>
                    {activePanel === "explorer" ? "Explorer" : activePanel === "search" ? "Search Workspace" : activePanel === "users" ? "Collaborators" : "AI Assistant"}
                  </span>
                </div>
                {activePanel === "explorer" && (
                  <div className="flex items-center gap-1">
                    {/* New file */}
                    <button
                      title="New File"
                      onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M9 2H4v12h8V6.5L9 2zm0 0v4.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 9v4M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                    {/* New folder */}
                    <button
                      title="New Folder"
                      onClick={() => setNewItemModal({ parentPath: "", isFolder: true })}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 4h5l1 2h8v7H1V4z" stroke="#d97706" strokeWidth="1.3" fill="none" /><path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                    {/* Upload */}
                    <input type="file" ref={fileInputRef} webkitdirectory="true" directory="true" multiple onChange={handleFolderUpload} className="hidden" />
                    <button
                      title="Upload Folder"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 11V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                    {/* Download ZIP */}
                    <button
                      title="Download as ZIP"
                      onClick={downloadZip}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: VS.textMuted }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* ── EXPLORER ── */}
              {activePanel === "explorer" && (
                <div className="flex-1 overflow-y-auto select-none">
                  {/* Workspace Accordion Header */}
                  <div
                    className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ background: VS.bg, borderBottom: `1px solid ${VS.border}`, color: VS.text }}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg width="9" height="9" viewBox="0 0 10 10" className="transform rotate-90 shrink-0" style={{ fill: VS.textMuted }}>
                        <path d="M2 1l6 4-6 4V1z" />
                      </svg>
                      <span>Workspace</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal" style={{ background: VS.input, color: VS.textMuted }}>
                      {files.filter(f => !f.isFolder).length}
                    </span>
                  </div>

                  <div className="py-1">
                    {files.length === 0 ? (
                      <div className="px-4 py-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 mb-3 rounded-xl flex items-center justify-center text-xl" style={{ background: VS.input }}>
                          📂
                        </div>
                        <p className="text-xs font-medium mb-3" style={{ color: VS.textMuted }}>No files in workspace yet.</p>
                        <button
                          onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}
                          className="px-3 py-1.5 rounded text-[11px] font-semibold text-white transition-opacity"
                          style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
                        >
                          + Add File
                        </button>
                      </div>
                    ) : (
                      renderTree(treeNodes)
                    )}
                  </div>
                </div>
              )}

              {/* ── SEARCH PANEL ── */}
              {activePanel === "search" && (
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 select-none">
                  {/* Search Input Box */}
                  <div className="relative flex items-center">
                    <svg className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="11" cy="11" r="8" strokeWidth="2" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search files or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 rounded-md text-[12px] outline-none transition-all"
                      style={{
                        background: VS.bg,
                        border: `1px solid ${VS.border}`,
                        color: VS.text,
                      }}
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Search Results */}
                  <div className="flex flex-col gap-1 overflow-y-auto">
                    {searchQuery.trim() === "" ? (
                      <p className="text-[11px] text-center text-slate-400 py-6">Type to search files or code content across workspace.</p>
                    ) : (
                      (() => {
                        const results = files.filter(f => !f.isFolder).flatMap((file) => {
                          const matches = [];
                          const filenameMatches = file.path.toLowerCase().includes(searchQuery.toLowerCase());
                          const lines = (file.content || "").split("\n");
                          lines.forEach((lineText, idx) => {
                            if (lineText.toLowerCase().includes(searchQuery.toLowerCase())) {
                              matches.push({ path: file.path, line: idx + 1, lineText: lineText.trim() });
                            }
                          });
                          if (filenameMatches && matches.length === 0) {
                            matches.push({ path: file.path, line: 1, lineText: "Filename match" });
                          }
                          return matches;
                        });

                        if (results.length === 0) {
                          return <p className="text-[11px] text-center text-slate-400 py-6">No matching results found.</p>;
                        }

                        return results.map((res, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              const f = files.find(item => item.path === res.path);
                              if (f) openFile(f.path, f.content);
                            }}
                            className="p-2 rounded-md hover:bg-slate-200/50 cursor-pointer border border-transparent hover:border-slate-300/50 transition-all flex flex-col gap-0.5"
                            style={{ background: VS.bg }}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: VS.accent }}>
                              <FileIcon filename={res.path.split("/").pop()} size={13} />
                              <span className="truncate">{res.path}</span>
                              <span className="ml-auto text-[10px] text-slate-400">L{res.line}</span>
                            </div>
                            <p className="text-[11px] font-mono truncate text-slate-600 pl-4">
                              {res.lineText}
                            </p>
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* ── COLLABORATORS ── */}
              {activePanel === "users" && (
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 select-none">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: VS.textMuted }}>Active Team ({users.length})</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                  </div>
                  {users.length === 0 ? (
                    <div className="px-3 py-8 text-center flex flex-col items-center">
                      <div className="w-10 h-10 mb-2 rounded-full flex items-center justify-center text-lg" style={{ background: VS.input }}>
                        👥
                      </div>
                      <p className="text-xs italic" style={{ color: VS.textMuted }}>No other collaborators online.</p>
                    </div>
                  ) : (
                    users.map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                        style={{ background: VS.bg, border: `1px solid ${VS.border}` }}
                      >
                        <div className="relative shrink-0">
                          <CollaboratorAvatar photoURL={u.photoURL} username={u.username} />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2" style={{ borderColor: VS.bg }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[12px] truncate leading-tight font-bold" style={{ color: VS.text }}>{u.username || "User"}</span>
                          <span className="text-[10px] truncate leading-tight mt-0.5 font-mono" style={{ color: VS.textMuted }}>
                            {u.activeFile ? `Editing ${u.activeFile.split('/').pop()}` : "Idle"}
                          </span>
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
              <div className="flex-1 flex flex-col items-center justify-center select-none px-6" style={{ background: VS.bg }}>
                <div
                  className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2 tracking-tight" style={{ color: VS.text }}>CodeFusionAI Workspace</h2>
                <p className="text-[13px] max-w-sm text-center mb-8" style={{ color: VS.textMuted }}>Select a file from the explorer or create a new document to start coding synchronously.</p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}
                    className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white shadow-md active:scale-95 transition-all cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
                  >
                    + Create New File
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-95 cursor-pointer"
                    style={{ background: VS.input, color: VS.text, border: `1px solid ${VS.border}` }}
                  >
                    Upload Folder
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* ── TAB BAR ── */}
                <div
                  className="flex items-end overflow-x-auto shrink-0 select-none"
                  style={{ background: VS.input, borderBottom: `1px solid ${VS.border}`, scrollbarWidth: "none", minHeight: "36px" }}
                >
                  {openTabs.map((tab) => {
                    const isActive = tab === activeFile;
                    const fileItem = files.find((f) => f.path === tab);
                    const fileColor = getFileColor(tab.split("/").pop());
                    return (
                      <div
                        key={tab}
                        className="flex items-center gap-2 px-3.5 shrink-0 cursor-pointer group transition-all duration-150"
                        style={{
                          height: "36px",
                          background: isActive ? VS.bg : "transparent",
                          borderRight: `1px solid ${VS.border}`,
                          borderTop: isActive ? `2px solid ${fileColor}` : "2px solid transparent",
                          color: isActive ? VS.text : VS.textMuted,
                          minWidth: "120px",
                          maxWidth: "200px",
                          boxShadow: isActive ? "0 -2px 8px rgba(0,0,0,0.03)" : "none",
                        }}
                        onClick={() => { if (fileItem) openFile(tab, fileItem.content); }}
                      >
                        <FileIcon filename={tab.split("/").pop()} size={14} />
                        <span className="text-[12px] truncate flex-1 font-medium">{tab.split("/").pop()}</span>
                        <button
                          onClick={(e) => closeTab(e, tab)}
                          className="w-4 h-4 flex items-center justify-center rounded text-[11px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-500/20"
                          style={{ color: VS.textMuted }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ── TOOLBAR ── */}
                <div
                  className="h-8 shrink-0 flex items-center justify-between px-3 gap-3 select-none"
                  style={{ background: VS.sidebarBg, borderBottom: `1px solid ${VS.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ color: VS.textMuted, border: `1px solid ${VS.border}`, background: VS.bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: LANGUAGES.find(l => l.id === language)?.color || "#6366f1" }} />
                      <span>{LANGUAGES.find(l => l.id === language)?.label || "Text"}</span>
                    </div>

                  </div>

                  <div className="flex items-center gap-2">
                    {/* Run Code */}
                    <button
                      onClick={runCode}
                      disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold text-white transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                      style={{
                        background: isRunning ? "#334155" : "linear-gradient(135deg, #10b981, #059669)",
                        boxShadow: isRunning ? "none" : "0 1px 3px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {isRunning ? (
                        <>
                          <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>Run Code</span>
                        </>
                      )}
                    </button>

                    {/* Preview Toggle */}
                    <button
                      onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer"
                      style={{
                        background: isPreviewOpen ? "linear-gradient(135deg, #4f46e5, #6366f1)" : VS.bg,
                        color: isPreviewOpen ? "#ffffff" : VS.textMuted,
                        border: `1px solid ${isPreviewOpen ? "transparent" : VS.border}`,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                      <span>Preview</span>
                    </button>
                  </div>
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
                {/* Browser-Style Preview Header */}
                <div className="h-9 shrink-0 flex items-center px-3 gap-2.5" style={{ borderBottom: `1px solid ${VS.border}`, background: VS.sidebarBg }}>
                  {/* Traffic lights */}
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => setIsPreviewOpen(false)} title="Close preview" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>

                  {/* Browser Address Bar */}
                  <div className="flex-1 flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px]" style={{ background: VS.bg, border: `1px solid ${VS.border}` }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: VS.textMuted }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="font-mono truncate flex-1" style={{ color: VS.text }}>{previewUrl || "http://localhost:5173"}</span>
                  </div>

                  {/* External Open & Close */}
                  <div className="flex items-center gap-1 shrink-0">
                    {previewUrl && (
                      <button onClick={() => window.open(previewUrl, "_blank")} title="Open in external browser window" className="p-1 rounded hover:opacity-80 transition-opacity" style={{ color: VS.textMuted }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => setIsPreviewOpen(false)} title="Close preview" className="p-1 rounded hover:opacity-80 transition-opacity" style={{ color: VS.textMuted }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
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
          className="h-6 shrink-0 flex items-center justify-between px-3 select-none text-[11px] font-sans"
          style={{
            background: VS.input,
            borderTop: `1px solid ${VS.border}`,
            color: VS.textMuted,
          }}
        >
          {/* Left – Git branch & Collaborator stack */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              style={{ color: "#6366f1" }}
              title="Git Branch: main"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="11" cy="4" r="2" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 6v4M5 6c0 2 6 2 6-2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span className="font-semibold text-[11px]">main</span>
            </div>

            {/* Online users */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
              <span className="font-semibold" style={{ color: "#10b981" }}>{users.length} online</span>
            </div>
          </div>

          {/* Centre – Room ID */}
          <div className="flex items-center gap-1.5" style={{ color: "var(--vs-accentPurple)" }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" /><path d="M5 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.3" /></svg>
            <span className="font-mono font-medium tracking-tight">Room: {roomId}</span>
            <CopyRoomId roomId={roomId} />
          </div>

          {/* Right – Language, Files & S3 Sync */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ color: VS.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: LANGUAGES.find((l) => l.id === language)?.color || "#7d8590" }} />
              <span className="font-medium">{LANGUAGES.find((l) => l.id === language)?.label || language}</span>
            </div>
            <span>UTF-8</span>
            <span>CRLF</span>
            <span>{files.filter(f => !f.isFolder).length} files</span>
            
            <div
              className="flex items-center gap-1.5 cursor-pointer px-1.5 py-0.5 rounded transition-all hover:bg-slate-500/10"
              onClick={forceFlushToS3}
              title="Click to force flush Redis cache to AWS S3"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: saveStatus === "saved" ? "#10b981" : saveStatus === "saving" ? "#6366f1" : "#f59e0b", boxShadow: saveStatus === "saved" ? "0 0 5px #10b981" : "0 0 5px #f59e0b" }} />
              <span className="font-medium" style={{ color: saveStatus === "saved" ? "#10b981" : saveStatus === "saving" ? "#6366f1" : "#f59e0b" }}>
                {saveStatus === "saved" ? "S3 Synced" : saveStatus === "saving" ? "S3 Saving..." : "S3 Unsaved"}
              </span>
            </div>
          </div>
        </div>

        {/* ── CONTEXT MENU POPUP ── */}
        {contextMenu && (
          <div
            className="fixed z-50 py-1.5 w-48 rounded-lg shadow-xl border text-[12px] font-medium select-none"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              background: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node?.isFolder ? (
              <>
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setNewItemModal({ parentPath: contextMenu.node.path, isFolder: false });
                    setContextMenu(null);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M9 2H4v12h8V6.5L9 2zm0 0v4.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 9v4M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  <span>New File...</span>
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setNewItemModal({ parentPath: contextMenu.node.path, isFolder: true });
                    setContextMenu(null);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 4h5l1 2h8v7H1V4z" stroke="#d97706" strokeWidth="1.3" fill="none" /><path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  <span>New Folder...</span>
                </button>
                <div className="my-1 border-t border-slate-200" />
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setDeleteModal({ path: contextMenu.node.path, isFolder: true });
                    setContextMenu(null);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>Delete Folder</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                  onClick={() => {
                    if (contextMenu.node?.path) openFile(contextMenu.node.path, contextMenu.node.content);
                    setContextMenu(null);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                  <span>Open File</span>
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                  onClick={() => {
                    if (contextMenu.node?.path) navigator.clipboard.writeText(contextMenu.node.path);
                    setContextMenu(null);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  <span>Copy Path</span>
                </button>
                <div className="my-1 border-t border-slate-200" />
                <button
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                  onClick={() => {
                    if (contextMenu.node?.path) setDeleteModal({ path: contextMenu.node.path, isFolder: false });
                    setContextMenu(null);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>Delete File</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
