import { useState } from "react";
import { CircleAlert, CircleX, Info, Terminal as TerminalIcon, ListTree, MonitorPlay, ChevronDown, ChevronUp } from "lucide-react";
import TerminalComponent from "./Terminal";

const SEVERITY = { 8: { icon: CircleX, cls: "is-error" }, 4: { icon: CircleAlert, cls: "is-warning" }, 2: { icon: Info, cls: "is-info" }, 1: { icon: Info, cls: "is-info" } };

/**
 * Terminal / Problems / Output / Console.
 * - Terminal: the existing WebContainer xterm (kept mounted so sessions survive tab switches).
 * - Problems: Monaco diagnostics for open models.
 * - Output: commands this workspace sent to the terminal (Run Code).
 * - Console: labelled placeholder — preview console capture isn't implemented.
 */
export default function BottomPanel({ height, problems, output, onOpenProblem, collapsed, onToggleCollapsed }) {
  const [tab, setTab] = useState("terminal");
  const errorCount = problems.filter((p) => p.severity === 8).length;
  const warnCount = problems.filter((p) => p.severity === 4).length;

  const tabs = [
    { id: "terminal", label: "Terminal", icon: TerminalIcon },
    { id: "problems", label: "Problems", icon: CircleAlert, badge: problems.length || null },
    { id: "output", label: "Output", icon: ListTree },
    { id: "console", label: "Console", icon: MonitorPlay },
  ];

  return (
    <section className="room-bottom" style={{ height: collapsed ? undefined : height }} aria-label="Panel">
      <div className="room-bottom-tabs" role="tablist">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id && !collapsed}
            onClick={() => { setTab(id); if (collapsed) onToggleCollapsed(); }}>
            <Icon size={13} aria-hidden="true" /> {label}
            {badge != null && <em className={errorCount ? "is-error" : ""}>{badge}</em>}
          </button>
        ))}
        <button type="button" className="room-icon-btn room-bottom-toggle" onClick={onToggleCollapsed} aria-label={collapsed ? "Expand panel" : "Collapse panel"}>
          {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      <div className="room-bottom-body" hidden={collapsed}>
        <div className="room-bottom-terminal" hidden={tab !== "terminal"}><TerminalComponent theme="light" /></div>

        {tab === "problems" && (
          problems.length === 0 ? (
            <p className="room-bottom-empty">No problems detected in open files.</p>
          ) : (
            <ul className="room-problems">
              <li className="room-problems-sum">{errorCount} error{errorCount === 1 ? "" : "s"}, {warnCount} warning{warnCount === 1 ? "" : "s"}</li>
              {problems.map((p, i) => {
                const { icon: Icon, cls } = SEVERITY[p.severity] || SEVERITY[2];
                return (
                  <li key={i}>
                    <button type="button" onClick={() => onOpenProblem(p)}>
                      <Icon size={14} className={cls} aria-hidden="true" />
                      <span className="room-problem-msg">{p.message}</span>
                      <span className="room-problem-loc">{p.file.split("/").pop()} [{p.line}, {p.column}]</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        )}

        {tab === "output" && (
          output.length === 0 ? (
            <p className="room-bottom-empty">Nothing here yet. Commands sent by <strong>Run Code</strong> are logged here.</p>
          ) : (
            <ul className="room-output">
              {output.map((o, i) => (
                <li key={i}><time>{new Date(o.at).toLocaleTimeString()}</time><code>{o.text}</code></li>
              ))}
            </ul>
          )
        )}

        {tab === "console" && (
          <p className="room-bottom-empty">
            Browser console output from the live preview isn't captured yet. Open the preview in a new tab and use your browser's DevTools to see <code>console.log</code> output.
          </p>
        )}
      </div>
    </section>
  );
}
