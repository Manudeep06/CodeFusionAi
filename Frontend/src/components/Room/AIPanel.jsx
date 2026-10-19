import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bug, FileCode2, Lightbulb, PanelRightClose, RotateCw, Sparkles, TestTube2, Trash2, TriangleAlert, Zap } from "lucide-react";
import Markdown from "../AIAssist/Markdown";
import { sendMessage } from "../../services/aiService";

const PROMPTS = [
  { icon: Lightbulb, label: "Explain this code", text: "Explain what this code does, step by step." },
  { icon: Bug, label: "Find bugs", text: "Find bugs, edge cases and risky patterns in this code." },
  { icon: Zap, label: "Optimize this function", text: "Optimize this code for readability and performance. Show the improved version." },
  { icon: TestTube2, label: "Generate test cases", text: "Write unit tests with edge cases for this code." },
];

const MAX_CONTEXT_CHARS = 12000;

/** Builds a prompt that carries the active file (or just the selection) and recent turns. */
const buildPrompt = ({ question, file, language, code, selection, history }) => {
  const snippet = (selection?.trim() ? selection : code || "").slice(0, MAX_CONTEXT_CHARS);
  const scope = selection?.trim() ? "the user's selected code" : "the active file";
  const turns = history.slice(-4).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n\n");
  return [
    "You are an expert pair programmer inside the CodeFusionAI IDE. Reply in GitHub-flavoured markdown; put code in fenced blocks with a language tag.",
    file ? `Active file: ${file} (${language || "plain text"}). Below is ${scope}:` : "",
    snippet ? `\`\`\`${language || ""}\n${snippet}\n\`\`\`` : "",
    turns ? `Recent conversation:\n\n${turns}` : "",
    `User: ${question}`,
  ].filter(Boolean).join("\n\n");
};

/**
 * Right-side AI assistant for the workspace (Cursor-style). Chat is kept per
 * room in sessionStorage so it survives reloads but not other rooms.
 */
export default function AIPanel({ roomId, file, language, code, selection, getContext, onApply, onClose, width }) {
  const storageKey = `cf_room_ai_${roomId}`;
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { sessionStorage.setItem(storageKey, JSON.stringify(messages)); }, [messages, storageKey]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, pending]);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  const ask = async (question, history) => {
    setMessages([...history, { role: "user", text: question }]);
    setPending(true);
    try {
      const live = getContext ? getContext() : { code, selection };
      const reply = await sendMessage(buildPrompt({ question, file, language, code: live.code, selection: live.selection, history: history.filter((m) => !m.error) }));
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", error: true, text: err.message || "The assistant couldn't respond." }]);
    } finally {
      setPending(false);
    }
  };

  const send = (text = draft) => {
    const q = text.trim();
    if (!q || pending) return;
    setDraft("");
    ask(q, messages.filter((m) => !m.error));
  };

  const retry = () => {
    const idx = messages.map((m) => m.role).lastIndexOf("user");
    if (idx < 0 || pending) return;
    ask(messages[idx].text, messages.slice(0, idx).filter((m) => !m.error));
  };

  const hasSelection = Boolean(selection?.trim());
  const selectionLines = hasSelection ? selection.split("\n").length : 0;

  return (
    <aside className="room-ai" style={{ width }} aria-label="AI assistant">
      <header className="room-ai-head">
        <Sparkles size={16} className="room-ai-spark" aria-hidden="true" />
        <strong>AI assistant</strong>
        <span className="room-ai-model">Gemini</span>
        {messages.length > 0 && <button type="button" className="room-icon-btn" onClick={() => setMessages([])} title="Clear chat" aria-label="Clear chat"><Trash2 size={15} /></button>}
        <button type="button" className="room-icon-btn" onClick={onClose} title="Hide AI panel" aria-label="Hide AI panel"><PanelRightClose size={16} /></button>
      </header>

      <div className="room-ai-scroll">
        {messages.length === 0 ? (
          <div className="room-ai-empty">
            <span className="room-ai-empty-icon"><Sparkles size={20} /></span>
            <strong>Ask about your code</strong>
            <p>I can see {file ? <code>{file.split("/").pop()}</code> : "the open file"}{hasSelection ? " and your selection" : ""}. Select lines in the editor to focus on them.</p>
          </div>
        ) : (
          messages.map((m, i) => (m.role === "user" ? (
            <div key={i} className="room-ai-user">{m.text}</div>
          ) : m.error ? (
            <div key={i} className="room-ai-error">
              <TriangleAlert size={15} />
              <div><strong>The assistant couldn't respond.</strong> {m.text}<button type="button" onClick={retry}><RotateCw size={13} /> Try again</button></div>
            </div>
          ) : (
            <div key={i} className="room-ai-reply"><Markdown onApply={onApply}>{m.text}</Markdown></div>
          )))
        )}
        {pending && <div className="ai-typing" aria-label="Assistant is typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>

      <div className="room-ai-foot">
        <div className="room-ai-context">
          <FileCode2 size={13} aria-hidden="true" />
          {file ? <span>{file.split("/").pop()}{hasSelection ? ` · ${selectionLines} line${selectionLines === 1 ? "" : "s"} selected` : " · whole file"}</span> : <span>No file open</span>}
        </div>
        <div className="room-ai-chips">
          {PROMPTS.map(({ icon: Icon, label, text }) => (
            <button type="button" key={label} onClick={() => send(text)} disabled={pending || !file}><Icon size={13} /> {label}</button>
          ))}
        </div>
        <form className="room-ai-box" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea ref={inputRef} rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about your code…" aria-label="Message the AI assistant"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button type="submit" disabled={!draft.trim() || pending} aria-label="Send"><ArrowUp size={16} /></button>
        </form>
      </div>
    </aside>
  );
}
