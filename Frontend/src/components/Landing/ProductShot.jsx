/**
 * Static rendering of the CodeFusionAI workspace used on the landing page.
 * Decorative only (aria-hidden); the collaborator cursors are CSS-animated.
 */
const files = [
  { name: "src", folder: true, depth: 0 },
  { name: "server.js", depth: 1, active: true },
  { name: "routes.js", depth: 1 },
  { name: "package.json", depth: 0 },
  { name: "README.md", depth: 0 },
];

const Line = ({ n, children, highlight }) => (
  <span className={`lp-line ${highlight ? "is-hl" : ""}`}><span className="lp-ln">{n}</span>{children}{"\n"}</span>
);
const K = ({ children }) => <span className="code-keyword">{children}</span>;
const S = ({ children }) => <span className="code-str">{children}</span>;
const F = ({ children }) => <span className="code-func">{children}</span>;

export default function ProductShot({ large = false }) {
  return (
    <div className={`lp-shot ${large ? "is-large" : ""}`} aria-hidden="true">
      <div className="lp-shot-titlebar">
        <span className="lp-dots"><i /><i /><i /></span>
        <span className="lp-shot-crumb">payments-api / src / <b>server.js</b></span>
        <span className="lp-shot-presence">
          <em style={{ background: "#6366f1" }}>M</em>
          <em style={{ background: "#0ea5e9" }}>R</em>
          <span>● 2 online</span>
        </span>
      </div>

      <div className="lp-shot-body">
        <aside className="lp-shot-explorer">
          <p>Explorer</p>
          {files.map((f) => (
            <div key={f.name} className={`lp-file ${f.active ? "is-active" : ""}`} style={{ paddingLeft: `${0.75 + f.depth * 0.85}rem` }}>
              <span className={f.folder ? "lp-ico-folder" : "lp-ico-file"} />
              {f.name}
            </div>
          ))}
        </aside>

        <div className="lp-shot-main">
          <div className="lp-shot-tabs"><span className="is-active">server.js</span><span>routes.js</span></div>
          <pre className="lp-shot-code">
            <code>
              <Line n={10}><K>import</K> express <K>from</K> <S>"express"</S>;</Line>
              <Line n={11} />
              <Line n={12}>app.<F>post</F>(<S>"/charge"</S>, <K>async</K> (req, res) =&gt; {"{"}</Line>
              <Line n={13}>{"  "}<K>const</K> {"{ amount }"} = req.body;<span className="lp-cursor is-riya" data-name="Riya" /></Line>
              <Line n={14} highlight>{"  "}res.<F>json</F>({"{ ok: "}<K>true</K>{" }"});<span className="lp-cursor is-manu" data-name="Manudeep" /></Line>
              <Line n={15}>{"}"});</Line>
            </code>
          </pre>
          {large && (
            <div className="lp-shot-terminal">
              <p className="lp-shot-panel-tabs"><b>Terminal</b><span>Problems</span><span>Output</span></p>
              <p><span className="lp-prompt">❯</span> npm run dev</p>
              <p className="ok">Server listening on :3000</p>
            </div>
          )}
        </div>

        <aside className="lp-shot-ai">
          <p>AI assistant</p>
          <div className="lp-msg user">Find bugs in the selection</div>
          <div className="lp-msg">
            <code>amount</code> isn't validated before charging. Add a guard for missing or negative values.
            <span className="lp-apply">Apply fix</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
