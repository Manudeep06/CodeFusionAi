import { useState } from "react";
import { auth, logout } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


// Clean static Dashboard Card Component - minimalist developer theme
function DashboardCard({ children, className = "" }) {
  return (
    <div
      className={`bg-slate-900/20 border border-slate-900 rounded-2xl p-6 md:p-8 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [joinId, setJoinId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRoom = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let segment1 = "";
    let segment2 = "";
    for (let i = 0; i < 4; i++) {
      segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
      segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generatedId = `cfai-${segment1}-${segment2}`;
    setRoomId(generatedId);
    setCopied(false);
  };

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    setIsJoining(true);
    // Simulate navigation/joining
    setTimeout(() => {
      alert(`Joining Room: ${joinId}\n(Note: Code editor implementation is currently being prepared.)`);
      setIsJoining(false);
    }, 1200);
  };

  // Get initials for avatar
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 flex flex-col font-sans">
      {/* Header/Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 select-none">
            <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-2 rounded-lg shadow-md shadow-purple-500/10">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
              CodeFusionAI
            </span>
          </div>

          {/* User Section & Logout */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800 rounded-full pl-3 pr-4 py-1.5 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-slate-300">
                {user?.displayName || user?.email?.split("@")[0]}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 py-2 px-3.5 border border-slate-800 rounded-xl bg-slate-900/40 hover:bg-red-950/20 hover:border-red-900/50 hover:text-red-400 transition-all duration-200 text-sm font-semibold cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2 font-sans select-none">
              Welcome back, {user?.displayName || user?.email?.split("@")[0]} 👋
            </h1>
            <p className="text-slate-400 font-sans text-sm">
              Your real-time AI pair programming environment is operational. Select an option to start.
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-450 font-sans max-w-xs select-none">
            <span className="font-semibold text-slate-450">Developer Session ID:</span>{" "}
            <span className="font-mono text-purple-400 font-medium select-all">
              {user?.uid?.slice(0, 12)}...
            </span>
          </div>
        </div>

        {/* HUD Developer metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 select-none">
          {/* Card 1 */}
          <div className="bg-slate-900/10 border border-slate-900/80 p-4.5 rounded-xl hover:border-slate-800 transition duration-300">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Sync Latency</span>
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-slate-100 font-sans">~12ms</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">✔ Websockets Active</div>
          </div>
          {/* Card 2 */}
          <div className="bg-slate-900/10 border border-slate-900/80 p-4.5 rounded-xl hover:border-slate-800 transition duration-300">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Active Rooms</span>
              <svg className="w-3.5 h-3.5 text-blue-405" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-lg font-bold text-slate-100 font-sans">{roomId ? "1 / 5" : "0 / 5"}</div>
            <div className="text-[10px] text-slate-550 mt-0.5">Developer Capacity</div>
          </div>
          {/* Card 3 */}
          <div className="bg-slate-900/10 border border-slate-900/80 p-4.5 rounded-xl hover:border-slate-800 transition duration-300">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>AI Copilot</span>
              <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-slate-100 font-sans">Ready</div>
            <div className="text-[10px] text-purple-400 font-semibold mt-0.5">Gemini-2.0-Flash</div>
          </div>
          {/* Card 4 */}
          <div className="bg-slate-900/10 border border-slate-900/80 p-4.5 rounded-xl hover:border-slate-800 transition duration-300">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Compilers</span>
              <svg className="w-3.5 h-3.5 text-cyan-405" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div className="text-lg font-bold text-slate-100 font-sans">4 Engines</div>
            <div className="text-[10px] text-slate-555 mt-0.5">Judge0 Sandbox</div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Management Section (Col Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Room Card */}
            <DashboardCard>
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-purple-400 shrink-0 select-none">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 mb-1 font-sans">
                    Create Collaborative Room
                  </h2>
                  <p className="text-slate-400 text-xs font-sans">
                    Spawn a secure coding space with instant real-time synchronization.
                  </p>
                </div>
              </div>

              {!roomId ? (
                <button
                  onClick={handleCreateRoom}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-purple-950/20 cursor-pointer text-sm font-sans"
                >
                  <span>Generate New Room</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-slate-950 border border-slate-850 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider sm:border-r sm:border-slate-800 sm:pr-4 select-none">
                      ROOM ID
                    </span>
                    <code className="text-purple-400 font-mono text-base font-semibold tracking-wider flex-1 selection:bg-purple-900/30 select-all">
                      {roomId}
                    </code>
                    <button
                      onClick={handleCopyRoomId}
                      className={`flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                        copied
                          ? "bg-emerald-950/40 text-emerald-405 border-emerald-800"
                          : "bg-slate-900 border-slate-850 text-slate-300 hover:text-slate-105 hover:border-slate-700"
                      }`}
                    >
                      {copied ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setRoomId("")}
                      className="text-xs font-semibold text-slate-505 hover:text-slate-400 transition cursor-pointer"
                    >
                      Clear generated room
                    </button>
                  </div>
                </div>
              )}
            </DashboardCard>

            {/* Join Room Card */}
            <DashboardCard>
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-blue-400 shrink-0 select-none">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 mb-1 font-sans">
                    Join Existing Room
                  </h2>
                  <p className="text-slate-400 text-xs font-sans">
                    Enter the Room ID shared by your team member to jump right into collaboration.
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-650">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. cfai-xxxx-xxxx"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    disabled={isJoining}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-650 font-mono text-sm tracking-wider focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-950 transition duration-200"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining || !joinId.trim()}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-950/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-sm font-sans"
                >
                  {isJoining ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect to Editor</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </DashboardCard>
          </div>

          {/* User Details & Sidebar */}
          <div className="space-y-8">
            {/* Profile Overview */}
            <DashboardCard className="!p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5 font-sans select-none">
                User Profile
              </h3>
              <div className="flex items-center space-x-4 mb-5 pb-5 border-b border-slate-900/50">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/20 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/10 shrink-0">
                    {getInitials()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-200 font-sans truncate">
                    {user?.displayName || "Developer Session"}
                  </h4>
                  <p className="text-slate-550 text-xs truncate font-sans">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="space-y-3.5 text-xs text-slate-450 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 select-none">Login Provider:</span>
                  <span className="font-semibold text-slate-350 bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded-md">
                    {user?.providerData?.[0]?.providerId === "google.com" ? "Google Work" : "Credentials"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 select-none">Access Control:</span>
                  <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 shadow-md shadow-emerald-500/20"></span>
                    Authorized
                  </span>
                </div>
              </div>
            </DashboardCard>

            {/* Service Status Panel */}
            <DashboardCard className="!p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5 font-sans select-none">
                System Status
              </h3>
              <ul className="space-y-4 font-sans text-xs">
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-300 font-medium">Sync Socket Server</span>
                  </div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Active</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-300 font-medium">Judge0 Sandboxes</span>
                  </div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Active</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-300 font-medium">Gemini-2.0-Flash API</span>
                  </div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Ready</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-300 font-medium">Database Cluster</span>
                  </div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Online</span>
                </li>
              </ul>
            </DashboardCard>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;