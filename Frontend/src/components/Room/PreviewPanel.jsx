import { ExternalLink, X, Globe, RotateCw, Loader2 } from "lucide-react";
import { useRef } from "react";

/** Resizable live-preview pane showing the WebContainer dev server. */
export default function PreviewPanel({ url, width, isDragging, onDividerMouseDown, onClose }) {
  const frameRef = useRef(null);
  const reload = () => { if (frameRef.current) frameRef.current.src = url; };

  return (
    <>
      <div className="room-divider-v" onMouseDown={onDividerMouseDown} role="separator" aria-orientation="vertical" title="Drag to resize preview" />
      <section className="room-preview" style={{ width }} aria-label="Live preview">
        <div className="room-preview-bar">
          <div className="room-preview-url">
            <Globe size={12} aria-hidden="true" />
            <span>{url || "Waiting for dev server…"}</span>
          </div>
          {url && (
            <>
              <button type="button" onClick={reload} title="Reload preview"><RotateCw size={13} /></button>
              <button type="button" onClick={() => window.open(url, "_blank")} title="Open in a new tab"><ExternalLink size={13} /></button>
            </>
          )}
          <button type="button" onClick={onClose} title="Close preview"><X size={14} /></button>
        </div>
        <div className="room-preview-frame" style={{ pointerEvents: isDragging ? "none" : "auto" }}>
          {url ? (
            <iframe ref={frameRef} src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title="Live preview" />
          ) : (
            <div className="room-empty">
              <Loader2 size={20} className="animate-spin" />
              <p>Click <strong>Run Code</strong> to start the dev server. The preview opens here when it's ready.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
