import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Menu, X, Settings, LogOut, ChevronsUpDown } from "lucide-react";
import { BrandMark } from "../ui/Brand";
import ProfileImage from "../Dashboard/ProfileImage";
import { openCommandPalette } from "../ui/palette";
import "../../styles/app.css";

/**
 * Authenticated app chrome: left sidebar (navigation, recent rooms, account),
 * page header with title + actions, and the scrollable content area.
 */
export default function AppShell({
  nav, active, onNavigate, recentRooms = [], onOpenRoom,
  user, avatarUrl, displayName, onSettings, onLogout,
  title, subtitle, actions, onNewRoom, children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = (displayName || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const go = (id) => { onNavigate(id); setDrawerOpen(false); };

  return (
    <div className={`app ${drawerOpen ? "is-drawer-open" : ""}`}>
      <aside className="app-sidebar" aria-label="Main">
        <div className="app-sidebar-top">
          <Link to="/dashboard" className="app-brand" onClick={() => go("Dashboard")}>
            <BrandMark size={15} /> CodeFusionAI
          </Link>
          <button type="button" className="app-icon-button app-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu"><X size={16} /></button>
        </div>

        <button type="button" className="app-search" onClick={openCommandPalette}>
          <Search size={14} aria-hidden="true" /> <span>Search</span> <kbd className="cf-kbd">Ctrl K</kbd>
        </button>

        <nav className="app-nav">
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} type="button" className={`app-nav-item ${active === id ? "is-active" : ""}`} aria-current={active === id ? "page" : undefined} onClick={() => go(id)}>
              <Icon size={16} aria-hidden="true" /> <span>{label}</span>
              {badge != null && <em>{badge}</em>}
            </button>
          ))}
        </nav>

        {recentRooms.length > 0 && (
          <div className="app-recent">
            <p>Recent rooms</p>
            {recentRooms.slice(0, 5).map((room) => (
              <button key={room.roomId} type="button" onClick={() => onOpenRoom(room.roomId)} title={room.roomId}>
                <i style={{ background: room.color || "var(--color-ink-faint)" }} />
                <span>{room.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="app-account" ref={menuRef}>
          {menuOpen && (
            <div className="app-account-menu" role="menu">
              <div className="app-account-menu-head">
                <strong>{displayName}</strong>
                <span>{user?.email}</span>
              </div>
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onSettings(); }}><Settings size={14} /> Account settings</button>
              <button type="button" role="menuitem" className="is-danger" onClick={onLogout}><LogOut size={14} /> Sign out</button>
            </div>
          )}
          <button type="button" className="app-account-button" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
            <ProfileImage src={avatarUrl} fallback={initials} alt="" className="app-avatar" />
            <span className="app-account-text">
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
            </span>
            <ChevronsUpDown size={14} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="app-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />

      <div className="app-main">
        <header className="app-header">
          <button type="button" className="app-icon-button app-menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="app-header-text">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="app-header-actions">
            {actions}
            {onNewRoom && <button type="button" className="cf-primary-button" onClick={onNewRoom}><Plus size={16} /> <span className="label">New room</span></button>}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
