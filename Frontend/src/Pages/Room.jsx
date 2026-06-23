import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../services/socket";

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(
`// Welcome to CodeFusionAI

console.log("Hello World");
`
  );

  const [files, setFiles] = useState([
    {
      name: "main.js",
      content: code,
    },
  ]);

  const [activeFile, setActiveFile] = useState(0);

  const activeFileRef = useRef(0);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  const [language, setLanguage] = useState("javascript");

  const [users, setUsers] = useState([]);

  const [output, setOutput] = useState(
`Code execution output will appear here...
`
  );

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("receive-code", (incomingCode) => {
      setCode(incomingCode);
      setFiles((prevFiles) => {
        const updated = [...prevFiles];
        if (updated[activeFileRef.current]) {
          updated[activeFileRef.current].content = incomingCode || "";
        }
        return updated;
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
    const updatedFiles = [...files];

    updatedFiles[activeFile].content =
      value || "";

    setFiles(updatedFiles);

    setCode(value || "");

    socket.emit("code-change", {
      roomId,
      code: value,
    });
  };

  const handleRunCode = () => {
    setOutput(
`Running ${language} code...

(Execution API will be connected next)
`
    );
  };

  const createFile = () => {
    const fileName = prompt("Enter file name");

    if (!fileName) return;

    setFiles([
      ...files,
      {
        name: fileName,
        content: "",
      },
    ]);
  };

  const deleteFile = (index) => {
    const updatedFiles = files.filter(
      (_, i) => i !== index
    );

    setFiles(updatedFiles);

    let newActive = activeFile;
    if (activeFile >= updatedFiles.length) {
      newActive = 0;
      setActiveFile(0);
    }

    if (updatedFiles[newActive]) {
      setCode(updatedFiles[newActive].content);
    } else {
      setCode("");
    }
  };

  const downloadFile = () => {
    const file = files[activeFile];

    const blob = new Blob(
      [file.content],
      { type: "text/plain" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = file.name;

    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-[#0d1117] text-white flex flex-col">

      {/* Top Navbar */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">

        <div>
          <h1 className="font-bold text-lg text-purple-400">
            CodeFusionAI
          </h1>
        </div>

        <div className="flex gap-3 items-center">

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#161b22] border border-gray-700 rounded px-3 py-1"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <button
            onClick={handleRunCode}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
          >
            ▶ Run
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col">

          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">
              Explorer
            </h2>
            <div className="mt-4 flex gap-2">
              <button
                onClick={createFile}
                className="bg-green-600 px-2 py-1 rounded text-xs"
              >
                + File
              </button>
              <button
                onClick={downloadFile}
                className="bg-blue-600 px-2 py-1 rounded text-xs"
              >
                Download
              </button>
            </div>
          </div>

          <div className="p-4 text-sm text-gray-300">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                  activeFile === index
                    ? "bg-slate-700"
                    : ""
                }`}
                onClick={() => {
                  setActiveFile(index);
                  setCode(file.content);
                }}
              >
                <span>
                  📄 {file.name}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(index);
                  }}
                  className="text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-800">
            <h2 className="font-semibold mb-3">
              Connected Users
            </h2>

            {users.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Waiting for users...
              </p>
            ) : (
              users.map((user, index) => (
                <div
                  key={index}
                  className="text-sm py-1"
                >
                  👤 {user.username || "User"}
                </div>
              ))
            )}
          </div>

          <div className="mt-auto p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400">
              Room:
            </p>

            <p className="text-xs break-all text-purple-400">
              {roomId}
            </p>
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col">

          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={files[activeFile]?.content || ""}
              onChange={handleCodeChange}
            />
          </div>

          {/* Terminal */}
          <div className="h-48 bg-black border-t border-gray-800 p-4 overflow-auto">

            <h3 className="font-semibold mb-2 text-green-400">
              Terminal
            </h3>

            <pre className="text-sm whitespace-pre-wrap text-gray-300">
              {output}
            </pre>

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-[#161b22] border-l border-gray-800 flex flex-col">

          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">
              AI Assistant
            </h2>
          </div>

          <div className="p-4 text-sm text-gray-300 flex-1">

            <div className="bg-[#0d1117] rounded-lg p-3 mb-3">
              💡 Ask AI to review your code
            </div>

            <div className="bg-[#0d1117] rounded-lg p-3 mb-3">
              🐛 Detect bugs
            </div>

            <div className="bg-[#0d1117] rounded-lg p-3">
              ⚡ Optimize code
            </div>

          </div>

          <div className="p-4 border-t border-gray-800">
            <input
              type="text"
              placeholder="Ask AI..."
              className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Room;