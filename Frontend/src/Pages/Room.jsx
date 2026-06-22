import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    socket.emit("join-room", roomId);

    console.log(`Joined Room: ${roomId}`);

    return () => {
      console.log(`Left Room: ${roomId}`);
    };
  }, [roomId]);

  return (
    <div className="min-h-screen bg-[#030812] text-white">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-[#030812] px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-400">
            CodeFusionAI
          </h1>
          <p className="text-sm text-slate-400">
            Real-Time Collaborative Editor
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
        >
          Leave Room
        </button>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Room Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-semibold">
            Room ID
          </h2>

          <p className="font-mono text-purple-400 mt-2">
            {roomId}
          </p>
        </div>

        {/* Editor Placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl h-[500px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              Monaco Editor Coming Soon 🚀
            </h2>

            <p className="text-slate-400">
              This area will contain the collaborative code editor.
            </p>
          </div>
        </div>

        {/* Connected Users Placeholder */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3">
            Connected Users
          </h2>

          <p className="text-slate-400">
            User tracking will be added in the next step.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Room;