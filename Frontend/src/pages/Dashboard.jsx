import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";

import DocsTab from "../components/Docs/DocsTab";
import SessionsTab from "../components/Sessions/SessionsTab";
import AIAssistTab from "../components/AIAssist/AIAssistTab";

import ProfileImage from "../components/Dashboard/ProfileImage";
import InteractiveBg from "../components/Dashboard/InteractiveBg";
import Card from "../components/Dashboard/Card";
import StatCard from "../components/Dashboard/StatCard";
import CodePreview from "../components/Dashboard/CodePreview";

// Export Card component for backwards compatibility with tabs
export { Card };

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId]       = useState("");
  const [roomName, setRoomName]   = useState("");
  const [joinId, setJoinId]       = useState("");
  const [copied, setCopied]       = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [template, setTemplate] = useState("react");
  const [activeTab, setActiveTab] = useState("Dashboard");

 useEffect(() => {
   socket.connect();

   const handleConnect = () => {
     console.log("Connected:", socket.id);
   };

   const handleWelcome = (message) => {
     console.log(message);
   };

   const handleRoomCreated = (roomId) => {
     console.log("Room Created:", roomId);
   };

   const handleRoomJoined = (roomId) => {
     console.log("Joined Room:", roomId);
   };

   const handleUserJoined = (data) => {
     console.log("New User:", data.userId);
   };

   socket.on("connect", handleConnect);
   socket.on("welcome", handleWelcome);
   socket.on("room-created", handleRoomCreated);
   socket.on("room-joined", handleRoomJoined);
   socket.on("user-joined", handleUserJoined);

   return () => {
     socket.off("connect", handleConnect);
     socket.off("welcome", handleWelcome);
     socket.off("room-created", handleRoomCreated);
     socket.off("room-joined", handleRoomJoined);
     socket.off("user-joined", handleUserJoined);

     socket.disconnect();
   };
 }, []);

  const handleLogout = async () => {
    try { await logout(); window.location.href = "/"; }
    catch (e) { console.error(e); }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    const seg = (n) =>
      Array.from(
        { length: n },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");

    const newRoomId = `cfai-${seg(4)}-${seg(4)}`;

    setRoomId(newRoomId);

    // Save project files to IndexedDB based on template
    const { getTemplateFiles } = await import("../services/templates");
    const { saveWorkspaceFiles } = await import("../services/db");
    const rootFolder = roomName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Project";
    const templateFilesRaw = getTemplateFiles(template);
    
    const templateFiles = templateFilesRaw.map(f => ({
      ...f,
      path: `${rootFolder}/${f.path}`
    }));
    templateFiles.push({ path: rootFolder, isFolder: true, content: undefined });

    await saveWorkspaceFiles(newRoomId, templateFiles);

    socket.emit("create-room", { 
      roomId: newRoomId, 
      roomName: roomName.trim(),
      ownerId: user?.uid || "",
      username: user?.displayName || user?.email?.split("@")[0] || "Developer",
      photoURL: user?.photoURL || "",
      template: template,
      files: JSON.stringify(templateFiles)
    });

    navigate(`/room/${newRoomId}`);
  };
  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();

    if (!joinId.trim()) return;

    setIsJoining(true);
    socket.emit("join-room", joinId);
    navigate(`/room/${joinId}`);
  };

  const getInitials = () => {
    if (user?.displayName) return user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "US";
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Developer";

  return (
    <div className="relative min-h-screen bg-[#030812] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <InteractiveBg />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030812]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-500 p-2 rounded-xl shadow-lg shadow-purple-500/30 animate-pulse-ring">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
              CodeFusionAI
            </span>
          </div>

          {/* Nav centre — feature pills */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {["Dashboard", "Sessions", "AI Assist", "Docs"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`px-3.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 border focus:outline-none ${
                  activeTab === item
                    ? "bg-purple-500/15 text-purple-300 border-purple-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border-transparent"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full pl-2.5 pr-4 py-1.5">
              <ProfileImage
                src={user?.photoURL}
                fallback={getInitials()}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover text-[8px]"
              />
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-slate-300 max-w-[120px] truncate">{displayName}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-red-950/40 hover:border-red-700/40 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] active:scale-[0.97] transition-all duration-200 text-sm font-semibold cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {activeTab === "Dashboard" && (
          <>
            {/* ── HERO — Two column layout ── */}
        <section className="mb-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — Text */}
          <div className="animate-card-enter" style={{ opacity: 0 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/15 to-indigo-500/10 border border-purple-500/25 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-400" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">Developer Dashboard</span>
            </div>

            <h1 className="font-black tracking-tight leading-[1.08] mb-5">
              <span className="block text-3xl md:text-4xl text-slate-400 font-bold mb-1">Welcome back,</span>
              <span className="block text-5xl md:text-6xl bg-gradient-to-r from-white via-purple-100 to-blue-200 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>

            <p className="text-slate-400 text-[15px] leading-relaxed max-w-md mb-8">
              Your AI-powered real-time collaborative IDE is live and ready.
              Spin up a secure room or join your team's session in one click.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { label: "WebSocket Sync",   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { label: "Gemini AI",         color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
                { label: "WebContainer Sandbox", color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
                { label: "End-to-End Encrypted", color: "text-blue-400", bg: "bg-blue-500/10",   border: "border-blue-500/20" },
              ].map(t => (
                <span key={t.label} className={`inline-flex items-center gap-1.5 ${t.bg} ${t.border} border ${t.color} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg`}>
                  <span className="w-1 h-1 rounded-full bg-current opacity-80" />
                  {t.label}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => {
                  const input = document.getElementById('roomNameInput');
                  if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => input.focus(), 300);
                  }
                }}
                className="group relative overflow-hidden flex items-center gap-2.5 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.40)] hover:shadow-[0_0_50px_rgba(168,85,247,0.65)] active:scale-[0.97] transition-all duration-300 cursor-pointer text-sm"
              >
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create New Room
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('join-room-input');
                  if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => input.focus(), 300);
                  }
                }}
                className="flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.09] hover:border-purple-500/30 text-slate-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                Join Session
              </button>
            </div>

            {/* Status strip */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400">All Systems Operational</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
                <span className="text-[11px] text-slate-600">UID</span>
                <span className="font-mono text-[11px] text-purple-400/80 select-all">{user?.uid?.slice(0, 10)}…</span>
              </div>
            </div>
          </div>

          {/* Right — Live Code Preview */}
          <div className="animate-card-enter" style={{ opacity: 0, animationDelay: "180ms" }}>
            <div className="relative">
              {/* Multi-layer glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-purple-600/25 via-indigo-600/15 to-blue-600/20 rounded-3xl blur-3xl" />
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl" />
              <div className="relative">
                <CodePreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12 select-none">
          <StatCard label="Sync Latency"  value="~12ms"                       sub="Websockets Active"  icon="⚡"   colorClass="text-emerald-400" glowHex="#10b981" barWidth="85%" delay={0}   />
          <StatCard label="Active Rooms"  value={roomId ? "1 / 5" : "0 / 5"} sub="Developer Capacity" icon="◈"   colorClass="text-violet-400"  glowHex="#8b5cf6" barWidth={roomId ? "20%" : "5%"} delay={80}  />
          <StatCard label="AI Copilot"    value="Ready"                       sub="Gemini-2.0-Flash"   icon="✦"   colorClass="text-fuchsia-400" glowHex="#ec4899" barWidth="100%" delay={160} />
          <StatCard label="Compilers"     value="WASM Node.js"               sub="WebContainer Sandbox" icon="</>" colorClass="text-cyan-400"    glowHex="#06b6d4" barWidth="75%" delay={240} />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2-col */}
          <div className="lg:col-span-2 space-y-6">

            {/* Create Room */}
            <Card delay={320} accentColor="purple">
              <div className="flex items-start gap-5 mb-6">
                <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-600/25 to-indigo-800/20 p-3.5 text-purple-400 shrink-0 shadow-[0_0_24px_rgba(168,85,247,0.18)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-white mb-1 tracking-tight">Create Collaborative Room</h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Spawn a secure, end-to-end encrypted coding space with instant WebSocket synchronization and AI assistance.
                  </p>
                </div>
              </div>

              {!roomId ? (
                <div className="space-y-4">
                  <div className="relative space-y-3">
                    <input
                      id="roomNameInput"
                      type="text"
                      placeholder="Enter Project Name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-700 font-medium focus:outline-none focus:border-purple-500/60 focus:bg-purple-950/10 focus:ring-2 focus:ring-purple-500/15 transition duration-200"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {[
                        { id: "react", name: "React", desc: "Vite App", color: "#61dafb", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.955 17.262c-3.133 0-5.918-.544-7.854-1.528-.868-.44-1.574-.95-2.072-1.498-.5-.55-.747-1.127-.747-1.706 0-.58.247-1.156.747-1.706.498-.549 1.204-1.059 2.072-1.498 1.936-.984 4.72-1.528 7.854-1.528 3.133 0 5.918.544 7.854 1.528.868.44 1.574.95 2.072 1.498.5.55.747 1.127.747 1.706 0 .58-.247 1.156-.747 1.706-.498.549-1.204 1.059-2.072 1.498-1.936.984-4.72 1.528-7.854 1.528zM11.955 8.8c-2.923 0-5.503.498-7.258 1.39-.784.398-1.4.846-1.815 1.302.395.426.967.842 1.696 1.213C6.35 13.61 8.98 14.118 11.955 14.118c2.975 0 5.604-.508 7.377-1.413.729-.371 1.301-.787 1.696-1.213-.415-.456-1.031-.904-1.815-1.302-1.755-.892-4.335-1.39-7.258-1.39z"/><circle cx="11.955" cy="12.53" r="2.25"/></svg> },
                        { id: "vue", name: "Vue", desc: "Vite App", color: "#42b883", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M14.222 3.667h5.111L12 16.333 4.667 3.667h5.111l2.222 3.889 2.222-3.889zM12 20.333L1.333 3.667h3.778L12 14.556l6.889-10.889h3.778L12 20.333z"/></svg> },
                        { id: "svelte", name: "Svelte", desc: "Vite App", color: "#ff3e00", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.067 2.25C15.343 2.25 13.7 2.915 12.5 4.1l-6.4 6.3c-1.4 1.4-1.4 3.6 0 5l1.6 1.6c1.4 1.4 3.6 1.4 5 0l1.7-1.7c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-1.7 1.7c-2 2-5.3 2-7.3 0l-1.6-1.6c-2-2-2-5.3 0-7.3l6.4-6.3c1.6-1.6 3.7-2.4 6-2.4 2.2 0 4.4.8 6 2.4 3.3 3.3 3.3 8.7 0 12l-.9.9c-.3.3-.8.3-1.1 0-.3-.3-.3-.8 0-1.1l.9-.9c2.7-2.7 2.7-7.1 0-9.8-1.4-1.4-3.2-2.1-5.2-2.1z"/><path d="M6.933 21.75c1.724 0 3.364-.665 4.567-1.85l6.4-6.3c1.4-1.4 1.4-3.6 0-5l-1.6-1.6c-1.4-1.4-3.6-1.4-5 0l-1.7 1.7c-.3.3-.8.3-1.1 0-.3-.3-.3-.8 0-1.1l1.7-1.7c2-2 5.3-2 7.3 0l1.6 1.6c2 2 2 5.3 0 7.3l-6.4 6.3c-1.6 1.6-3.7 2.4-6 2.4-2.2 0-4.4-.8-6-2.4-3.3-3.3-3.3-8.7 0-12l.9-.9c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-.9.9c-2.7 2.7-2.7 7.1 0 9.8 1.4 1.4 3.2 2.1 5.2 2.1z"/></svg> },
                        { id: "node", name: "Node.js", desc: "Express", color: "#339933", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7.7v8.6l10 5.7 10-5.7V7.7L12 2zm8 13.1l-8 4.6-8-4.6V8.9l8-4.6 8 4.6v6.2z"/><path d="M12 6.6L5.7 10v4l6.3 3.6 6.3-3.6v-4L12 6.6zm4.5 6.6L12 15.8l-4.5-2.6v-2.4l4.5-2.6 4.5 2.6v2.4z"/></svg> },
                        { id: "vanilla", name: "Vanilla", desc: "HTML / JS", color: "#f7df1e", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.5 2L4 21.5l8 2.5 8-2.5L21.5 2h-19zm15 4l-.5 4.5h-9l.5 3h8.5l-.5 4.5-4 1.5-4-1.5-.5-3.5h3l.5 1 2 .5 2-.5.5-1.5h-8.5l-1-9h11.5z"/></svg> }
                      ].map(t => (
                        <div
                          key={t.id}
                          onClick={() => setTemplate(t.id)}
                          className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center group ${
                            template === t.id 
                              ? "border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]" 
                              : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.15]"
                          }`}
                        >
                          {template === t.id && (
                            <div className="absolute top-1.5 right-1.5">
                              <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `${t.color}20`, color: t.color }}>
                            {t.icon}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-200">{t.name}</div>
                            <div className="text-[9px] text-slate-500 font-medium">{t.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[10px] text-slate-500">
                      Files will be saved in your browser's IndexedDB.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!roomName.trim()}
                    className="group relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-7 rounded-xl shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] active:scale-[0.97] transition-all duration-300 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Generate New Room
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-purple-950/25 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.18em]">Room ID</span>
                    </div>
                    <code className="text-purple-300 font-mono text-sm font-bold tracking-[0.12em] flex-1 select-all border-l border-slate-700 pl-3">
                      {roomId}
                    </code>
                    <button
                      onClick={handleCopyRoomId}
                      className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer shrink-0 ${
                        copied
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-700/40"
                          : "bg-white/[0.04] border-white/[0.1] text-slate-300 hover:text-white hover:border-white/[0.2]"
                      }`}
                    >
                      {copied ? (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1" /></svg>Copy ID</>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setRoomId("")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-400 transition cursor-pointer"
                  >
                    ↺ Regenerate room ID
                  </button>
                </div>
              )}
            </Card>

            {/* Join Room */}
            <Card delay={420} accentColor="blue" id="join">
              <div className="flex items-start gap-5 mb-6">
                <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/25 to-cyan-800/20 p-3.5 text-blue-400 shrink-0 shadow-[0_0_24px_rgba(59,130,246,0.18)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-white mb-1 tracking-tight">Join Existing Room</h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Enter the Room ID shared by your teammate to instantly connect to the collaborative editor.
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    id="join-room-input"
                    type="text"
                    placeholder="e.g. cfai-ab3d-9f2c"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    disabled={isJoining}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-slate-200 placeholder-slate-700 font-mono text-sm tracking-widest focus:outline-none focus:border-blue-500/60 focus:bg-blue-950/10 focus:ring-2 focus:ring-blue-500/15 transition duration-200"
                    required
                  />
                </div>
                <button
                  type="submit"
                  id="join-room-btn"
                  disabled={isJoining || !joinId.trim()}
                  className="group relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-7 rounded-xl shadow-[0_0_24px_rgba(6,182,212,0.25)] hover:shadow-[0_0_40px_rgba(6,182,212,0.45)] active:scale-[0.97] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-sm"
                >
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
                  {isJoining ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Connecting…</>
                  ) : (
                    <>Connect to Editor<svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                  )}
                </button>
              </form>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Profile */}
            <Card delay={370} accentColor="purple" noPad>
              {/* Header band with avatar */}
              <div className="relative px-6 pt-6 pb-6 border-b border-white/[0.06]">
                <div
                  className="absolute inset-0 rounded-t-2xl"
                  style={{ background: "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(124,58,237,0.35), rgba(79,70,229,0.10) 60%, transparent)" }}
                />
                <div className="relative flex items-center gap-4">
                  <div className="relative shrink-0">
                    <ProfileImage
                      src={user?.photoURL}
                      fallback={getInitials()}
                      alt={user?.displayName || "Avatar"}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-2xl text-lg"
                    />
                    {/* Online dot */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#030812] border-2 border-emerald-500 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-black text-white truncate tracking-tight text-base">{user?.displayName || "Developer"}</h4>
                    <p className="text-slate-500 text-xs truncate mt-0.5 mb-2">{user?.email}</p>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      ✓ Authorized
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-3">
                {[
                  { label: "Login Provider", value: user?.providerData?.[0]?.providerId === "google.com" ? "Google OAuth" : "Credentials" },
                  { label: "Session ID", value: `${user?.uid?.slice(0, 10)}…`, mono: true },
                  { label: "Plan", value: "Developer Beta" },
                  { label: "Region", value: "Global Edge" },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-slate-600 font-semibold">{label}</span>
                    <span className={`text-[11px] font-bold ${mono ? "font-mono text-purple-400 select-all" : "text-slate-300"} bg-white/[0.04] border border-white/[0.07] px-2.5 py-0.5 rounded-lg`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Status */}
            <Card delay={470} accentColor="none" noPad>
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">System Status</h3>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    All Operational
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {[
                    { label: "Sync Socket Server", status: "Active",  dotColor: "#10b981", bg: "rgba(16,185,129,0.06)" },
                    { label: "WebContainer Runtime", status: "Active",  dotColor: "#10b981", bg: "rgba(16,185,129,0.06)" },
                    { label: "Gemini-2.0-Flash",   status: "Ready",   dotColor: "#a855f7", bg: "rgba(168,85,247,0.06)" },
                    { label: "Firebase Auth",       status: "Online",  dotColor: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
                    { label: "Database Cluster",    status: "Online",  dotColor: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
                  ].map(({ label, status, dotColor, bg }) => (
                    <li
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-default group"
                      style={{ background: bg }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: dotColor }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: dotColor }} />
                        </span>
                        <span className="text-slate-300 text-[11px] font-semibold">{label}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ color: dotColor, background: `${dotColor}18` }}>{status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

          </div>
        </div>
          </>
        )}

        {activeTab === "Sessions" && (
          <SessionsTab handleJoinRoomShortcut={(id) => {
            setJoinId(id);
            setActiveTab("Dashboard");
            setTimeout(() => {
              const input = document.getElementById("join-room-input");
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }} />
        )}

        {activeTab === "AI Assist" && (
          <AIAssistTab />
        )}

        {activeTab === "Docs" && (
          <DocsTab />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-5 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>© 2025 CodeFusionAI — Real-time AI Pair Programming</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-purple-500 font-bold">v1.0 Beta</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
