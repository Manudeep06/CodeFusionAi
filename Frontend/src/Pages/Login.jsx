import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithGoogle,
  loginUser,
  registerUser,
} from "../firebase/firebase";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isRegister) {
        await registerUser(email, password);
        alert("Registration Successful");
      } else {
        await loginUser(email, password);
        alert("Login Successful");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div>
      <h1>CodeFusionAI</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br />
        <br />

        <button type="submit">
          {isRegister ? "Register" : "Login"}
        </button>
      </form>

      <br />

      <button onClick={handleGoogleLogin}>
        Sign In With Google
      </button>

      <br />
      <br />

      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister
          ? "Already have an account? Login"
          : "Create New Account"}
      </button>
    </div>
  );
}

export default Login;