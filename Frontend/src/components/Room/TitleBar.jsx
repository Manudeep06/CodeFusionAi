import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, Loader2, Lock, Globe2, UserPlus, Check, Sparkles, Wifi, WifiOff } from "lucide-react";
import { BrandMark } from "../ui/Brand";
import { CollaboratorAvatar } from "./CollaboratorsPanel";

const SAVE = {
  saved: { label: "Saved", cls: "is-ok", title: "All edits are persisted to S3" },
  saving: { label: "Saving…", cls: "is-busy", title: "Flushing edits to S3" },
  unsaved: { label: "Unsaved", cls: "is-warn", title: "Edits are buffered and will be saved shortly" },
};
const CONNECTION = {
  connected: { label: "Connected", cls: "is-ok", icon: Wifi },
  connecting: { label: "Connecting…", cls: "is-warn", icon: Loader2 },
  disconnected: { label: "Offline", cls: "is-bad", icon: WifiOff },
};

/** Workspace toolbar: room identity, presence, invite, connection, AI toggle and save. */
export default function TitleBar({ roomName, roomId, access, users, connection, saveStatus, lastSavedTime, onSave, aiOpen, onToggleAI }) {
  const [copied, setCopied] = useState(false);
  const save = SAVE[saveStatus] || SAVE.unsaved;
  const conn = CONNECTION[connection] || CONNECTION.connecting;
  const ConnIcon = conn.icon;

  const invite = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <header className="room-titlebar">
      <div className="room-titlebar-left">
        <Link to="/dashboard" className="room-brand" title="Back to dashboard" aria-label="Back to dashboard"><BrandMark size={13} /></Link>
        <strong className="room-titlebar-name">{roomName || "Workspace"}</strong>
        <code className="room-titlebar-id">{roomId}</code>
        {access && (
          <span className="room-pill">{access === "public" ? <><Globe2 size={12} /> Public</> : <><Lock size={12} /> Private</>}</span>
        )}
      </div>

      <div className="room-titlebar-right">
        {users.length > 0 && (
          <div className="room-presence" title={users.map((u) => u.username).join(", ")}>
            {users.slice(0, 4).map((u, i) => (
              <span key={u.userId || i} className="room-presence-avatar"><CollaboratorAvatar photoURL={u.photoURL} username={u.username} size={24} /></span>
            ))}
            {users.length > 4 && <span className="room-presence-more">+{users.length - 4}</span>}
          </div>
        )}
        <button type="button" className="room-btn is-primary" onClick={invite} title="Copy invite link">
          {copied ? <Check size={14} /> : <UserPlus size={14} />} {copied ? "Link copied" : "Invite"}
        </button>
        <span className={`room-status ${conn.cls}`} title={`Real-time connection: ${conn.label}`}>
          <ConnIcon size={13} className={connection === "connecting" ? "animate-spin" : ""} /> <span className="room-hide-sm">{conn.label}</span>
        </span>
        <span className={`room-status ${save.cls}`} title={saveStatus === "saved" && lastSavedTime ? `${save.title} · ${new Date(lastSavedTime).toLocaleTimeString()}` : save.title}>
          {saveStatus === "saving" ? <Loader2 size={13} className="animate-spin" /> : <i />} <span className="room-hide-sm">{save.label}</span>
        </span>
        <button type="button" className="room-btn" onClick={onSave} disabled={saveStatus === "saving"} title="Save to S3 now (Ctrl+S)"><Save size={14} /> <span className="room-hide-sm">Save</span></button>
        <button type="button" className={`room-btn ${aiOpen ? "is-on" : ""}`} onClick={onToggleAI} aria-pressed={aiOpen} title="Toggle AI assistant">
          <Sparkles size={14} /> <span className="room-hide-sm">AI</span>
        </button>
      </div>
    </header>
  );
}
