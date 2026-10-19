import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowUp, Bug, Code2, Copy, Check, Lightbulb, MessageCircle, PanelLeftClose, PanelLeftOpen,
  RotateCw, Search, Sparkles, SquarePen, TestTube2, Trash2, Zap, TriangleAlert,
} from "lucide-react";
import { BrandMark } from "../components/ui/Brand";
import Markdown from "../components/AIAssist/Markdown";
import useChatStore from "../components/AIAssist/useChatStore";
import { confirmDialog } from "../components/ui/confirmStore";
import { useAuth } from "../context/AuthContext";
import ProfileImage from "../components/Dashboard/ProfileImage";
import "../styles/assistant.css";

const PROMPTS = [
  { icon: Lightbulb, label: "Explain this code", text: "Explain what this code does, step by step:\n\n```\n\n```" },
  { icon: Bug, label: "Find bugs", text: "Find bugs and edge cases in this code:\n\n```\n\n```" },
  { icon: Zap, label: "Optimize this function", text: "Optimize this function for readability and performance:\n\n```\n\n```" },
  { icon: TestTube2, label: "Generate test cases", text: "Write unit tests (with edge cases) for this code:\n\n```\n\n```" },
];

const DAY = 24 * 60 * 60 * 1000;
const groupOf = (ts) => {
  const age = Date.now() - (ts || 0);
  if (age < DAY) return "Today";
  if (age < 7 * DAY) return "Previous 7 days";
  return "Older";
};

function CopyMessage({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" title="Copy reply" aria-label="Copy reply"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export default function Assistant() {
  const { user } = useAuth();
  const { chats, active, setActiveId, create, remove, send, retry, pending } = useChatStore();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [railOpen, setRailOpen] = useState(() => window.matchMedia("(min-width: 901px)").matches);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "You";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [active?.messages.length, pending]);

  // Auto-grow the composer.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [draft]);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = [...chats]
      .filter((c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return ["Today", "Previous 7 days", "Older"]
      .map((g) => [g, list.filter((c) => groupOf(c.updatedAt) === g)])
      .filter(([, items]) => items.length);
  }, [chats, filter]);

  const submit = (e) => {
    e?.preventDefault();
    if (!draft.trim() || pending) return;
    send(draft);
    setDraft("");
  };

  const applyPrompt = (text) => {
    setDraft(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const caret = text.indexOf("```\n") + 4;
      el.setSelectionRange(caret, caret);
    });
  };

  const insertFence = () => {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? draft.length;
    const next = `${draft.slice(0, pos)}\n\`\`\`\n\n\`\`\`\n${draft.slice(pos)}`;
    setDraft(next);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(pos + 5, pos + 5); });
  };

  const deleteChat = async (id, title) => {
    if (await confirmDialog({ title: "Delete this chat?", body: `"${title}" will be removed from this browser.`, confirmLabel: "Delete chat", danger: true })) remove(id);
  };

  const messages = active?.messages || [];
  const last = messages[messages.length - 1];

  return (
    <div className={`ai-page ${railOpen ? "" : "is-rail-closed"}`}>
      <aside className="ai-rail" aria-label="Chats">
        <div className="ai-rail-top">
          <Link to="/dashboard" className="app-brand"><BrandMark size={15} /> CodeFusionAI</Link>
          <button type="button" className="app-icon-button" onClick={() => setRailOpen(false)} aria-label="Hide chat list"><PanelLeftClose size={18} /></button>
        </div>
        <Link to="/dashboard" className="ai-back"><ArrowLeft size={15} /> Back to dashboard</Link>
        <button type="button" className="cf-primary-button ai-new" onClick={() => { create(); inputRef.current?.focus(); }}><SquarePen size={16} /> New chat</button>
        <label className="ai-filter">
          <Search size={15} aria-hidden="true" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search chats" aria-label="Search chats" />
        </label>
        <nav className="ai-history">
          {grouped.length === 0 && <p className="ai-history-empty">No chats match "{filter}".</p>}
          {grouped.map(([group, items]) => (
            <div key={group}>
              <p className="ai-group">{group}</p>
              {items.map((c) => (
                <div key={c.id} className={`ai-thread ${c.id === active?.id ? "is-active" : ""}`}>
                  <button type="button" onClick={() => setActiveId(c.id)} aria-current={c.id === active?.id ? "true" : undefined}>
                    <MessageCircle size={15} aria-hidden="true" /><span>{c.title || "New chat"}</span>
                  </button>
                  <button type="button" className="ai-thread-del" onClick={() => deleteChat(c.id, c.title)} aria-label={`Delete ${c.title}`}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="ai-me">
          <ProfileImage src={user?.photoURL} fallback={displayName.slice(0, 1).toUpperCase()} alt="" className="app-avatar" />
          <div><strong>{displayName}</strong><span>{user?.email}</span></div>
        </div>
      </aside>

      <main className="ai-main">
        <header className="ai-bar">
          {!railOpen && <button type="button" className="app-icon-button" onClick={() => setRailOpen(true)} aria-label="Show chat list"><PanelLeftOpen size={18} /></button>}
          <h1>{messages.length ? active.title : "AI Assistant"}</h1>
          <span className="ai-model"><Sparkles size={14} /> Gemini 2.5 Flash</span>
          {messages.length > 0 && (
            <button type="button" className="app-icon-button ai-bar-end" title="Delete chat" aria-label="Delete chat" onClick={() => deleteChat(active.id, active.title)}><Trash2 size={17} /></button>
          )}
        </header>

        <div className="ai-scroll">
          <div className="ai-col">
            {messages.length === 0 ? (
              <div className="ai-empty">
                <span className="ai-empty-icon"><Sparkles size={24} /></span>
                <h2>What are we building today?</h2>
                <p>Ask a coding question, paste a snippet to review, or start from a prompt.</p>
                <div className="ai-empty-grid">
                  {PROMPTS.map(({ icon: Icon, label, text }) => (
                    <button type="button" key={label} onClick={() => applyPrompt(text)}><Icon size={18} /> {label}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (m.role === "user" ? (
                <div key={i} className="ai-user">{m.text}</div>
              ) : (
                <div key={i} className={`ai-reply ${m.error ? "is-error" : ""}`}>
                  <span className="ai-bot">{m.error ? <TriangleAlert size={17} /> : <Sparkles size={17} />}</span>
                  <div className="ai-reply-body">
                    {m.error ? (
                      <div className="ai-error">
                        <p><strong>The assistant couldn't respond.</strong> {m.text}</p>
                        <button type="button" className="cf-secondary-button" onClick={retry}><RotateCw size={14} /> Try again</button>
                      </div>
                    ) : (
                      <>
                        <Markdown>{m.text}</Markdown>
                        <div className="ai-reply-actions">
                          <CopyMessage text={m.text} />
                          {m === last && <button type="button" title="Regenerate" aria-label="Regenerate reply" onClick={retry}><RotateCw size={15} /></button>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )))
            )}
            {pending && (
              <div className="ai-reply">
                <span className="ai-bot"><Sparkles size={17} /></span>
                <div className="ai-typing" aria-label="Assistant is typing"><i /><i /><i /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form className="ai-composer" onSubmit={submit}>
          <div className="ai-col">
            {messages.length > 0 && (
              <div className="ai-chips">
                {PROMPTS.map(({ icon: Icon, label, text }) => (
                  <button type="button" key={label} className="ai-chip" onClick={() => applyPrompt(text)}><Icon size={14} /> {label}</button>
                ))}
              </div>
            )}
            <div className="ai-box">
              <textarea ref={inputRef} rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask anything about code, or paste a snippet…"
                aria-label="Message the AI assistant"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
              <div className="ai-box-row">
                <button type="button" className="ai-chip" onClick={insertFence}><Code2 size={14} /> Paste code</button>
                <span>Enter to send · Shift + Enter for a new line</span>
                <button type="submit" className="ai-send" disabled={!draft.trim() || pending} aria-label="Send message"><ArrowUp size={18} /></button>
              </div>
            </div>
            <p className="ai-hint">AI answers can be wrong. Review code before you run it.</p>
          </div>
        </form>
      </main>
    </div>
  );
}
