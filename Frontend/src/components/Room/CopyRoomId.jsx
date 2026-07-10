import { useState } from "react";

function CopyRoomId({ roomId }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy Room ID"
      className="flex items-center justify-center w-4 h-4 rounded transition-all duration-150"
      style={{ color: copied ? "#3fb950" : "#7d8590" }}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = "#a371f7"; }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = "#7d8590"; }}
    >
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l4 4 6-6" stroke="#3fb950" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="1" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 5v9a1 1 0 0 0 1 1h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export default CopyRoomId;
