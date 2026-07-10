import { VS } from "./constants";

function ActivityIcon({ title, active, onClick, accentColor = "#58a6ff", children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-12 h-12 flex items-center justify-center relative group transition-all duration-150"
      style={{
        color: active ? VS.text : VS.textDim,
        borderLeft: active ? `2px solid ${accentColor}` : "2px solid transparent",
        background: active ? VS.hover : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "#7d8590";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "#484f58";
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
          style={{ background: "#21262d" }}
        />
      )}
      {children}
    </button>
  );
}

export default ActivityIcon;
