import { useState } from "react";

export default function SessionsTab({ handleJoinRoomShortcut }) {
  const [sessions, setSessions] = useState([
    { roomId: "cfai-ecom-9a2c", name: "E-Commerce Frontend", template: "react", users: 3, lastActive: "10 mins ago", status: "Active" },
    { roomId: "cfai-pyth-d83f", name: "AI agent python sandbox", template: "node", users: 1, lastActive: "2 hours ago", status: "Active" },
    { roomId: "cfai-algo-2f0a", name: "DSA Practice (C++)", template: "vanilla", users: 0, lastActive: "Yesterday", status: "Idle" },
  ]);

  return (
    <div className="animate-card-enter space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Collaboration Hub</span>
          <h2 className="text-2xl font-black text-white mt-1 tracking-tight">Active Rooms & Sessions</h2>
          <p className="text-xs text-slate-500 mt-1">Access your team's live environments or rejoin previous sessions.</p>
        </div>
        <button
          onClick={() => {
            const input = document.getElementById('roomNameInput');
            if (input) {
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => input.focus(), 300);
            }
          }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-purple-500/20"
        >
          Create New Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.map((s) => (
          <div
            key={s.roomId}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-white/[0.02] to-transparent p-5 backdrop-blur-xl hover:border-purple-500/35 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] transition-all duration-300"
          >
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/35 to-transparent" />
            
            <div className="flex items-start justify-between mb-4">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-slate-400">
                {s.template.toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                s.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border border-white/[0.04]"
              }`}>
                <span className={`w-1 h-1 rounded-full ${s.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                {s.status}
              </span>
            </div>

            <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition duration-150 truncate">{s.name}</h3>
            <code className="block font-mono text-[10px] text-purple-400/80 mt-1 select-all">{s.roomId}</code>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-5 pt-3 border-t border-white/[0.04]">
              <span className="flex items-center gap-1">
                👥 {s.users} user{s.users !== 1 ? 's' : ''} active
              </span>
              <span>{s.lastActive}</span>
            </div>

            <button
              onClick={() => handleJoinRoomShortcut(s.roomId)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold bg-white/[0.04] border border-white/[0.08] hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-white transition duration-200 cursor-pointer"
            >
              Join Session →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
