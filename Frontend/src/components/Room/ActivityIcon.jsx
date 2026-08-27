import { VS } from "./constants";

function ActivityIcon({ title, active, onClick, accentColor = "#6366f1", children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-12 h-12 flex items-center justify-center relative group transition-all duration-150 cursor-pointer select-none"
      style={{
        color: active ? "var(--vs-accent)" : "var(--vs-textMuted)",
        background: active ? "rgba(79, 70, 229, 0.12)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--vs-text)";
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--vs-textMuted)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md transition-all duration-150"
          style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
        />
      )}
      {children}
    </button>
  );
}

export default ActivityIcon;
