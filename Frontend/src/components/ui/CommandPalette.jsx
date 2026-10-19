import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";

/**
 * Ctrl/⌘+K command palette.
 * commands: [{ id, label, group, icon?: LucideIcon, hint?, keywords?, run() }]
 * dynamic(query) may return extra commands derived from the typed text
 * (e.g. "Join room cfai-…").
 */
export default function CommandPalette({ commands, dynamic }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const show = () => { setQuery(""); setActive(0); setOpen(true); };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) setOpen(false);
        else show();
      }
    };
    const onOpen = show;
    window.addEventListener("keydown", onKey);
    window.addEventListener("cf:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cf:open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const extra = dynamic ? dynamic(query.trim()) : [];
    const matched = commands.filter((c) =>
      !q || [c.label, c.group, ...(c.keywords || [])].join(" ").toLowerCase().includes(q));
    return [...extra, ...matched];
  }, [query, commands, dynamic]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (cmd) => {
    setOpen(false);
    // Let the dialog close before the command moves focus or navigates.
    requestAnimationFrame(() => cmd.run());
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); run(results[active]); }
  };

  let lastGroup = null;

  return (
    <dialog ref={dialogRef} className="cf-dialog cf-palette" aria-label="Command palette"
      onClose={() => setOpen(false)}
      onClick={(e) => { if (e.target === dialogRef.current) setOpen(false); }}>
      {open && (
        <div onKeyDown={onKeyDown}>
          <div className="cf-palette-search">
            <Search size={16} aria-hidden="true" />
            <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              placeholder="Search commands, or paste a room ID…" aria-label="Search commands"
              role="combobox" aria-expanded="true" aria-controls="cf-palette-list" />
            <kbd>Esc</kbd>
          </div>
          <ul id="cf-palette-list" ref={listRef} role="listbox" className="cf-palette-list">
            {results.length === 0 && <li className="cf-palette-empty">No commands match “{query}”.</li>}
            {results.map((cmd, i) => {
              const header = cmd.group !== lastGroup ? cmd.group : null;
              lastGroup = cmd.group;
              const Icon = cmd.icon;
              return (
                <li key={cmd.id} role="presentation">
                  {header && <p className="cf-palette-group">{header}</p>}
                  <div role="option" aria-selected={i === active} className="cf-palette-item"
                    onMouseMove={() => setActive(i)} onClick={() => run(cmd)}>
                    {Icon && <Icon size={16} aria-hidden="true" />}
                    <span>{cmd.label}</span>
                    {cmd.hint && <kbd>{cmd.hint}</kbd>}
                    {i === active && <CornerDownLeft size={14} className="cf-palette-enter" aria-hidden="true" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </dialog>
  );
}
