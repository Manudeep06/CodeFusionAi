import { useState, useRef, useEffect } from "react";

export default function ChatHistorySidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  activeTheme,
  onChangeTheme,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const editInputRef = useRef(null);

  const themesList = [
    { id: "dark", name: "Dark Mode", color: "#8b5cf6", tooltip: "Classic Dark Mode" },
    { id: "light", name: "Light Mode", color: "#3b82f6", tooltip: "Notebook Light Mode" },
  ];

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const handleStartRename = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = (chatId) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleKeyDown = (e, chatId) => {
    if (e.key === "Enter") {
      handleSaveRename(chatId);
    } else if (e.key === "Escape") {
      setEditingChatId(null);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex flex-col h-full border-r transition-all duration-300 select-none overflow-hidden
        ${isCollapsed ? "w-16" : "w-64 md:w-72"}`}
      style={{
        backgroundColor: "var(--ai-sidebar-bg)",
        borderColor: "var(--ai-border)",
        fontFamily: "var(--ai-font, sans-serif)",
      }}
    >
      {/* Sidebar Header */}
      <div className="p-3 flex items-center justify-between border-b" style={{ borderColor: "var(--ai-border)" }}>
        {!isCollapsed && (
          <span
            className="text-xs font-black uppercase tracking-wider pl-1"
            style={{ color: "var(--ai-text)" }}
          >
            History
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-[var(--ai-sidebar-hover)] transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{ color: "var(--ai-text)" }}
        >
          {isCollapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 flex flex-col gap-2 border-b" style={{ borderColor: "var(--ai-border)" }}>
        {isCollapsed ? (
          <button
            onClick={onNewChat}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 shadow-md cursor-pointer hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "var(--ai-accent)",
              color: "#ffffff",
            }}
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 shadow-md cursor-pointer hover:scale-[1.02] active:scale-98"
              style={{
                backgroundColor: "var(--ai-accent)",
                color: "#ffffff",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Chat</span>
            </button>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition duration-200"
              style={{
                backgroundColor: "var(--ai-input-bg)",
                borderColor: "var(--ai-border)",
              }}
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                style={{ color: "var(--ai-text-muted)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs"
                style={{ color: "var(--ai-text)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded-md hover:bg-white/10 shrink-0 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ color: "var(--ai-text)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Chats History List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-thin">
        {filteredChats.length === 0 ? (
          <div
            className="text-center py-8 text-[11px]"
            style={{ color: "var(--ai-text-muted)" }}
          >
            {!isCollapsed && (searchQuery ? "No matching chats" : "No past conversations")}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isEditing = chat.id === editingChatId;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`ai-sidebar-item mx-2 rounded-xl flex items-center justify-between p-2.5 transition duration-150 cursor-pointer group/item
                  ${isActive ? "active" : ""}`}
                style={{
                  color: isActive ? "var(--ai-text)" : "var(--ai-text-muted)",
                }}
              >
                {/* Chat Left Side / Icon & Name */}
                <div className="flex items-center gap-2 overflow-hidden w-full">
                  {/* Chat Icon */}
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    style={{ color: isActive ? "var(--ai-accent)" : "var(--ai-text-muted)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>

                  {/* Chat Title / Input */}
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveRename(chat.id)}
                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent border-none outline-none text-xs p-0 font-semibold"
                      style={{ color: "var(--ai-text)" }}
                    />
                  ) : (
                    !isCollapsed && (
                      <span className="text-xs font-semibold truncate leading-none">
                        {chat.title}
                      </span>
                    )
                  )}
                </div>

                {/* Hover Actions (rename/delete) */}
                {!isCollapsed && !isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity ml-1.5 shrink-0">
                    <button
                      onClick={(e) => handleStartRename(chat, e)}
                      className="p-1 rounded hover:bg-white/10"
                      title="Rename Chat"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: "var(--ai-text)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500/80 hover:text-red-400"
                      title="Delete Chat"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Theme Selector Section */}
      <div
        className="p-3 border-t flex flex-col gap-2 shrink-0 transition-all duration-300"
        style={{
          borderColor: "var(--ai-border)",
          backgroundColor: "rgba(0,0,0,0.15)",
        }}
      >
        {isCollapsed ? (
          <button
            onClick={() => {
              // Cycle theme
              const currentIndex = themesList.findIndex((t) => t.id === activeTheme);
              const nextIndex = (currentIndex + 1) % themesList.length;
              onChangeTheme(themesList[nextIndex].id);
            }}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Cycle Theme"
            style={{ color: "var(--ai-text)" }}
          >
            🎨
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[10px] font-black uppercase tracking-wider pl-0.5"
              style={{ color: "var(--ai-text-muted)" }}
            >
              Study Theme
            </span>
            <div className="flex items-center justify-between gap-2 bg-black/10 p-1 rounded-xl border" style={{ borderColor: "var(--ai-border)" }}>
              {themesList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeTheme(t.id)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition duration-200 cursor-pointer
                    ${activeTheme === t.id ? "bg-[var(--ai-accent)] text-white shadow-sm" : "hover:bg-[var(--ai-sidebar-hover)] opacity-70 hover:opacity-100"}`}
                  style={{
                    color: activeTheme === t.id ? "#ffffff" : "var(--ai-text)",
                  }}
                  title={t.name}
                >
                  <span>{t.id === "dark" ? "🌙" : "☀️"}</span>
                  <span className="text-[9px] uppercase font-black tracking-wider">{t.id === "dark" ? "Dark" : "Light"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
