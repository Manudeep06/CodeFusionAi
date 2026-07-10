function DeleteModal({ path, isFolder, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[420px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          boxShadow: "0 0 0 1px #30363d, 0 24px 48px #00000080, 0 0 60px #f8514918",
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="h-0.5" style={{ background: "#21262d" }} />

        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "#f8514918", border: "1px solid #f8514930" }}>
            🗑
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Delete {isFolder ? "Folder" : "File"}</h3>
            <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: "#7d8590" }}>{path}</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
            style={{ color: "#484f58" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#484f58"}
          >×</button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#f8514910", border: "1px solid #f8514920", color: "#e6edf3" }}>
            {isFolder
              ? "This will permanently delete the folder and all files inside it."
              : "This will permanently delete this file."}{" "}
            <span style={{ color: "#7d8590" }}>This action cannot be undone.</span>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "#21262d", color: "#7d8590", border: "1px solid #30363d" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#7d8590"}
            >Cancel</button>
            <button onClick={onConfirm}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: "#21262d", color: "#fff", boxShadow: "0 4px 14px #f8514930" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;
