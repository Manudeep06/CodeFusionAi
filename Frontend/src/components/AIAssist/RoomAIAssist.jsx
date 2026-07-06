import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "../../services/aiService";

function CodeBlock({ code, language, onApply }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-lg overflow-hidden border border-[#30363d] bg-black/35 font-mono text-[11px] shadow-sm w-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1c2128] border-b border-[#30363d] text-[10px] text-[#7d8590] select-none">
        <span className="font-bold uppercase tracking-wider">{language || "code"}</span>
        <div className="flex items-center gap-2.5">
          {onApply && (
            <button
              onClick={() => onApply(code)}
              className="flex items-center gap-1 text-[#58a6ff] hover:text-[#79c0ff] transition duration-150 cursor-pointer font-bold"
              title="Replace entire active file content with this code"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Apply</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-[#e6edf3] transition duration-150 cursor-pointer"
          >
            {copied ? (
              <span className="text-[#3fb950] font-bold">Copied</span>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed text-[#e6edf3] scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function RoomAIAssist({ code, language, activeFileName, files, onApplyCode, selectedCode, roomTheme, onThemeChange }) {
  const { roomId } = useParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef(null);

  const activeTheme = roomTheme || "dark";

  // Load room-specific chats from localStorage
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem(`codefusionai_room_chats_${roomId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing room chats", e);
      }
    }
    // Default chat
    return [
      {
        id: Date.now(),
        title: "New Chat",
        messages: [
          {
            role: "assistant",
            text: "Hi! I'm your AI coding assistant. Ask me anything about your code, algorithms, or debugging. I have access to your active file!"
          }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => chats[0].id);

  // Sync chats to localStorage helper
  const saveChats = (updatedChats) => {
    localStorage.setItem(`codefusionai_room_chats_${roomId}`, JSON.stringify(updatedChats));
  };

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  useEffect(() => {
    if (!showHistory) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading, showHistory]);

  const handleSend = async (customPrompt) => {
    const promptText = customPrompt || input.trim();
    if (!promptText || loading) return;

    const userMessage = { role: "user", text: promptText };
    
    // Add user message locally
    let updatedChats = chats.map(c => {
      if (c.id === activeChatId) {
        const isNew = c.title === "New Chat" && c.messages.length <= 1;
        const newTitle = isNew ? (promptText.slice(0, 30) + (promptText.length > 30 ? "..." : "")) : c.title;
        return {
          ...c,
          title: newTitle,
          messages: [...c.messages, userMessage]
        };
      }
      return c;
    });

    setChats(updatedChats);
    saveChats(updatedChats);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      // Build a smart context about the current workspace and code
      let promptWithContext = "";
      if (selectedCode && selectedCode.trim()) {
        const fileCount = files ? files.filter(f => !f.isFolder).length : 0;
        promptWithContext = `You are an expert AI pair-programming assistant inside the CodeFusionAI IDE.
Context:
- Active File: ${activeFileName || "unnamed"}
- Language: ${language || "plain text"}
- Workspace Files count: ${fileCount}

The user has highlighted/selected the following section of code in the editor:
\`\`\`${language || ""}
${selectedCode}
\`\`\`

User query regarding the highlighted code snippet above:
${promptText}

Please focus your suggestions on the highlighted selection, answer their question, and provide code blocks if relevant.`;
      } else if (code && code.trim()) {
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
      const assistantMessage = { role: "assistant", text: reply };

      const replyChats = updatedChats.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage]
          };
        }
        return c;
      });

      setChats(replyChats);
      saveChats(replyChats);
    } catch (error) {
      console.error("Room AI Assist Error:", error);
      const errorMessage = {
        role: "assistant",
        text: "Failed to generate AI response. Please check your network connection and API key configuration."
      };
      const errorChats = updatedChats.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, errorMessage]
          };
        }
        return c;
      });
      setChats(errorChats);
      saveChats(errorChats);
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

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [
        {
          role: "assistant",
          text: "Hi! Started a new conversation. How can I help you with this file?"
        }
      ],
      createdAt: new Date().toISOString()
    };
    const updated = [newChat, ...chats];
    setChats(updated);
    setActiveChatId(newChat.id);
    saveChats(updated);
    setShowHistory(false);
  };

  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    let updated = chats.filter(c => c.id !== id);
    if (updated.length === 0) {
      const defaultChat = {
        id: Date.now(),
        title: "New Chat",
        messages: [
          { role: "assistant", text: "Hi! I'm your AI coding assistant..." }
        ],
        createdAt: new Date().toISOString()
      };
      updated = [defaultChat];
    }
    setChats(updated);
    saveChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated[0].id);
    }
  };

  const quickPrompts = [
    { label: "💡 Explain code", prompt: "Explain this code in detail and summarize what it does." },
    { label: "🔍 Find bugs", prompt: "Inspect this code for potential bugs, logical errors, or edge-case issues." },
    { label: "⚡ Optimize performance", prompt: "Analyze the time and space complexity of this code and suggest optimizations." },
    { label: "✍️ Add comments", prompt: "Refactor this code by adding descriptive inline comments and JSDoc/docstrings." }
  ];

  // Custom renderer for markdown in sidebar
  const markdownComponents = {
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match;
      const codeText = String(children).replace(/\n$/, "");
      
      if (isInline) {
        return (
          <code className="px-1 py-0.5 rounded bg-[#21262d]/60 font-mono text-[11px] text-[#ff7b72]" {...props}>
            {children}
          </code>
        );
      }
      
      return (
        <CodeBlock 
          code={codeText} 
          language={match[1]} 
          onApply={onApplyCode} 
        />
      );
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden theme-${activeTheme}`}
      style={{
        backgroundColor: "var(--ai-bg)",
        color: "var(--ai-text)",
        fontFamily: "var(--ai-font, sans-serif)",
      }}
    >
      {/* Local styles for theme mapping */}
      <style>{`
        .theme-dark {
          --ai-bg: #1c2128;
          --ai-sidebar-bg: #141920;
          --ai-text: #e6edf3;
          --ai-text-muted: #7d8590;
          --ai-accent: #a371f7;
          --ai-border: #21262d;
          --ai-msg-user: #21262d;
          --ai-msg-user-text: #e6edf3;
          --ai-msg-ai: #141920;
          --ai-msg-ai-text: #e6edf3;
          --ai-input-bg: #0d1117;
          --ai-font: system-ui, sans-serif;
        }

        .theme-light {
          --vs-hover: rgba(0, 0, 0, 0.03);
          --ai-bg: #faf9f6;
          --ai-sidebar-bg: #f4f3ee;
          --ai-text: #0f172a;
          --ai-text-muted: #475569;
          --ai-accent: #4f46e5;
          --ai-border: rgba(0, 0, 0, 0.08);
          --ai-msg-user: linear-gradient(135deg, #6366f1, #4f46e5);
          --ai-msg-user-text: #ffffff;
          --ai-msg-ai: #ffffff;
          --ai-msg-ai-text: #0f172a;
          --ai-input-bg: #ffffff;
          --ai-font: 'Outfit', 'Inter', system-ui, sans-serif;
        }

        /* Ruled bullet-journal dot grid in Light Mode */
        .theme-light .bg-notebook-pattern {
          background-color: #faf9f6 !important;
          background-image: radial-gradient(rgba(0, 0, 0, 0.04) 1.2px, transparent 1.2px) !important;
          background-size: 18px 18px !important;
          background-attachment: local;
        }
      `}</style>

      {/* Mini header for controls */}
      <div 
        className="px-3 py-2 border-b flex items-center justify-between select-none shrink-0"
        style={{
          backgroundColor: "var(--ai-sidebar-bg)",
          borderColor: "var(--ai-border)"
        }}
      >
        {/* Left - Toggle History */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition duration-150 cursor-pointer border hover:opacity-85"
          style={{
            color: showHistory ? "var(--ai-accent)" : "var(--ai-text)",
            borderColor: showHistory ? "var(--ai-accent)" : "var(--ai-border)",
            backgroundColor: "rgba(0,0,0,0.03)"
          }}
          title="Toggle Chat History List"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>History</span>
        </button>

        {/* Center - Start New Chat */}
        <button
          onClick={handleNewChat}
          className="px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition duration-150 cursor-pointer border hover:opacity-85"
          style={{
            color: "var(--ai-accent)",
            borderColor: "var(--ai-border)",
            backgroundColor: "rgba(0,0,0,0.03)"
          }}
          title="Start new conversation"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Chat</span>
        </button>

        {/* Right - Toggle Theme */}
        <button
          onClick={() => {
            const nextTheme = activeTheme === "dark" ? "light" : "dark";
            if (onThemeChange) {
              onThemeChange(nextTheme);
            }
          }}
          className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition duration-150 cursor-pointer border hover:opacity-85"
          style={{
            color: "var(--ai-text)",
            borderColor: "var(--ai-border)",
            backgroundColor: "rgba(0,0,0,0.03)"
          }}
        >
          <span>{activeTheme === "dark" ? "🌙" : "☀️"}</span>
        </button>
      </div>

      {showHistory ? (
        /* Render History List View */
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 scrollbar-thin">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1 select-none">Past Conversations</p>
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setActiveChatId(c.id);
                setShowHistory(false);
              }}
              className="group relative flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 cursor-pointer"
              style={{
                background: c.id === activeChatId ? "var(--ai-sidebar-bg)" : "rgba(0,0,0,0.01)",
                borderColor: c.id === activeChatId ? "var(--ai-accent)" : "var(--ai-border)",
              }}
            >
              <div className="flex flex-col min-w-0 flex-1 pr-4">
                <span 
                  className="text-[12px] truncate font-bold"
                  style={{ color: c.id === activeChatId ? "var(--ai-accent)" : "var(--ai-text)" }}
                >
                  {c.title}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 select-none">
                  {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <button
                onClick={(e) => handleDeleteChat(c.id, e)}
                className="p-1 rounded text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                title="Delete Chat"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Render Active Chat View */
        <>
          {/* Messages Scroll container */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 scrollbar-thin bg-notebook-pattern">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-0.5 select-none">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black text-white"
                      style={{ background: "var(--ai-accent)" }}
                    >✦</div>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--ai-accent)" }}>AI</span>
                  </div>
                )}
                <div
                  className="max-w-full rounded-xl px-3 py-2 text-[12px] leading-relaxed break-words"
                  style={{
                    background: msg.role === "user" ? "var(--ai-msg-user)" : "var(--ai-msg-ai)",
                    border: "1px solid var(--ai-border)",
                    color: msg.role === "user" ? "var(--ai-msg-user-text)" : "var(--ai-msg-ai-text)",
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
                <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] text-white" style={{ background: "var(--ai-accent)" }}>✦</div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "var(--ai-accent)",
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
          <div className="px-3 pb-2.5 flex flex-col gap-1.5 border-t pt-2 shrink-0" style={{ borderColor: "var(--ai-border)" }}>
            <p className="text-[9px] uppercase tracking-widest font-black text-slate-500 select-none">Quick Actions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {quickPrompts.map((item) => (
                <button
                  key={item.label}
                  disabled={loading || !code?.trim()}
                  onClick={() => handleSend(item.prompt)}
                  className="text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 border cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--ai-sidebar-bg)",
                    color: "var(--ai-text)",
                    borderColor: "var(--ai-border)"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="px-3 pb-3 border-t pt-2 shrink-0" style={{ borderColor: "var(--ai-border)" }}>
            <div
              className="flex items-end gap-2 rounded-xl p-2 border"
              style={{ background: "var(--ai-input-bg)", borderColor: "var(--ai-border)" }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI anything... (Enter to send)"
                rows={2}
                disabled={loading}
                className="flex-1 bg-transparent outline-none resize-none text-[12px] leading-5 scrollbar-thin min-h-[40px] max-h-32"
                style={{ color: "var(--ai-text)", fontFamily: "system-ui, sans-serif" }}
              />
              <button
                disabled={!input.trim() || loading}
                onClick={() => handleSend()}
                className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-150 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: "var(--ai-accent)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
