import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "../../services/aiService";

const STORAGE_KEY = "codefusionai_chats";
const ACTIVE_KEY = "codefusionai_active_chat_id";
const HISTORY_TURNS = 6;

const newChat = () => ({ id: `chat_${Date.now()}`, title: "New chat", messages: [], createdAt: Date.now(), updatedAt: Date.now() });

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      // Older versions seeded a canned welcome message; drop it.
      return parsed.map((c) => ({ ...c, messages: (c.messages || []).filter((m, i) => !(i === 0 && m.role === "assistant" && /Welcome|Hi! I am your AI Copilot|Conversation cleared/.test(m.text))) }));
    }
  } catch { /* corrupt storage: start fresh */ }
  return [newChat()];
};

/** Builds the prompt with the last few turns so Gemini keeps context. */
export const buildPrompt = (messages, text) => {
  const history = messages.filter((m) => !m.error).slice(-HISTORY_TURNS);
  if (!history.length) return text;
  const turns = history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n\n");
  return `You are a helpful coding assistant inside the CodeFusionAI IDE. Recent conversation:\n\n${turns}\n\nUser: ${text}\n\nReply in GitHub-flavoured markdown and put code in fenced blocks with a language tag.`;
};

/** Chat list + active chat + send, persisted in localStorage (per browser). */
export default function useChatStore() {
  const [chats, setChats] = useState(load);
  const [activeId, setActiveId] = useState(() => {
    const last = localStorage.getItem(ACTIVE_KEY);
    return last && chats.some((c) => c.id === last) ? last : chats[0].id;
  });
  const [pending, setPending] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); }, [chats]);
  useEffect(() => { localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);

  const active = chats.find((c) => c.id === activeId) || chats[0];
  const patch = (id, fn) => setChats((list) => list.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)));

  const create = useCallback(() => {
    const empty = chats.find((c) => c.messages.length === 0);
    if (empty) { setActiveId(empty.id); return; }
    const chat = newChat();
    setChats((list) => [chat, ...list]);
    setActiveId(chat.id);
  }, [chats]);

  const remove = (id) => {
    setChats((list) => {
      const next = list.filter((c) => c.id !== id);
      const safe = next.length ? next : [newChat()];
      if (id === activeId) setActiveId(safe[0].id);
      return safe;
    });
  };

  /** Replace the chat's messages with `prior` + the question, then fetch the answer. */
  const ask = async (id, prior, prompt) => {
    patch(id, (c) => ({
      ...c,
      title: prior.length === 0 ? prompt.slice(0, 48) : c.title,
      messages: [...prior, { role: "user", text: prompt }],
    }));
    setPending(true);
    try {
      const reply = await sendMessage(buildPrompt(prior, prompt));
      patch(id, (c) => ({ ...c, messages: [...c.messages, { role: "assistant", text: reply }] }));
    } catch (err) {
      patch(id, (c) => ({ ...c, messages: [...c.messages, { role: "assistant", error: true, text: err.message || "The assistant couldn't respond." }] }));
    } finally {
      setPending(false);
    }
  };

  const send = (text) => {
    const prompt = text.trim();
    if (!prompt || pending || !active) return;
    ask(active.id, active.messages.filter((m) => !m.error), prompt);
  };

  /** Re-asks the last user question (after an error, or to get a different answer). */
  const retry = () => {
    if (pending || !active) return;
    const idx = active.messages.map((m) => m.role).lastIndexOf("user");
    if (idx < 0) return;
    ask(active.id, active.messages.slice(0, idx).filter((m) => !m.error), active.messages[idx].text);
  };

  return { chats, active, activeId, setActiveId, create, remove, send, retry, pending };
}
