import { useEffect, useState } from "react";
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

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);

  const handleLogout = async () => {
    try { await logout(); window.location.href = "/"; }
    catch (error) { console.error(error); }
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

  const initials = user?.displayName?.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || "CF";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Developer";

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
        <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
          <ProfileImage src={user?.photoURL} fallback={initials} alt="Profile" className="w-8 h-8 rounded-full object-cover text-xs" />
          <button className="cf-quiet-button" onClick={handleLogout}>Sign out</button>
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
            <div className="cf-summary"><span className="cf-summary-label">Rooms</span><strong className="cf-summary-value">{roomId ? "1" : "0"}</strong></div>
            <div className="cf-summary"><span className="cf-summary-label">Live collaboration</span><strong className="cf-summary-value">Ready</strong></div>
            <div className="cf-summary"><span className="cf-summary-label">AI assistant</span><strong className="cf-summary-value">Available</strong></div>
            <div className="cf-summary"><span className="cf-summary-label">Runtime</span><strong className="cf-summary-value">Online</strong></div>
          </section>

          <section className="cf-dashboard-grid">
            <div>
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
              <div className="cf-surface">
                <h2 className="cf-section-title">Account</h2>
                <div className="cf-meta-list">
                  <div className="cf-meta-row"><span>Signed in as</span><strong>{displayName}</strong></div>
                  <div className="cf-meta-row"><span>Email</span><strong>{user?.email || "—"}</strong></div>
                  <div className="cf-meta-row"><span>Provider</span><strong>{user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email"}</strong></div>
                </div>
              </div>
              <div className="cf-surface">
                <h2 className="cf-section-title">How rooms work</h2>
                <p className="cf-section-copy">Each room is a shared development environment. Your collaborators can edit files, use the terminal, and ask the assistant in the same session.</p>
              </div>
            </aside>
          </section>
        </main>
      )}

      {activeTab === "Sessions" && <main className="cf-dashboard-main"><SessionsTab handleJoinRoomShortcut={(id) => navigate(`/room/${id}`)} onCreateRoomClick={() => { setActiveTab("Dashboard"); setTimeout(focusRoom, 100); }} /></main>}
      {activeTab === "AI Assist" && <main className="cf-dashboard-main"><AIAssistTab /></main>}
      {activeTab === "Docs" && <main className="cf-dashboard-main"><DocsTab /></main>}
    </div>
  );
}

export default Dashboard;
