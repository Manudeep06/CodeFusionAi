import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../services/socket";

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(
`// Welcome to CodeFusionAI 🚀

console.log("Hello World");
`
  );

  const [files, setFiles] = useState([
    {
      path: "main.js",
      content: `// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World");\n`,
      isFolder: false,
    },
  ]);

  const [activeFile, setActiveFile] = useState("main.js");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [output, setOutput] = useState(
    "Code execution output will appear here...\n"
  );

  const activeFileRef = useRef("main.js");
  const fileInputRef = useRef(null);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("receive-code", (incomingCode) => {
      try {
        const parsed = JSON.parse(incomingCode);
        if (Array.isArray(parsed)) {
          setFiles((currentFiles) => {
            if (JSON.stringify(currentFiles) === incomingCode) {
              return currentFiles;
            }

            // Sync active file's code if files array changed
            const activePath = activeFileRef.current;
            const activeFileItem = parsed.find(
              (f) => f.path === activePath && !f.isFolder
            );
            if (activeFileItem) {
              setCode(activeFileItem.content || "");
            } else {
              const firstFile = parsed.find((f) => !f.isFolder);
              if (firstFile) {
                setTimeout(() => {
                  setActiveFile(firstFile.path);
                  setCode(firstFile.content || "");
                }, 0);
              } else {
                setTimeout(() => {
                  setActiveFile("");
                  setCode("");
                }, 0);
              }
            }

            return parsed;
          });
          return;
        }
      } catch (e) {
        // Fallback for legacy single code string rooms
      }

      setCode(incomingCode || "");
      setFiles((prevFiles) => {
        let changed = false;
        const updated = prevFiles.map((file) => {
          if (file.path === activeFileRef.current) {
            if (file.content !== incomingCode) {
              changed = true;
              return { ...file, content: incomingCode || "" };
            }
          }
          return file;
        });
        return changed ? updated : prevFiles;
      });
    });

    socket.on("room-users", (roomUsers) => {
      setUsers(roomUsers);
    });

    return () => {
      socket.off("receive-code");
      socket.off("room-users");
    };
  }, [roomId]);

  const handleCodeChange = (value) => {
    const updatedFiles = files.map((file) => {
      if (file.path === activeFile) {
        return { ...file, content: value || "" };
      }
      return file;
    });

    setFiles(updatedFiles);
    setCode(value || "");

    socket.emit("code-change", {
      roomId,
      code: JSON.stringify(updatedFiles),
    });
  };

  const handleRunCode = () => {
    setOutput(
      `Running ${language} code...

(Execution API will be connected next)
`
    );
  };

  const createNewItem = (parentPath = "", isFolder = false) => {
    const name = prompt(`Enter ${isFolder ? "folder" : "file"} name:`);
    if (!name) return;

    if (name.includes("/")) {
      alert("Name cannot contain '/'");
      return;
    }

    const itemPath = parentPath ? `${parentPath}/${name}` : name;

    if (files.some((f) => f.path === itemPath)) {
      alert("An item with this name already exists at this location.");
      return;
    }

    const newItem = {
      path: itemPath,
      isFolder,
      content: isFolder ? undefined : "",
    };

    const updatedFiles = [...files, newItem];
    setFiles(updatedFiles);

    if (!isFolder) {
      setActiveFile(itemPath);
      setCode("");
    } else {
      if (parentPath) {
        setExpandedFolders((prev) => ({ ...prev, [parentPath]: true }));
      }
    }

    socket.emit("code-change", {
      roomId,
      code: JSON.stringify(updatedFiles),
    });
  };

  const deleteItem = (path, isFolder = false) => {
    if (isFolder) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete folder "${path}" and all its contents?`
      );
      if (!confirmDelete) return;
    }

    const updatedFiles = files.filter((f) => {
      if (isFolder) {
        return f.path !== path && !f.path.startsWith(`${path}/`);
      }
      return f.path !== path;
    });

    setFiles(updatedFiles);

    const activeFileStillExists = updatedFiles.some(
      (f) => f.path === activeFile && !f.isFolder
    );

    if (!activeFileStillExists) {
      const firstFile = updatedFiles.find((f) => !f.isFolder);
      if (firstFile) {
        setActiveFile(firstFile.path);
        setCode(firstFile.content || "");
      } else {
        setActiveFile("");
        setCode("");
      }
    }

    socket.emit("code-change", {
      roomId,
      code: JSON.stringify(updatedFiles),
    });
  };

  const handleFolderUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (uploadedFiles.length === 0) return;

    const newFileItems = [];

    // Filter out node_modules, dist, git, build
    const filteredFiles = uploadedFiles.filter((file) => {
      const path = file.webkitRelativePath;
      return (
        !path.includes("/node_modules/") &&
        !path.includes("/.git/") &&
        !path.includes("/dist/") &&
        !path.includes("/build/")
      );
    });

    for (const file of filteredFiles) {
      const path = file.webkitRelativePath;
      try {
        const content = await file.text();
        newFileItems.push({
          path,
          content,
          isFolder: false,
        });
      } catch (err) {
        console.error("Error reading file:", file.name, err);
      }
    }

    if (newFileItems.length === 0) return;

    const proceed = window.confirm(
      "Uploading a folder will replace your current workspace files. Proceed?"
    );
    if (!proceed) return;

    setFiles(newFileItems);

    const firstFile = newFileItems.find((f) => !f.isFolder);
    if (firstFile) {
      setActiveFile(firstFile.path);
      setCode(firstFile.content || "");
    }

    const initialExpanded = {};
    newFileItems.forEach((f) => {
      const parts = f.path.split("/");
      if (parts.length > 1) {
        initialExpanded[parts[0]] = true;
      }
    });
    setExpandedFolders(initialExpanded);

    socket.emit("code-change", {
      roomId,
      code: JSON.stringify(newFileItems),
    });
  };

  const downloadProject = async () => {
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const zip = new window.JSZip();

    files.forEach((file) => {
      if (!file.isFolder) {
        zip.file(file.path, file.content);
      } else {
        zip.folder(file.path);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-${roomId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to build hierarchy from flat files
  const buildTree = (filesList) => {
    const root = { name: "root", path: "", isFolder: true, children: [] };

    filesList.forEach((file) => {
      const parts = file.path.split("/");
      let current = root;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        let child = current.children.find((c) => c.name === part);
        if (!child) {
          child = {
            name: part,
            path: currentPath,
            isFolder: !isLast || file.isFolder,
            content: isLast ? file.content : undefined,
            children: [],
          };
          current.children.push(child);
        }
        current = child;
      });
    });

    const sortTree = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };
    sortTree(root);

    return root.children;
  };

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const renderTree = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = !!expandedFolders[node.path];
      const isSelected = activeFile === node.path;

      if (node.isFolder) {
        return (
          <div key={node.path} className="select-none">
            <div
              className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-800/60 rounded cursor-pointer text-slate-300 hover:text-white transition duration-150 group"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(node.path)}
            >
              <span className="text-slate-500 text-[10px] w-3 text-center">
                {isExpanded ? "▼" : "▶"}
              </span>
              <span className="text-amber-400 text-sm">
                {isExpanded ? "📂" : "📁"}
              </span>
              <span className="truncate text-xs font-medium">{node.name}</span>

              {/* Folder Actions */}
              <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNewItem(node.path, false);
                  }}
                  className="hover:bg-slate-700 p-0.5 rounded text-green-400 hover:text-green-300 text-[10px]"
                  title="New File"
                >
                  📄+
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNewItem(node.path, true);
                  }}
                  className="hover:bg-slate-700 p-0.5 rounded text-blue-400 hover:text-blue-300 text-[10px]"
                  title="New Folder"
                >
                  📁+
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(node.path, true);
                  }}
                  className="hover:bg-slate-700 p-0.5 rounded text-red-400 hover:text-red-300 text-[10px]"
                  title="Delete Folder"
                >
                  ✕
                </button>
              </div>
            </div>
            {isExpanded && node.children && renderTree(node.children, depth + 1)}
          </div>
        );
      } else {
        const ext = node.name.split(".").pop();
        let fileIcon = "📄";
        if (ext === "js" || ext === "jsx") fileIcon = "🟨";
        else if (ext === "py") fileIcon = "🐍";
        else if (ext === "cpp" || ext === "h") fileIcon = "🟦";
        else if (ext === "java") fileIcon = "☕";
        else if (ext === "json") fileIcon = "⚙️";
        else if (ext === "css") fileIcon = "🎨";
        else if (ext === "html") fileIcon = "🌐";

        return (
          <div
            key={node.path}
            className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition duration-150 group text-xs ${
              isSelected
                ? "bg-purple-600/20 text-purple-200 border-l-2 border-purple-500 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
            style={{ paddingLeft: `${depth * 12 + 20}px` }}
            onClick={() => {
              setActiveFile(node.path);
              setCode(node.content || "");

              if (ext === "js" || ext === "jsx") setLanguage("javascript");
              else if (ext === "py") setLanguage("python");
              else if (ext === "cpp") setLanguage("cpp");
              else if (ext === "java") setLanguage("java");
              else if (ext === "css") setLanguage("css");
              else if (ext === "html") setLanguage("html");
              else if (ext === "json") setLanguage("json");
            }}
          >
            <span>{fileIcon}</span>
            <span className="truncate">{node.name}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(node.path, false);
              }}
              className="ml-auto hover:bg-slate-800 p-0.5 rounded text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px]"
              title="Delete File"
            >
              ✕
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div className="h-screen bg-[#07090e] text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <div className="h-14 border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">💻</span>
          <h1 className="font-extrabold text-lg bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            CodeFusionAI
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
            Workspace
          </span>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-[#121824] border border-white/5 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">
              Language:
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="javascript" className="bg-[#121824]">
                JavaScript
              </option>
              <option value="python" className="bg-[#121824]">
                Python
              </option>
              <option value="cpp" className="bg-[#121824]">
                C++
              </option>
              <option value="java" className="bg-[#121824]">
                Java
              </option>
              <option value="css" className="bg-[#121824]">
                CSS
              </option>
              <option value="html" className="bg-[#121824]">
                HTML
              </option>
              <option value="json" className="bg-[#121824]">
                JSON
              </option>
            </select>
          </div>

          <button
            onClick={handleRunCode}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-4 py-1.5 rounded-lg font-semibold shadow-md shadow-green-950/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-sm"
          >
            <span>▶</span> Run Code
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white px-4 py-1.5 rounded-lg font-medium hover:scale-105 active:scale-95 transition-all duration-200 text-sm"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#0b0e14] border-r border-white/5 flex flex-col">
          {/* Explorer Header */}
          <div className="p-4 border-b border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Explorer
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => createNewItem("", false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="New File"
                >
                  📄+
                </button>
                <button
                  onClick={() => createNewItem("", true)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="New Folder"
                >
                  📁+
                </button>
              </div>
            </div>

            {/* Folder Upload & Download ZIP Actions */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="file"
                ref={fileInputRef}
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#121824] hover:bg-slate-800 text-[11px] font-medium py-1.5 rounded text-slate-300 hover:text-white border border-white/5 transition flex items-center justify-center gap-1"
                title="Upload Local Folder"
              >
                <span>📤</span> Upload
              </button>
              <button
                onClick={downloadProject}
                className="bg-[#121824] hover:bg-slate-800 text-[11px] font-medium py-1.5 rounded text-slate-300 hover:text-white border border-white/5 transition flex items-center justify-center gap-1"
                title="Download Project ZIP"
              >
                <span>📥</span> ZIP
              </button>
            </div>
          </div>

          {/* Tree Files Container */}
          <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
            {files.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-xs">
                No files in workspace
              </div>
            ) : (
              renderTree(buildTree(files))
            )}
          </div>

          {/* Connected Users */}
          <div className="p-4 border-t border-white/5 bg-[#090c10]/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>👥</span> Connected Users ({users.length})
            </h3>

            <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar">
              {users.length === 0 ? (
                <p className="text-slate-500 text-xs italic">
                  Waiting for users...
                </p>
              ) : (
                users.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs py-1 px-1.5 rounded bg-slate-800/20 text-slate-300 hover:bg-slate-800/40"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="truncate">{user.username || "User"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Room Info */}
          <div className="p-4 border-t border-white/5 bg-[#090c10]/80">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Room ID:
            </p>
            <p className="text-xs font-mono break-all text-purple-400 bg-purple-950/20 p-1.5 rounded border border-purple-500/10 mt-1">
              {roomId}
            </p>
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col bg-[#07090e]">
          {/* Active File Tab Bar */}
          <div className="h-9 bg-[#0b0e14] border-b border-white/5 flex items-center px-4 overflow-x-auto select-none custom-scrollbar">
            {activeFile ? (
              <div className="flex items-center gap-2 bg-[#07090e] border-t-2 border-purple-500 px-3 py-1.5 text-xs text-slate-200 font-medium rounded-t border-r border-l border-white/5">
                <span>📄</span>
                <span>{activeFile.split("/").pop()}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({activeFile})
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">No open file</span>
            )}
          </div>

          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Terminal */}
          <div className="h-48 bg-[#090c12] border-t border-white/5 flex flex-col">
            <div className="h-8 border-b border-white/5 px-4 flex items-center justify-between bg-[#0b0e14]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>🐚</span> Terminal
              </h3>
              <button
                onClick={() =>
                  setOutput("Code execution output will appear here...\n")
                }
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-sm text-slate-300">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {output}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-80 bg-[#0b0e14] border-l border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>✨</span> AI Assistant
            </h2>
          </div>

          <div className="p-4 text-xs text-slate-400 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="bg-[#121824]/60 border border-white/5 rounded-xl p-3.5 space-y-2 hover:bg-[#121824]/80 transition duration-200">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <span>💡</span>
                <span>Code Review</span>
              </div>
              <p className="leading-relaxed">
                Ask AI to inspect the current file for potential optimizations,
                refactoring tips, and code style suggestions.
              </p>
            </div>

            <div className="bg-[#121824]/60 border border-white/5 rounded-xl p-3.5 space-y-2 hover:bg-[#121824]/80 transition duration-200">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <span>🐛</span>
                <span>Bugs & Security</span>
              </div>
              <p className="leading-relaxed">
                Analyze your logic for runtime exceptions, edge-cases, memory
                leaks, or minor type mismatches.
              </p>
            </div>

            <div className="bg-[#121824]/60 border border-white/5 rounded-xl p-3.5 space-y-2 hover:bg-[#121824]/80 transition duration-200">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <span>⚡</span>
                <span>Performance Boost</span>
              </div>
              <p className="leading-relaxed">
                Optimize complexity bottlenecks and speed up runtimes with
                dynamic suggestions.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-[#090c10]">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask AI assistant..."
                className="w-full bg-[#121824] border border-white/5 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500/50 transition duration-200"
              />
              <span className="absolute right-3 top-2.5 text-slate-500 cursor-pointer hover:text-purple-400 transition">
                ⚡
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;