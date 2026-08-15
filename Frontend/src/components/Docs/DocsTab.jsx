import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { docsSections } from "./docsContent";

export default function DocsTab() {
  const [activeSection, setActiveSection] = useState(docsSections[0].id);
  const contentRef = useRef(null);
  
  // Implement ScrollSpy
  useEffect(() => {
    const options = {
      root: contentRef.current,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        setActiveSection(visibleEntries[0].target.id);
      }
    }, options);

    docsSections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  // Custom renderers to beautify markdown
  const MarkdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-[32px] font-extrabold text-[#2f8d46] border-b-2 border-gray-100 pb-3 mb-6" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-[24px] font-bold text-[#2f3542] mt-10 mb-4 border-b border-gray-100 pb-2" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-[18px] font-bold text-[#4b5563] mt-8 mb-3" {...props} />,
    p: ({node, ...props}) => <p className="text-[15px] leading-relaxed text-[#4b5563] mb-4" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 text-[#4b5563] mb-6 marker:text-[#2f8d46]" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 text-[#4b5563] mb-6 marker:text-[#2f8d46]" {...props} />,
    li: ({node, ...props}) => <li className="text-[15px]" {...props} />,
    a: ({node, ...props}) => <a className="text-[#2f8d46] font-medium hover:underline decoration-2 underline-offset-2" {...props} />,
    blockquote: ({node, children, ...props}) => {
      // Very basic handling to make blockquotes look like GeeksforGeeks notes/alerts
      const textContent = Array.isArray(children) ? children[0]?.props?.children : children;
      const isWarning = typeof textContent === 'string' && textContent.includes('[!WARNING]');
      const isTip = typeof textContent === 'string' && textContent.includes('[!TIP]');
      const isInfo = typeof textContent === 'string' && textContent.includes('[!INFO]');
      
      let bg = "bg-[#f8f9fa]";
      let border = "border-[#2f8d46]";
      let icon = "💡";

      if (isWarning) { bg = "bg-amber-50"; border = "border-amber-500"; icon = "⚠️"; }
      if (isInfo) { bg = "bg-blue-50"; border = "border-blue-500"; icon = "ℹ️"; }

      return (
        <div className={`my-6 px-5 py-4 border-l-4 ${border} ${bg} rounded-r-lg shadow-sm flex gap-3 items-start`}>
          <span className="text-xl shrink-0 mt-0.5">{icon}</span>
          <div className="text-[14.5px] text-gray-700 leading-relaxed font-medium [&>p]:mb-0 [&>p]:mt-0">
            {children}
          </div>
        </div>
      );
    },
    code: ({node, className, children, ...props}) => {
      const isInline = !className && !String(children).includes('\n');
      if (isInline) {
        return <code className="!text-[#d63384] !bg-[#f8f9fa] px-1.5 py-0.5 rounded border border-gray-200 text-[13.5px] font-mono" {...props}>{children}</code>;
      }
      return <code className={className} {...props}>{children}</code>;
    },
    pre: ({node, ...props}) => (
      <pre className="!bg-[#282c34] !text-gray-100 p-4 rounded-xl shadow-inner text-[14px] font-mono overflow-x-auto my-4 border border-gray-800" {...props} />
    ),
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-6 border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse" {...props} />
      </div>
    ),
    th: ({node, ...props}) => <th className="bg-[#f8f9fa] p-3 text-[14px] font-bold text-gray-700 border-b border-gray-200" {...props} />,
    td: ({node, ...props}) => <td className="p-3 text-[14px] text-gray-600 border-b border-gray-100" {...props} />
  };

  return (
    <div className="bg-[#f8f9fa] w-full h-full font-sans text-[#2f3542] rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col relative z-10" style={{ isolation: 'isolate' }}>
      {/* ─── Top Navbar (GeeksforGeeks Style) ──────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-20 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gradient-to-br from-[#2f8d46] to-[#1e612e] text-white shadow-md border border-[#1e612e]">
            <span className="font-black text-lg tracking-tighter ml-[1px]">CF</span>
          </div>
          <h1 className="text-[22px] font-black text-[#2f3542] tracking-tight m-0 flex items-center">
            CodeFusion<span className="text-[#2f8d46]">AI</span> 
            <span className="font-medium text-gray-400 ml-2 text-[18px]">Docs</span>
          </h1>
        </div>
        <div className="flex items-center">
          <span className="text-xs font-bold text-[#1e612e] bg-[#e9f5ec] px-3 py-1 rounded-full border border-[#c3e6cb] shadow-sm tracking-wide">v1.2.0</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        {/* ─── Left Sidebar Navigation ───────────────────────────────────────── */}
        <aside className="w-full lg:w-[300px] border-r border-gray-200 bg-white shrink-0 overflow-y-auto hidden lg:block h-full shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
          <nav className="py-6 px-4 space-y-1 pb-12">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Table of Contents</h3>
            {docsSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-[13.5px] font-bold transition-all duration-200 cursor-pointer block truncate ${
                  activeSection === sec.id
                    ? "bg-[#e9f5ec] text-[#2f8d46] border-l-[4px] border-[#2f8d46] shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#2f8d46] border-l-[4px] border-transparent"
                }`}
                title={sec.label}
              >
                {sec.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Dropdown */}
        <div className="lg:hidden p-4 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-20 shadow-sm">
          <select 
            value={activeSection}
            onChange={(e) => scrollToSection(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2f8d46]"
          >
            {docsSections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.label}</option>
            ))}
          </select>
        </div>

        {/* ─── Right Content Display ────────────────────────────────────────── */}
        <main ref={contentRef} className="flex-1 p-6 lg:p-14 bg-white overflow-y-auto h-full scroll-smooth relative">
          <div className="max-w-[850px] mx-auto pb-32 space-y-20">
            
            {docsSections.map((sec) => (
              <div 
                key={sec.id} 
                id={sec.id} 
                className="scroll-mt-10 group"
              >
                <div className="prose prose-slate prose-green max-w-none 
                  prose-headings:text-[#2f3542] prose-headings:font-bold 
                  prose-h1:text-[32px] prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3 prose-h1:mb-6 prose-h1:text-[#2f8d46]
                  prose-h2:text-[24px] prose-h2:mt-10 prose-h2:mb-4
                  prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-[#4b5563]
                  prose-a:text-[#2f8d46] prose-a:no-underline hover:prose-a:underline
                  prose-ul:text-[15px] prose-ul:text-[#4b5563] prose-li:my-1
                  prose-table:border-collapse prose-table:w-full
                  prose-th:bg-gray-50 prose-th:p-3 prose-th:border prose-th:border-gray-200 prose-th:text-left
                  prose-td:p-3 prose-td:border prose-td:border-gray-200
                ">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {sec.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

          </div>
        </main>
      </div>
    </div>
  );
}


