import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { apiFetch } from "../services/api";
import { toast } from "../components/ui/toastStore";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import "../lib/monacoSetup";

import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { syncFilesToWebContainer, onServerReady, shouldRunNpmInstall, recordNpmInstall } from "../services/webcontainer";
import { loadWorkspaceFiles } from "../services/db";

import { getLangByExt, VS, BOILERPLATES } from "../components/Room/constants";
import FileIcon from "../components/Room/FileIcon";
import FolderIcon from "../components/Room/FolderIcon";
import NewItemModal from "../components/Room/NewItemModal";
import DeleteModal from "../components/Room/DeleteModal";
import UploadModal from "../components/Room/UploadModal";
import TitleBar from "../components/Room/TitleBar";
import StatusBar from "../components/Room/StatusBar";
import SearchPanel from "../components/Room/SearchPanel";
import CollaboratorsPanel from "../components/Room/CollaboratorsPanel";
import PreviewPanel from "../components/Room/PreviewPanel";
import { defineMonacoTheme, MONACO_THEME } from "../components/Room/monacoTheme";
import ActivityBar from "../components/Room/ActivityBar";
import AIPanel from "../components/Room/AIPanel";
import HistoryPanel from "../components/Room/HistoryPanel";
import BottomPanel from "../components/Room/BottomPanel";
import CompareView from "../components/Room/CompareView";
import { confirmDialog } from "../components/ui/confirmStore";
import { FilePlus2, FolderPlus, Upload, Download, ChevronRight, Play, Loader2, PanelRight, X } from "lucide-react";
import "../styles/room.css";

const PANEL_TITLES = { explorer: "Explorer", search: "Search", users: "Collaborators", history: "Version history" };
const AI_WIDTH = "clamp(20rem, 30vw, 27rem)";

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
  const [editorReady,     setEditorReady]     = useState(false);
  // One CRDT document per room: Map<path, Y.Text>. The server holds the authoritative copy.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a fresh document per room
  const ydoc = useMemo(() => new Y.Doc(), [roomId]);
  const bindingRef = useRef(null);
  const [openTabs,        setOpenTabs]        = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [language,        setLanguage]        = useState("javascript");
  const [users,           setUsers]           = useState([]);
  const [selectedCode,    setSelectedCode]    = useState("");
  const roomTheme = "light";
  const [isRunning,       setIsRunning]       = useState(false);
  const [activePanel,     setActivePanel]     = useState("explorer"); // explorer | search | users | history
  const [aiOpen,          setAiOpen]          = useState(() => window.matchMedia("(min-width: 1100px)").matches);
  const [connection,      setConnection]      = useState(socket.connected ? "connected" : "connecting");
  const [cursor,          setCursor]          = useState(null);
  const [problems,        setProblems]        = useState([]);
  const [output,          setOutput]          = useState([]);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [historyKey,      setHistoryKey]      = useState(0);
  const [compare,         setCompare]         = useState(null);   // { version, createdAt, files }
  const [restoring,       setRestoring]       = useState(null);   // version number being restored
  const [roomMeta,        setRoomMeta]        = useState(null);   // { name, accessType }
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

  /* ── Room name + privacy (from the user's room list) ── */
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    apiFetch(`/api/rooms/user/${user.uid}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rooms) => { if (!cancelled) setRoomMeta(rooms.find((r) => r.roomId === roomId) || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [roomId, user?.uid]);

  /* ── Real-time connection status ── */
  useEffect(() => {
    const up = () => setConnection("connected");
    const down = () => setConnection("disconnected");
    const retry = () => setConnection("connecting");
    socket.on("connect", up);
    socket.on("disconnect", down);
    socket.io.on("reconnect_attempt", retry);
    return () => { socket.off("connect", up); socket.off("disconnect", down); socket.io.off("reconnect_attempt", retry); };
  }, []);

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
          const res = await apiFetch(`${baseUrl}/api/users/profile/${user.uid}`);
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
        setHistoryKey((k) => k + 1);
      } else {
        setSaveStatus("unsaved");
      }
    });

    socket.on("join-error", (errorMessage) => {
      toast.error(errorMessage || "Failed to join room.");
      navigate("/dashboard");
    });

    socket.on("room-closed", (data) => {
      toast.info(data.message || "This room has been closed by the owner.");
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

    const applyRemote = (update) => {
      if (update) Y.applyUpdate(ydoc, new Uint8Array(update), "remote");
    };
    socket.on("yjs-sync", applyRemote);
    socket.on("yjs-update", applyRemote);
    socket.on("version-restored", ({ version, by }) => { toast.info(`${by} restored version ${version}.`); setHistoryKey((k) => k + 1); });

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
      socket.off("yjs-sync", applyRemote);
      socket.off("yjs-update", applyRemote);
      socket.off("version-restored");
    };
  }, [roomId, username, photoURL, user?.uid, navigate, ydoc]);

  /* ── CRDT: send local edits, mirror text into `files` state ── */
  useEffect(() => {
    const onLocalUpdate = (update, origin) => {
      if (origin === "remote") return;
      setSaveStatus("unsaved");
      socket.emit("yjs-update", { roomId, update });
    };
    const map = ydoc.getMap("files");
    // Any text change (local or remote) is reflected in the file list used by
    // the explorer, search, AI context and the WebContainer sync.
    const onDeep = (events) => {
      const changed = new Set();
      for (const e of events) {
        if (e.target === map) e.changes.keys.forEach((_, key) => changed.add(key));
        else if (e.path.length) changed.add(String(e.path[0]));
      }
      if (!changed.size) return;
      setFiles((prev) => prev.map((f) => (changed.has(f.path) && map.has(f.path) ? { ...f, content: map.get(f.path).toString() } : f)));
    };
    ydoc.on("update", onLocalUpdate);
    map.observeDeep(onDeep);
    return () => {
      ydoc.off("update", onLocalUpdate);
      map.unobserveDeep(onDeep);
    };
  }, [ydoc, roomId]);

  /* ── CRDT: bind Monaco to the active file's Y.Text ── */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editorReady || !editor || !activeFile) return;
    const map = ydoc.getMap("files");
    let binding = null;
    const bind = () => {
      const text = map.get(activeFile);
      const model = editor.getModel();
      if (!text || !model || binding) return;
      binding = new MonacoBinding(text, model, new Set([editor]));
      bindingRef.current = binding;
    };
    bind();
    // A brand-new file gets its Y.Text from the server a moment later.
    const onKeys = () => bind();
    if (!binding) map.observe(onKeys);
    return () => {
      map.unobserve(onKeys);
      binding?.destroy();
      if (bindingRef.current === binding) bindingRef.current = null;
    };
  }, [activeFile, editorReady, ydoc]);

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
    // With a CRDT binding the edit is already on its way as a Yjs update.
    if (bindingRef.current) return;
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
    const selection = editor.getSelection();
    const range = selection && !selection.isEmpty()
      ? selection
      : model ? model.getFullModelRange() : new monacoInstance.Range(1, 1, 1, 1);
    const id = { major: 1, minor: 1 };
    const textOp = {
      identifier: id,
      range: range,
      text: newContent,
      forceMoveMarkers: true,
    };
    editor.executeEdits("ai-assist", [textOp]);
    editor.focus();
    toast.success(selection && !selection.isEmpty() ? "Selection replaced. Undo with Ctrl Z." : `Applied to ${activeFile.split("/").pop()}. Undo with Ctrl Z.`);
  };

  /** Reads the active file and selection straight from the editor, so the AI always sees what's on screen. */
  const getEditorContext = useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!model) return { code, selection: selectedCode };
    const sel = editor.getSelection();
    return { code: model.getValue(), selection: sel && !sel.isEmpty() ? model.getValueInRange(sel) : "" };
  }, [code, selectedCode]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    window.monaco = monaco;
    setEditorReady(true);

    // Problems tab: Monaco diagnostics across open models.
    const readMarkers = () => setProblems(
      monaco.editor.getModelMarkers({})
        .filter((m) => m.resource.scheme !== "inmemory" || m.resource.path)
        .map((m) => ({ file: decodeURIComponent(m.resource.path.replace(/^\//, "")), line: m.startLineNumber, column: m.startColumn, message: m.message, severity: m.severity }))
        .slice(0, 200)
    );
    monaco.editor.onDidChangeMarkers(readMarkers);
    readMarkers();

    editor.onDidChangeCursorPosition((e) => {
      setCursor({ lineNumber: e.position.lineNumber, column: e.position.column });
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
        await apiFetch(`${baseUrl}/api/filesystem/folder`, {
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
      setOutput((o) => [...o.slice(-99), { at: Date.now(), text: cmd.trim() }]);
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

  /* ── Version history ── */
  const restoreVersion = async (version) => {
    const ok = await confirmDialog({
      title: `Restore version ${version}?`,
      body: "The workspace will be replaced for everyone in this room. The current state is kept as a version, so you can undo this.",
      confirmLabel: "Restore",
    });
    if (!ok) return;
    setRestoring(version);
    socket.timeout(20000).emit("restore-version", { version }, (err, res) => {
      setRestoring(null);
      if (err || !res?.ok) { toast.error(res?.error || "Restore failed. Try again."); return; }
      setCompare(null);
      toast.success(`Restored version ${version}.`);
    });
  };

  const openProblem = (p) => {
    const f = files.find((item) => item.path === p.file);
    if (f) openFile(f.path, f.content);
    setTimeout(() => {
      editorRef.current?.revealLineInCenter(p.line);
      editorRef.current?.setPosition({ lineNumber: p.line, column: p.column });
      editorRef.current?.focus();
    }, 50);
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

      <div className={`room-app theme-${roomTheme}`}>

        <TitleBar
          roomName={roomMeta?.name || files.find((f) => f.isFolder && !f.path.includes("/"))?.path}
          roomId={roomId}
          access={roomMeta?.accessType}
          users={users}
          connection={connection}
          saveStatus={saveStatus}
          lastSavedTime={lastSavedTime}
          onSave={forceFlushToS3}
          aiOpen={aiOpen}
          onToggleAI={() => setAiOpen((v) => !v)}
        />

        <div className="room-body">
          <ActivityBar active={activePanel} onSelect={setActivePanel} userCount={users.length} onLeave={() => navigate("/dashboard")} />

          {activePanel && (
            <>
              <aside className="room-side" style={{ width: sidebarWidth }} aria-label={PANEL_TITLES[activePanel]}>
                <div className="room-side-head">
                  <span>{PANEL_TITLES[activePanel]}</span>
                  {activePanel === "explorer" && (
                    <div className="room-side-actions">
                      <button type="button" title="New file" aria-label="New file" onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}><FilePlus2 size={15} /></button>
                      <button type="button" title="New folder" aria-label="New folder" onClick={() => setNewItemModal({ parentPath: "", isFolder: true })}><FolderPlus size={15} /></button>
                      <input type="file" ref={fileInputRef} webkitdirectory="true" directory="true" multiple onChange={handleFolderUpload} className="hidden" />
                      <button type="button" title="Upload folder" aria-label="Upload folder" onClick={() => fileInputRef.current?.click()}><Upload size={15} /></button>
                      <button type="button" title="Download as ZIP" aria-label="Download as ZIP" onClick={downloadZip}><Download size={15} /></button>
                    </div>
                  )}
                  <button type="button" className="room-icon-btn room-side-close" onClick={() => setActivePanel(null)} aria-label="Close panel"><X size={15} /></button>
                </div>

                {activePanel === "explorer" && (
                  <div className="room-tree">
                    {files.length === 0 ? (
                      <div className="room-empty">
                        <FilePlus2 size={20} />
                        <p>This workspace is empty. Create a file or upload a folder to get started.</p>
                        <button type="button" className="room-btn is-primary" onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}>New file</button>
                      </div>
                    ) : renderTree(treeNodes)}
                  </div>
                )}

                {activePanel === "search" && (
                  <SearchPanel
                    files={files}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    onOpen={(path) => { const f = files.find((item) => item.path === path); if (f) openFile(f.path, f.content); }}
                  />
                )}

                {activePanel === "users" && <CollaboratorsPanel users={users} />}

                {activePanel === "history" && (
                  <HistoryPanel roomId={roomId} refreshKey={historyKey} busyVersion={restoring}
                    onCompare={(snap) => setCompare(snap)} onRestore={restoreVersion} />
                )}
              </aside>
              <div className="room-divider-v" onMouseDown={onSidebarDividerMouseDown} role="separator" aria-orientation="vertical" title="Drag to resize" />
            </>
          )}

          <div className="room-center">
            {compare ? (
              <CompareView snapshot={compare} files={files} restoring={restoring != null} onClose={() => setCompare(null)} onRestore={restoreVersion} />
            ) : openTabs.length === 0 ? (
              <div className="room-welcome">
                <span className="room-welcome-icon"><FilePlus2 size={26} /></span>
                <h2>Open a file to start coding</h2>
                <p>Pick a file in the explorer, or create one. Everyone in the room sees your changes live.</p>
                <div className="room-welcome-actions">
                  <button type="button" className="room-btn is-primary" onClick={() => setNewItemModal({ parentPath: "", isFolder: false })}><FilePlus2 size={14} /> New file</button>
                  <button type="button" className="room-btn" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Upload folder</button>
                </div>
              </div>
            ) : (
              <div className="room-editor">
                <div className="room-tabs" role="tablist" aria-label="Open files">
                  {openTabs.map((tab) => {
                    const isActive = tab === activeFile;
                    const fileItem = files.find((f) => f.path === tab);
                    return (
                      <div key={tab} role="tab" aria-selected={isActive} tabIndex={0} className={`room-tab ${isActive ? "is-active" : ""}`}
                        onClick={() => { if (fileItem) openFile(tab, fileItem.content); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && fileItem) openFile(tab, fileItem.content); }}>
                        <FileIcon filename={tab.split("/").pop()} size={14} />
                        <span>{tab.split("/").pop()}</span>
                        <button type="button" onClick={(e) => closeTab(e, tab)} aria-label={`Close ${tab.split("/").pop()}`}><X size={12} /></button>
                      </div>
                    );
                  })}
                  <div className="room-tabs-actions">
                    <button type="button" className="room-btn is-run" onClick={runCode} disabled={isRunning}>
                      {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} {isRunning ? "Running…" : "Run"}
                    </button>
                    <button type="button" className={`room-btn ${isPreviewOpen ? "is-on" : ""}`} onClick={() => setIsPreviewOpen(!isPreviewOpen)} aria-pressed={isPreviewOpen}>
                      <PanelRight size={13} /> Preview
                    </button>
                  </div>
                </div>

                <div className="room-crumbs" aria-label="File path">
                  {(activeFile || "").split("/").map((part, i, arr) => (
                    <span key={i} className={i === arr.length - 1 ? "is-file" : ""}>
                      {i === arr.length - 1 && <FileIcon filename={part} size={12} />}{part}
                      {i < arr.length - 1 && <ChevronRight size={12} />}
                    </span>
                  ))}
                </div>

                <div className="room-monaco">
                  <Editor
                    height="100%"
                    language={language}
                    theme={MONACO_THEME}
                    beforeMount={defineMonacoTheme}
                    path={activeFile || "untitled"}
                    defaultValue={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorMount}
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      fontLigatures: true,
                      lineHeight: 22,
                      minimap: { enabled: true, scale: 0.8, renderCharacters: false },
                      automaticLayout: true,
                      padding: { top: 12 },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      renderLineHighlight: "all",
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: true },
                      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                      overviewRulerLanes: 0,
                      tabSize: 2,
                    }}
                  />
                </div>
              </div>
            )}

            {!bottomCollapsed && <div className="room-divider-h" onMouseDown={onDividerMouseDown} role="separator" aria-orientation="horizontal" title="Drag to resize" />}
            <BottomPanel height={terminalHeight} problems={problems} output={output} onOpenProblem={openProblem}
              collapsed={bottomCollapsed} onToggleCollapsed={() => setBottomCollapsed((v) => !v)} />
          </div>

          {isPreviewOpen && (
            <PreviewPanel
              url={previewUrl}
              width={previewWidth}
              isDragging={isDraggingPreviewState}
              onDividerMouseDown={onPreviewDividerMouseDown}
              onClose={() => setIsPreviewOpen(false)}
            />
          )}

          {aiOpen && (
            <AIPanel roomId={roomId} file={activeFile} language={language} code={code} selection={selectedCode} getContext={getEditorContext}
              onApply={activeFile ? handleApplyCodeSuggestion : undefined} onClose={() => setAiOpen(false)} width={AI_WIDTH} />
          )}
        </div>

        <StatusBar
          users={users}
          roomId={roomId}
          language={language}
          cursor={activeFile ? cursor : null}
          connection={connection}
          saveStatus={saveStatus}
          onSave={forceFlushToS3}
        />

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
