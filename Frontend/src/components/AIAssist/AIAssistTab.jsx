import { useState, useEffect } from "react";
import { Card } from "../../pages/Dashboard";
import { sendMessage } from "../../services/aiService";
import ChatHistorySidebar from "./ChatHistorySidebar";
import ChatWindow from "./ChatWindow";

export default function AIAssistTab() {
  // Load chats from localStorage or initialize with a welcome chat
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("codefusionai_chats");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing chats history:", e);
      }
    }
    return [
      {
        id: "chat_default",
        title: "Welcome Copilot",
        messages: [
          {
            role: "assistant",
            text: "Welcome to CodeFusionAI Copilot Hub! Ask me any programming question, request templates, or explore details about the system's architecture."
          }
        ],
        model: "Gemini-2.5-Flash"
      }
    ];
  });

  // Track active chat ID
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem("codefusionai_chats");
    let parsedChats = [];
    if (saved) {
      try {
        parsedChats = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing chats history:", e);
      }
    }
    if (!Array.isArray(parsedChats) || parsedChats.length === 0) {
      parsedChats = [
        {
          id: "chat_default",
          title: "Welcome Copilot",
          messages: [
            {
              role: "assistant",
              text: "Welcome to CodeFusionAI Copilot Hub! Ask me any programming question, request templates, or explore details about the system's architecture."
            }
          ],
          model: "Gemini-2.5-Flash"
        }
      ];
    }
    const lastActive = localStorage.getItem("codefusionai_active_chat_id");
    if (lastActive && parsedChats.some((c) => c.id === lastActive)) {
      return lastActive;
    }
    return parsedChats[0].id;
  });

  const [loading, setLoading] = useState(false);

  // Sync active chat ID to localStorage
  useEffect(() => {
    localStorage.setItem("codefusionai_active_chat_id", activeChatId);
  }, [activeChatId]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
  };

  const handleNewChat = () => {
    const newChat = {
      id: "chat_" + Date.now(),
      title: "New Chat",
      messages: [
        {
          role: "assistant",
          text: "Hi! I am your AI Copilot. How can I help you study coding today? Pick a quick starter prompt or write your own!"
        }
      ],
      model: "Gemini-2.5-Flash"
    };
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setActiveChatId(newChat.id);
    localStorage.setItem("codefusionai_chats", JSON.stringify(updatedChats));
  };

  const handleDeleteChat = (chatId) => {
    const updatedChats = chats.filter((c) => c.id !== chatId);
    setChats(updatedChats);
    localStorage.setItem("codefusionai_chats", JSON.stringify(updatedChats));

    if (activeChatId === chatId) {
      if (updatedChats.length > 0) {
        setActiveChatId(updatedChats[0].id);
      } else {
        // Force create a new chat if list becomes empty
        const forceChat = {
          id: "chat_" + Date.now(),
          title: "New Chat",
          messages: [
            {
              role: "assistant",
              text: "Hi! I am your AI Copilot. How can I help you study coding today?"
            }
          ],
          model: "Gemini-2.5-Flash"
        };
        setChats([forceChat]);
        setActiveChatId(forceChat.id);
        localStorage.setItem("codefusionai_chats", JSON.stringify([forceChat]));
      }
    }
  };

  const handleRenameChat = (chatId, newTitle) => {
    const updatedChats = chats.map((c) => {
      if (c.id === chatId) {
        return { ...c, title: newTitle };
      }
      return c;
    });
    setChats(updatedChats);
    localStorage.setItem("codefusionai_chats", JSON.stringify(updatedChats));
  };

  const handleClearChat = () => {
    const updatedChats = chats.map((c) => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: [
            {
              role: "assistant",
              text: "Conversation cleared. Ask me anything!"
            }
          ]
        };
      }
      return c;
    });
    setChats(updatedChats);
    localStorage.setItem("codefusionai_chats", JSON.stringify(updatedChats));
  };

  const handleSendMessage = async (text) => {
    const chat = chats.find((c) => c.id === activeChatId);
    if (!chat || loading) return;

    // Add user message
    const userMsg = { role: "user", text };
    const updatedMessages = [...chat.messages, userMsg];

    // Determine if we need to auto-rename chat title from "New Chat" or "Welcome Copilot"
    let newTitle = chat.title;
    if (chat.title === "New Chat" || chat.title === "Welcome Copilot") {
      newTitle = text.length > 25 ? text.substring(0, 22) + "..." : text;
    }

    const updatedChats = chats.map((c) => {
      if (c.id === activeChatId) {
        return {
          ...c,
          title: newTitle,
          messages: updatedMessages,
        };
      }
      return c;
    });

    setChats(updatedChats);
    localStorage.setItem("codefusionai_chats", JSON.stringify(updatedChats));
    setLoading(true);

    try {
      // Package conversation turns (up to last 6 messages) to provide Gemini context
      const historyContext = updatedMessages.slice(-6);
      let promptWithContext = "";
      if (historyContext.length > 1) {
        promptWithContext = "You are a helpful coding assistant. Below is the recent chat history for context:\n\n";
        historyContext.slice(0, -1).forEach((m) => {
          promptWithContext += `${m.role === "user" ? "User" : "Assistant"}: ${m.text}\n\n`;
        });
        promptWithContext += `Current prompt: ${text}\n\nPlease respond based on the conversation context above.`;
      } else {
        promptWithContext = text;
      }

      // Query backend
      const reply = await sendMessage(promptWithContext);

      // Add AI reply
      const aiReplyMsg = { role: "assistant", text: reply };
      const finalChats = updatedChats.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...updatedMessages, aiReplyMsg],
          };
        }
        return c;
      });

      setChats(finalChats);
      localStorage.setItem("codefusionai_chats", JSON.stringify(finalChats));
    } catch (error) {
      console.error(error);
      const errorMsg = { role: "assistant", text: "Failed to generate response. Please verify connection and try again." };
      const finalChats = updatedChats.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...updatedMessages, errorMsg],
          };
        }
        return c;
      });
      setChats(finalChats);
      localStorage.setItem("codefusionai_chats", JSON.stringify(finalChats));
    } finally {
      setLoading(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="ai-theme-wrapper max-w-5xl mx-auto px-1 sm:px-4">
      {/* Dynamic CSS Stylesheet Injector for Themes */}
      <style>{`
        .ai-theme-wrapper {
          --ai-bg: var(--color-paper);
          --ai-sidebar-bg: var(--color-paper-muted);
          --ai-text: var(--color-ink);
          --ai-text-muted: var(--color-ink-soft);
          --ai-accent: var(--color-accent);
          --ai-accent-hover: var(--color-accent-hover);
          --ai-border: var(--color-rule);
          --ai-msg-user: var(--color-accent);
          --ai-msg-user-text: var(--color-accent-ink);
          --ai-msg-ai: var(--color-paper-raised);
          --ai-msg-ai-text: var(--color-ink);
          --ai-input-bg: var(--color-paper-raised);
          --ai-sidebar-hover: oklch(0.935 0.005 240);
          --ai-font: var(--font-sans, system-ui, sans-serif);
          --ai-card-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          --ai-header-bg: var(--color-paper-muted);
          --ai-input-panel-bg: var(--color-paper-muted);
        }

        /* --- Scrollbar styling overrides --- */
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--ai-border);
          border-radius: 9px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: var(--ai-accent);
        }

        /* --- Sidebar Item styles --- */
        .ai-sidebar-item.active {
          background-color: var(--ai-sidebar-hover);
          border-left: 3px solid var(--ai-accent);
          padding-left: 7px;
        }
        .ai-sidebar-item:hover {
          background-color: var(--ai-sidebar-hover);
        }

        /* --- Notebook Ruled Lines Pattern --- */
        .ai-theme-wrapper .bg-notebook-pattern {
          background-color: var(--ai-bg) !important;
          background-image: radial-gradient(rgba(0, 0, 0, 0.03) 1.2px, transparent 1.2px) !important;
          background-size: 20px 20px !important;
          background-attachment: local;
        }

        /* --- Card overrides --- */
        .ai-theme-wrapper > div {
          background: var(--ai-bg) !important;
          border-color: var(--ai-border) !important;
          box-shadow: var(--ai-card-shadow) !important;
          backdrop-filter: none !important;
        }
        
        .ai-theme-wrapper > div > div.absolute {
          display: none !important;
        }
      `}</style>

      <Card
        className="flex h-[620px] !p-0 overflow-hidden transition-all duration-300"
        noPad
      >
        <ChatHistorySidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />
        
        <ChatWindow
          activeChat={activeChat}
          onSendMessage={handleSendMessage}
          loading={loading}
          onClearChat={handleClearChat}
        />
      </Card>
    </div>
  );
}
