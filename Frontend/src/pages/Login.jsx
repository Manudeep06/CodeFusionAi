import { useEffect, useState } from "react";
import { signInWithGoogle, signInWithGoogleRedirect, loginUser, registerUser } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

const Mark = () => (
  <span className="cf-brand-mark" aria-hidden="true">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
    </svg>
  </span>
);

function Login() {
  const { user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    if (user) window.location.href = "/dashboard";
  }, [user]);

  const resetMessages = () => {
    setErrMsg("");
    setOkMsg("");
  };

  const google = () => {
    const signInPromise = signInWithGoogle();
    setLoading(true);
    resetMessages();

    signInPromise
      .then((result) => {
        if (result?.user) {
          setOkMsg("Signed in. Opening your workspace…");
          setTimeout(() => { window.location.href = "/dashboard"; }, 500);
        }
      })
      .catch((err) => {
        if (err.code === "auth/popup-blocked") {
          setOkMsg("Popup blocked. Continuing with Google…");
          signInWithGoogleRedirect().catch(() => setErrMsg("Google sign-in could not start. Please allow popups and try again."));
        } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
          setErrMsg("Sign-in was cancelled. Try again when you're ready.");
        } else if (err.code === "auth/network-request-failed") {
          setErrMsg("Network error. Check your connection and try again.");
        } else if (err.code === "auth/unauthorized-domain") {
          setErrMsg("This domain is not authorized for Google sign-in.");
        } else {
          setErrMsg(err.message || "Google sign-in failed. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      if (isRegister) {
        await registerUser(email, password);
        setOkMsg("Account created. Opening your workspace…");
      } else {
        await loginUser(email, password);
        setOkMsg("Signed in. Opening your workspace…");
      }
    } catch (err) {
      let message = err.message || "We couldn't complete that request.";
      if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) message = "Check your email and password, then try again.";
      if (message.includes("auth/user-not-found")) message = "No account exists for this email. Create one to continue.";
      if (message.includes("auth/email-already-in-use")) message = "An account already exists for this email. Sign in instead.";
      if (message.includes("auth/invalid-email")) message = "Enter a valid email address.";
      if (message.includes("auth/weak-password")) message = "Use a password with at least 6 characters.";
      setErrMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const selectMode = (register) => {
    setIsRegister(register);
    resetMessages();
  };

  return (
    <div className="cf-app">
      <header className="cf-app-header">
        <div className="cf-brand"><Mark /> CodeFusionAI</div>
        <span className="cf-eyebrow">Collaborative coding</span>
      </header>

      <main className="cf-auth">
        <section className="cf-auth-story" aria-labelledby="welcome-title">
          <p className="cf-eyebrow">A better starting point</p>
          <h1 id="welcome-title" className="cf-auth-title">Bring the whole build into one room.</h1>
          <p className="cf-auth-copy">Open a shared workspace, write together in real time, and bring AI help into the same focused flow.</p>
          <div className="cf-workflow" aria-label="How CodeFusionAI works">
            <div><strong>Create</strong><span>Start with a project you can shape.</span></div>
            <div><strong>Invite</strong><span>Share a room link with your collaborators.</span></div>
            <div><strong>Ship</strong><span>Run, review, and iterate in one place.</span></div>
          </div>
        </section>

        <section className="cf-auth-panel" aria-labelledby="auth-title">
          <div className="cf-segmented" role="group" aria-label="Authentication mode">
            <button type="button" aria-pressed={!isRegister} onClick={() => selectMode(false)}>Sign in</button>
            <button type="button" aria-pressed={isRegister} onClick={() => selectMode(true)}>Create account</button>
          </div>
          <h2 id="auth-title" className="cf-panel-heading">{isRegister ? "Start a workspace" : "Welcome back"}</h2>
          <p className="cf-panel-subtitle">{isRegister ? "Create your account to start a shared coding room." : "Sign in to continue to your projects."}</p>

          {errMsg && <div className="cf-message error" role="alert">{errMsg}</div>}
          {okMsg && <div className="cf-message success" role="status">{okMsg}</div>}

          <button type="button" className="cf-secondary-button cf-google-button" onClick={google} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="var(--color-google-blue)" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="var(--color-google-green)" />
              <path d="M5.84 14.09A6.95 6.95 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.06H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85Z" fill="var(--color-google-yellow)" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z" fill="var(--color-google-red)" />
            </svg>
            Continue with Google
          </button>

          <div className="cf-divider">or continue with email</div>

          <form className="cf-form" onSubmit={submit}>
            <div className="cf-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="cf-field">
              <label htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input id="password" type={showPwd ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 6 characters" : "Your password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" />
                <button type="button" className="cf-quiet-button" onClick={() => setShowPwd((visible) => !visible)} style={{ position: "absolute", right: "0.25rem", top: "0.2rem" }}>{showPwd ? "Hide" : "Show"}</button>
              </div>
            </div>
            <button type="submit" className="cf-primary-button" disabled={loading}>{loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
          </form>
          <p className="cf-auth-note">By continuing, you agree to use this workspace responsibly and only share room links with people you trust.</p>
        </section>
      </main>
    </div>
  );
}

export default Login;
