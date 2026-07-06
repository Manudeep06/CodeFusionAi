import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "../../services/aiService";

export default function RoomAIAssist({ code, language, activeFileName, files }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your AI coding assistant. Ask me anything about your code, algorithms, or debugging. I have access to your active file!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const handleSend = async (customPrompt) => {
    const promptText = customPrompt || input.trim();
    if (!promptText || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: promptText }]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      // Build a smart context about the current workspace and code
      let promptWithContext = "";
      if (code && code.trim()) {
        const fileCount = files ? files.filter(f => !f.isFolder).length : 0;
        promptWithContext = `You are an expert AI pair-programming assistant inside the CodeFusionAI IDE.
Context:
- Active File: ${activeFileName || "unnamed"}
- Language: ${language || "plain text"}
- Workspace Files count: ${fileCount}

Here is the source code of the active file:
\`\`\`${language || ""}
${code}
\`\`\`

User query:
${promptText}

Please respond clearly and provide code suggestions if relevant.`;
      } else {
        promptWithContext = promptText;
      }

      // Incorporate conversation history context
      const historySlice = messages.slice(-4);
      let finalPrompt = promptWithContext;
      if (historySlice.length > 0) {
        let compiledHistory = "Recent Conversation Context:\n\n";
        historySlice.forEach((m) => {
          compiledHistory += `${m.role === "user" ? "User" : "Assistant"}: ${m.text}\n\n`;
        });
        compiledHistory += `Current Question:\n${promptWithContext}`;
        finalPrompt = compiledHistory;
      }

      const reply = await sendMessage(finalPrompt);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (error) {
      console.error("Room AI Assist Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Failed to generate AI response. Please check your network connection and API key configuration."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    { label: "💡 Explain this code", prompt: "Explain this code in detail and summarize what it does." },
    { label: "🔍 Find bugs", prompt: "Inspect this code for potential bugs, logical errors, or edge-case issues." },
    { label: "⚡ Optimize performance", prompt: "Analyze the time and space complexity of this code and suggest optimizations." },
    { label: "✍️ Add comments", prompt: "Refactor this code by adding descriptive inline comments and JSDoc/docstrings." }
  ];

  // Custom renderer for markdown in sidebar
  const markdownComponents = {
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match;
      return isInline ? (
        <code className="px-1 py-0.5 rounded bg-[#21262d]/60 font-mono text-[11px] text-[#ff7b72]" {...props}>
          {children}
        </code>
      ) : (
        <pre className="p-2 rounded bg-black/40 overflow-x-auto text-[11px] font-mono border border-[#30363d] my-1" {...props}>
          <code>{children}</code>
        </pre>
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Scroll container */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1.5 mb-0.5 select-none">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black"
                  style={{ background: "#21262d", color: "#fff" }}
                >✦</div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#a371f7]">AI</span>
              </div>
            )}
            <div
              className="max-w-full rounded-xl px-3 py-2 text-[12px] leading-relaxed break-words"
              style={{
                background: msg.role === "user" ? "#21262d" : "#1c2128",
                border: msg.role === "user" ? "1px solid #58a6ff30" : "1px solid #21262d",
                color: "#e6edf3",
              }}
            >
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-1 select-none">
            <div className="w-4 h-4 rounded flex items-center justify-center text-[8px]" style={{ background: "#21262d", color: "#fff" }}>✦</div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((j) => (
                <span
                  key={j}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#a371f7",
                    animation: `pulse 1s ${j * 0.2}s infinite`
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts Panel */}
      <div className="px-3 pb-2.5 flex flex-col gap-1.5 border-t border-[#21262d]/40 pt-2 shrink-0">
        <p className="text-[9px] uppercase tracking-widest font-black text-[#484f58] select-none">Quick Actions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {quickPrompts.map((item) => (
            <button
              key={item.label}
              disabled={loading || !code?.trim()}
              onClick={() => handleSend(item.prompt)}
              className="text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 border border-[#21262d] bg-[#1c2128] text-[#7d8590] cursor-pointer hover:border-[#a371f740] hover:text-[#e6edf3] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="px-3 pb-3 border-t border-[#21262d]/40 pt-2 shrink-0">
        <div
          className="flex items-end gap-2 rounded-xl p-2 border"
          style={{ background: "#0d1117", borderColor: "#30363d" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything... (Enter to send)"
            rows={2}
            disabled={loading}
            className="flex-1 bg-transparent outline-none resize-none text-[12px] leading-5 text-[#e6edf3] scrollbar-thin min-h-[40px] max-h-32"
            style={{ fontFamily: "system-ui, sans-serif" }}
          />
          <button
            disabled={!input.trim() || loading}
            onClick={() => handleSend()}
            className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-150 bg-[#21262d] text-[#484f58] hover:text-[#fff] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
