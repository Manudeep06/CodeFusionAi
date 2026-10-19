import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Users, Sparkles, FolderTree, SquareTerminal, Lock, Radio, Code2, FileArchive, Menu, X,
  GraduationCap, Laptop, UsersRound, Check, Plus, BookOpen,
} from "lucide-react";
import Brand from "../components/ui/Brand";
import ProductShot from "../components/Landing/ProductShot";
import { useAuth } from "../context/AuthContext";
import "../styles/landing.css";

const features = [
  { icon: Users, title: "Real-time collaborative editing", body: "Yjs CRDTs merge every keystroke, so two people can type in the same file without overwriting each other." },
  { icon: Sparkles, title: "AI code assistant", body: "Gemini reads your active file and selection to explain, debug, optimize and write tests, with one-click apply." },
  { icon: FolderTree, title: "Smart file explorer", body: "Create, rename, upload and organize files and folders, with language-aware icons and search across the workspace." },
  { icon: SquareTerminal, title: "Integrated coding workspace", body: "Monaco editor, tabs, an in-browser Node.js terminal and a live preview, all in one tab." },
  { icon: Lock, title: "Private and public rooms", body: "Keep a room to people with the ID, or list it in the public hub so anyone can join and learn." },
  { icon: Radio, title: "Live collaboration and presence", body: "See who's online, which file they have open, and where their cursor is, in real time." },
  { icon: Code2, title: "Multi-language development", body: "Edit any language; run Node projects in the browser, and JavaScript, Python, C++ or Java on the server." },
  { icon: FileArchive, title: "Code sharing and export", body: "Share a room link to invite collaborators, restore any saved version, or export the workspace as a ZIP." },
];

const steps = [
  { title: "Create or join a coding room", body: "Pick a React, Vue, Node or vanilla template, or paste a room ID from a teammate." },
  { title: "Invite collaborators and code together", body: "Share the link. Everyone edits the same files with live cursors and presence." },
  { title: "Improve your code with AI", body: "Ask the assistant to explain, debug or refactor using your file and selection as context." },
];

const audiences = [
  { icon: GraduationCap, title: "Students", points: ["Pair on assignments without installing anything", "Ask the AI to explain concepts in your own code", "Learn from public rooms in the hub"] },
  { icon: Laptop, title: "Developers", points: ["Review a pull request live with a teammate", "Prototype in a real Node runtime in the browser", "Restore any saved version if an experiment breaks"] },
  { icon: UsersRound, title: "Coding teams", points: ["Run hackathons and mock interviews in one room", "Private rooms protected by sign-in and owner controls", "Everyone sees the same code at the same time"] },
];

const faqs = [
  { q: "Is CodeFusionAI free to use?", a: "Yes. Sign in with Google or email and create as many rooms as you like." },
  { q: "Do I need to install anything?", a: "No. The editor, terminal and preview run in your browser. Node projects run inside WebContainers, a sandboxed Node.js runtime in the tab." },
  { q: "Which languages can I run?", a: "You can edit any language. Node.js projects run in the browser; single-file JavaScript, Python, C++ and Java programs can run on the server." },
  { q: "What happens if two people edit the same line?", a: "Edits are merged with a CRDT (Yjs), so both changes are kept and everyone converges to the same text. No locks, no lost keystrokes." },
  { q: "Are private rooms secure?", a: "Every request is authenticated with a Firebase ID token, only owners can close or delete a room, and private rooms are never listed publicly. Share room IDs only with people you trust." },
  { q: "Can I get my code out?", a: "Yes. Download the whole workspace as a ZIP at any time, or restore an earlier version from the room's history." },
];

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#about", label: "About" },
];

export default function Landing() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = user ? { to: "/dashboard", label: "Open dashboard" } : { to: "/login?mode=register", label: "Start Coding for Free" };

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-header-inner">
          <Brand />
          <nav className="lp-nav" aria-label="Primary">
            {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
            <Link to="/docs">Docs</Link>
          </nav>
          <div className="lp-header-actions">
            {!user && <Link to="/login" className="cf-quiet-button">Sign in</Link>}
            <Link to={primary.to} className="cf-primary-button cf-pill-button">{user ? "Dashboard" : "Get started"}</Link>
            <button type="button" className="app-icon-button lp-menu" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lp-mobile-nav" aria-label="Mobile">
            {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>)}
            <Link to="/docs">Docs</Link>
            {!user && <Link to="/login">Sign in</Link>}
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero" id="product">
          <span className="lp-badge cf-rise"><Sparkles size={13} /> AI-assisted · real-time · in the browser</span>
          <h1 className="lp-title cf-rise cf-rise-1">Code Together.<br /><span className="cf-gradient-text">Build Smarter.</span></h1>
          <p className="lp-lead cf-rise cf-rise-2">
            A shared, real-time coding workspace with an AI assistant that understands your code. Create a room, invite your team, and write, run and ship from one browser tab.
          </p>
          <div className="lp-cta cf-rise cf-rise-3">
            <Link to={primary.to} className="cf-primary-button cf-button-lg cf-pill-button">{primary.label} <ArrowRight size={17} /></Link>
            <a href="#workspace" className="cf-secondary-button cf-button-lg cf-pill-button">Explore the Workspace</a>
          </div>
          <div className="lp-shot-wrap cf-rise cf-rise-4"><ProductShot /></div>
        </section>

        {/* Features */}
        <section className="lp-section" id="features">
          <header className="lp-head">
            <p className="cf-eyebrow">Features</p>
            <h2>Everything your team needs to code together</h2>
            <p>No setup, no local environment, no "works on my machine". Open a room and start building.</p>
          </header>
          <div className="lp-features">
            {features.map(({ icon: Icon, title, body }) => (
              <article key={title} className="lp-feature">
                <span className="lp-feature-icon"><Icon size={20} strokeWidth={1.9} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="lp-band" id="how">
          <div className="lp-section lp-section-tight">
            <header className="lp-head">
              <p className="cf-eyebrow">How it works</p>
              <h2>From idea to running code in three steps</h2>
            </header>
            <ol className="lp-steps">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <span className="lp-step-num">0{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Workspace showcase */}
        <section className="lp-section" id="workspace">
          <header className="lp-head">
            <p className="cf-eyebrow">The workspace</p>
            <h2>A real IDE, built for collaboration</h2>
            <p>Familiar like VS Code, with live presence and an AI assistant built in.</p>
          </header>
          <ProductShot large />
          <div className="lp-callouts">
            <div><FolderTree size={18} /><strong>Explorer</strong><span>Files, folders, uploads and search</span></div>
            <div><Code2 size={18} /><strong>Monaco editor</strong><span>Syntax highlighting, tabs, live cursors</span></div>
            <div><SquareTerminal size={18} /><strong>Terminal and preview</strong><span>npm install, npm run dev, live URL</span></div>
            <div><Sparkles size={18} /><strong>AI panel</strong><span>Context-aware help with one-click apply</span></div>
          </div>
        </section>

        {/* Benefits */}
        <section className="lp-band" id="about">
          <div className="lp-section lp-section-tight">
            <header className="lp-head">
              <p className="cf-eyebrow">Who it's for</p>
              <h2>Built for how people actually learn and ship</h2>
            </header>
            <div className="lp-audiences">
              {audiences.map(({ icon: Icon, title, points }) => (
                <article key={title}>
                  <span className="lp-feature-icon"><Icon size={20} /></span>
                  <h3>{title}</h3>
                  <ul>{points.map((p) => <li key={p}><Check size={15} /> {p}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section lp-faq-wrap" id="faq">
          <header className="lp-head">
            <p className="cf-eyebrow">FAQ</p>
            <h2>Questions, answered</h2>
          </header>
          <div className="lp-faq">
            {faqs.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}<Plus size={18} aria-hidden="true" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="lp-final">
          <h2>Open your first room in under a minute.</h2>
          <p>Free to use. Sign in with Google or email.</p>
          <div className="lp-cta">
            <Link to={primary.to} className="cf-primary-button cf-button-lg cf-pill-button">{primary.label} <ArrowRight size={17} /></Link>
            <Link to="/docs" className="lp-final-link"><BookOpen size={16} /> Read the docs</Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Brand />
            <p>The collaborative IDE with an AI pair programmer.</p>
          </div>
          <div className="lp-footer-cols">
            <div><p>Product</p><a href="#features">Features</a><a href="#workspace">Workspace</a><a href="#how">How it works</a></div>
            <div><p>Resources</p><Link to="/docs">Documentation</Link><Link to="/docs/quickstart">Quickstart</Link><Link to="/docs/rest-api">API reference</Link></div>
            <div><p>Project</p><a href="#about">About</a><a href="#faq">FAQ</a><a href="https://github.com/Manudeep06/CodeFusionAi" target="_blank" rel="noreferrer">GitHub</a></div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} CodeFusionAI</span>
          <a href="https://github.com/Manudeep06/CodeFusionAi" target="_blank" rel="noreferrer" aria-label="CodeFusionAI on GitHub"><GithubIcon /></a>
        </div>
      </footer>
    </div>
  );
}
