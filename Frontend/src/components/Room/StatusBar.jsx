import { Users, Cloud, CloudOff, Loader2, Wifi, WifiOff } from "lucide-react";
import CopyRoomId from "./CopyRoomId";
import { LANGUAGES } from "./constants";

/** Bottom status bar: presence, connection, room ID, cursor position, language and sync state. */
export default function StatusBar({ users, roomId, language, cursor, connection, saveStatus, onSave }) {
  const lang = LANGUAGES.find((l) => l.id === language);
  const sync = {
    saved: { icon: Cloud, label: "Saved", cls: "is-ok" },
    saving: { icon: Loader2, label: "Saving…", cls: "is-busy" },
    unsaved: { icon: CloudOff, label: "Unsaved", cls: "is-warn" },
  }[saveStatus] || { icon: CloudOff, label: "Unsaved", cls: "is-warn" };
  const SyncIcon = sync.icon;
  const online = connection === "connected";

  return (
    <footer className="room-statusbar">
      <div className="room-statusbar-group">
        <span className={`room-status-item ${online ? "is-ok" : "is-warn"}`} title="Real-time collaboration">
          {online ? <Wifi size={12} /> : <WifiOff size={12} />} {online ? "Live" : "Reconnecting"}
        </span>
        <span className="room-status-item" title="Collaborators online"><Users size={12} /> {users.length} online</span>
      </div>

      <div className="room-statusbar-group room-hide-sm">
        <span className="room-status-item room-status-mono">{roomId}</span>
        <CopyRoomId roomId={roomId} />
      </div>

      <div className="room-statusbar-group">
        {cursor && <span className="room-status-item">Ln {cursor.lineNumber}, Col {cursor.column}</span>}
        <span className="room-status-item room-hide-sm">Spaces: 2</span>
        <span className="room-status-item room-hide-sm">UTF-8</span>
        {lang && <span className="room-status-item"><i className="room-status-dot" style={{ background: lang.color }} /> {lang.label}</span>}
        <button type="button" className={`room-status-item room-status-button ${sync.cls}`} onClick={onSave} title="Save to S3 now">
          <SyncIcon size={12} className={saveStatus === "saving" ? "animate-spin" : ""} /> {sync.label}
        </button>
      </div>
    </footer>
  );
}
