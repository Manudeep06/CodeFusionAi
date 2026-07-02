import { useState } from "react";
import { Card } from "../../pages/Dashboard";
import ArchitectureDiagram from "./ArchitectureDiagram";

export default function DocsTab() {
  const [selectedDocSection, setSelectedDocSection] = useState("overview");

  const sections = [
    { id: "overview", label: "System Overview", icon: "📖" },
    { id: "architecture", label: "Architecture Diagram", icon: "🏗️" },
    { id: "realtime", label: "Real-Time Sync Engine", icon: "⚡" },
    { id: "execution", label: "WASM Sandbox & Compilers", icon: "💻" },
    { id: "api", label: "API & Data Structures", icon: "🌐" },
  ];

  return (
    <div className="animate-card-enter grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* ─── Left Sidebar Navigation ───────────────────────────────────────── */}
      <div className="lg:col-span-1 space-y-4">
        <div className="p-2 rounded-2xl border border-white/[0.08] bg-[#090d16]/80 backdrop-blur-2xl shadow-xl">
          <div className="px-4 py-3.5 border-b border-white/[0.06] mb-3">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.15em]">Documentation</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">CodeFusionAI Core Spec</p>
          </div>
          
          <nav className="space-y-1.5">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedDocSection(sec.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-xs font-extrabold transition-all duration-300 cursor-pointer focus:outline-none relative overflow-hidden group ${
                  selectedDocSection === sec.id
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/25 shadow-md shadow-purple-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                {/* Active indicator bar */}
                {selectedDocSection === sec.id && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r" />
                )}
                <span className="text-sm select-none group-hover:scale-110 transition-transform duration-200">{sec.icon}</span>
                {sec.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Documentation Meta Card */}
        <Card accentColor="none" className="!p-5 bg-[#090d16]/80" delay={60}>
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Release Specs</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1.5 border-b border-white/[0.04]">
              <span>Doc Version</span>
              <span className="font-mono text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded text-[10px]">v1.2.0</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1.5 border-b border-white/[0.04]">
              <span>Last Checked</span>
              <span className="text-slate-300 font-semibold">July 2026</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Status</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Right Content Display ────────────────────────────────────────── */}
      <div className="lg:col-span-3">
        <Card accentColor="purple" className="min-h-[520px] bg-[#090d16]/60 backdrop-blur-2xl">
          
          {/* 1. SYSTEM OVERVIEW SECTION */}
          {selectedDocSection === "overview" && (
            <div className="space-y-8 animate-card-enter">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Section 1.0</span>
                <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight leading-none">System Overview</h2>
                <p className="text-slate-400 text-xs mt-2">Core design, targets, and operational features of the collaborative IDE.</p>
              </div>

              <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent" />

              <p className="text-slate-300 text-sm leading-relaxed">
                CodeFusionAI is a state-of-the-art, **AI-powered real-time collaborative workspace** designed for developer teams. It integrates client-side WebAssembly execution containers with cloud subprocess host compilers and Google Gemini AI, facilitating instant code synchronization and execution without any local software dependencies.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {/* Core features list */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-purple-500/20 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/[0.03] to-transparent rounded-bl-full pointer-events-none" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="text-purple-400">🔥</span> Core Functional Specs
                  </h4>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 font-bold shrink-0">✓</span>
                      <span>Bidirectional **Socket.io** workspace sync with version control locks.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 font-bold shrink-0">✓</span>
                      <span>**WebContainer VM** executes Node.js servers inside the browser.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 font-bold shrink-0">✓</span>
                      <span>**Multi-language sandbox** executes Python, C++, Java on backend subprocesses.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 font-bold shrink-0">✓</span>
                      <span>**Gemini AI Copilot** yields instant code refactoring, complexity audits, and logs explanations.</span>
                    </li>
                  </ul>
                </div>

                {/* Architecture targets */}
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-cyan-500/20 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/[0.03] to-transparent rounded-bl-full pointer-events-none" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="text-cyan-400">⚙️</span> Architecture Highlights
                  </h4>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold shrink-0">●</span>
                      <span>**Zero-Latency Sync**: Keystrokes propagate in sub-15ms via optimized Socket buffers.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold shrink-0">●</span>
                      <span>**Isolated Environments**: In-browser sandbox VMs prevent server host CPU abuse.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold shrink-0">●</span>
                      <span>**Fault Tolerant**: Persistent local IndexedDB structures prevent code loss during disconnection spikes.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 2. ARCHITECTURE DIAGRAM SECTION */}
          {selectedDocSection === "architecture" && (
            <div className="space-y-8 animate-card-enter">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Section 2.0</span>
                <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight leading-none">System Architecture</h2>
                <p className="text-slate-400 text-xs mt-2">Real-time pipeline routing diagram between clients, web sockets, database, and compilers.</p>
              </div>

              <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent" />

              <ArchitectureDiagram />

              <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <h4 className="text-xs font-black text-slate-300 uppercase mb-2">ℹ️ Technical Note on Client Isolation</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  To achieve absolute security when executing arbitrary user scripts, CodeFusionAI divides execution workloads. Standard web dev packages (React, Express, Vite) compile within the browser's WASM engine sandbox. Python and C++ compile on host server sub-processes inside dedicated temporary workspace caching folders, which are immediately swept and cleaned when users disconnect.
                </p>
              </div>
            </div>
          )}

          {/* 3. REAL-TIME SYNC ENGINE SECTION */}
          {selectedDocSection === "realtime" && (
            <div className="space-y-8 animate-card-enter">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Section 3.0</span>
                <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight leading-none">Sync Engine & Websockets</h2>
                <p className="text-slate-400 text-xs mt-2">Detailed flow specifications for real-time document synchronization and shared markers.</p>
              </div>

              <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent" />

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Event sequence list */}
                <div className="md:col-span-3 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Sync Pipeline Flow Steps</h3>
                  
                  <div className="space-y-3">
                    {[
                      { step: "01", title: "Keystroke Captured", desc: "User inputs change in Monaco Editor; frontend debounces buffer mutations." },
                      { step: "02", title: "Socket.IO Broadcast", desc: "Client sends 'code-change' message containing roomId and files array JSON." },
                      { step: "03", title: "Backend Disk Sync", desc: "Server writes workspace copy to os.tmpdir() workspace cache." },
                      { step: "04", title: "MongoDB Commits", desc: "Server updates room database logs throttled to prevent I/O blocking." },
                      { step: "05", title: "Peer Reconciliation", desc: "Peers receive 'receive-code' and patch editor viewports with zero cursor reset." }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                        <span className="text-xs font-black text-purple-400">{item.step}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                          <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side cursor explanation */}
                <div className="md:col-span-2 space-y-5">
                  <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/[0.02] relative overflow-hidden">
                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-2.5">👥 Presence & Cursors</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Collaborative cursors are tracked using low-overhead events. When a user shifts their cursor selection, coordinates are sent via:
                      <code className="block bg-black/50 text-[10px] text-purple-300 font-mono p-2 rounded mt-2.5">
                        socket.emit("cursor-change", &#123; roomId, position &#125;)
                      </code>
                      This creates colored markers matching each peer's user avatar inside Monaco's canvas lines.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">⚡ Debouncing Code Sync</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      To prevent Socket congestion during high-speed typing, the editor debounces workspace emissions. File serialization and database persistence checks trigger after a 300ms idle interval.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 4. WASM SANDBOX SECTION */}
          {selectedDocSection === "execution" && (
            <div className="space-y-8 animate-card-enter">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Section 4.0</span>
                <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight leading-none">Code Execution Sandboxes</h2>
                <p className="text-slate-400 text-xs mt-2">Differentiating client-side Webcontainers from native server subprocess compilation.</p>
              </div>

              <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent" />

              {/* Sandbox comparison table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Client Side WASM */}
                <div className="p-5 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.01] hover:bg-cyan-500/[0.02] transition duration-200">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">Client VM</span>
                    <span className="text-xs">⚡ WebContainers</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">In-Browser Node.js VM</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses WebAssembly binaries inside the browser sandbox to run commands. The virtual machine executes package dependencies (`npm install`), launches dev servers (React/Vue), and registers service worker proxies.
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>Performance: Native browser</span>
                    <span className="text-cyan-400">Node / React / Vite</span>
                  </div>
                </div>

                {/* Server Side Compilers */}
                <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.01] hover:bg-amber-500/[0.02] transition duration-200">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">Server Host</span>
                    <span className="text-xs">🖥️ Host Compilers</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Subprocess OS Compilers</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    For compiling script binaries (like Python, Java, C++), the backend runs a subprocess compile loop on the host OS, capturing output terminal buffers and error logs via system pipelines.
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>Performance: Server CPU</span>
                    <span className="text-amber-400">Python / C++ / Java</span>
                  </div>
                </div>

              </div>

              {/* COEP/COOP config banner */}
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#0c101a] relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-400" />
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-2.5">🛠️ WebContainer Header Setup</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  WebContainer APIs require SharedArrayBuffer memory threads. To authorize thread operations inside browser frames, servers must respond with explicit headers:
                </p>
                <div className="bg-black/50 p-3.5 rounded-xl mt-3 font-mono text-[10.5px] text-cyan-300 space-y-1">
                  <div>Cross-Origin-Embedder-Policy: require-corp</div>
                  <div>Cross-Origin-Opener-Policy: same-origin</div>
                </div>
              </div>
            </div>
          )}

          {/* 5. API SPEC & DATA MODELS SECTION */}
          {selectedDocSection === "api" && (
            <div className="space-y-8 animate-card-enter">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Section 5.0</span>
                <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight leading-none">Data Models & API Spec</h2>
                <p className="text-slate-400 text-xs mt-2">Mongoose schema details, database schemas, and endpoints specs.</p>
              </div>

              <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent" />

              <div className="space-y-6">
                
                {/* Schema Panel (VS Code style container) */}
                <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#05080f] shadow-xl">
                  {/* Fake VS Code Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01] text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      <span className="ml-2.5 text-slate-400">Room.js (Mongoose Schema)</span>
                    </div>
                    <span>JavaScript</span>
                  </div>
                  
                  <pre className="p-4 text-[10.5px] text-slate-400 font-mono overflow-x-auto leading-relaxed">
{`const RoomSchema = new Schema({
  roomId:     { type: String, required: true, unique: true },
  name:       { type: String, default: 'Untitled Project' },
  ownerId:    { type: String },
  template:   { type: String, default: 'react' },
  files:      { type: String }, // JSON stringified array of files
  lastActive: { type: Date, default: Date.now }
});`}
                  </pre>
                </div>

                {/* API Endpoint cards */}
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">📡 API endpoints</h4>
                  
                  <div className="space-y-3">
                    
                    {/* Endpoint 1 */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-purple-500/10 transition duration-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">POST</span>
                          <span className="font-mono text-xs font-bold text-white">/api/filesystem/folder</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1.5 leading-relaxed">Creates workspace subfolders inside server-side cache directories during folder setup.</p>
                      </div>
                      <div className="text-[10px] font-mono text-purple-400 bg-purple-500/5 border border-purple-500/10 px-3 py-1.5 rounded-lg select-all shrink-0">
                        Body: &#123; roomId, folderName &#125;
                      </div>
                    </div>

                    {/* Endpoint 2 */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-purple-500/10 transition duration-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">POST</span>
                          <span className="font-mono text-xs font-bold text-white">/api/execute</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1.5 leading-relaxed">Compiles and runs server host scripts (Python/Java/C++) capturing execution logs.</p>
                      </div>
                      <div className="text-[10px] font-mono text-purple-400 bg-purple-500/5 border border-purple-500/10 px-3 py-1.5 rounded-lg select-all shrink-0">
                        Body: &#123; language, code &#125;
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
