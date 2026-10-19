import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid, FolderKanban, Bot, BookOpen, Plus, LogIn, LogOut, Settings, ArrowRight,
  Globe2, Lock, FolderOpen, Users, Activity, Layers, Sparkles, RotateCw, TriangleAlert,
} from "lucide-react";
import { toast } from "../components/ui/toastStore";
import { apiFetch } from "../services/api";
import { logout } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";
import SessionsTab from "../components/Sessions/SessionsTab";
import ProfileImage from "../components/Dashboard/ProfileImage";
import AppShell from "../components/app/AppShell";
import Modal from "../components/ui/Modal";
import CommandPalette from "../components/ui/CommandPalette";
import { SkeletonCard } from "../components/ui/Skeleton";
import { TEMPLATES, templateColor, timeAgo } from "../lib/rooms";


const NAV = [
  { id: "Dashboard", label: "Overview", icon: LayoutGrid, title: "Overview" },
  { id: "Sessions", label: "Rooms", icon: FolderKanban, title: "Rooms" },
  { id: "AI Assist", label: "AI Assistant", icon: Bot, to: "/assistant" },
  { id: "Docs", label: "Docs", icon: BookOpen, to: "/docs" },
];


const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => (window.location.hash === "#rooms" ? "Sessions" : "Dashboard"));

  // Create / join dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [template, setTemplate] = useState("react");
  const [accessType, setAccessType] = useState("private");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState("");

  // Account
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // ProtectedRoute only renders this page once the user is known.
  const [settingsName, setSettingsName] = useState(() => user?.displayName || "");
  const [settingsPhoto, setSettingsPhoto] = useState(() => user?.photoURL || "");
  const [avatarUrl, setAvatarUrl] = useState(() => user?.photoURL || "");
  const avatarFileInputRef = useRef(null);

  // Data
  const [myRooms, setMyRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);


  // Pull the saved profile (MongoDB) and mirror the display name into Firebase.
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/users/profile/${user.uid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.photoURL) { setAvatarUrl(data.photoURL); setSettingsPhoto(data.photoURL); }
        if (data.displayName) {
          setSettingsName(data.displayName);
          const { auth } = await import("../firebase/firebase");
          const { updateProfile } = await import("firebase/auth");
          if (auth.currentUser && auth.currentUser.displayName !== data.displayName) {
            await updateProfile(auth.currentUser, { displayName: data.displayName });
          }
        }
      } catch (err) {
        console.error("Error syncing profile:", err);
      }
    })();
  }, [user?.uid]);

  useEffect(() => {
    if (activeTab !== "Dashboard" || !user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const [mine, pub] = await Promise.all([apiFetch(`/api/rooms/user/${user.uid}`), apiFetch("/api/rooms/public")]);
        if (cancelled) return;
        if (!mine.ok) throw new Error(`rooms ${mine.status}`);
        setMyRooms(await mine.json());
        if (pub.ok) setPublicRooms(await pub.json());
        setDashError(false);
      } catch (err) {
        console.error(err);
        if (!cancelled) setDashError(true);
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, user?.uid, reloadKey]);

  const handleLogout = async () => {
    try { await logout(); window.location.href = "/"; }
    catch (error) { console.error(error); }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Choose an image smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { setSettingsPhoto(reader.result); setAvatarUrl(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    if (!settingsName.trim()) return;
    try {
      const res = await apiFetch("/api/users/profile", {
        method: "POST",
        body: JSON.stringify({ displayName: settingsName.trim(), photoURL: settingsPhoto.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      const { auth } = await import("../firebase/firebase");
      const { updateProfile } = await import("firebase/auth");
      if (auth.currentUser) {
        const payload = { displayName: settingsName.trim() };
        if (settingsPhoto && !settingsPhoto.startsWith("data:")) payload.photoURL = settingsPhoto.trim();
        await updateProfile(auth.currentUser, payload);
      }
      setAvatarUrl(settingsPhoto);
      toast.success("Profile updated.");
      setShowSettingsModal(false);
    } catch (err) {
      console.error(err);
      toast.error("We couldn't update your profile. Try again.");
    }
  };

  const handleCreateRoom = async (event) => {
    event?.preventDefault();
    const name = roomName.trim();
    if (!name || creating) return;
    if (myRooms.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.ownerId === user?.uid)) {
      toast.error("You already have a room with this name. Pick a different one.");
      return;
    }
    setCreating(true);
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const segment = (length) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const newRoomId = `cfai-${segment(4)}-${segment(4)}`;

    const { getTemplateFiles } = await import("../services/templates");
    const { saveWorkspaceFiles } = await import("../services/db");
    const rootFolder = name.replace(/[^a-zA-Z0-9_-]/g, "_") || "Project";
    const projectFiles = getTemplateFiles(template).map((file) => ({ ...file, path: `${rootFolder}/${file.path}` }));
    projectFiles.push({ path: rootFolder, isFolder: true, content: undefined });
    await saveWorkspaceFiles(newRoomId, projectFiles);

    socket.emit("create-room", {
      roomId: newRoomId,
      roomName: name,
      username: user?.displayName || user?.email?.split("@")[0] || "Developer",
      photoURL: user?.photoURL || "",
      template,
      files: JSON.stringify(projectFiles),
      accessType,
      description,
    });
    navigate(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (event) => {
    event.preventDefault();
    const id = joinId.trim();
    if (id) navigate(`/room/${id}`);
  };

  const displayName = settingsName || user?.displayName || user?.email?.split("@")[0] || "Developer";
  const initials = displayName.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "CF";
  const openCreate = () => setCreateOpen(true);
  const openJoin = () => setJoinOpen(true);

  const stats = useMemo(() => {
    const active = myRooms.filter((r) => r.status !== "closed").length;
    const owned = myRooms.filter((r) => r.ownerId === user?.uid).length;
    const collaborators = new Set(myRooms.flatMap((r) => (r.participants || []).map((p) => (typeof p === "string" ? p : p?.userId))).filter((id) => id && id !== user?.uid)).size;
    return [
      { label: "Rooms", value: myRooms.length, hint: `${owned} owned`, icon: Layers, color: "#2563eb" },
      { label: "Active now", value: active, hint: `${myRooms.length - active} closed`, icon: Activity, color: "#16a34a" },
      { label: "Collaborators", value: collaborators, hint: "across your rooms", icon: Users, color: "#db2777" },
      { label: "Public hub", value: publicRooms.length, hint: "open rooms", icon: Globe2, color: "#d97706" },
    ];
  }, [myRooms, publicRooms, user?.uid]);

  const recentRooms = useMemo(() => myRooms.map((r) => ({ ...r, color: templateColor(r.template) })), [myRooms]);

  const paletteCommands = [
    { id: "new-room", group: "Actions", label: "Create a new room", icon: Plus, keywords: ["new", "project"], run: openCreate },
    { id: "join-room", group: "Actions", label: "Join a room by ID", icon: LogIn, run: openJoin },
    ...NAV.map(({ id, label, icon, to }) => ({ id: `tab-${id}`, group: "Navigate", label: `Go to ${label}`, icon, run: () => (to ? navigate(to) : setActiveTab(id)) })),
    ...myRooms.slice(0, 8).map((room) => ({ id: `room-${room.roomId}`, group: "Recent rooms", label: room.name, hint: room.roomId, icon: FolderOpen, keywords: [room.roomId], run: () => navigate(`/room/${room.roomId}`) })),
    { id: "settings", group: "Account", label: "Account settings", icon: Settings, run: () => setShowSettingsModal(true) },
    { id: "logout", group: "Account", label: "Sign out", icon: LogOut, run: handleLogout },
  ];
  const paletteDynamic = (q) => (/^cfai-[a-z0-9]{4}-[a-z0-9]{4}$/i.test(q)
    ? [{ id: "join-typed", group: "Jump", label: `Join room ${q}`, icon: ArrowRight, run: () => navigate(`/room/${q}`) }]
    : []);

  const current = NAV.find((n) => n.id === activeTab) || NAV[0];

  return (
    <>
      <AppShell
        nav={NAV.map((n) => (n.id === "Sessions" && myRooms.length ? { ...n, badge: myRooms.length } : n))}
        active={activeTab}
        onNavigate={(id) => { const item = NAV.find((n) => n.id === id); if (item?.to) navigate(item.to); else setActiveTab(id); }}
        recentRooms={recentRooms}
        onOpenRoom={(id) => navigate(`/room/${id}`)}
        user={user}
        avatarUrl={avatarUrl}
        displayName={displayName}
        onSettings={() => setShowSettingsModal(true)}
        onLogout={handleLogout}
        title={current.title}
        actions={<button type="button" className="cf-secondary-button" onClick={openJoin}><LogIn size={16} /> <span className="label">Join</span></button>}
        onNewRoom={openCreate}
      >
        {activeTab === "Dashboard" && (
          <div className="cf-rise">
            <section className="welcome">
              <div>
                <h2>{greeting()}, {displayName.split(" ")[0]}</h2>
                <p>Here's what's happening across your workspaces.</p>
              </div>
            </section>

            <section className="stats" aria-label="Workspace summary">
              {stats.map(({ label, value, hint, icon: Icon, color }) => (
                <div key={label} className="stat">
                  <span><Icon size={16} style={{ color }} aria-hidden="true" /> {label}</span>
                  <strong>{dashLoading ? "—" : value}</strong>
                  <small>{hint}</small>
                </div>
              ))}
            </section>

            <section>
              <div className="quick-actions">
                <button type="button" className="quick-action" onClick={openCreate}>
                  <span className="quick-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}><Plus size={20} /></span>
                  <span className="quick-action-text"><strong>New room</strong><small>Start from React, Vue, Node or a blank project.</small></span>
                </button>
                <button type="button" className="quick-action" onClick={openJoin}>
                  <span className="quick-action-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}><LogIn size={20} /></span>
                  <span className="quick-action-text"><strong>Join a room</strong><small>Paste a room ID a teammate shared with you.</small></span>
                </button>
                <button type="button" className="quick-action" onClick={() => navigate("/assistant")}>
                  <span className="quick-action-icon" style={{ background: "#f5f3ff", color: "#7c3aed" }}><Sparkles size={20} /></span>
                  <span className="quick-action-text"><strong>Ask the AI</strong><small>Explain, debug or generate code with Gemini.</small></span>
                </button>
              </div>
            </section>

            <div className="overview-grid">
              <section>
                <div className="page-section-head">
                  <div><h2>Recent rooms</h2><p>Rooms you created or joined.</p></div>
                  {myRooms.length > 0 && <button type="button" className="page-link" onClick={() => setActiveTab("Sessions")}>View all <ArrowRight size={14} /></button>}
                </div>
                {dashError ? (
                  <div className="error-banner" role="alert">
                    <TriangleAlert size={18} /> We couldn't load your rooms. Check that the API is running.
                    <button type="button" className="cf-secondary-button" onClick={() => { setDashLoading(true); setReloadKey((k) => k + 1); }}><RotateCw size={14} /> Retry</button>
                  </div>
                ) : dashLoading ? (
                  <div style={{ display: "grid", gap: "0.5rem" }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
                ) : myRooms.length === 0 ? (
                  <div className="cf-empty" style={{ padding: "2.5rem 1rem" }}>
                    <FolderOpen size={22} /><strong>No rooms yet</strong>
                    <span>Create your first room to start coding with your team.</span>
                    <button type="button" className="cf-primary-button" style={{ marginTop: "0.75rem" }} onClick={openCreate}><Plus size={15} /> New room</button>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Name</th><th className="hide-sm">Template</th><th>Status</th><th className="hide-sm">Updated</th></tr></thead>
                      <tbody>
                        {myRooms.slice(0, 6).map((room) => (
                          <tr key={room.roomId} onClick={() => navigate(`/room/${room.roomId}`)}>
                            <td>
                              <div className="table-name">
                                <i style={{ background: templateColor(room.template) || "var(--color-ink-faint)" }} />
                                <div><strong>{room.name}</strong><code>{room.roomId}</code></div>
                              </div>
                            </td>
                            <td className="hide-sm"><span className="chip">{room.template || "custom"}</span></td>
                            <td><span className={`status ${room.status === "closed" ? "is-closed" : "is-active"}`}>{room.status === "closed" ? "Closed" : "Active"}</span></td>
                            <td className="table-muted hide-sm">{timeAgo(room.updatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <aside>
                <div className="page-section-head">
                  <div><h2>Public hub</h2><p>Open rooms anyone can join.</p></div>
                  <button type="button" className="page-link" onClick={() => setActiveTab("Sessions")}>Browse <ArrowRight size={14} /></button>
                </div>
                {dashLoading ? (
                  <div style={{ display: "grid", gap: "0.5rem" }}><SkeletonCard /><SkeletonCard /></div>
                ) : publicRooms.length === 0 ? (
                  <div className="cf-empty"><Globe2 size={20} /><strong>No public rooms</strong><span>Make a room public to list it here.</span></div>
                ) : (
                  <div style={{ display: "grid", gap: "0.6rem" }}>
                    {publicRooms.slice(0, 4).map((room) => (
                      <button type="button" key={room.roomId} className="hub-card" onClick={() => navigate(`/room/${room.roomId}`)}>
                        <header><h3>{room.name}</h3><span className="chip">{room.template || "custom"}</span></header>
                        <p>{room.description || "No description"}</p>
                        <footer><span>{room.ownerName || "Anonymous"}</span><span>{timeAgo(room.updatedAt)}</span></footer>
                      </button>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {activeTab === "Sessions" && <SessionsTab handleJoinRoomShortcut={(id) => navigate(`/room/${id}`)} onCreateRoomClick={openCreate} />}
      </AppShell>

      <CommandPalette commands={paletteCommands} dynamic={paletteDynamic} />

      {/* ── Create room ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} className="create-dialog"
        title="Create a room" description="You'll get a room ID to share with collaborators.">
        <form className="cf-form" onSubmit={handleCreateRoom} id="create-room-form">
          <div className="cf-field">
            <label htmlFor="roomNameInput">Project name</label>
            <input id="roomNameInput" autoFocus value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. design-system-refresh" maxLength={60} required />
          </div>
          <div className="cf-field">
            <label>Template</label>
            <div className="cf-template-grid">
              {TEMPLATES.map((item) => (
                <button type="button" key={item.id} aria-pressed={template === item.id} className={`cf-template ${template === item.id ? "is-selected" : ""}`} onClick={() => setTemplate(item.id)}>
                  <span className="cf-template-icon" style={{ background: item.tint, color: item.color }}><item.icon size={16} /></span><strong>{item.name}</strong><span>{item.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cf-field">
            <label>Visibility</label>
            <div className="cf-segmented" style={{ marginBottom: 0 }}>
              <button type="button" aria-pressed={accessType === "private"} onClick={() => setAccessType("private")}><Lock size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />Private</button>
              <button type="button" aria-pressed={accessType === "public"} onClick={() => setAccessType("public")}><Globe2 size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />Public</button>
            </div>
          </div>
          {accessType === "public" && (
            <div className="cf-field">
              <label htmlFor="roomDescription">Description</label>
              <textarea id="roomDescription" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project for?" />
            </div>
          )}
          <div className="cf-dialog-actions" style={{ marginTop: "0.25rem" }}>
            <button type="button" className="cf-secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="cf-primary-button" disabled={!roomName.trim() || creating}>{creating ? "Creating…" : "Create room"}</button>
          </div>
        </form>
      </Modal>

      {/* ── Join room ── */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a room" description="Paste the room ID a collaborator shared with you.">
        <form className="cf-form" onSubmit={handleJoinRoom}>
          <div className="cf-field">
            <label htmlFor="join-room-input">Room ID</label>
            <input id="join-room-input" autoFocus value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="cfai-ab12-cd34" required style={{ fontFamily: "var(--font-mono)" }} />
          </div>
          <div className="cf-dialog-actions" style={{ marginTop: "0.25rem" }}>
            <button type="button" className="cf-secondary-button" onClick={() => setJoinOpen(false)}>Cancel</button>
            <button type="submit" className="cf-primary-button" disabled={!joinId.trim()}>Join room</button>
          </div>
        </form>
      </Modal>

      {/* ── Account settings ── */}
      <Modal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Account settings" description="Update how collaborators see you.">
        <div className="cf-form">
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <ProfileImage src={settingsPhoto} fallback={initials} alt="" className="app-avatar" style={{ height: "3.25rem", width: "3.25rem" }} />
            <input type="file" accept="image/*" onChange={handleAvatarFileChange} hidden ref={avatarFileInputRef} />
            <button type="button" className="cf-secondary-button" onClick={() => avatarFileInputRef.current?.click()}>Upload photo</button>
          </div>
          <div className="cf-field">
            <label htmlFor="settingsName">Display name</label>
            <input id="settingsName" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="cf-field">
            <label htmlFor="settingsPhoto">Or photo URL</label>
            <input id="settingsPhoto" value={settingsPhoto.startsWith("data:") ? "" : settingsPhoto} onChange={(e) => setSettingsPhoto(e.target.value)} placeholder="https://example.com/avatar.png" />
          </div>
          <div className="cf-dialog-actions" style={{ marginTop: "0.25rem" }}>
            <button type="button" className="cf-secondary-button" onClick={() => setShowSettingsModal(false)}>Cancel</button>
            <button type="button" className="cf-primary-button" onClick={handleSaveSettings} disabled={!settingsName.trim()}>Save changes</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Dashboard;
