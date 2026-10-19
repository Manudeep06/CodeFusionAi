import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="cf-app" style={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
        <span className="cf-pill"><span className="cf-live-dot" aria-hidden="true" /> Loading your workspace…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;