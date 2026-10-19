import { useEffect, useState } from "react";

const RELOAD_FLAG = "cf_isolation_reload";

/**
 * WebContainers need a cross-origin-isolated document (COOP + COEP headers).
 * The server only sends those headers for /room, /dashboard and /webcontainer
 * because they break Google sign-in popups elsewhere. When the user arrives at a
 * room through client-side navigation (e.g. from "/" or "/docs"), the current
 * document was loaded without them — so reload once to pick them up.
 */
export default function IsolatedRoute({ children }) {
  const needsReload = typeof window !== "undefined" && !window.crossOriginIsolated && sessionStorage.getItem(RELOAD_FLAG) !== window.location.pathname;
  const [ready] = useState(!needsReload);

  useEffect(() => {
    if (window.crossOriginIsolated) {
      sessionStorage.removeItem(RELOAD_FLAG);
      return;
    }
    if (needsReload) {
      // Remember we tried, so a server without the headers can't cause a reload loop.
      sessionStorage.setItem(RELOAD_FLAG, window.location.pathname);
      window.location.reload();
    }
  }, [needsReload]);

  if (!ready) {
    return (
      <div className="cf-app" style={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
        <span className="cf-pill"><span className="cf-live-dot" aria-hidden="true" /> Preparing your workspace…</span>
      </div>
    );
  }
  return children;
}
