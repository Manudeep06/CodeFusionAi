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
    const lastActive = localStorage.getItem("codefusionai_active_chat_id");
    if (lastActive) {
      return lastActive;
    }
    const saved = localStorage.getItem("codefusionai_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return "chat_default";
  });

  // Track theme preference
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem("codefusionai_theme");
    return saved === "light" || saved === "notebook" ? "light" : "dark";
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

  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    localStorage.setItem("codefusionai_theme", theme);
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
    <div className={`ai-theme-wrapper theme-${activeTheme} max-w-5xl mx-auto px-1 sm:px-4`}>
      {/* Dynamic CSS Stylesheet Injector for Themes */}
      <style>{`
        /* --- Themes Definitions --- */
        .theme-dark {
          --ai-bg: rgba(13, 10, 28, 0.7);
          --ai-sidebar-bg: rgba(20, 16, 42, 0.85);
          --ai-text: #f8fafc;
          --ai-text-muted: #94a3b8;
          --ai-accent: #8b5cf6;
          --ai-accent-hover: #7c3aed;
          --ai-border: rgba(255, 255, 255, 0.08);
          --ai-msg-user: #8b5cf6;
          --ai-msg-user-text: #ffffff;
          --ai-msg-ai: rgba(255, 255, 255, 0.035);
          --ai-msg-ai-text: #e2e8f0;
          --ai-input-bg: rgba(0, 0, 0, 0.35);
          --ai-sidebar-hover: rgba(255, 255, 255, 0.05);
          --ai-font: 'Inter', system-ui, sans-serif;
          --ai-card-shadow: 0 12px 48px rgba(0,0,0,0.6);
          --ai-header-bg: rgba(0, 0, 0, 0.05);
          --ai-input-panel-bg: rgba(0, 0, 0, 0.1);
        }

        .theme-light {
          --ai-bg: #faf9f6;
          --ai-sidebar-bg: #f4f3ee;
          --ai-text: #0f172a;
          --ai-text-muted: #475569;
          --ai-accent: #4f46e5;
          --ai-accent-hover: #3730a3;
          --ai-border: rgba(0, 0, 0, 0.07);
          --ai-msg-user: linear-gradient(135deg, #6366f1, #4f46e5);
          --ai-msg-user-text: #ffffff;
          --ai-msg-ai: #ffffff;
          --ai-msg-ai-text: #0f172a;
          --ai-input-bg: #ffffff;
          --ai-sidebar-hover: rgba(0, 0, 0, 0.04);
          --ai-font: 'Outfit', 'Inter', system-ui, sans-serif;
          --ai-card-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
          --ai-header-bg: rgba(0, 0, 0, 0.02);
          --ai-input-panel-bg: transparent;
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

        /* --- Notebook Ruled Lines Pattern (Bullet Journal dot-grid style in Light Mode) --- */
        .theme-light .bg-notebook-pattern {
          background-color: #faf9f6 !important;
          background-image: radial-gradient(rgba(0, 0, 0, 0.04) 1.2px, transparent 1.2px) !important;
          background-size: 20px 20px !important;
          background-attachment: local;
        }

        /* --- Vite Card Theme Container Overrides --- */
        .ai-theme-wrapper:not(.theme-dark) > div {
          background: var(--ai-bg) !important;
          border-color: var(--ai-border) !important;
          box-shadow: var(--ai-card-shadow) !important;
          backdrop-filter: none !important;
        }
        
        .ai-theme-wrapper:not(.theme-dark) > div > div.absolute {
          display: none !important;
        }
      `}</style>

      <Card
        accentColor={activeTheme === "dark" ? "purple" : "none"}
        className="flex h-[620px] !p-0 overflow-hidden shadow-2xl transition-all duration-300"
        noPad
      >
        <ChatHistorySidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          activeTheme={activeTheme}
          onChangeTheme={handleThemeChange}
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
