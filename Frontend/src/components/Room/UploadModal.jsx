function UploadModal({ fileCount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[440px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          boxShadow: "0 0 0 1px #30363d, 0 24px 48px #00000080, 0 0 60px #58a6ff18",
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="h-0.5" style={{ background: "#21262d" }} />
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "#58a6ff18", border: "1px solid #58a6ff30" }}>📤</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Upload Folder</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#7d8590" }}>{fileCount} files ready to import</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
            style={{ color: "#484f58" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e6edf3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#484f58"}
          >×</button>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#e3b34110", border: "1px solid #e3b34120", color: "#e6edf3" }}>
            ⚠ Uploading will <span style={{ color: "#f85149", fontWeight: 600 }}>replace your current workspace</span>. All existing files will be lost.
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
              style={{ background: "#21262d", color: "#fff", boxShadow: "0 4px 14px #58a6ff30" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >Upload & Replace</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
