import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithGoogle,
  loginUser,
  registerUser,
} from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import Background3D from "./Background3D";

function Login() {
  const { user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Failed to authenticate with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isRegister) {
        await registerUser(email, password);
        setSuccessMsg("Registration Successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        await loginUser(email, password);
        setSuccessMsg("Login Successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 bg-grid-pattern bg-radial-glow px-4 py-16 overflow-hidden">
      {/* 3D Interactive Canvas Background */}
      <Background3D />

      {/* Brand Name/Logo at top-left of page */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-12 flex items-center space-x-2.5 z-20 select-none">
        <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-2 rounded-xl shadow-lg shadow-purple-500/25">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight font-sans">
          CodeFusionAI
        </span>
      </div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 pt-12 lg:pt-0">
        {/* Left Column - Collaborative Developer Activity Dashboard */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center animate-float">
          {/* Dashboard Container */}
          <div className="w-full bg-[#0d1117]/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/85 font-sans p-6 text-left relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80 select-none">
              <div>
                <h3 className="text-base font-bold text-slate-100">Collaboration Activity Room</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time sync stream room: cfai-live-react</p>
              </div>
              <div className="flex items-center space-x-1 bg-purple-950/60 border border-purple-500/20 px-2.5 py-1 rounded-full text-purple-300 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse mr-1"></span>
                LIVE CONNECT
              </div>
            </div>

            {/* HUD Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 select-none">
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sync Latency</div>
                <div className="text-lg font-bold text-emerald-400 mt-1 font-mono flex items-center">
                  12ms
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-2 shrink-0"></span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Peers</div>
                <div className="text-lg font-bold text-slate-200 mt-1 flex items-center justify-between">
                  <span>5</span>
                  {/* Tiny avatar group */}
                  <div className="flex -space-x-1 shrink-0">
                    <div className="w-4.5 h-4.5 rounded-full bg-purple-600 flex items-center justify-center text-[7px] text-white font-bold border border-slate-950 shadow">S</div>
                    <div className="w-4.5 h-4.5 rounded-full bg-blue-600 flex items-center justify-center text-[7px] text-white font-bold border border-slate-950 shadow">A</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">AI Scan Status</div>
                <div className="text-lg font-bold text-purple-400 mt-1 font-mono flex items-center">
                  Clean
                  <svg className="w-4 h-4 text-purple-400 ml-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Activity Chart Container */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3 select-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sync & Commit Rate</span>
                <span className="text-[10px] text-slate-500 font-mono">Last 6 Hours</span>
              </div>
              <div className="relative w-full h-24">
                {/* SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path
                    d="M 0 100 L 0 70 Q 20 40 40 55 T 80 25 L 100 15 L 100 100 Z"
                    fill="url(#chartGlow)"
                  />
                  {/* Line Path */}
                  <path
                    d="M 0 70 Q 20 40 40 55 T 80 25 L 100 15"
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  {/* Interactive dots */}
                  <circle cx="40" cy="55" r="2.5" fill="#6366f1" className="animate-pulse" />
                  <circle cx="100" cy="15" r="2.5" fill="#06b6d4" className="animate-pulse" />
                </svg>
                {/* Floating active label overlay */}
                <div className="absolute top-1 left-1/3 bg-slate-900 border border-indigo-500/20 px-2 py-0.75 rounded text-[9px] text-slate-300 font-mono shadow-md select-none">
                  ⚡ 84 commits/min
                </div>
              </div>
            </div>

            {/* Collaboration Event Stream */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 select-none">Recent Room Events</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                
                {/* Event 1 */}
                <div className="flex items-start space-x-3 text-xs border-l border-slate-800/80 pl-3 relative">
                  <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-slate-900 shrink-0"></span>
                  <div className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-[9px] font-bold text-purple-300 shrink-0 select-none">AM</div>
                  <div>
                    <div className="text-slate-300"><span className="font-semibold text-slate-200">Alex Mitchell</span> joined the workspace sync.</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">3 mins ago • room: cfai-live-react</div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="flex items-start space-x-3 text-xs border-l border-slate-800/80 pl-3 relative">
                  <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-slate-900 shrink-0"></span>
                  <div className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-500/30 flex items-center justify-center text-[9px] font-bold text-purple-300 shrink-0 select-none">✨</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300"><span className="font-semibold text-purple-400">Gemini AI</span> optimized loop in <code className="text-[10px] bg-slate-950 px-1 py-0.5 rounded text-purple-300 font-mono">App.jsx</code></div>
                    <div className="text-[9px] text-slate-500 mt-0.5">6 mins ago • 98% confidence code review match</div>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="flex items-start space-x-3 text-xs border-l border-slate-800/80 pl-3 relative">
                  <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-slate-900 shrink-0"></span>
                  <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-300 shrink-0 select-none">SM</div>
                  <div>
                    <div className="text-slate-300"><span className="font-semibold text-slate-200">Sarah Mercer</span> pushed local edits to repository.</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">14 mins ago • master branch</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Clean Static Form Card */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          {/* Login Card Form */}
          <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 rounded-2xl p-8 shadow-2xl shadow-black/90 transition-all duration-300">
            
            {/* Premium Pill Mode Switcher */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 mb-8 select-none">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500/40 ${
                  !isRegister
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow shadow-purple-950/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500/40 ${
                  isRegister
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow shadow-purple-950/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Register
              </button>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-6 text-center font-sans tracking-tight">
              {isRegister ? "Create developer account" : "Welcome back"}
            </h2>

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 text-sm flex items-start space-x-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-sm flex items-start space-x-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 select-none" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition duration-200 text-sm font-sans"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 select-none" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-12 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition duration-200 text-sm font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition duration-150 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isRegister ? (
                  "Create Account"
                ) : (
                  "Login with Email"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center select-none">
              <div className="absolute inset-x-0 border-t border-slate-800"></div>
              <span className="relative bg-slate-900 px-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-slate-300 font-semibold text-sm bg-slate-950 border border-slate-800 hover:bg-slate-900/60 hover:text-slate-100 hover:border-slate-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500/40 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;