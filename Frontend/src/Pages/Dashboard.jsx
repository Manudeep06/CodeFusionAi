import { auth, logout } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>
        Welcome {user?.displayName || user?.email}
      </h2>

      <p>Email: {user?.email}</p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;