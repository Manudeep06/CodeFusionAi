import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function SessionsTab({ handleJoinRoomShortcut, onCreateRoomClick }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "active", "closed", "owned", "joined"
  const [openMenuRoomId, setOpenMenuRoomId] = useState(null);

  // Sub-Tab Switcher State
  const [subTab, setSubTab] = useState("my-sessions"); // "my-sessions" or "public-hub"

  const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuRoomId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Function to fetch all rooms based on selected sub-tab
  const fetchSessions = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const url = subTab === "my-sessions"
        ? `${baseUrl}/api/rooms/user/${user.uid}`
        : `${baseUrl}/api/rooms/public`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }
      const data = await response.json();
      setSessions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.uid, subTab]);

  // Handler to close a room (Owner only)
  const handleCloseRoom = async (roomId) => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`${baseUrl}/api/rooms/${roomId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to close room");
      }
      fetchSessions(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  // Handler to reopen/resume a room (Owner only)
  const handleResumeRoom = async (roomId) => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`${baseUrl}/api/rooms/${roomId}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to resume room");
      }
      fetchSessions(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  // Handler to permanently delete a room (Owner only)
  const handleDeleteRoom = async (roomId) => {
    if (!user?.uid) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this room? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${baseUrl}/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete room");
      }
      fetchSessions(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter and Search computed list
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.roomId.toLowerCase().includes(searchQuery.toLowerCase());

    const isOwner = user?.uid === s.ownerId;
    const isActive = s.status === "active";

    if (activeFilter === "active") return matchesSearch && isActive;
    if (activeFilter === "closed") return matchesSearch && !isActive;
    if (activeFilter === "owned") return matchesSearch && isOwner;
    if (activeFilter === "joined") return matchesSearch && !isOwner;
    return matchesSearch;
  });

  // Get color configurations based on template type
  const getTemplateTheme = (template) => {
    const t = template?.toLowerCase() || "";
    if (t === "react") {
      return {
        badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        cardHover: "hover:border-cyan-500/35 hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.25)]",
        line: "via-cyan-500/35",
      };
    }
    if (t === "node" || t === "javascript") {
      return {
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        cardHover: "hover:border-emerald-500/35 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)]",
        line: "via-emerald-500/35",
      };
    }
    return {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      cardHover: "hover:border-amber-500/35 hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.25)]",
      line: "via-amber-500/35",
    };
  };

  return (
    <div className="animate-card-enter space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">Collaboration Hub</span>
          <h2 className="text-2xl font-black text-[var(--color-ink)] mt-1 tracking-tight">Active Rooms & Sessions</h2>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">Access your team's live environments or rejoin previous sessions.</p>
        </div>
        <button
          onClick={onCreateRoomClick}
          className="cf-primary-button flex items-center gap-2 py-2 px-5 text-xs transition duration-200 cursor-pointer shadow-sm animate-fade-in"
        >
          Create New Room
        </button>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center gap-5 border-b border-[var(--color-rule)] pb-3 mb-6">
        <button
          onClick={() => {
            setSubTab("my-sessions");
            setActiveFilter("all");
          }}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer focus:outline-none ${
            subTab === "my-sessions"
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          My Sessions
        </button>
        <button
          onClick={() => {
            setSubTab("public-hub");
            setActiveFilter("all");
          }}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer focus:outline-none ${
            subTab === "public-hub"
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          Public Hub
        </button>
      </div>

      {/* Search and Filters bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[var(--color-paper-muted)] border border-[var(--color-rule)] p-3 rounded-2xl">
        {/* Search input */}
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by workspace name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none focus:border-[var(--color-accent)] focus:bg-[var(--color-paper-raised)] transition-all duration-200"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-rule)] p-1 rounded-xl">
          {[
            { id: "all", label: "All Sessions" },
            { id: "active", label: "Active" },
            { id: "closed", label: "Closed" },
            ...(subTab === "my-sessions" ? [
              { id: "owned", label: "Owned" },
              { id: "joined", label: "Joined" }
            ] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:opacity-90"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-[var(--color-ink-soft)] py-12 font-semibold text-sm">
          Loading sessions...
        </div>
      ) : error ? (
        <div className="text-center text-[var(--color-danger)] py-12 font-semibold text-sm">
          {error}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center text-[var(--color-ink-soft)] py-20 border border-dashed border-[var(--color-rule)] rounded-2xl bg-[var(--color-paper-raised)]">
          <p className="text-sm font-semibold">No workspaces found</p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((s) => {
            const isOwner = user?.uid === s.ownerId;
            const isActive = s.status === "active";

            return (
              <div
                key={s.roomId}
                className="group relative rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 transition-all duration-150 hover:-translate-y-[1px] active:translate-y-[0px] hover:border-[var(--color-accent)] hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Template badge */}
                  <span className="text-[9px] font-bold uppercase tracking-wider border border-[var(--color-rule)] bg-[var(--color-paper-muted)] text-[var(--color-ink-soft)] px-2 py-0.5 rounded">
                    {s.template.toUpperCase()}
                  </span>
                  
                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    isActive 
                      ? "bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)] text-[var(--color-success)] border-[color-mix(in_oklch,var(--color-success)_20%,transparent)]" 
                      : "bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] text-[var(--color-danger)] border-[color-mix(in_oklch,var(--color-danger)_20%,transparent)]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-danger)]"}`} />
                    {s.status}
                  </span>
                </div>

                {/* Title and 3-dots menu */}
                <div className="flex items-start justify-between gap-3 relative">
                  <div className="truncate flex-1">
                    <h3 className="font-bold text-[var(--color-ink)] text-sm group-hover:text-[var(--color-accent)] transition duration-150 truncate">{s.name}</h3>
                    <code className="block font-mono text-[10px] text-[var(--color-accent)] mt-1 select-all">{s.roomId}</code>
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuRoomId(openMenuRoomId === s.roomId ? null : s.roomId);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-paper-muted)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition duration-150 cursor-pointer focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    {openMenuRoomId === s.roomId && (
                      <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-1 shadow-md z-50 animate-fade-in">
                        {isActive ? (
                          <>
                            <button
                              onClick={() => {
                                handleJoinRoomShortcut(s.roomId);
                                setOpenMenuRoomId(null);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition duration-150 cursor-pointer"
                            >
                              Join Session
                            </button>
                            {isOwner && (
                              <>
                                <button
                                  onClick={() => {
                                    handleCloseRoom(s.roomId);
                                    setOpenMenuRoomId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] transition duration-150 cursor-pointer"
                                >
                                  Close Room
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteRoom(s.roomId);
                                    setOpenMenuRoomId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] transition duration-150 cursor-pointer"
                                >
                                  Delete Room
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {isOwner ? (
                              <>
                                <button
                                  onClick={() => {
                                    handleResumeRoom(s.roomId);
                                    setOpenMenuRoomId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-success)] hover:bg-[color-mix(in_oklch,var(--color-success)_8%,transparent)] transition duration-150 cursor-pointer"
                                >
                                  Resume Room
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteRoom(s.roomId);
                                    setOpenMenuRoomId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] transition duration-150 cursor-pointer"
                                >
                                  Delete Room
                                </button>
                              </>
                            ) : (
                              <div className="px-3 py-2 text-[10px] text-[var(--color-ink-soft)] font-bold italic text-center">
                                Closed by Owner
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description for public rooms */}
                {s.description && (
                  <p className="text-[11px] text-[var(--color-ink-soft)] mt-2.5 line-clamp-2 italic bg-[var(--color-paper-muted)] border border-[var(--color-rule)] p-2 rounded-lg leading-relaxed">
                    {s.description}
                  </p>
                )}

                {/* Metadata sections */}
                <div className="text-[11px] text-[var(--color-ink-soft)] space-y-1.5 mt-4 pt-3 border-t border-[var(--color-rule)]">
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="font-semibold text-[var(--color-ink)]">{isOwner ? "You" : s.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-[var(--color-ink-soft)]">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Active:</span>
                    <span className="text-[var(--color-ink-soft)]">
                      {new Date(s.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
