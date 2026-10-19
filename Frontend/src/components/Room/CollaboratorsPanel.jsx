import { useState } from "react";
import { Users } from "lucide-react";

export function CollaboratorAvatar({ photoURL, username, size = 28 }) {
  const [imgError, setImgError] = useState(false);
  const style = { width: size, height: size };

  if (photoURL && !imgError) {
    return <img src={photoURL} alt={username || "User"} className="rounded-full object-cover shrink-0" style={style} referrerPolicy="no-referrer" onError={() => setImgError(true)} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white" style={{ ...style, background: "var(--vs-accent)" }}>
      {(username || "U")[0].toUpperCase()}
    </div>
  );
}

/** Who is in the room and what each person has open. */
export default function CollaboratorsPanel({ users }) {
  return (
    <div className="room-panel-body">
      <p className="room-panel-meta">{users.length} online</p>
      {users.length === 0 ? (
        <div className="room-empty">
          <Users size={20} />
          <p>You're the only one here. Share the room ID from the status bar to invite people.</p>
        </div>
      ) : (
        <ul className="room-people">
          {users.map((u, i) => (
            <li key={u.socketId || u.userId || i}>
              <span className="room-people-avatar">
                <CollaboratorAvatar photoURL={u.photoURL} username={u.username} />
                <i />
              </span>
              <span className="room-people-text">
                <strong>{u.username || "User"}</strong>
                <span>{u.activeFile ? `Editing ${u.activeFile.split("/").pop()}` : "Idle"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
