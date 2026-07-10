import { useState, useEffect, useRef } from "react";

function NewItemModal({ isFolder, parentPath, existingPaths, onConfirm, onCancel }) {
  const [name,  setName]  = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 40); }, []);

  const submit = (e) => {
    e.preventDefault();
    const t = name.trim();
    if (!t)               return setError("A file name must be provided.");
    if (t.includes("/"))  return setError("The name may not contain '/'.");
    const full = parentPath ? `${parentPath}/${t}` : t;
    if (existingPaths.includes(full)) return setError("A file or folder with that name already exists.");
    onConfirm(t);
  };

  const accentColor = isFolder ? "#e3b341" : "#58a6ff";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[440px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          boxShadow: `0 0 0 1px #30363d, 0 24px 48px #00000080, 0 0 60px ${accentColor}18`,
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: accentColor + "18", border: `1px solid ${accentColor}30` }}
          >
            {isFolder ? "📁" : "📄"}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
              New {isFolder ? "Folder" : "File"}
            </h3>
            {parentPath && (
              <p className="text-[11px] mt-0.5" style={{ color: "#7d8590", fontFamily: "Consolas, monospace" }}>
                inside / {parentPath}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none transition-colors"
            style={{ color: "#484f58" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#484f58"}
          >×</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="px-5 pb-5 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#7d8590" }}>
              {isFolder ? "Folder" : "File"} Name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={isFolder ? "e.g.  components" : "e.g.  index.js"}
              spellCheck={false}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-150"
              style={{
                background: "#0d1117",
                color: "#e6edf3",
                border: `1px solid ${error ? "#f85149" : accentColor + "60"}`,
                fontFamily: "'Consolas', monospace",
                boxShadow: error ? "0 0 0 3px #f8514920" : `0 0 0 3px ${accentColor}12`,
              }}
            />
            {error && (
              <p className="mt-2 text-[11px] flex items-center gap-1.5" style={{ color: "#f85149" }}>
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button" onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ background: "#21262d", color: "#7d8590", border: "1px solid #30363d" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#7d8590"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all duration-150"
              style={{ background: accentColor, color: "#fff" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Create {isFolder ? "Folder" : "File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewItemModal;
