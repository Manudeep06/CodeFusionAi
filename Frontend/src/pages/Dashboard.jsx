import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";
import DocsTab from "../components/Docs/DocsTab";
import SessionsTab from "../components/Sessions/SessionsTab";
import AIAssistTab from "../components/AIAssist/AIAssistTab";
import ProfileImage from "../components/Dashboard/ProfileImage";
import Card from "../components/Dashboard/Card";

export { Card };

const templates = [
  { id: "react", name: "React", description: "Vite app" },
  { id: "vue", name: "Vue", description: "Vite app" },
  { id: "node", name: "Node", description: "Server" },
  { id: "vanilla", name: "Vanilla", description: "HTML + JS" },
];

const Mark = () => (
  <span className="cf-brand-mark" aria-hidden="true">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" /></svg>
  </span>
);

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [template, setTemplate] = useState("react");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [accessType, setAccessType] = useState("private");
  const [description, setDescription] = useState("");

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsPhoto, setSettingsPhoto] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const avatarFileInputRef = useRef(null);

  const [dashboardRooms, setDashboardRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [totalRoomsCount, setTotalRoomsCount] = useState(0);
  const [dashLoading, setDashLoading] = useState(false);

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (user) {
      setSettingsName(user.displayName || "");
      setSettingsPhoto(user.photoURL || "");
      setAvatarUrl(user.photoURL || "");
    }
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = () => setShowProfileMenu(false);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Sync profile data from MongoDB to Firebase on mount
  useEffect(() => {
    if (user?.uid) {
      const syncUserProfile = async () => {
        try {
          const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
          const res = await fetch(`${baseUrl}/api/users/profile/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.photoURL) {
              setAvatarUrl(data.photoURL);
              setSettingsPhoto(data.photoURL);
            }
            if (data.displayName) {
              setSettingsName(data.displayName);
              const { auth } = await import("../firebase/firebase");
              const { updateProfile } = await import("firebase/auth");
              if (auth.currentUser && auth.currentUser.displayName !== data.displayName) {
                await updateProfile(auth.currentUser, {
                  displayName: data.displayName
                });
              }
            }
          }
        } catch (err) {
          console.error("Error syncing profile with MongoDB:", err);
        }
      };
      syncUserProfile();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (activeTab === "Dashboard" && user?.uid) {
      const fetchDashboardData = async () => {
        setDashLoading(true);
        try {
          const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
          const resUser = await fetch(`${baseUrl}/api/rooms/user/${user.uid}`);
          if (resUser.ok) {
            const dataUser = await resUser.json();
            setDashboardRooms(dataUser.slice(0, 3)); // show top 3 recent rooms
            setTotalRoomsCount(dataUser.length);
          }
          const resPublic = await fetch(`${baseUrl}/api/rooms/public`);
          if (resPublic.ok) {
            const dataPublic = await resPublic.json();
            setPublicRooms(dataPublic.slice(0, 3)); // show top 3 public rooms
          }
        } catch (err) {
          console.error(err);
        } finally {
          setDashLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [activeTab, user?.uid]);

  const handleLogout = async () => {
    try { await logout(); window.location.href = "/"; }
    catch (error) { console.error(error); }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { // limit 2MB
      alert("Image size should be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettingsPhoto(reader.result);
      setAvatarUrl(reader.result); // live-preview in header
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    if (!settingsName.trim()) return;
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

      // 1. Save in MongoDB
      const resMongo = await fetch(`${baseUrl}/api/users/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          displayName: settingsName.trim(),
          photoURL: settingsPhoto.trim(),
        }),
      });
      if (!resMongo.ok) {
        throw new Error("Failed to save profile in MongoDB");
      }

      // 2. Save in Firebase
      const { auth } = await import("../firebase/firebase");
      const { updateProfile } = await import("firebase/auth");
      if (auth.currentUser) {
        const updatePayload = {
          displayName: settingsName.trim(),
        };
        if (settingsPhoto && !settingsPhoto.startsWith("data:")) {
          updatePayload.photoURL = settingsPhoto.trim();
        }
        await updateProfile(auth.currentUser, updatePayload);
        // Immediately update avatarUrl so header reflects new photo without full reload
        setAvatarUrl(settingsPhoto);
        alert("Settings updated successfully!");
        setShowSettingsModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile settings.");
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/rooms/user/${user?.uid}`);
      if (response.ok) {
        const rooms = await response.json();
        if (rooms.some((room) => room.name.toLowerCase() === roomName.trim().toLowerCase() && room.ownerId === user?.uid)) {
          alert("A room with this name already exists in your account. Use a unique name.");
          return;
        }
      }
    } catch (error) {
      console.error("Error verifying room name uniqueness:", error);
    }

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const segment = (length) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const newRoomId = `cfai-${segment(4)}-${segment(4)}`;
    setRoomId(newRoomId);

    const { getTemplateFiles } = await import("../services/templates");
    const { saveWorkspaceFiles } = await import("../services/db");
    const rootFolder = roomName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Project";
    const projectFiles = getTemplateFiles(template).map((file) => ({ ...file, path: `${rootFolder}/${file.path}` }));
    projectFiles.push({ path: rootFolder, isFolder: true, content: undefined });
    await saveWorkspaceFiles(newRoomId, projectFiles);

    socket.emit("create-room", {
      roomId: newRoomId,
      roomName: roomName.trim(),
      ownerId: user?.uid || "",
      username: user?.displayName || user?.email?.split("@")[0] || "Developer",
      photoURL: user?.photoURL || "",
      template,
      files: JSON.stringify(projectFiles),
      accessType,
      description,
    });
    navigate(`/room/${newRoomId}`);
  };

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleJoinRoom = (event) => {
    event.preventDefault();
    if (!joinId.trim()) return;
    setIsJoining(true);
    socket.emit("join-room", joinId);
    navigate(`/room/${joinId}`);
  };

  const displayName = settingsName || user?.displayName || user?.email?.split("@")[0] || "Developer";
  const initials = displayName.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "CF";

  const focusRoom = () => document.getElementById("roomNameInput")?.focus();

  return (
    <div className="cf-app">
      <header className="cf-app-header">
        <div className="cf-brand"><Mark /> CodeFusionAI</div>
        <nav className="cf-nav" aria-label="Workspace navigation">
          {["Dashboard", "Sessions", "AI Assist", "Docs"].map((tab) => (
            <button key={tab} className={`cf-nav-button ${activeTab === tab ? "is-active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </nav>
        <div className="relative" style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
            }}
            className="focus:outline-none cursor-pointer rounded-full p-0.5 border border-transparent hover:border-[var(--color-rule)] transition duration-150 shrink-0 flex items-center gap-2"
          >
            <ProfileImage src={avatarUrl} fallback={initials} alt="Profile" className="w-8 h-8 rounded-full object-cover text-xs" />
            <span className="text-xs font-bold text-[var(--color-ink)] hidden sm:inline">{displayName}</span>
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 top-10 w-48 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-1.5 shadow-md z-50 animate-fade-in text-left">
              <div className="px-3 py-2 border-b border-[var(--color-rule)] mb-1">
                <p className="text-[11px] font-bold text-[var(--color-ink)] truncate">{displayName}</p>
                <p className="text-[9px] text-[var(--color-ink-soft)] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(true);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition duration-150 cursor-pointer"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] transition duration-150 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {activeTab === "Dashboard" && (
        <main className="cf-dashboard-main">
          <section className="cf-dashboard-hero">
            <div>
              <p className="cf-eyebrow">Your workspace</p>
              <h1 className="cf-dashboard-heading">Good to see you, {displayName}.</h1>
              <p className="cf-dashboard-copy">Start a room for your next build or continue with a shared project. Everything you need to collaborate lives in one focused space.</p>
            </div>
            <span className="cf-status">Services available</span>
          </section>

          <section className="cf-summary-grid" aria-label="Workspace summary">
            <div className="cf-summary"><span className="cf-summary-label">Rooms</span><strong className="cf-summary-value">{totalRoomsCount}</strong></div>
            <div className="cf-summary"><span className="cf-summary-label">Live collaboration</span><strong className="cf-summary-value">Ready</strong></div>
            <div className="cf-summary"><span className="cf-summary-label">AI assistant</span><strong className="cf-summary-value">Available</strong></div>
            <div className="cf-summary"><span className="cf-summary-label">Runtime</span><strong className="cf-summary-value">Online</strong></div>
          </section>

          <section className="cf-dashboard-grid">
            <div>
              {/* Create a room */}
              <div className="cf-surface">
                <h2 className="cf-section-title">Create a room</h2>
                <p className="cf-section-copy">Choose a starting point, name your project, then share the generated room link with your team.</p>
                {!roomId ? (
                  <div className="cf-form">
                    <div className="cf-field"><label htmlFor="roomNameInput">Project name</label><input id="roomNameInput" value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="e.g. Design system refresh" /></div>
                    <div><p className="cf-section-copy" style={{ marginBottom: "0.5rem" }}>Start from</p><div className="cf-template-grid">{templates.map((item) => <button type="button" key={item.id} className={`cf-template ${template === item.id ? "is-selected" : ""}`} onClick={() => setTemplate(item.id)}><strong>{item.name}</strong><span>{item.description}</span></button>)}</div></div>
                    <div className="cf-segmented" style={{ marginBottom: 0 }}><button type="button" aria-pressed={accessType === "private"} onClick={() => setAccessType("private")}>Private room</button><button type="button" aria-pressed={accessType === "public"} onClick={() => setAccessType("public")}>Public room</button></div>
                    {accessType === "public" && <div className="cf-field"><label htmlFor="roomDescription">Description</label><textarea id="roomDescription" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this project for?" /></div>}
                    <div className="cf-inline-actions"><button className="cf-primary-button" onClick={handleCreateRoom} disabled={!roomName.trim()}>Create room</button><span className="cf-section-copy" style={{ margin: 0 }}>Files are saved in your browser.</span></div>
                  </div>
                ) : (
                  <div className="cf-message success"><strong>Room ready: </strong><code>{roomId}</code><div className="cf-inline-actions"><button className="cf-secondary-button" onClick={handleCopyRoomId}>{copied ? "Copied" : "Copy room ID"}</button><button className="cf-primary-button" onClick={() => navigate(`/room/${roomId}`)}>Open room</button></div></div>
                )}
              </div>

              {/* Join a room */}
              <div className="cf-surface">
                <h2 className="cf-section-title">Join a room</h2>
                <p className="cf-section-copy">Paste a room ID shared by a collaborator to enter their workspace.</p>
                <form className="cf-form" onSubmit={handleJoinRoom}>
                  <div className="cf-field"><label htmlFor="join-room-input">Room ID</label><input id="join-room-input" value={joinId} onChange={(event) => setJoinId(event.target.value)} placeholder="cfai-ab12-cd34" required /></div>
                  <div className="cf-inline-actions"><button type="submit" className="cf-secondary-button" disabled={isJoining || !joinId.trim()}>{isJoining ? "Joining…" : "Join room"}</button><button type="button" className="cf-quiet-button" onClick={focusRoom}>Create a new room instead</button></div>
                </form>
              </div>
            </div>

            <aside>
              {/* Account details */}
              <div className="cf-surface">
                <h2 className="cf-section-title">Account</h2>
                <div className="cf-meta-list">
                  <div className="cf-meta-row"><span>Signed in as</span><strong>{displayName}</strong></div>
                  <div className="cf-meta-row"><span>Email</span><strong>{user?.email || "—"}</strong></div>
                  <div className="cf-meta-row"><span>Provider</span><strong>{user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email"}</strong></div>
                </div>
              </div>

              {/* Public Rooms Sidebar Highlights */}
              <div className="cf-surface">
                <h2 className="cf-section-title">Public Hub Highlights</h2>
                <p className="cf-section-copy font-medium">Browse active public rooms.</p>
                {dashLoading ? (
                  <p className="text-xs text-[var(--color-ink-soft)] italic py-2">Loading public rooms...</p>
                ) : publicRooms.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-soft)] italic py-2">No public rooms found.</p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {publicRooms.map((room) => (
                      <div key={room.roomId} className="flex flex-col gap-2 p-3 border border-[var(--color-rule)] rounded-xl bg-[var(--color-paper-raised)]">
                        <div>
                          <p className="text-xs font-bold text-[var(--color-ink)] truncate">{room.name}</p>
                          <p className="text-[10px] text-[var(--color-ink-soft)] italic truncate mt-0.5">{room.description || "No description"}</p>
                          <code className="text-[9px] text-[var(--color-accent)]">{room.roomId}</code>
                        </div>
                        <button
                          onClick={() => navigate(`/room/${room.roomId}`)}
                          className="w-full text-center py-1 bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:opacity-90 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer"
                        >
                          Join Room
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How rooms work */}
              <div className="cf-surface">
                <h2 className="cf-section-title">How rooms work</h2>
                <p className="cf-section-copy">Each room is a shared development environment. Your collaborators can edit files, use the terminal, and ask the assistant in the same session.</p>
              </div>
            </aside>
          </section>
        </main>
      )}

      {activeTab === "Sessions" && <main className="cf-dashboard-main cf-sessions-main"><SessionsTab handleJoinRoomShortcut={(id) => navigate(`/room/${id}`)} onCreateRoomClick={() => { setActiveTab("Dashboard"); setTimeout(focusRoom, 100); }} /></main>}
      {activeTab === "AI Assist" && <main className="cf-dashboard-main cf-ai-main"><AIAssistTab /></main>}
      {activeTab === "Docs" && <main className="cf-dashboard-main"><DocsTab /></main>}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-2xl w-full max-w-sm p-6 shadow-xl relative animate-card-enter">
            <h3 className="text-sm font-bold text-[var(--color-ink)] mb-4 uppercase tracking-wider">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2 border-b border-[var(--color-rule)] mb-2">
                <ProfileImage src={settingsPhoto} fallback={initials} alt="Preview" className="w-16 h-16 rounded-full object-cover text-lg border border-[var(--color-rule)]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                  ref={avatarFileInputRef}
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-rule)] hover:bg-[var(--color-paper-muted)] text-[11px] font-bold text-[var(--color-ink)] transition duration-150 cursor-pointer"
                >
                  Upload from system
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--color-ink-soft)] mb-1">Display Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="Your display name"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--color-ink-soft)] mb-1">Or Profile Image URL</label>
                <input
                  type="text"
                  value={settingsPhoto}
                  onChange={(e) => setSettingsPhoto(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-muted)] transition duration-150 cursor-pointer border border-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="cf-primary-button px-4 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
