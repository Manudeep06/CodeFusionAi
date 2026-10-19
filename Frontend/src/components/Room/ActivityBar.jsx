import { Files, Search, Users, History, LogOut } from "lucide-react";

const ITEMS = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "users", label: "Collaborators", icon: Users },
  { id: "history", label: "Version history", icon: History },
];

/** VS Code-style left icon rail. Clicking the active item collapses the side panel. */
export default function ActivityBar({ active, onSelect, userCount, onLeave }) {
  return (
    <nav className="room-activity" aria-label="Workspace panels">
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={active === id ? "is-active" : ""} title={label} aria-label={label}
          aria-pressed={active === id} onClick={() => onSelect(active === id ? null : id)}>
          <Icon size={19} strokeWidth={1.8} />
          {id === "users" && userCount > 1 && <em>{userCount}</em>}
        </button>
      ))}
      <button type="button" className="room-activity-leave" title="Leave room" aria-label="Leave room" onClick={onLeave}>
        <LogOut size={18} strokeWidth={1.8} />
      </button>
    </nav>
  );
}
