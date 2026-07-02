import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Room from "./pages/Room";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          }
        />
        <Route
          path="/webcontainer/*"
          element={
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: '#e6edf3', fontFamily: 'sans-serif' }}>
              <svg className="animate-spin h-8 w-8 text-[#58a6ff] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
              </svg>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Connecting to Dev Server...</h2>
              <p style={{ color: '#8b949e', fontSize: '0.875rem', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
                Waiting for the WebContainer Service Worker to intercept this request. If it does not load after a few seconds, please view the preview directly inside the IDE.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '20px', padding: '8px 16px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#30363d'}
                onMouseLeave={(e) => e.target.style.background = '#21262d'}
              >
                Force Reload
              </button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;