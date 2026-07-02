import { useState, useRef, useEffect } from "react";
import { Card } from "../../pages/Dashboard";

export default function AIAssistTab() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Welcome to CodeFusionAI Copilot Hub! Ask me any programming question, request templates, or explore details about the system's architecture." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let reply = "";
      if (text.toLowerCase().includes("architect") || text.toLowerCase().includes("design")) {
        reply = "CodeFusionAI architecture is designed as a secure, distributed development network. The core execution sandbox uses **WebContainers** for client-side sandboxing, preventing malicious scripts from compromising the main backend host system. Real-time document collaboration uses **Socket.IO** rooms synchronizing file buffers back to a persistent **MongoDB Atlas** NoSQL database.";
      } else if (text.toLowerCase().includes("template") || text.toLowerCase().includes("react")) {
        reply = "You can bootstrap a project using React (Vite-based), Vue (Vite-based), Svelte (Vite-based), Vanilla JS, or Node.js. Select a template on the Dashboard, name the project, and click 'Create Room'. The system initializes files into browser IndexedDB and syncs them automatically.";
      } else {
        reply = `I see you are interested in "${text}". CodeFusionAI supports hot-reloaded dev servers, package installs, and secure script terminals. Feel free to spin up a collaborative room to start pair-programming with your team!`;
      }
      
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 1000);
  };

  return (
    <div className="animate-card-enter max-w-3xl mx-auto">
      <Card accentColor="purple" className="flex flex-col h-[550px] !p-0 overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-purple-500/20">
              AI
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">Copilot Assistant</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Gemini-2.0-Flash</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            AI Ready
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-start gap-3`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 select-none">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-purple-600 text-white font-medium rounded-tr-none shadow-[0_4px_16px_rgba(147,51,234,0.15)]"
                    : "bg-white/[0.03] border border-white/[0.06] text-slate-300 rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 select-none">
                AI
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/30 p-2 focus-within:border-purple-500/40 transition duration-200">
            <input
              type="text"
              placeholder="Ask anything about CodeFusionAI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-transparent border-none outline-none text-slate-200 text-xs px-2"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
