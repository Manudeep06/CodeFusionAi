import { Upload, TriangleAlert } from "lucide-react";
function UploadModal({ fileCount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[440px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 0 0 1px #e2e8f0, 0 24px 48px rgba(15,23,42,0.18)",
          animation: "slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="h-0.5" style={{ background: "#f1f5f9" }} />
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "#2563eb18", border: "1px solid #2563eb30" }}><Upload size={17} color="#2563eb" /></div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>Upload Folder</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>{fileCount} files ready to import</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
            style={{ color: "#94a3b8" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#0f172a"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
          >×</button>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#d9770610", border: "1px solid #d9770620", color: "#0f172a" }}>
            <TriangleAlert size={13} style={{ display: "inline", verticalAlign: "-2px", color: "#d97706" }} /> Uploading will <span style={{ color: "#dc2626", fontWeight: 600 }}>replace your current workspace</span>. All existing files will be lost.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#0f172a"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
            >Cancel</button>
            <button onClick={onConfirm}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: "#f1f5f9", color: "#fff", boxShadow: "0 4px 14px #2563eb30" }}
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
