import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, MoreHorizontal, ArrowUpRight, Copy, Power, RotateCcw, Trash2, Lock, Globe2, FolderOpen, Plus, TriangleAlert, RotateCw,
} from "lucide-react";
import { apiFetch } from "../../services/api";
import { toast } from "../ui/toastStore";
import { confirmDialog } from "../ui/confirmStore";
import { useAuth } from "../../context/AuthContext";
import Skeleton from "../ui/Skeleton";
import { templateColor, timeAgo } from "../../lib/rooms";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "closed", label: "Closed" },
  { id: "owned", label: "Owned" },
  { id: "joined", label: "Shared with me" },
];


function RowMenu({ room, isOwner, onOpen, onClose, onResume, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const run = (fn) => (e) => { e.stopPropagation(); setOpen(false); fn(); };
  return (
    <div className="row-menu" ref={ref}>
      <button type="button" className="app-icon-button" aria-label={`Actions for ${room.name}`} aria-haspopup="menu" aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div className="row-menu-list" role="menu">
          <button type="button" role="menuitem" onClick={run(onOpen)}><ArrowUpRight size={15} /> Open room</button>
          <button type="button" role="menuitem" onClick={run(() => { navigator.clipboard.writeText(room.roomId); toast.success("Room ID copied."); })}><Copy size={15} /> Copy room ID</button>
          {isOwner && (room.status === "closed"
            ? <button type="button" role="menuitem" onClick={run(onResume)}><RotateCcw size={15} /> Reopen room</button>
            : <button type="button" role="menuitem" onClick={run(onClose)}><Power size={15} /> Close room</button>)}
          {isOwner && <button type="button" role="menuitem" className="is-danger" onClick={run(onDelete)}><Trash2 size={15} /> Delete room</button>}
        </div>
      )}
    </div>
  );
}

export default function SessionsTab({ handleJoinRoomShortcut, onCreateRoomClick }) {
  const { user } = useAuth();
  const [view, setView] = useState("mine"); // mine | public
  const [mine, setMine] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const [m, p] = await Promise.all([apiFetch(`/api/rooms/user/${user.uid}`), apiFetch("/api/rooms/public")]);
        if (!m.ok || !p.ok) throw new Error("Failed to load rooms");
        const [mineData, publicData] = await Promise.all([m.json(), p.json()]);
        if (cancelled) return;
        setMine(mineData);
        setPublicRooms(publicData);
        setError(false);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const act = async (path, method, success) => {
    try {
      const res = await apiFetch(path, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Request failed");
      toast.success(success);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const closeRoom = (room) => act(`/api/rooms/${room.roomId}/close`, "POST", `"${room.name}" closed.`);
  const resumeRoom = (room) => act(`/api/rooms/${room.roomId}/resume`, "POST", `"${room.name}" reopened.`);
  const deleteRoom = async (room) => {
    const ok = await confirmDialog({
      title: `Delete "${room.name}"?`,
      body: "The room, its files and its version history will be permanently deleted. This can't be undone.",
      confirmLabel: "Delete room",
      danger: true,
    });
    if (ok) act(`/api/rooms/${room.roomId}`, "DELETE", `"${room.name}" deleted.`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = view === "mine" ? mine : publicRooms;
    return list.filter((r) => {
      const matches = !q || r.name?.toLowerCase().includes(q) || r.roomId.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
      if (!matches || view === "public") return matches;
      const owner = r.ownerId === user?.uid;
      if (filter === "active") return r.status !== "closed";
      if (filter === "closed") return r.status === "closed";
      if (filter === "owned") return owner;
      if (filter === "joined") return !owner;
      return true;
    });
  }, [view, mine, publicRooms, query, filter, user?.uid]);

  return (
    <div className="cf-rise">
      <div className="tabs" role="tablist" aria-label="Room lists">
        <button type="button" role="tab" aria-selected={view === "mine"} onClick={() => setView("mine")}>My rooms <em>{mine.length}</em></button>
        <button type="button" role="tab" aria-selected={view === "public"} onClick={() => setView("public")}>Public hub <em>{publicRooms.length}</em></button>
      </div>

      <div className="toolbar">
        <label className="search-input">
          <Search size={15} aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={view === "mine" ? "Search by name or room ID" : "Search public rooms"} aria-label="Search rooms" />
        </label>
        {view === "mine" && (
          <div className="segmented-sm" role="group" aria-label="Filter rooms">
            {FILTERS.map((f) => <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
          </div>
        )}
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          <TriangleAlert size={18} /> We couldn't load rooms. Check that the API is running.
          <button type="button" className="cf-secondary-button" onClick={() => { setLoading(true); reload(); }}><RotateCw size={14} /> Retry</button>
        </div>
      ) : loading ? (
        <div className="table-wrap" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ alignItems: "center", borderBottom: "1px solid var(--color-paper-sunken)", display: "flex", gap: "1rem", padding: "1rem 1.25rem" }}>
              <Skeleton width="0.6rem" height="0.6rem" />
              <div style={{ display: "grid", flex: 1, gap: "0.4rem" }}><Skeleton width="30%" /><Skeleton width="18%" height="0.7rem" /></div>
              <Skeleton width="4rem" /><Skeleton width="5rem" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="cf-empty" style={{ padding: "3rem 1rem" }}>
          {view === "mine" ? <FolderOpen size={24} /> : <Globe2 size={24} />}
          <strong>
            {query || filter !== "all" ? "No rooms match your filters" : view === "mine" ? "Create your first room" : "No public rooms yet"}
          </strong>
          <span>
            {query || filter !== "all" ? "Try a different search or filter." : view === "mine" ? "Pick a template, invite your team and start coding together." : "Make one of your rooms public to list it here."}
          </span>
          {view === "mine" && !query && filter === "all" && (
            <button type="button" className="cf-primary-button" style={{ marginTop: "0.75rem" }} onClick={onCreateRoomClick}><Plus size={15} /> New room</button>
          )}
        </div>
      ) : view === "mine" ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th className="hide-sm">Template</th><th className="hide-sm">Access</th><th>Status</th><th className="hide-sm">Updated</th><th className="table-actions"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {filtered.map((room) => {
                const isOwner = room.ownerId === user?.uid;
                return (
                  <tr key={room.roomId} onClick={() => handleJoinRoomShortcut(room.roomId)}>
                    <td>
                      <div className="table-name">
                        <i style={{ background: templateColor(room.template) || "var(--color-ink-ghost)" }} />
                        <div>
                          <strong>{room.name}</strong>
                          <code>{room.roomId}{!isOwner && ` · by ${room.ownerName || "someone else"}`}</code>
                        </div>
                      </div>
                    </td>
                    <td className="hide-sm"><span className="chip">{room.template || "custom"}</span></td>
                    <td className="hide-sm"><span className="chip-access">{room.accessType === "public" ? <><Globe2 size={14} /> Public</> : <><Lock size={14} /> Private</>}</span></td>
                    <td><span className={`status ${room.status === "closed" ? "is-closed" : "is-active"}`}>{room.status === "closed" ? "Closed" : "Active"}</span></td>
                    <td className="table-muted hide-sm">{timeAgo(room.updatedAt)}</td>
                    <td className="table-actions" onClick={(e) => e.stopPropagation()}>
                      <RowMenu room={room} isOwner={isOwner} onOpen={() => handleJoinRoomShortcut(room.roomId)}
                        onClose={() => closeRoom(room)} onResume={() => resumeRoom(room)} onDelete={() => deleteRoom(room)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hub-grid">
          {filtered.map((room) => (
            <button type="button" key={room.roomId} className="hub-card" onClick={() => handleJoinRoomShortcut(room.roomId)}>
              <header><h3>{room.name}</h3><span className="chip">{room.template || "custom"}</span></header>
              <p>{room.description || "No description"}</p>
              <footer><span>{room.ownerName || "Anonymous"}</span><span>{timeAgo(room.updatedAt)}</span></footer>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
