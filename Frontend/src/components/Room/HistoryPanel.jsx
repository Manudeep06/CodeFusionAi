import { useEffect, useState } from "react";
import { History, RotateCcw, RotateCw, Eye, TriangleAlert, Loader2 } from "lucide-react";
import { apiFetch } from "../../services/api";
import { timeAgo } from "../../lib/rooms";

const REASON = {
  auto: { label: "Auto", className: "is-auto" },
  manual: { label: "Manual", className: "is-manual" },
  restore: { label: "Restore", className: "is-restore" },
};

const bytes = (n = 0) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

/**
 * Lists saved versions of the room. "Compare" loads a version's files and
 * hands them to the parent (which opens a diff); "Restore" asks the parent to
 * restore through the socket so everyone in the room updates live.
 */
export default function HistoryPanel({ roomId, refreshKey, onCompare, onRestore, busyVersion }) {
  const [versions, setVersions] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [loadingVersion, setLoadingVersion] = useState(null);

  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/rooms/${roomId}/history`)
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then((list) => { if (!cancelled) { setVersions(list); setState("ready"); } })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [roomId, refreshKey, retryKey]);

  const compare = async (version) => {
    setLoadingVersion(version);
    try {
      const res = await apiFetch(`/api/rooms/${roomId}/history/${version}`);
      if (!res.ok) throw new Error("Couldn't load that version");
      const data = await res.json();
      onCompare(data);
    } finally {
      setLoadingVersion(null);
    }
  };

  return (
    <div className="room-panel-body">
      {state === "loading" && <p className="room-panel-hint"><Loader2 size={14} className="animate-spin" /> Loading versions…</p>}
      {state === "error" && (
        <div className="room-empty">
          <TriangleAlert size={20} />
          <p>We couldn't load the version history.</p>
          <button type="button" className="room-btn" onClick={() => { setState("loading"); setRetryKey((k) => k + 1); }}><RotateCw size={13} /> Retry</button>
        </div>
      )}
      {state === "ready" && versions.length === 0 && (
        <div className="room-empty">
          <History size={20} />
          <p>No saved versions yet. A version is recorded each time the workspace is saved to S3. Press <kbd>Ctrl S</kbd> to save one now.</p>
        </div>
      )}
      {state === "ready" && versions.length > 0 && (
        <>
          <p className="room-panel-meta">{versions.length} saved version{versions.length === 1 ? "" : "s"}</p>
          <ul className="room-versions">
            {versions.map((v, i) => {
              const reason = REASON[v.reason] || REASON.auto;
              return (
                <li key={v.version} className={i === 0 ? "is-latest" : ""}>
                  <div className="room-version-top">
                    <strong>v{v.version}</strong>
                    <span className={`room-version-badge ${reason.className}`}>{v.restoredFrom ? `Restored v${v.restoredFrom}` : reason.label}</span>
                    {i === 0 && <span className="room-version-current">Current</span>}
                  </div>
                  <p>{v.createdByName || "Auto-save"} · {timeAgo(v.createdAt)}</p>
                  <p className="room-version-sub">{v.fileCount} files · {bytes(v.totalBytes)}</p>
                  {i > 0 && (
                    <div className="room-version-actions">
                      <button type="button" className="room-btn" onClick={() => compare(v.version)} disabled={loadingVersion === v.version}>
                        {loadingVersion === v.version ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Compare
                      </button>
                      <button type="button" className="room-btn" onClick={() => onRestore(v.version)} disabled={busyVersion != null}>
                        {busyVersion === v.version ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Restore
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
