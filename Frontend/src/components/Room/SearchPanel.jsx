import { useMemo } from "react";
import { Search, X } from "lucide-react";
import FileIcon from "./FileIcon";

const MAX_RESULTS = 200;

/** Workspace-wide search across file names and file contents. */
export default function SearchPanel({ files, query, onQueryChange, onOpen }) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const file of files) {
      if (file.isFolder) continue;
      const lines = (file.content || "").split("\n");
      let matched = false;
      for (let i = 0; i < lines.length && out.length < MAX_RESULTS; i++) {
        if (lines[i].toLowerCase().includes(q)) {
          out.push({ path: file.path, line: i + 1, text: lines[i].trim() });
          matched = true;
        }
      }
      if (!matched && file.path.toLowerCase().includes(q)) out.push({ path: file.path, line: 1, text: "File name match" });
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  }, [files, query]);

  return (
    <div className="room-panel-body">
      <label className="room-search">
        <Search size={13} aria-hidden="true" />
        <input autoFocus value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search files and code" aria-label="Search workspace" />
        {query && <button type="button" onClick={() => onQueryChange("")} aria-label="Clear search"><X size={12} /></button>}
      </label>

      {!query.trim() ? (
        <p className="room-panel-hint">Search file names and contents across the workspace.</p>
      ) : results.length === 0 ? (
        <p className="room-panel-hint">No results for “{query}”.</p>
      ) : (
        <>
          <p className="room-panel-meta">{results.length >= MAX_RESULTS ? `${MAX_RESULTS}+` : results.length} results</p>
          <ul className="room-search-results">
            {results.map((r, i) => (
              <li key={`${r.path}:${r.line}:${i}`}>
                <button type="button" onClick={() => onOpen(r.path)}>
                  <span className="room-search-file">
                    <FileIcon filename={r.path.split("/").pop()} size={12} />
                    <span>{r.path}</span>
                    <em>:{r.line}</em>
                  </span>
                  <code>{r.text}</code>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
