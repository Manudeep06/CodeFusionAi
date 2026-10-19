import { useMemo, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { X, RotateCcw, FilePlus2, FileMinus2, FileDiff } from "lucide-react";
import { defineMonacoTheme, MONACO_THEME } from "./monacoTheme";
import { getLangByExt } from "./constants";
import FileIcon from "./FileIcon";

/**
 * Side-by-side diff of a saved version (left) against the live workspace (right).
 * Lists only files that differ; restoring is delegated to the parent.
 */
export default function CompareView({ snapshot, files, onClose, onRestore, restoring }) {
  const changes = useMemo(() => {
    const before = new Map(snapshot.files.filter((f) => !f.isFolder).map((f) => [f.path, f.content || ""]));
    const after = new Map(files.filter((f) => !f.isFolder).map((f) => [f.path, f.content || ""]));
    const out = [];
    for (const [path, content] of before) {
      if (!after.has(path)) out.push({ path, kind: "deleted", before: content, after: "" });
      else if (after.get(path) !== content) out.push({ path, kind: "modified", before: content, after: after.get(path) });
    }
    for (const [path, content] of after) if (!before.has(path)) out.push({ path, kind: "added", before: "", after: content });
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }, [snapshot, files]);

  const [selected, setSelected] = useState(changes[0]?.path);
  const current = changes.find((c) => c.path === selected) || changes[0];
  const icons = { added: FilePlus2, deleted: FileMinus2, modified: FileDiff };

  return (
    <div className="room-compare">
      <header className="room-compare-head">
        <div>
          <strong>Compare v{snapshot.version} with current</strong>
          <span>{changes.length === 0 ? "No differences" : `${changes.length} file${changes.length === 1 ? "" : "s"} changed`} · saved {new Date(snapshot.createdAt).toLocaleString()}</span>
        </div>
        <button type="button" className="room-btn is-primary" onClick={() => onRestore(snapshot.version)} disabled={restoring}><RotateCcw size={14} /> Restore v{snapshot.version}</button>
        <button type="button" className="room-icon-btn" onClick={onClose} aria-label="Close comparison"><X size={16} /></button>
      </header>
      {changes.length === 0 ? (
        <p className="room-bottom-empty">This version is identical to the current workspace.</p>
      ) : (
        <div className="room-compare-body">
          <ul className="room-compare-files">
            {changes.map((c) => {
              const Icon = icons[c.kind];
              return (
                <li key={c.path}>
                  <button type="button" className={c.path === current?.path ? "is-active" : ""} onClick={() => setSelected(c.path)}>
                    <FileIcon filename={c.path.split("/").pop()} size={13} />
                    <span>{c.path}</span>
                    <Icon size={13} className={`is-${c.kind}`} aria-label={c.kind} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="room-compare-diff">
            <div className="room-compare-labels"><span>v{snapshot.version}</span><span>Current</span></div>
            <DiffEditor
              height="100%"
              theme={MONACO_THEME}
              beforeMount={defineMonacoTheme}
              language={getLangByExt(current.path)?.id || "plaintext"}
              original={current.before}
              modified={current.after}
              options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono', Consolas, monospace", scrollBeyondLastLine: false, automaticLayout: true }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
