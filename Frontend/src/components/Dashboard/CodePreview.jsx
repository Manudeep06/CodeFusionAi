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
    { tokens: [{ t: "  sandbox", c: "text-violet-300" }, { t: ": ", c: "text-slate-500" }, { t: "'webcontainer'", c: "text-emerald-400" }] },
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

export default CodePreview;
