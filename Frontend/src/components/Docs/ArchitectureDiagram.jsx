import { useState } from "react";

export default function ArchitectureDiagram() {
  const [activeFlow, setActiveFlow] = useState("collab"); // collab, wasm, server
  const [hoveredNode, setHoveredNode] = useState(null);

  // Nodes metadata and detail specs
  const nodes = {
    monaco: {
      title: "Monaco Editor",
      role: "Code Input & Cursors",
      tech: "@monaco-editor/react",
      desc: "Captures code changes, selection blocks, and mouse cursor coordinates locally."
    },
    webcontainer: {
      title: "WebContainer VM",
      role: "WASM Node.js Sandbox",
      tech: "@webcontainer/api",
      desc: "Executes Node.js, npm installations, and React dev servers entirely in-browser."
    },
    xterm: {
      title: "Xterm Terminal",
      role: "Output shell console",
      tech: "xterm.js + fit-addon",
      desc: "Displays stdout streams and terminal build outputs for dev preview."
    },
    socketio: {
      title: "Socket.IO Gateway",
      role: "Real-time sync broker",
      tech: "WebSockets / rooms",
      desc: "Coordinates sub-second collaborative messages between room participants."
    },
    express: {
      title: "Express Backend",
      role: "Session Coordinator",
      tech: "Node.js + Express",
      desc: "Manages server-side cache mounting and registers execution REST endpoints."
    },
    mongodb: {
      title: "MongoDB Atlas",
      role: "Cloud Database",
      tech: "Mongoose + MongoDB",
      desc: "Stores project files structures, document versions, and metadata."
    },
    compilers: {
      title: "Host OS Compilers",
      role: "Native compiler engine",
      tech: "python / g++ / javac",
      desc: "Compiles and executes traditional scripts inside secure temporary folders."
    }
  };

  // Flow details & horizontal stages list
  const flows = {
    collab: {
      title: "Collaborative Sync Flow",
      badge: "Real-Time WebSocket Sync",
      theme: "purple",
      color: "#c084fc",
      glowId: "glow-purple",
      stages: ["1. Edit Monaco", "2. Emit WebSocket", "3. Server Broadcast", "4. Commit DB", "5. Update Peer View"]
    },
    wasm: {
      title: "Local WASM Run Flow",
      badge: "In-Browser Sandbox VM",
      theme: "cyan",
      color: "#22d3ee",
      glowId: "glow-cyan",
      stages: ["1. Run Triggered", "2. Mount WASM VM", "3. Execute npm dev", "4. Intercept Port", "5. Pipe Output Log"]
    },
    server: {
      title: "Server Compilers Flow",
      badge: "Backend Host Execution",
      theme: "amber",
      color: "#f59e0b",
      glowId: "glow-amber",
      stages: ["1. Script Compiled", "2. API POST Dispatch", "3. Write Temp File", "4. OS Subprocess", "5. Return Terminal Buffer"]
    }
  };

  const isLinkActive = (fromNode, toNode) => {
    if (activeFlow === "collab") {
      return (
        (fromNode === "monaco" && toNode === "socketio") ||
        (fromNode === "socketio" && toNode === "express") ||
        (fromNode === "express" && toNode === "mongodb")
      );
    }
    if (activeFlow === "wasm") {
      return (
        (fromNode === "monaco" && toNode === "webcontainer") ||
        (fromNode === "webcontainer" && toNode === "xterm")
      );
    }
    if (activeFlow === "server") {
      return (
        (fromNode === "monaco" && toNode === "socketio") ||
        (fromNode === "socketio" && toNode === "express") ||
        (fromNode === "express" && toNode === "compilers") ||
        (fromNode === "express" && toNode === "xterm")
      );
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* ─── Control Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-white/[0.08] bg-[#090d16]/80 backdrop-blur-xl">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Flow visualization pipeline</span>
          <h3 className="text-base font-black text-white mt-0.5">Visualizing System Execution</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {Object.entries(flows).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setActiveFlow(key)}
              className={`px-3 py-2 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer focus:outline-none ${
                activeFlow === key
                  ? "bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/35"
                  : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Unified Diagram Panel ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* SVG Diagram Canvas */}
        <div className="xl:col-span-3 relative border border-white/[0.08] rounded-2xl bg-[#020612] p-4 shadow-2xl overflow-hidden">
          <svg className="w-full h-auto" viewBox="0 0 900 440" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Drop-shadow glows */}
              <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Dynamic directional arrows */}
              <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#c084fc" />
              </marker>
              <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#22d3ee" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#334155" />
              </marker>
              
              {/* Gradients for flow nodes */}
              <linearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="gateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#083344" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#451a03" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Grid Pattern */}
            <g opacity="0.04">
              <path d="M 0 40 L 900 40 M 0 80 L 900 80 M 0 120 L 900 120 M 0 160 L 900 160 M 0 200 L 900 200 M 0 240 L 900 240 M 0 280 L 900 280 M 0 320 L 900 320 M 0 360 L 900 360 M 0 400 L 900 400" stroke="#fff" strokeWidth="1"/>
              <path d="M 100 0 L 100 440 M 200 0 L 200 440 M 300 0 L 300 440 M 400 0 L 400 440 M 500 0 L 500 440 M 600 0 L 600 440 M 700 0 L 700 440 M 800 0 L 800 440" stroke="#fff" strokeWidth="1"/>
            </g>

            {/* Columns labels */}
            <text x="150" y="30" fill="#475569" fontSize="9" fontWeight="black" textAnchor="middle" letterSpacing="2">BROWSER SANDBOX (CLIENT)</text>
            <text x="450" y="30" fill="#475569" fontSize="9" fontWeight="black" textAnchor="middle" letterSpacing="2">GATEWAY / ROUTING</text>
            <text x="750" y="30" fill="#475569" fontSize="9" fontWeight="black" textAnchor="middle" letterSpacing="2">SERVER CLUSTER</text>

            {/* ─── CONNECTIONS (PATHS WITH ARROWS) ────────────────────────── */}
            {/* Monaco <-> Socket.IO */}
            <path
              d="M 250 90 C 300 90, 300 140, 342 140"
              stroke={isLinkActive("monaco", "socketio") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("monaco", "socketio") ? "2.5" : "1.2"}
              filter={isLinkActive("monaco", "socketio") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("monaco", "socketio") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("monaco", "socketio") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="2.4s" repeatCount="indefinite" path="M 250 90 C 300 90, 300 140, 342 140" />
              </circle>
            )}

            {/* Socket.IO <-> Express */}
            <path
              d="M 450 180 L 450 252"
              stroke={isLinkActive("socketio", "express") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("socketio", "express") ? "2.5" : "1.2"}
              filter={isLinkActive("socketio", "express") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("socketio", "express") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("socketio", "express") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="1.6s" repeatCount="indefinite" path="M 450 180 L 450 252" />
              </circle>
            )}

            {/* Express <-> MongoDB */}
            <path
              d="M 550 300 C 600 300, 600 140, 642 140"
              stroke={isLinkActive("express", "mongodb") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("express", "mongodb") ? "2.5" : "1.2"}
              filter={isLinkActive("express", "mongodb") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("express", "mongodb") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("express", "mongodb") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="2.8s" repeatCount="indefinite" path="M 550 300 C 600 300, 600 140, 642 140" />
              </circle>
            )}

            {/* Express <-> Compilers */}
            <path
              d="M 550 300 L 642 300"
              stroke={isLinkActive("express", "compilers") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("express", "compilers") ? "2.5" : "1.2"}
              filter={isLinkActive("express", "compilers") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("express", "compilers") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("express", "compilers") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="1.8s" repeatCount="indefinite" path="M 550 300 L 642 300" />
              </circle>
            )}

            {/* Monaco <-> WebContainer */}
            <path
              d="M 150 130 L 150 172"
              stroke={isLinkActive("monaco", "webcontainer") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("monaco", "webcontainer") ? "2.5" : "1.2"}
              filter={isLinkActive("monaco", "webcontainer") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("monaco", "webcontainer") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("monaco", "webcontainer") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M 150 130 L 150 172" />
              </circle>
            )}

            {/* WebContainer <-> Xterm */}
            <path
              d="M 150 260 L 150 302"
              stroke={isLinkActive("webcontainer", "xterm") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("webcontainer", "xterm") ? "2.5" : "1.2"}
              filter={isLinkActive("webcontainer", "xterm") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("webcontainer", "xterm") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("webcontainer", "xterm") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M 150 260 L 150 302" />
              </circle>
            )}

            {/* Express -> Xterm (Run compiler output return) */}
            <path
              d="M 350 300 C 300 300, 300 350, 258 350"
              stroke={isLinkActive("express", "xterm") ? flows[activeFlow].color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLinkActive("express", "xterm") ? "2.5" : "1.2"}
              filter={isLinkActive("express", "xterm") ? `url(#${flows[activeFlow].glowId})` : ""}
              markerEnd={isLinkActive("express", "xterm") ? `url(#arrow-${flows[activeFlow].theme})` : "url(#arrow-gray)"}
            />
            {isLinkActive("express", "xterm") && (
              <circle r="4.5" fill={flows[activeFlow].color} filter={`url(#${flows[activeFlow].glowId})`}>
                <animateMotion dur="2.2s" repeatCount="indefinite" path="M 350 300 C 300 300, 300 350, 258 350" />
              </circle>
            )}

            {/* ─── NODE OVERLAYS (SVG GRAPHICS WITH NATIVE ICONS) ────────── */}
            
            {/* 1. MONACO EDITOR */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("monaco")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="50" y="50" width="200" height="80" rx="14" fill="url(#clientGrad)" stroke={hoveredNode === "monaco" ? "#c084fc" : "rgba(168,85,247,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="68" y="76" width="24" height="24" rx="6" fill="rgba(192,132,252,0.1)" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
              <path d="M 77 84 L 73 88 L 77 92 M 83 84 L 87 88 L 83 92" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="104" y="90" fill="#fff" fontSize="12" fontWeight="bold">Monaco Editor</text>
              <text x="104" y="104" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">@monaco-editor/react</text>
            </g>

            {/* 2. WEBCONTAINER VM */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("webcontainer")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="50" y="180" width="200" height="80" rx="14" fill="url(#clientGrad)" stroke={hoveredNode === "webcontainer" ? "#22d3ee" : "rgba(6,182,212,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="68" y="206" width="24" height="24" rx="6" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
              <path d="M 75 218 L 80 213 L 85 218 L 80 223 Z M 80 213 L 80 223 M 75 218 L 85 218" stroke="#22d3ee" strokeWidth="1.2" />
              <text x="104" y="220" fill="#fff" fontSize="12" fontWeight="bold">WebContainer VM</text>
              <text x="104" y="234" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">@webcontainer/api</text>
            </g>

            {/* 3. XTERM TERMINAL */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("xterm")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="50" y="310" width="200" height="80" rx="14" fill="url(#clientGrad)" stroke={hoveredNode === "xterm" ? "#cbd5e1" : "rgba(148,163,184,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="68" y="336" width="24" height="24" rx="6" fill="rgba(203,213,225,0.1)" stroke="rgba(203,213,225,0.3)" strokeWidth="1" />
              <path d="M 74 345 L 78 348 L 74 351 M 80 351 L 86 351" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
              <text x="104" y="350" fill="#fff" fontSize="12" fontWeight="bold">Xterm Terminal</text>
              <text x="104" y="364" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">xterm.js + fit-addon</text>
            </g>

            {/* 4. SOCKET.IO GATEWAY */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("socketio")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="350" y="100" width="200" height="80" rx="14" fill="url(#gateGrad)" stroke={hoveredNode === "socketio" ? "#22d3ee" : "rgba(6,182,212,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="368" y="126" width="24" height="24" rx="6" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
              <circle cx="376" cy="138" r="3" stroke="#22d3ee" strokeWidth="1.5" />
              <circle cx="384" cy="138" r="3" stroke="#22d3ee" strokeWidth="1.5" />
              <path d="M 379 138 L 381 138" stroke="#22d3ee" strokeWidth="1.5" />
              <text x="404" y="140" fill="#fff" fontSize="12" fontWeight="bold">Socket.IO Gateway</text>
              <text x="404" y="154" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">SOCKET.IO ROOMS</text>
            </g>

            {/* 5. EXPRESS SERVER */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("express")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="350" y="260" width="200" height="80" rx="14" fill="url(#gateGrad)" stroke={hoveredNode === "express" ? "#818cf8" : "rgba(129,140,248,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="368" y="286" width="24" height="24" rx="6" fill="rgba(129,140,248,0.1)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
              <circle cx="380" cy="298" r="5" stroke="#818cf8" strokeWidth="1.5" />
              <path d="M 380 290 L 380 293 M 380 303 L 380 306 M 372 298 L 375 298 M 385 298 L 388 298" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
              <text x="404" y="300" fill="#fff" fontSize="12" fontWeight="bold">Express Backend</text>
              <text x="404" y="314" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">NODE.JS + EXPRESS</text>
            </g>

            {/* 6. MONGODB DATABASE */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("mongodb")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="650" y="100" width="200" height="80" rx="14" fill="url(#dbGrad)" stroke={hoveredNode === "mongodb" ? "#34d399" : "rgba(52,211,153,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="668" y="126" width="24" height="24" rx="6" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" />
              <ellipse cx="680" cy="134" rx="5" ry="2" stroke="#34d399" strokeWidth="1.2" />
              <path d="M 675 134 L 675 142 C 675 145, 685 145, 685 142 L 685 134" stroke="#34d399" strokeWidth="1.2" />
              <text x="704" y="140" fill="#fff" fontSize="12" fontWeight="bold">MongoDB Atlas</text>
              <text x="704" y="154" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">PERSISTENT MONGOOSE</text>
            </g>

            {/* 7. OS COMPILERS */}
            <g
              cursor="pointer"
              onMouseEnter={() => setHoveredNode("compilers")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <rect x="650" y="260" width="200" height="80" rx="14" fill="url(#dbGrad)" stroke={hoveredNode === "compilers" ? "#fbbf24" : "rgba(251,191,36,0.25)"} strokeWidth="1.5" />
              {/* Icon */}
              <rect x="668" y="286" width="24" height="24" rx="6" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
              <rect x="672" y="291" width="16" height="13" rx="2" stroke="#fbbf24" strokeWidth="1.2" />
              <path d="M 676 298 L 684 298" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="704" y="300" fill="#fff" fontSize="12" fontWeight="bold">Host OS Compilers</text>
              <text x="704" y="314" fill="#64748b" fontSize="8" fontWeight="bold" letterSpacing="0.5">SUBPROCESS EXEC</text>
            </g>

          </svg>
        </div>

        {/* ─── Detail Sidebar Inspector ──────────────────────────────────────── */}
        <div className="xl:col-span-1 flex flex-col justify-between p-5 rounded-2xl border border-white/[0.08] bg-[#090d16]/80 backdrop-blur-xl min-h-[440px] shadow-xl">
          <div>
            <div className="pb-3 border-b border-white/[0.06] mb-4">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Flow Details</span>
              <h4 className="text-sm font-black text-white mt-0.5">{flows[activeFlow].title}</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              {flows[activeFlow].desc}
            </p>

            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Flow Status</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: flows[activeFlow].color }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: flows[activeFlow].color }} />
                </span>
                <span className="text-xs text-white font-semibold">Active simulation running</span>
              </div>
            </div>
          </div>

          {/* Node detail tooltip */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-purple-600 to-indigo-600 rounded" />
            {hoveredNode ? (
              <div className="pl-3 animate-card-enter">
                <h5 className="text-[11px] font-black text-white uppercase tracking-wider">{nodes[hoveredNode].title}</h5>
                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{nodes[hoveredNode].role}</span>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{nodes[hoveredNode].desc}</p>
                <div className="inline-flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-[8px] text-purple-400 font-mono mt-2 font-semibold">
                  Tech: {nodes[hoveredNode].tech}
                </div>
              </div>
            ) : (
              <div className="pl-3 text-slate-500 text-[10px] italic leading-tight">
                💡 Hover over any box in the architecture canvas above to inspect its description and technical spec.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── Stage steps bar at bottom (Legend / Timeline) ──────────────────── */}
      <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#090d16]/80 backdrop-blur-xl shadow-xl">
        <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block mb-4">Pipeline Step-by-Step Sequence</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {flows[activeFlow].stages.map((stage, idx) => (
            <div key={idx} className="relative p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] flex flex-col justify-between min-h-[60px]">
              {/* Connector line between cards */}
              {idx < 4 && (
                <div className="hidden md:block absolute top-1/2 -right-2.5 w-5 h-px bg-white/[0.06] z-10" />
              )}
              <span className="text-[9px] font-bold text-slate-600 uppercase">Stage 0{idx + 1}</span>
              <span className="text-[11px] font-extrabold text-slate-200 mt-1 leading-tight">{stage.slice(3)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
