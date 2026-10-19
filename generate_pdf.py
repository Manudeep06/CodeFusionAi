import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header on pages > 1
        if self._pageNumber > 1:
            self.drawString(54, 750, "CodeFusionAI — Infosys Interview Guide (Simple English & Frontend)")
            self.drawRightString(612 - 54, 750, "Interview Prep")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)
            
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 36, page_str)
        self.drawString(54, 36, "Prepared for Infosys Technical & Frontend Live-Coding Round")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()

def create_simple_guide_pdf(filename="CodeFusionAI_Infosys_Interview_Guide.pdf"):
    pdf_path = os.path.join(r"c:\CodeFusionAI", filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor("#0F172A")    # Deep Navy
    SECONDARY = colors.HexColor("#1D4ED8")  # Vibrant Blue
    ACCENT = colors.HexColor("#0284C7")     # Ocean Blue
    TEXT_DARK = colors.HexColor("#1E293B")  # Slate 800
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Light Slate
    BORDER_COLOR = colors.HexColor("#CBD5E1")
    TAG_BG = colors.HexColor("#EFF6FF")
    CODE_BG = colors.HexColor("#F1F5F9")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=12
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    
    qa_q_style = ParagraphStyle(
        'QA_Q',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=SECONDARY,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    qa_a_style = ParagraphStyle(
        'QA_A',
        parent=body_style,
        leftIndent=6,
        spaceAfter=5
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0F172A")
    )

    def code_box(code_text):
        p = Preformatted(code_text.strip(), code_style)
        t = Table([[p]], colWidths=[512])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), CODE_BG),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#94A3B8")),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        return t

    def tip_box(title, text):
        c = [
            Paragraph(f"<b>{title}</b>", ParagraphStyle('TTitle', parent=body_style, fontName='Helvetica-Bold', textColor=SECONDARY)),
            Spacer(1, 2),
            Paragraph(text, body_style)
        ]
        t = Table([[c]], colWidths=[512])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), TAG_BG),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#93C5FD")),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    story = []
    
    # ─── HEADER ────────────────────────────────────────────────────────────────
    story.append(Paragraph("CodeFusionAI — Infosys Interview Complete Guide", title_style))
    story.append(Paragraph("Simple English Explanations • Frontend Live-Coding • CS Fundamentals • System Design", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    # ─── SECTION 1: RESUME POINTS ──────────────────────────────────────────────
    story.append(Paragraph("1. The 5 Points on Your Resume (Read & Remember)", h1_style))
    resume_points = [
        "<b>1. Real-Time Collaboration:</b> Built a real-time collaborative code editor using Socket.IO and Monaco Editor, allowing multiple developers to edit code together live with under 50ms delay.",
        "<b>2. In-Browser Execution (MERN):</b> Implemented an in-browser runtime using WebContainers, allowing users to install npm packages and run full-stack MERN projects directly in the browser with a live preview.",
        "<b>3. Redis Caching & Cloud Savings:</b> Reduced AWS S3 cloud costs by 85% by caching live edits in Redis and saving files in batches every 30 seconds instead of on every keystroke.",
        "<b>4. Gemini AI Integration:</b> Integrated Google Gemini AI to automatically review code, detect bugs, explain time and space complexity, and answer coding questions.",
        "<b>5. Auth & Offline Save:</b> Implemented Firebase Auth with Google Sign-In for secure login and used IndexedDB to auto-save work locally so users never lose their code."
    ]
    for rp in resume_points:
        story.append(Paragraph(f"• {rp}", bullet_style))
    story.append(Spacer(1, 6))

    # ─── SECTION 2: HOW TO EXPLAIN IN SIMPLE ENGLISH ───────────────────────────
    story.append(Paragraph("2. How to Explain the Project in 30 Seconds (Simple English)", h1_style))
    pitch = (
        "\"Sir, CodeFusionAI is an online code editor like Google Docs or Replit, built for MERN stack projects. "
        "Multiple developers can join a room and write code together live without lag using WebSockets. "
        "Instead of running servers on our backend, users can run React and Node.js directly inside their own browser using WebContainers. "
        "We also connected Google Gemini AI for instant code review, and we used Redis to cache edits and batch saves to AWS S3, "
        "which reduced cloud storage costs by 85%.\""
    )
    story.append(tip_box("Say this when they say: 'Tell me about yourself / your project'", pitch))
    story.append(Spacer(1, 8))

    # ─── SECTION 3: FRONTEND INTERVIEW & LIVE CODING QUESTIONS ─────────────────
    story.append(PageBreak())
    story.append(Paragraph("3. Frontend Deep Dive & Live Coding Questions (React & JS)", h1_style))
    story.append(Paragraph("In Infosys, the interviewer will often ask you to <b>open Notepad, share your screen, or write code on paper</b>. Here are the exact questions they ask for Frontend:", body_style))
    story.append(Spacer(1, 4))

    # Q1: Debounce function
    story.append(Paragraph("Q1: 'Write a Debounce function in JavaScript.' (Very Common!)", qa_q_style))
    story.append(Paragraph("<b>Why they ask this:</b> When a user types in Monaco Editor, typing 50 letters in 10 seconds shouldn't send 50 socket events. We debounce it so it sends only after the user pauses.", qa_a_style))
    debounce_code = """// Simple Debounce function
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// How to use in React:
const sendCodeChange = debounce((newCode) => {
  socket.emit("code-change", { roomId, code: newCode });
}, 300);"""
    story.append(code_box(debounce_code))
    story.append(Spacer(1, 6))

    # Q2: WebSocket in React useEffect with cleanup
    story.append(Paragraph("Q2: 'Write a React component that connects to a WebSocket and avoids memory leaks.'", qa_q_style))
    story.append(Paragraph("<b>Why they ask this:</b> To check if you know how `useEffect` cleanup works. If you don't remove socket listeners, you get duplicate events and memory leaks!", qa_a_style))
    socket_code = """import { useEffect, useState } from "react";
import { socket } from "../services/socket";

function CodeRoom({ roomId }) {
  const [code, setCode] = useState("");

  useEffect(() => {
    // 1. Join the room
    socket.emit("join-room", { roomId });

    // 2. Listen for code updates from peers
    const handleReceiveCode = (newCode) => {
      setCode(newCode);
    };
    socket.on("receive-code", handleReceiveCode);

    // 3. CLEANUP FUNCTION (Crucial! Prevents memory leaks)
    return () => {
      socket.off("receive-code", handleReceiveCode);
    };
  }, [roomId]);

  return <div>{/* Editor rendering */}</div>;
}"""
    story.append(code_box(socket_code))
    story.append(Spacer(1, 6))

    # Q3: Monaco Editor integration
    story.append(Paragraph("Q3: 'How did you integrate Monaco Editor inside React?'", qa_q_style))
    story.append(Paragraph("<b>Answer in simple words:</b> <i>'We used `@monaco-editor/react`. We pass properties like `language`, `theme`, and `value`. When the user types, the `onChange` event fires. We also get the editor instance in `onMount` so we can control cursor positions and selections.'</i>", qa_a_style))
    monaco_code = """import Editor from "@monaco-editor/react";

<Editor
  height="90vh"
  language="javascript"
  theme="vs-dark"
  value={code}
  onChange={(newValue) => {
    setCode(newValue);
    socket.emit("code-change", { roomId, code: newValue });
  }}
  onMount={(editor, monaco) => {
    console.log("Monaco Editor is ready!");
  }}
/>"""
    story.append(code_box(monaco_code))
    story.append(Spacer(1, 6))

    # Q4: React Hooks explained simply
    story.append(Paragraph("Q4: 'What is the difference between useState, useEffect, useRef, and useCallback?'", qa_q_style))
    hooks_text = [
        "• <b>useState:</b> Stores data that re-renders the UI when changed (e.g., current code text, active file name).",
        "• <b>useEffect:</b> Runs side effects (e.g., connecting to WebSockets, loading files from IndexedDB when the page loads).",
        "• <b>useRef:</b> Stores a reference that stays the same WITHOUT re-rendering the UI (e.g., holding the editor instance, terminal DOM node, or drag coordinates).",
        "• <b>useCallback:</b> Caches a function definition between re-renders so child components don't re-render unnecessarily."
    ]
    for h in hooks_text:
        story.append(Paragraph(h, bullet_style))
    story.append(Spacer(1, 6))

    # Q5: Resizable panels
    story.append(Paragraph("Q5: 'How did you make the terminal and sidebar resizable in React?'", qa_q_style))
    story.append(Paragraph("<b>Answer:</b> We store `sidebarWidth` in state. When the user clicks the divider, we listen to mouse movements (`mousemove`) and update the width. On mouse release (`mouseup`), we stop listening.", qa_a_style))

    # ─── SECTION 4: CS FUNDAMENTALS IN SIMPLE ENGLISH ──────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("4. Core CS Fundamentals (Simple English Answers)", h1_style))
    story.append(Paragraph("Infosys checks your basics. Speak these simple 2-sentence answers confidently:", body_style))
    story.append(Spacer(1, 4))

    cs_simple = [
        (
            "1. Networking: Why WebSockets instead of HTTP?",
            "HTTP sends a new request and closes every time, which has high delay (lag) and large headers. WebSockets open one continuous connection like a phone call, so messages travel in under 50ms."
        ),
        (
            "2. Networking: Does Socket.IO use TCP or UDP?",
            "It uses <b>TCP</b> because code editing cannot lose any letters or semicolons. TCP guarantees that every single packet arrives in the exact correct order."
        ),
        (
            "3. OS: Node.js is single-threaded. How does it handle multiple users?",
            "Node.js runs your JavaScript code on one thread, but it gives heavy tasks (like network sockets, database queries, and timers) to the background OS worker threads using the <b>Event Loop</b>. That is why it never freezes."
        ),
        (
            "4. OS: What is a Race Condition, and how did you solve it?",
            "A race condition is when two users save at the exact same millisecond and one person's changes accidentally overwrite the other's. We solved it by saving each file under its own key in a <b>Redis Hash</b>, and using <b>Redis Mutex Locks</b> so only one save runs at a time."
        ),
        (
            "5. DBMS: Why MongoDB instead of SQL for this project?",
            "Code projects have folders inside folders and files of different sizes. This fits naturally into MongoDB's JSON-like document format. In SQL, nested folders would need slow, complicated JOIN queries."
        ),
        (
            "6. DBMS: What is the difference between Redis and MongoDB?",
            "Redis stores data in <b>RAM memory</b> (super fast, but temporary). MongoDB stores data on <b>hard disk</b> (permanent, but slower). We use Redis for live keystrokes, and MongoDB for permanent records."
        ),
        (
            "7. OOPs: Name 2 Design Patterns used in your project.",
            "<b>Observer Pattern:</b> When code changes, the server broadcasts an event to all users listening in the room.<br/><b>Singleton Pattern:</b> Only one database and Redis connection instance is created and shared across the entire server."
        )
    ]
    for q, a in cs_simple:
        story.append(Paragraph(f"<b>{q}</b>", qa_q_style))
        story.append(Paragraph(f"<b>Simple Answer:</b> {a}", qa_a_style))

    # ─── SECTION 5: SYSTEM DESIGN IN SIMPLE ENGLISH ───────────────────────────
    story.append(Spacer(1, 6))
    story.append(Paragraph("5. System Design Questions (Token Bucket & Execution)", h1_style))

    sys_simple = [
        (
            "How did you measure the sub-50ms latency?",
            "I added a timestamp when the person typing pressed a key. When the other user received it on their screen, I took a second timestamp. The time difference was consistently between 35ms and 50ms."
        ),
        (
            "Explain the Token Bucket rate limiter in simple words.",
            "It is like a bucket with 5 tickets. Every 5 seconds, 1 new ticket is added. When a user types 10 letters, we check if a ticket is available. If yes, we save the file to AWS S3 and take 1 ticket. If no, we wait. This stopped us from making 1,000s of expensive S3 calls."
        ),
        (
            "Does it save automatically or manually?",
            "Both! It automatically saves in the background after 10 edits and every 30 seconds. But the user can also press Ctrl+S to save manually anytime."
        ),
        (
            "What is WebContainers?",
            "It is a technology that runs Node.js and React directly inside the user's web browser using WebAssembly. We don't have to pay for backend servers to run user code, and it starts up instantly."
        ),
        (
            "What is IndexedDB?",
            "It is a database inside your web browser with lots of storage. We use it to auto-save files locally so if the user refreshes the page or loses Wi-Fi, their code is still there."
        )
    ]
    for q, a in sys_simple:
        story.append(Paragraph(f"<b>{q}</b>", qa_q_style))
        story.append(Paragraph(f"<b>Simple Answer:</b> {a}", qa_a_style))

    # ─── SECTION 6: LIVE CODING CHEAT SHEET (WRITE ON NOTEPAD) ────────────────
    story.append(PageBreak())
    story.append(Paragraph("6. Quick Live-Coding Checklist (If they ask you to write code)", h1_style))
    story.append(Paragraph("If the interviewer says: <i>'Open a plain editor and write this'</i>, here are 3 quick snippets to memorize:", body_style))
    story.append(Spacer(1, 4))

    # Array methods
    story.append(Paragraph("A. JavaScript Array Methods (map, filter, reduce)", h2_style))
    js_methods = """// 1. map (transform items)
const fileNames = files.map(f => f.path);

// 2. filter (select items)
const codeFiles = files.filter(f => !f.isFolder);

// 3. reduce (calculate total)
const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);"""
    story.append(code_box(js_methods))
    story.append(Spacer(1, 6))

    # Async Await & Fetch
    story.append(Paragraph("B. Fetching AI Review from Backend (async/await + try/catch)", h2_style))
    async_code = """async function getAICodeReview(codeSnippet) {
  try {
    const response = await fetch("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeSnippet, language: "javascript" }),
    });
    
    if (!response.ok) throw new Error("Server error");
    const data = await response.json();
    return data.review; // Markdown response from Gemini
  } catch (error) {
    console.error("AI Review failed:", error.message);
    return "Error getting review. Please try again.";
  }
}"""
    story.append(code_box(async_code))
    story.append(Spacer(1, 6))

    # Behavioral Tip Box
    story.append(Paragraph("7. Infosys Golden Interview Rules", h1_style))
    rules = (
        "1. <b>Never rush your answer:</b> Take 3 seconds to think before speaking.<br/>"
        "2. <b>Say 'I built this' with confidence:</b> Speak about Redis, WebSockets, and React as decisions you made.<br/>"
        "3. <b>If you don't know a syntax:</b> Say: <i>'I know the logic: we need to use a debounce timer / useEffect cleanup, but I might need to verify the exact method name.'</i> Interviewers respect honesty and problem-solving!"
    )
    story.append(tip_box("Remember for Tomorrow", rules))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[Success] Simple English + Frontend PDF generated at: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_simple_guide_pdf()
