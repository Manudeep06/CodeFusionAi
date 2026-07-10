import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, signInWithGoogleRedirect, loginUser, registerUser } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

import ParticleCanvas from "../components/Login/ParticleCanvas";
import OrbBg from "../components/Login/OrbBg";
import StatBadge from "../components/Login/StatBadge";
import FloatingCard from "../components/Login/FloatingCard";

function Login() {
  const { user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errMsg,   setErrMsg]   = useState("");
  const [okMsg,    setOkMsg]    = useState("");
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in (full reload required to load headers)
  useEffect(() => { if (user) window.location.href = "/dashboard"; }, [user]);

  const google = () => {
    // Start Google Sign-In synchronously in the click call stack!
    // This prevents the browser popup blocker from intercepting it.
    const signInPromise = signInWithGoogle();
    
    // Set loading and clear errors now that the popup is open
    setLoading(true);
    setErrMsg("");
    setOkMsg("");

    signInPromise
      .then((result) => {
        if (result?.user) {
          setOkMsg("Signed in successfully! Redirecting…");
          setTimeout(() => { window.location.href = "/dashboard"; }, 500);
        }
      })
      .catch((err) => {
        console.error("Google Sign-In error:", err);
        if (err.code === "auth/popup-blocked") {
          setOkMsg("Popup blocked. Redirecting to Google Sign-In instead...");
          signInWithGoogleRedirect().catch((redirErr) => {
            console.error("Google Redirect error:", redirErr);
            setErrMsg("Google login failed. Please allow popups or try again.");
          });
        } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
          setErrMsg("Sign-in was cancelled. Please try again.");
        } else if (err.code === "auth/network-request-failed") {
          setErrMsg("Network error. Please check your connection and try again.");
        } else if (err.code === "auth/unauthorized-domain") {
          setErrMsg("This domain is not authorized for Google Sign-In.");
        } else {
          setErrMsg(err.message || "Google Sign-In failed. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErrMsg(""); setOkMsg("");
    try {
      if (isRegister) {
        await registerUser(email, password);
        setOkMsg("Account created! Redirecting…");
      } else {
        await loginUser(email, password);
        setOkMsg("Welcome back! Redirecting…");
      }
    } catch (err) {
      console.error(err);
      if (!isRegister && (err.code === "auth/user-not-found" || err.message?.includes("user-not-found"))) {
        setErrMsg(
          <span>
            Account does not exist.{" "}
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className="underline text-purple-400 font-bold hover:text-purple-300 cursor-pointer ml-1 focus:outline-none"
            >
              Create Account
            </button>
          </span>
        );
      } else if (isRegister && (err.code === "auth/email-already-in-use" || err.message?.includes("email-already-in-use"))) {
        setErrMsg(
          <span>
            Email already registered.{" "}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className="underline text-purple-400 font-bold hover:text-purple-300 cursor-pointer ml-1 focus:outline-none"
            >
              Sign In
            </button>
          </span>
        );
      } else {
        let friendlyMsg = err.message || "Auth error occurred.";
        if (friendlyMsg.includes("auth/invalid-credential") || friendlyMsg.includes("auth/wrong-password")) {
          friendlyMsg = "Invalid email or password. Please try again.";
        } else if (friendlyMsg.includes("auth/invalid-email")) {
          friendlyMsg = "Please enter a valid email address.";
        } else if (friendlyMsg.includes("auth/weak-password")) {
          friendlyMsg = "Password is too weak. Must be at least 6 characters.";
        }
        setErrMsg(friendlyMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (reg) => { setIsRegister(reg); setErrMsg(""); setOkMsg(""); };

  return (
    <div className="relative min-h-screen bg-[#050814] text-slate-100 font-sans overflow-hidden flex flex-col">
      <OrbBg />
      <ParticleCanvas />

      {/* ── Topbar ── */}
      <nav className="relative z-30 flex items-center justify-between px-6 lg:px-10 py-5">
        <div className="flex items-center gap-3 select-none">
          <div className="bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 p-2.5 rounded-xl shadow-xl shadow-purple-500/30 animate-pulse-ring">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
            CodeFusionAI
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full px-4 py-2 border border-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-emerald-400 tracking-wide">All Systems Live</span>
        </div>
      </nav>

      {/* ── Body ── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-16 items-center">

          {/* ───── LEFT ───── */}
          <div className="hidden lg:flex flex-col">

            {/* Badge */}
            <div className="animate-card-enter inline-flex self-start items-center gap-2.5 rounded-full border border-purple-500/30 px-5 py-2 mb-8" style={{ background: "rgba(139,92,246,0.08)" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-400">Now in Beta · 2,400+ Developers</span>
            </div>

            {/* Hero heading */}
            <div className="animate-card-enter mb-6" style={{ animationDelay: "60ms" }}>
              <h1 className="font-black leading-[1.05] tracking-tight">
                <span className="block text-[3.4rem] xl:text-[4rem] text-white">Build together.</span>
                <span className="block text-[3.4rem] xl:text-[4rem] bg-gradient-to-r from-purple-400 via-fuchsia-300 to-blue-400 bg-clip-text text-transparent animate-gradient">Ship faster.</span>
              </h1>
              <p className="mt-5 text-[16px] text-slate-400 leading-relaxed max-w-[420px]">
                The AI-native collaborative IDE where your whole team codes in perfect real-time sync, powered by Gemini 2.0.
              </p>
            </div>

            {/* Stats row */}
            <div className="animate-card-enter flex items-center gap-8 mb-10 pl-1" style={{ animationDelay: "120ms" }}>
              <StatBadge value="<12ms" label="Sync Latency"    color="#34d399" />
              <div className="w-px h-8 bg-white/[0.07]" />
              <StatBadge value="4"       label="Languages"        color="#a78bfa" />
              <div className="w-px h-8 bg-white/[0.07]" />
              <StatBadge value="100%"    label="Encrypted"        color="#60a5fa" />
              <div className="w-px h-8 bg-white/[0.07]" />
              <StatBadge value="∞"       label="Collaborators"    color="#f472b6" />
            </div>

            {/* Illustration area ── floating UI cards over a gradient slab */}
            <div className="animate-card-enter relative h-[310px]" style={{ animationDelay: "180ms" }}>

              {/* Base slab */}
              <div className="absolute inset-0 rounded-3xl border border-white/[0.07] overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 50%, rgba(0,0,0,0.3) 100%)", backdropFilter: "blur(20px)" }}>
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

                {/* Background code preview */}
                <div className="absolute inset-4 font-mono text-[10.5px] leading-[1.7] select-none overflow-hidden opacity-40">
                  <div><span className="text-slate-600">{"// "}</span><span className="text-slate-500 italic">CodeFusionAI live session</span></div>
                  <div className="mt-1"><span className="text-pink-400">import</span><span className="text-slate-400"> {"{ ai, socket }"} </span><span className="text-pink-400">from</span><span className="text-emerald-400"> 'codefusion'</span></div>
                  <div className="mt-1"><span className="text-pink-400">const</span><span className="text-sky-300"> session </span><span className="text-slate-400">= await </span><span className="text-blue-300">ai.createRoom</span><span className="text-slate-500">{"({"}</span></div>
                  <div className="ml-4"><span className="text-violet-300">model</span><span className="text-slate-500">: </span><span className="text-emerald-400">'gemini-2.0-flash'</span><span className="text-slate-500">,</span></div>
                  <div className="ml-4"><span className="text-violet-300">collab</span><span className="text-slate-500">: </span><span className="text-orange-400">true</span><span className="text-slate-500">,</span></div>
                  <div className="ml-4"><span className="text-violet-300">sandbox</span><span className="text-slate-500">: </span><span className="text-emerald-400">'webcontainer'</span></div>
                  <div><span className="text-slate-500">{"})"}</span></div>
                  <div className="mt-1 bg-purple-500/[0.12] -mx-4 px-4 rounded"><span className="text-pink-400">await</span><span className="text-sky-300"> session</span><span className="text-slate-400">.invite(</span><span className="text-amber-400">teammates</span><span className="text-slate-400">)</span><span className="inline-block w-[6px] h-[12px] bg-purple-400 opacity-90 animate-blink rounded-[1px] ml-0.5 align-middle" /></div>
                </div>
              </div>

              {/* Floating card ── AI suggestion */}
              <FloatingCard className="animate-float top-4 right-4 px-4 py-3.5 z-10 w-64" style={{ animationDelay: "0s" }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-lg shadow-purple-500/30">AI</div>
                  <div>
                    <div className="text-[10px] font-black text-white mb-0.5">Gemini Suggestion</div>
                    <div className="text-[9px] text-slate-400 leading-snug">Refactor <code className="text-purple-300 bg-purple-500/10 px-1 rounded">useEffect</code> — memoize with useCallback for 40% perf boost</div>
                    <div className="mt-2 flex gap-2">
                      <button className="text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/25 rounded-md px-2 py-0.5 cursor-default">Apply ✓</button>
                      <button className="text-[9px] font-bold text-slate-600 cursor-default">Dismiss</button>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              {/* Floating card ── peers online */}
              <FloatingCard className="animate-float bottom-4 left-4 px-4 py-3 z-10" style={{ animationDelay: "-3.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["#7c3aed","#3b82f6","#10b981","#f59e0b"].map((c, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0a0e1e] flex items-center justify-center text-[8px] font-black text-white" style={{ background: c }}>
                        {["AM","SK","RK","JP"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white">4 devs online</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] text-emerald-400 font-bold">Live syncing</span>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              {/* Floating card ── latency */}
              <FloatingCard className="animate-float bottom-14 right-6 px-3.5 py-2.5 z-10" style={{ animationDelay: "-6s" }}>
                <div className="text-center">
                  <div className="text-lg font-black text-emerald-400 font-mono leading-none">9ms</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sync Latency</div>
                </div>
              </FloatingCard>

            </div>

            {/* Social proof */}
            <div className="animate-card-enter flex items-center gap-3 mt-6" style={{ animationDelay: "300ms" }}>
              <div className="flex -space-x-2">
                {["#7c3aed","#3b82f6","#10b981","#f59e0b","#ec4899"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050814] shadow-lg" style={{ background: `radial-gradient(circle at 35% 35%, ${c}dd, ${c}88)` }} />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}
                </div>
                <div className="text-[11px] text-slate-400"><span className="text-white font-bold">2,400+</span> developers love CodeFusionAI</div>
              </div>
            </div>
          </div>

          {/* ───── RIGHT — Auth Card ───── */}
          <div className="flex flex-col items-center">
            <div className="w-full animate-card-enter" style={{ animationDelay: "80ms" }}>
              <div className="relative">

                {/* === Rotating conic gradient border === */}
                <div className="absolute -inset-[1.5px] rounded-[30px] z-0 overflow-hidden">
                  <div className="absolute inset-0 animate-spin-slow"
                    style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.9) 60deg, rgba(99,102,241,0.7) 120deg, rgba(59,130,246,0.8) 180deg, transparent 240deg, transparent 360deg)" }} />
                </div>

                {/* === Wide ambient glow behind card === */}
                <div className="absolute -inset-8 rounded-[40px] blur-3xl z-0"
                  style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.25) 0%, rgba(79,70,229,0.15) 40%, transparent 70%)" }} />
                <div className="absolute -inset-4 rounded-[36px] blur-xl z-0"
                  style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.18) 0%, transparent 60%)" }} />

                {/* === Main Card === */}
                <div className="relative z-10 rounded-[28px] overflow-hidden"
                  style={{
                    background: "linear-gradient(170deg, rgba(22,16,48,0.97) 0%, rgba(12,10,30,0.98) 50%, rgba(8,10,25,0.99) 100%)",
                    backdropFilter: "blur(48px)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)",
                  }}>

                  {/* Top edge prismatic line */}
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-300/90 to-transparent" />
                  {/* Subtle inner glow top */}
                  <div className="absolute top-0 inset-x-0 h-52 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
                  {/* Bottom inner glow */}
                  <div className="absolute bottom-0 inset-x-0 h-36 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(59,130,246,0.09) 0%, transparent 70%)" }} />
                  {/* Corner sparkle */}
                  <div className="absolute top-0 right-0 w-60 h-60 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 100% 0%, rgba(139,92,246,0.10) 0%, transparent 60%)" }} />

                  <div className="relative p-9">

                    {/* ── Hero Header ── */}
                    <div className="flex flex-col items-center text-center mb-8">
                      {/* Multi-ring icon */}
                      <div className="relative mb-5">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-3xl scale-[1.35] border border-purple-500/15 animate-pulse" />
                        {/* Mid ring */}
                        <div className="absolute inset-0 rounded-3xl scale-[1.18] border border-purple-500/25" />
                        {/* Icon box */}
                        <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/40"
                          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4f46e5 75%, #3b82f6 100%)",
                                   boxShadow: "0 0 0 1px rgba(168,85,247,0.4), 0 16px 40px rgba(109,40,217,0.6), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                          <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>

                      <h2 className="text-[1.6rem] font-black tracking-tight leading-tight mb-2"
                        style={{ background: "linear-gradient(135deg, #ffffff 0%, #e2d9f3 50%, #c4b5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {isRegister ? "Create your account" : "Welcome back"}
                      </h2>
                      <p className="text-slate-500 text-[13px] leading-relaxed">
                        {isRegister ? "Join 2,400+ developers building together" : "Sign in to your collaborative workspace"}
                      </p>

                      {/* Inline social proof */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex -space-x-1.5">
                          {["#7c3aed","#3b82f6","#10b981","#f59e0b"].map((c,i) => (
                             <div key={i} className="w-5 h-5 rounded-full border border-[#100c28]" style={{ background: `radial-gradient(circle at 35% 35%, ${c}ee, ${c}88)` }} />
                          ))}
                        </div>
                        <div className="flex">{[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-[10px]">★</span>)}</div>
                        <span className="text-[11px] text-slate-600">Loved by <span className="text-slate-400 font-bold">2.4k+ devs</span></span>
                      </div>
                    </div>

                    {/* ── Google Button ── */}
                    <button onClick={google} disabled={loading}
                      className="group relative w-full flex items-center gap-4 py-4 px-5 rounded-2xl border cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 active:scale-[0.98] mb-5 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)"; }}>
                      {/* Shimmer */}
                      <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                      {/* Google G logo backdrop */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-[13px] font-bold text-slate-200 group-hover:text-white transition-colors">Continue with Google</div>
                        <div className="text-[10px] text-slate-600">Fastest way to get started</div>
                      </div>
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* ── Divider ── */}
                    <div className="relative flex items-center gap-3 mb-5 select-none">
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))" }} />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.18em] px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>or</span>
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))" }} />
                    </div>

                    {/* ── Tab Switcher ── */}
                    <div className="relative flex rounded-2xl p-1 mb-6" style={{ background: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)" }}>
                      {[{ l: "Sign In", v: false, icon: "→" }, { l: "Register", v: true, icon: "+" }].map(({ l, v, icon }) => (
                        <button key={l} type="button" onClick={() => switchTab(v)}
                          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-350 cursor-pointer focus:outline-none ${
                            isRegister === v ? "text-white" : "text-slate-600 hover:text-slate-400"
                          }`}>
                          {isRegister === v && (
                            <span className="absolute inset-0 rounded-xl shadow-lg"
                              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(109,40,217,0.85), rgba(79,70,229,0.9))",
                                       boxShadow: "0 0 20px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" }} />
                          )}
                          <span className="relative text-base leading-none">{icon}</span>
                          <span className="relative">{l}</span>
                        </button>
                      ))}
                    </div>

                    {/* ── Feedback ── */}
                    {errMsg && (
                      <div className="mb-5 flex items-start gap-3 p-4 rounded-2xl text-xs" style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.22)" }}>
                        <div className="w-5 h-5 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="text-red-400 leading-relaxed">{errMsg}</span>
                      </div>
                    )}
                    {okMsg && (
                      <div className="mb-5 flex items-start gap-3 p-4 rounded-2xl text-xs" style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.22)" }}>
                        <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-emerald-400 leading-relaxed">{okMsg}</span>
                      </div>
                    )}

                    {/* ── Form ── */}
                    <form onSubmit={submit} className="space-y-4">

                      {/* Email field */}
                      <div className="group/field">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 mb-2.5 select-none" htmlFor="email">
                          <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center" style={{ background: "rgba(139,92,246,0.20)" }}>
                            <svg className="w-2 h-2 text-purple-400" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                          </span>
                          Email Address
                        </label>
                        <div className="relative">
                          {/* Left accent bar */}
                          <div className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-gradient-to-b from-purple-500/60 to-blue-500/40 opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-700 group-focus-within/field:text-purple-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input id="email" type="email" placeholder="name@company.com"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            disabled={loading} required
                            className="w-full pl-11 pr-4 py-3.5 text-[13px] text-slate-200 placeholder-slate-700 rounded-2xl outline-none transition-all duration-200"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)",
                            }}
                            onFocus={e => { e.target.style.border = "1px solid rgba(139,92,246,0.55)"; e.target.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.25), 0 0 0 3px rgba(139,92,246,0.12)"; e.target.style.background = "rgba(139,92,246,0.05)"; }}
                            onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; e.target.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.25)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
                          />
                        </div>
                      </div>

                      {/* Password field */}
                      <div className="group/field">
                        <div className="flex items-center justify-between mb-2.5">
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 select-none" htmlFor="password">
                            <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center" style={{ background: "rgba(139,92,246,0.20)" }}>
                              <svg className="w-2 h-2 text-purple-400" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                            </span>
                            Password
                          </label>
                          {!isRegister && <span className="text-[10px] font-bold text-slate-700 hover:text-purple-400 cursor-default transition">Forgot password?</span>}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-gradient-to-b from-purple-500/60 to-blue-500/40 opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-700 group-focus-within/field:text-purple-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <input id="password" type={showPwd ? "text" : "password"} placeholder="Min 8 characters"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            disabled={loading} required
                            className="w-full pl-11 pr-12 py-3.5 text-[13px] text-slate-200 placeholder-slate-700 rounded-2xl outline-none transition-all duration-200"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)",
                            }}
                            onFocus={e => { e.target.style.border = "1px solid rgba(139,92,246,0.55)"; e.target.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.25), 0 0 0 3px rgba(139,92,246,0.12)"; e.target.style.background = "rgba(139,92,246,0.05)"; }}
                            onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; e.target.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.25)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
                          />
                          <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-700 hover:text-purple-400 transition-colors duration-150 cursor-pointer focus:outline-none">
                            {showPwd
                              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                          </button>
                        </div>
                      </div>

                      {/* ── Submit CTA ── */}
                      <button type="submit" disabled={loading}
                        className="group relative overflow-hidden w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-[14px] cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 active:scale-[0.98] mt-2"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 25%, #6d28d9 50%, #4f46e5 75%, #3b82f6 100%)",
                          boxShadow: "0 0 0 1px rgba(168,85,247,0.5), 0 8px 32px rgba(109,40,217,0.6), 0 20px 60px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(168,85,247,0.7), 0 12px 48px rgba(109,40,217,0.75), 0 28px 80px rgba(79,70,229,0.50), inset 0 1px 0 rgba(255,255,255,0.25)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(168,85,247,0.5), 0 8px 32px rgba(109,40,217,0.6), 0 20px 60px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.22)"; }}>
                        {/* Shimmer */}
                        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[800ms] bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-15deg]" />
                        {/* Top glint */}
                        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        {/* Bottom shadow */}
                        <span className="absolute inset-x-0 bottom-0 h-px bg-black/30" />
                        {loading
                          ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg><span className="tracking-wide">Authenticating…</span></>
                          : isRegister
                            ? <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg><span className="tracking-wide">Create Free Account</span><span className="ml-1 opacity-70">→</span></>
                            : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg><span className="tracking-wide">Enter Workspace</span><span className="ml-1 opacity-70">→</span></>
                        }
                      </button>
                    </form>

                    {/* ── Trust strip ── */}
                    <div className="mt-7 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between">
                        {[
                          { icon: "🔒", label: "E2E Encrypted",  dot: "#10b981" },
                          { icon: "⚡", label: "<12ms Sync",     dot: "#a855f7" },
                          { icon: "✦",  label: "Gemini 2.0 AI", dot: "#3b82f6" },
                        ].map(({ icon, label, dot }) => (
                          <div key={label} className="flex flex-col items-center gap-1.5">
                            <span className="text-base">{icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: dot }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-slate-800 mt-4">
                By continuing, you agree to our{" "}
                <span className="text-slate-600 hover:text-purple-400 cursor-default transition">Terms</span>{" & "}
                <span className="text-slate-600 hover:text-purple-400 cursor-default transition">Privacy Policy</span>
              </p>
            </div>
          </div>


        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-20 px-8 py-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-800">
          <span>© 2025 CodeFusionAI — Real-time AI Pair Programming Platform</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-700 animate-pulse" />
            <span className="text-slate-700 font-bold">v1.0 Beta</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Login;
