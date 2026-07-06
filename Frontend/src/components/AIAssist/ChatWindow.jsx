import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/40 font-mono text-left text-xs shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-black/25 border-b border-white/5 text-[10px] text-slate-400 select-none">
        <span className="font-bold uppercase tracking-wider">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition duration-150 cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.675A2.25 2.25 0 0015.05 1.5H9.75A2.25 2.25 0 007.5 3.75M3.75 6h16.5M12 9h.01M12 12h.01M12 15h.01" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-slate-100 font-mono scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ChatWindow({
  activeChat,
  onSendMessage,
  loading,
  onClearChat,
}) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom("smooth");
  }, [activeChat?.messages?.length, loading]);

  const scrollToBottom = (behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show scroll button if user scrolled up significantly (more than 200px from bottom)
    const isUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBtn(isUp);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterPrompts = [
    {
      title: "🧠 Explain Recursion",
      desc: "Analogy & JS code sample",
      prompt: "Can you explain recursion to me like I am 10 years old with a clear JavaScript code example?",
    },
    {
      title: "⚡ WebSocket Client",
      desc: "React setup template",
      prompt: "Show me a clean and robust React WebSocket connection hook or component pattern.",
    },
    {
      title: "🎨 CSS Grid Layout",
      desc: "Responsive card gallery",
      prompt: "Write a modern, responsive CSS Grid layouts stylesheet for a photo gallery with hover zoom effects.",
    },
    {
      title: "🛡️ Secure SQL Query",
      desc: "Node.js injection prevention",
      prompt: "How do I secure SQL database queries in a Node.js API to prevent injection vulnerabilities? Show examples.",
    },
  ];

  const markdownComponents = {
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeText = String(children).replace(/\n$/, "");
      const isInline = !match;

      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[11px] border border-white/5"
            style={{ color: "var(--ai-accent)" }}
            {...props}
          >
            {children}
          </code>
        );
      }

      return <CodeBlock code={codeText} language={match[1]} />;
    },
  };

  if (!activeChat) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        style={{
          backgroundColor: "var(--ai-bg)",
          color: "var(--ai-text-muted)",
          fontFamily: "var(--ai-font, sans-serif)",
        }}
      >
        <svg className="w-12 h-12 mb-4 animate-bounce opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        <p className="text-sm font-semibold">Select or create a conversation from the sidebar history.</p>
      </div>
    );
  }

  // A chat is considered "new" if it only contains the system greeting
  const isNewChat = activeChat.messages.length <= 1;

  return (
    <div
      className="flex-1 flex flex-col h-full relative overflow-hidden"
      style={{
        backgroundColor: "var(--ai-bg)",
        color: "var(--ai-text)",
        fontFamily: "var(--ai-font, sans-serif)",
      }}
    >
      {/* Chat Window Header */}
      <div
        className="px-6 py-3.5 border-b flex items-center justify-between z-10 shrink-0"
        style={{
          borderColor: "var(--ai-border)",
          backgroundColor: "rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md"
            style={{
              backgroundColor: "var(--ai-accent)",
            }}
          >
            AI
          </div>
          <div>
            <h3 className="text-xs font-black leading-tight max-w-[150px] sm:max-w-xs truncate">
              {activeChat.title}
            </h3>
            <p className="text-[9px] mt-0.5" style={{ color: "var(--ai-text-muted)" }}>
              Gemini 2.5 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              borderColor: "rgba(16, 185, 129, 0.2)",
              color: "#10b981",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>

          {activeChat.messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Clear all messages in this chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
              <span className="hidden sm:inline text-[10px] font-bold uppercase">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Panel */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin relative bg-notebook-pattern"
      >
        {isNewChat ? (
          /* Welcome Panel & Suggestion Cards */
          <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col items-center">
            {/* Mascot Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4 animate-bounce"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid var(--ai-border)",
              }}
            >
              🚀
            </div>
            <h2 className="text-base font-black tracking-tight mb-1 text-center">
              Student Copilot Assistant
            </h2>
            <p className="text-xs text-center mb-8 max-w-sm" style={{ color: "var(--ai-text-muted)" }}>
              Ask a question or request a coding template to start studying.
            </p>

            {/* Quick Prompts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {starterPrompts.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(card.prompt)}
                  className="p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-sm"
                  style={{
                    backgroundColor: "var(--ai-sidebar-bg)",
                    borderColor: "var(--ai-border)",
                  }}
                >
                  <h4 className="text-xs font-bold leading-tight" style={{ color: "var(--ai-text)" }}>
                    {card.title}
                  </h4>
                  <p className="text-[10px] mt-1" style={{ color: "var(--ai-text-muted)" }}>
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Bubble Logs */
          <div className="max-w-3xl mx-auto space-y-4">
            {activeChat.messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3.5`}
                >
                  {!isUser && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 select-none shadow-sm"
                      style={{
                        backgroundColor: "var(--ai-accent)",
                      }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4.5 py-3 text-xs leading-relaxed shadow-sm
                      ${
                        isUser
                          ? "rounded-tr-none text-right font-medium"
                          : "rounded-tl-none text-left"
                      }`}
                    style={{
                      background: isUser ? "var(--ai-msg-user)" : "var(--ai-msg-ai)",
                      color: isUser ? "var(--ai-msg-user-text)" : "var(--ai-msg-ai-text)",
                      border: isUser ? "none" : "1px solid var(--ai-border)",
                    }}
                  >
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {loading && (
              <div className="flex justify-start items-center gap-3.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 select-none shadow-sm"
                  style={{
                    backgroundColor: "var(--ai-accent)",
                  }}
                >
                  AI
                </div>
                <div
                  className="rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5"
                  style={{
                    backgroundColor: "var(--ai-msg-ai)",
                    border: "1px solid var(--ai-border)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "var(--ai-accent)", animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "var(--ai-accent)", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "var(--ai-accent)", animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-24 right-8 p-2 rounded-full shadow-lg border text-white transition hover:scale-105 active:scale-95 cursor-pointer z-10"
          style={{
            backgroundColor: "var(--ai-accent)",
            borderColor: "var(--ai-border)",
          }}
          title="Scroll to bottom"
        >
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Input Form Area */}
      <div
        className="p-4 border-t shrink-0 z-10"
        style={{
          borderColor: "var(--ai-border)",
          backgroundColor: "rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl border p-2 focus-within:ring-1 transition duration-200 max-w-3xl mx-auto"
          style={{
            backgroundColor: "var(--ai-input-bg)",
            borderColor: "var(--ai-border)",
          }}
        >
          <textarea
            placeholder="Ask AI Copilot to code or explain..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ color: "var(--ai-text)" }}
            className="flex-1 bg-transparent border-none outline-none text-xs px-2 py-1.5 resize-none max-h-32 scrollbar-thin min-h-[28px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl text-white font-bold transition duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            style={{
              backgroundColor: "var(--ai-accent)",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
