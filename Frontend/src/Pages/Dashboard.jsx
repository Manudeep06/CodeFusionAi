import { useState, useEffect, useRef, useCallback } from "react";
import { logout } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";

/* ─── Interactive Parallax Background ─────────────────────────────────────── */
function InteractiveBg() {
  const spotRef = useRef(null);
  const orbRef1 = useRef(null);
  const orbRef2 = useRef(null);
  const orbRef3 = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const { clientX: x, clientY: y } = e;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const px = (x / w - 0.5) * 2;   // -1 to 1
    const py = (y / h - 0.5) * 2;

    if (spotRef.current) {
      spotRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(120,60,255,0.10), transparent 70%)`;
    }
    if (orbRef1.current) {
      orbRef1.current.style.transform = `translate(${px * 30}px, ${py * 20}px)`;
    }
    if (orbRef2.current) {
      orbRef2.current.style.transform = `translate(${px * -20}px, ${py * -15}px)`;
    }
    if (orbRef3.current) {
      orbRef3.current.style.transform = `translate(${px * 15}px, ${py * 25}px)`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Fine dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Coarse accent grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)",
          backgroundSize: "112px 112px",
        }}
      />

      {/* Top aurora bloom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 60% at 50% -8%, rgba(109,40,217,0.24) 0%, rgba(79,70,229,0.10) 45%, transparent 70%)",
        }}
      />
      {/* Bottom horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 28% at 50% 108%, rgba(37,99,235,0.16) 0%, transparent 70%)",
        }}
      />

      {/* Parallax Orb 1 — main purple */}
      <div
        ref={orbRef1}
        className="animate-orb absolute rounded-full blur-[140px] transition-transform duration-[1200ms] ease-out"
        style={{
          width: 680, height: 680,
          top: "-18%", left: "5%",
          background: "radial-gradient(circle, rgba(124,58,237,0.42) 0%, rgba(79,70,229,0.22) 50%, transparent 80%)",
        }}
      />
      {/* Parallax Orb 2 — deep blue */}
      <div
        ref={orbRef2}
        className="animate-orb-slow absolute rounded-full blur-[160px] transition-transform duration-[1400ms] ease-out"
        style={{
          width: 560, height: 560,
          bottom: "-8%", right: "2%",
          background: "radial-gradient(circle, rgba(37,99,235,0.32) 0%, rgba(8,145,178,0.18) 50%, transparent 80%)",
        }}
      />
      {/* Parallax Orb 3 — pink/violet */}
      <div
        ref={orbRef3}
        className="animate-orb-med absolute rounded-full blur-[120px] transition-transform duration-[1000ms] ease-out"
        style={{
          width: 400, height: 400,
          top: "32%", left: "50%",
          background: "radial-gradient(circle, rgba(219,39,119,0.28) 0%, rgba(147,51,234,0.18) 55%, transparent 80%)",
        }}
      />
      {/* Orb 4 — teal accent */}
      <div
        className="animate-orb absolute rounded-full blur-[90px]"
        style={{
          width: 240, height: 240,
          top: "58%", left: "12%",
          background: "radial-gradient(circle, rgba(20,184,166,0.22) 0%, transparent 75%)",
          animationDelay: "-9s",
        }}
      />
      {/* Orb 5 — indigo mid */}
      <div
        className="animate-orb-slow absolute rounded-full blur-[100px]"
        style={{
          width: 300, height: 300,
          top: "18%", right: "18%",
          background: "radial-gradient(circle, rgba(99,102,241,0.26) 0%, transparent 75%)",
          animationDelay: "-5s",
        }}
      />

      {/* Mouse spotlight */}
      <div ref={spotRef} className="absolute inset-0 transition-[background] duration-200" />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(3,8,18,0.75) 100%)",
        }}
      />
    </div>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────────────── */
function Card({ children, className = "", delay = 0, accentColor = "purple", noPad = false }) {
  const glows = {
    purple: "hover:border-purple-500/35 hover:shadow-[0_0_70px_-10px_rgba(168,85,247,0.45)]",
    blue:   "hover:border-blue-500/35   hover:shadow-[0_0_70px_-10px_rgba(59,130,246,0.45)]",
    none:   "hover:border-white/[0.12]",
  };
  const topEdge = {
    purple: "via-purple-400/60",
    blue:   "via-blue-400/60",
    none:   "via-white/12",
  };
  const cornerGlow = {
    purple: "from-purple-500/[0.08]",
    blue:   "from-blue-500/[0.08]",
    none:   "from-white/[0.03]",
  };
  return (
    <div
      className={`animate-card-enter relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-white/[0.02] to-transparent backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-500 group ${glows[accentColor] ?? glows.purple} ${noPad ? "" : "p-6 md:p-8"} ${className}`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      {/* Top prismatic line */}
      <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${topEdge[accentColor]} to-transparent`} />
      {/* Corner radiance */}
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${cornerGlow[accentColor]} to-transparent rounded-bl-full pointer-events-none`} />
      {children}
    </div>
  );
}

/* ─── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, colorClass, glowHex, barWidth = "60%", delay = 0 }) {
  return (
    <div
      className="animate-card-enter relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-xl p-5 hover:scale-[1.04] hover:border-white/[0.15] transition-all duration-300 cursor-default group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* Corner bg glow */}
      <div
        className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
        style={{ background: glowHex }}
      />
      {/* Icon pill */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg"
          style={{ background: `${glowHex}28`, color: glowHex, boxShadow: `0 0 12px ${glowHex}40` }}
        >
          {icon}
        </div>
      </div>
      {/* Value */}
      <div className={`text-[1.65rem] font-black font-mono leading-none ${colorClass} mb-1`}>{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-3">{sub}</div>
      {/* Progress bar */}
      <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: barWidth, background: `linear-gradient(90deg, ${glowHex}80, ${glowHex})` }}
        />
      </div>
    </div>
  );
}

/* ─── Live Code Preview ─────────────────────────────────────────────────────── */
function CodePreview() {
  const lines = [
    { tokens: [{ t: "// CodeFusionAI — real-time collab engine", c: "text-slate-600 italic" }] },
    { tokens: [] },
    { tokens: [{ t: "import", c: "text-pink-400 font-semibold" }, { t: " { socket, ai } ", c: "text-slate-300" }, { t: "from", c: "text-pink-400 font-semibold" }, { t: " 'codefusion-sdk'", c: "text-emerald-400" }] },
    { tokens: [] },
    { tokens: [{ t: "const", c: "text-pink-400 font-semibold" }, { t: " room ", c: "text-sky-300" }, { t: "=", c: "text-slate-400" }, { t: " await ", c: "text-pink-400 font-semibold" }, { t: "socket", c: "text-slate-300" }, { t: ".", c: "text-slate-500" }, { t: "create", c: "text-blue-300" }, { t: "({" , c: "text-slate-400" }] },
    { tokens: [{ t: "  model", c: "text-violet-300" }, { t: ": ", c: "text-slate-500" }, { t: "'gemini-2.0-flash'", c: "text-emerald-400" }, { t: ",", c: "text-slate-500" }] },
    { tokens: [{ t: "  collab", c: "text-violet-300" }, { t: ": ", c: "text-slate-500" }, { t: "true", c: "text-orange-400" }, { t: ",", c: "text-slate-500" }] },
    { tokens: [{ t: "  sync", c: "text-violet-300" }, { t: ": ", c: "text-slate-500" }, { t: "'crdt'", c: "text-emerald-400" }, { t: ",", c: "text-slate-500" }] },
    { tokens: [{ t: "  sandbox", c: "text-violet-300" }, { t: ": ", c: "text-slate-500" }, { t: "'judge0'", c: "text-emerald-400" }] },
    { tokens: [{ t: "})", c: "text-slate-400" }] },
    { tokens: [] },
    { tokens: [{ t: "await", c: "text-pink-400 font-semibold" }, { t: " room", c: "text-sky-300" }, { t: ".", c: "text-slate-500" }, { t: "invite", c: "text-blue-300" }, { t: "(collaborators)", c: "text-slate-400" }] },
  ];

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ background: "linear-gradient(160deg, #0d1117 0%, #0a0e17 100%)" }}>
      {/* Traffic lights + tabs */}
      <div className="flex items-center gap-0 border-b border-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_6px_#ff5f5780]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-[0_0_6px_#febc2e80]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-[0_0_6px_#28c84080]" />
        </div>
        {/* Tabs */}
        <div className="flex items-end gap-0 ml-2 text-[10px] font-mono">
          <div className="px-4 py-2 border-b-2 border-purple-400 text-slate-300 bg-white/[0.04] -mb-px">main.js</div>
          <div className="px-4 py-2 text-slate-600 hover:text-slate-500 transition-colors">room.config.ts</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-4">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[9px] text-emerald-400 font-black tracking-widest">LIVE SYNC</span>
        </div>
      </div>
      {/* Code area */}
      <div className="flex">
        {/* Gutter */}
        <div className="py-4 px-3 border-r border-white/[0.05] select-none" style={{ background: "rgba(0,0,0,0.15)" }}>
          {lines.map((_, i) => (
            <div key={i} className="text-[10px] text-slate-700 font-mono leading-6 text-right">{i + 1}</div>
          ))}
          <div className="text-[10px] text-slate-700 font-mono leading-6 text-right">{lines.length + 1}</div>
        </div>
        {/* Lines */}
        <div className="px-4 py-4 font-mono text-[11.5px] leading-6 select-none flex-1">
          {lines.map((line, i) => (
            <div key={i} className={`${i === 4 ? "bg-purple-500/[0.07] -mx-4 px-4 rounded" : ""}`}>
              {line.tokens.length === 0
                ? <>&nbsp;</>
                : line.tokens.map((tok, j) => <span key={j} className={tok.c}>{tok.t}</span>)
              }
            </div>
          ))}
          {/* Cursor */}
          <div>
            <span className="inline-block w-[7px] h-[13px] bg-purple-400 opacity-90 animate-blink rounded-[1px] align-middle" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────────────── */
function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId]       = useState("");
  const [joinId, setJoinId]       = useState("");
  const [copied, setCopied]       = useState(false);
  const [isJoining, setIsJoining] = useState(false);

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
    try { await logout(); navigate("/"); }
    catch (e) { console.error(e); }
  };

  const handleCreateRoom = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    const seg = (n) =>
      Array.from(
        { length: n },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");

    const newRoomId = `cfai-${seg(4)}-${seg(4)}`;

    setRoomId(newRoomId);

    socket.emit("create-room", newRoomId);

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

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
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
            {["Dashboard", "Sessions", "AI Assist", "Docs"].map((item, i) => (
              <span
                key={item}
                className={`px-3.5 py-1.5 rounded-lg cursor-default transition-all duration-150 ${
                  i === 0
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                {item}
              </span>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full pl-2.5 pr-4 py-1.5">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[8px] font-black text-white">
                  {getInitials()}
                </div>
              )}
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

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── HERO — Two column layout ─────────────────────────────────────── */}
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
                { label: "Judge0 Sandbox",   color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
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
                onClick={handleCreateRoom}
                className="group relative overflow-hidden flex items-center gap-2.5 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.40)] hover:shadow-[0_0_50px_rgba(168,85,247,0.65)] active:scale-[0.97] transition-all duration-300 cursor-pointer text-sm"
              >
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create New Room
              </button>
              <a
                href="#join"
                className="flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.09] hover:border-purple-500/30 text-slate-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                Join Session
              </a>
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
              {/* LIVE badge */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
              {/* AI chip */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2.5 border border-white/[0.12] rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ background: "rgba(13,17,23,0.9)" }}>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-lg shadow-purple-500/30">
                  AI
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-300 leading-none mb-0.5">Gemini Copilot</div>
                  <div className="text-[9px] text-emerald-400 font-bold">● Typing suggestions active</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12 select-none">
          <StatCard label="Sync Latency"  value="~12ms"                       sub="Websockets Active"  icon="⚡"   colorClass="text-emerald-400" glowHex="#10b981" barWidth="85%" delay={0}   />
          <StatCard label="Active Rooms"  value={roomId ? "1 / 5" : "0 / 5"} sub="Developer Capacity" icon="◈"   colorClass="text-violet-400"  glowHex="#8b5cf6" barWidth={roomId ? "20%" : "5%"} delay={80}  />
          <StatCard label="AI Copilot"    value="Ready"                       sub="Gemini-2.0-Flash"   icon="✦"   colorClass="text-fuchsia-400" glowHex="#ec4899" barWidth="100%" delay={160} />
          <StatCard label="Compilers"     value="4 Engines"                   sub="Judge0 Sandbox"     icon="</>" colorClass="text-cyan-400"    glowHex="#06b6d4" barWidth="75%" delay={240} />
        </div>

        {/* ── Main Grid ────────────────────────────────────────────────────── */}
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
                <button
                  onClick={handleCreateRoom}
                  className="group relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-7 rounded-xl shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] active:scale-[0.97] transition-all duration-300 cursor-pointer text-sm"
                >
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Generate New Room
                </button>
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
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>Copy ID</>
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

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
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
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "Avatar"}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-2xl"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-2xl shadow-purple-900/50">
                        {getInitials()}
                      </div>
                    )}
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
                    { label: "Judge0 Sandboxes",   status: "Active",  dotColor: "#10b981", bg: "rgba(16,185,129,0.06)" },
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
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
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