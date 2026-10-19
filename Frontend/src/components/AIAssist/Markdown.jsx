import { Children, isValidElement, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import { Check, Copy, FileCode2 } from "lucide-react";
import "../../styles/markdown.css";

// Register only the grammars we need (keeps the bundle small).
Object.entries({ javascript, js: javascript, jsx, typescript, ts: typescript, tsx, python, py: python, java, cpp, c: cpp, css, json, bash, sh: bash, shell: bash, html: markup, xml: markup, markup, sql })
  .forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

const textOf = (children) => Children.toArray(children)
  .map((c) => (typeof c === "string" ? c : isValidElement(c) ? textOf(c.props.children) : ""))
  .join("");

export function CodeBlock({ code, language, onApply }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="md-code">
      <header>
        <FileCode2 size={14} aria-hidden="true" />
        <span>{language || "code"}</span>
        <div className="md-code-actions">
          {onApply && <button type="button" className="is-primary" onClick={() => onApply(code)}>Apply to file</button>}
          <button type="button" onClick={copy} aria-label="Copy code">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
        </div>
      </header>
      <SyntaxHighlighter language={language || "text"} style={oneLight} PreTag="div" customStyle={{ margin: 0, padding: "1rem 1.1rem", background: "#fff", fontSize: "0.82rem", lineHeight: 1.7 }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Renders assistant replies: GitHub-flavoured markdown with highlighted,
 * copyable code blocks. Pass onApply to show "Apply to file" on code blocks.
 */
export default function Markdown({ children, onApply }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children: pre }) => {
            const child = Children.toArray(pre)[0];
            const className = isValidElement(child) ? child.props.className || "" : "";
            const language = (className.match(/language-([\w+-]+)/) || [])[1];
            return <CodeBlock code={textOf(pre).replace(/\n$/, "")} language={language} onApply={onApply} />;
          },
          code: ({ className, children: code, ...props }) => <code className={className || "md-inline"} {...props}>{code}</code>,
          a: ({ href, children: label }) => <a href={href} target="_blank" rel="noreferrer">{label}</a>,
          table: ({ children: t }) => <div className="md-table"><table>{t}</table></div>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
