import { Children, cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft, ArrowRight, ArrowUp, BookOpen, ChevronRight, Clock, Code2, Copy, Check, HelpCircle, Info, Lightbulb,
  Menu, Network, Rocket, Search, Sparkles, TriangleAlert, Users, Webhook, X, Pencil, Bug,
} from "lucide-react";
import { BrandMark } from "../components/ui/Brand";
import { docsSections, docsGroups } from "../components/Docs/docsContent";
import { useAuth } from "../context/AuthContext";
import "../styles/docs.css";

const REPO = "https://github.com/Manudeep06/CodeFusionAi";
const GROUP_ICONS = { "Getting started": Rocket, "Using the IDE": Code2, Architecture: Network, Reference: Webhook, Help: HelpCircle };
const TABS = [
  { id: "guides", label: "Guides", groups: ["Getting started", "Using the IDE", "Help"] },
  { id: "reference", label: "API reference", groups: ["Reference"] },
  { id: "architecture", label: "Architecture", groups: ["Architecture"] },
];
const QUICK_LINKS = [
  { id: "quickstart", title: "Quickstart", body: "Create a room and run a React app in about a minute.", icon: Rocket, tint: "#eff6ff", color: "#2563eb" },
  { id: "ai", title: "AI assistant", body: "Explain, debug and refactor with your file as context.", icon: Sparkles, tint: "#f5f3ff", color: "#7c3aed" },
  { id: "collaboration", title: "Collaboration", body: "Live cursors, presence and conflict-free editing.", icon: Users, tint: "#f0fdf4", color: "#16a34a" },
  { id: "rest-api", title: "API reference", body: "Every REST route and socket event.", icon: Webhook, tint: "#fffbeb", color: "#d97706" },
];

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const textOf = (children) => Children.toArray(children).map((c) => (typeof c === "string" ? c : isValidElement(c) ? textOf(c.props.children) : "")).join("");
const readMinutes = (md) => Math.max(1, Math.round(md.split(/\s+/).length / 200));

const callouts = {
  NOTE: { icon: Info, label: "Note" },
  TIP: { icon: Lightbulb, label: "Tip" },
  WARNING: { icon: TriangleAlert, label: "Warning" },
};

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const code = textOf(children).replace(/\n$/, "");
  const lang = (Children.toArray(children)[0]?.props?.className || "").replace("language-", "") || "code";
  return (
    <div className="docs-pre">
      <header>
        <span>{lang}</span>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
      </header>
      <pre>{children}</pre>
    </div>
  );
}

// Removes the leading "[!KIND]" marker from blockquote content.
function Strip({ marker, children }) {
  if (!marker) return children;
  let done = false;
  const walk = (node) => {
    if (done) return node;
    if (typeof node === "string") {
      if (node.includes(marker)) { done = true; return node.replace(marker, "").trimStart(); }
      return node;
    }
    if (isValidElement(node) && node.props.children) return cloneElement(node, undefined, ...Children.toArray(node.props.children).map(walk));
    return node;
  };
  return Children.map(children, walk);
}

const markdown = {
  h1: () => null, // the page renders its own title
  h2: ({ children }) => <h2 id={slug(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={slug(textOf(children))}>{children}</h3>,
  a: ({ href, children }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{children}</a>,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="docs-table"><table>{children}</table></div>,
  blockquote: ({ children }) => {
    const match = textOf(children).match(/^\s*\[!(NOTE|TIP|WARNING)\]/);
    const kind = match ? match[1] : "NOTE";
    const { icon: Icon, label } = callouts[kind];
    return (
      <aside className={`docs-callout is-${kind.toLowerCase()}`}>
        <Icon size={18} aria-hidden="true" />
        <div><strong>{label}</strong> <Strip marker={match?.[0].trim()}>{children}</Strip></div>
      </aside>
    );
  },
};

export default function Docs() {
  const { page } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState(null);
  const articleRef = useRef(null);
  const searchRef = useRef(null);

  const index = Math.max(0, docsSections.findIndex((s) => s.id === page));
  const section = docsSections[index];
  const prev = docsSections[index - 1];
  const next = docsSections[index + 1];
  const tab = TABS.find((t) => t.groups.includes(section.group)) || TABS[0];

  // Split the markdown: first paragraph becomes the lede, the rest is the body.
  const { lede, body } = useMemo(() => {
    const withoutTitle = section.content.replace(/^\s*# .+\n/, "").trim();
    const [first, ...rest] = withoutTitle.split(/\n\s*\n/);
    return first.startsWith("#") || first.startsWith("|") || first.startsWith("```")
      ? { lede: "", body: withoutTitle }
      : { lede: first, body: rest.join("\n\n") };
  }, [section]);

  const headings = useMemo(() => [...section.content.matchAll(/^## (.+)$/gm)].map((m) => ({ text: m[1], id: slug(m[1]) })), [section]);
  const currentHeading = headings.some((h) => h.id === activeHeading) ? activeHeading : headings[0]?.id;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return docsSections.filter((s) => s.label.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const go = (id) => {
    navigate(`/docs/${id}`);
    setQuery("");
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  };

  // "/" or Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName)) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { document.title = `${section.label} · CodeFusionAI Docs`; }, [section]);

  // Highlight the heading in view in the "On this page" outline.
  useEffect(() => {
    const nodes = articleRef.current?.querySelectorAll("h2[id]");
    if (!nodes?.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveHeading(visible[0].target.id);
    }, { rootMargin: "-90px 0px -65% 0px" });
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [section]);

  return (
    <div className="docs-page">
      <header className="docs-top">
        <button type="button" className="app-icon-button docs-menu" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
        <Link to="/docs" className="docs-brand"><BrandMark size={15} /> CodeFusionAI <em>Docs</em></Link>
        <nav className="docs-tabs" aria-label="Documentation sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={t.id === tab.id ? "is-active" : ""}
              onClick={() => go(docsSections.find((s) => t.groups.includes(s.group)).id)}>{t.label}</button>
          ))}
        </nav>
        <div className="docs-search">
          <Search size={15} aria-hidden="true" />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentation" aria-label="Search documentation"
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].id); if (e.key === "Escape") setQuery(""); }} />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button> : <kbd>Ctrl K</kbd>}
          {query && (
            <div className="docs-results" role="listbox">
              {results.length === 0 ? <p>No pages match "{query}".</p> : results.map((r) => (
                <button key={r.id} type="button" onClick={() => go(r.id)}><BookOpen size={14} /><span><strong>{r.label}</strong><small>{r.group}</small></span></button>
              ))}
            </div>
          )}
        </div>
        <Link to={user ? "/dashboard" : "/login"} className="cf-secondary-button docs-back">
          {user ? <><ArrowLeft size={15} /> Dashboard</> : "Sign in"}
        </Link>
      </header>

      <div className={`docs-layout ${navOpen ? "is-nav-open" : ""}`}>
        <div className="docs-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
        <nav className="docs-nav" aria-label="Pages">
          {docsGroups.map((group) => {
            const Icon = GROUP_ICONS[group] || BookOpen;
            return (
              <div key={group} className="docs-nav-group">
                <p><Icon size={15} aria-hidden="true" /> {group}</p>
                {docsSections.filter((s) => s.group === group).map((s) => (
                  <Link key={s.id} to={`/docs/${s.id}`} className={s.id === section.id ? "is-active" : ""} aria-current={s.id === section.id ? "page" : undefined}
                    onClick={() => { setNavOpen(false); window.scrollTo({ top: 0 }); }}>
                    {s.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <article ref={articleRef} className="docs-article" key={section.id}>
          <p className="docs-crumbs">Docs <ChevronRight size={13} /> <span>{section.group}</span></p>
          <h1>{section.label}</h1>
          {lede && <div className="docs-lede"><ReactMarkdown remarkPlugins={[remarkGfm]}>{lede}</ReactMarkdown></div>}
          <p className="docs-meta"><Clock size={14} /> {readMinutes(section.content)} min read</p>

          {section.id === "introduction" && (
            <div className="docs-cards">
              {QUICK_LINKS.map(({ id, title, body: text, icon: Icon, tint, color }) => (
                <Link key={id} to={`/docs/${id}`} className="docs-card">
                  <span style={{ background: tint, color }}><Icon size={19} /></span>
                  <div><strong>{title}</strong><small>{text}</small></div>
                </Link>
              ))}
            </div>
          )}

          <div className="docs-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdown}>{body}</ReactMarkdown>
          </div>

          <nav className="docs-pager" aria-label="Pagination">
            {prev ? <Link to={`/docs/${prev.id}`} onClick={() => window.scrollTo({ top: 0 })}><small>Previous</small><strong><ArrowLeft size={14} /> {prev.label}</strong></Link> : <span />}
            {next && <Link className="is-next" to={`/docs/${next.id}`} onClick={() => window.scrollTo({ top: 0 })}><small>Next</small><strong>{next.label} <ArrowRight size={14} /></strong></Link>}
          </nav>
        </article>

        <aside className="docs-toc" aria-label="On this page">
          {headings.length > 0 && <p>On this page</p>}
          {headings.map((h) => (
            <a key={h.id} href={`#${h.id}`} className={currentHeading === h.id ? "is-active" : ""}
              onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{h.text}</a>
          ))}
          <div className="docs-toc-links">
            <a href={`${REPO}/blob/main/Frontend/src/components/Docs/docsContent.js`} target="_blank" rel="noreferrer"><Pencil size={14} /> Edit this page</a>
            <a href={`${REPO}/issues/new`} target="_blank" rel="noreferrer"><Bug size={14} /> Report an issue</a>
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}><ArrowUp size={14} /> Back to top</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
