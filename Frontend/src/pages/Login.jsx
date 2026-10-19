import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, CircleAlert, Loader2, MailCheck } from "lucide-react";
import { signInWithGoogle, signInWithGoogleRedirect, loginUser, registerUser, resetPassword } from "../firebase/firebase";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Brand, { BrandMark } from "../components/ui/Brand";
import "../styles/auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const friendlyError = (err) => {
  const code = err?.code || err?.message || "";
  if (/invalid-credential|wrong-password/.test(code)) return "Check your email and password, then try again.";
  if (/user-not-found/.test(code)) return "No account exists for this email. Create one to continue.";
  if (/email-already-in-use/.test(code)) return "An account already exists for this email. Sign in instead.";
  if (/invalid-email/.test(code)) return "Enter a valid email address.";
  if (/weak-password/.test(code)) return "Use a password with at least 6 characters.";
  if (/too-many-requests/.test(code)) return "Too many attempts. Wait a moment and try again.";
  if (/network-request-failed/.test(code)) return "Network error. Check your connection and try again.";
  if (/popup-closed-by-user|cancelled-popup-request/.test(code)) return "Sign-in was cancelled. Try again when you're ready.";
  if (/unauthorized-domain/.test(code)) return "This domain isn't authorized for Google sign-in.";
  return err?.message || "Something went wrong. Please try again.";
};

const strengthOf = (pw) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
};

const initialsOf = (name) => name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function Login() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "signin"); // signin | register | reset
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const busy = useRef(false); // true while we finish profile setup after sign-up

  // Already signed in (or just signed in): go to the dashboard — unless we're still saving the new profile.
  useEffect(() => {
    if (user && !busy.current) window.location.href = "/dashboard";
  }, [user]);

  const isRegister = mode === "register";
  const nameError = isRegister && (name.trim().length < 2 || name.trim().length > 40) ? "Enter your name (2–40 characters)." : "";
  const emailError = !EMAIL_RE.test(email) ? "Enter a valid email address." : "";
  const passwordError = mode !== "reset" && password.length < 6 ? "Use 6 or more characters." : "";
  const strength = strengthOf(password);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setTouched({});
    setResetSent(false);
  };

  const google = () => {
    setLoading(true);
    setError("");
    signInWithGoogle()
      .catch((err) => {
        if (err.code === "auth/popup-blocked") {
          return signInWithGoogleRedirect().catch(() => setError("Google sign-in couldn't start. Allow pop-ups and try again."));
        }
        setError(friendlyError(err));
      })
      .finally(() => setLoading(false));
  };

  const submit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if ((isRegister && nameError) || emailError || (mode !== "reset" && passwordError)) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setResetSent(true);
      } else if (isRegister) {
        busy.current = true;
        const displayName = name.trim();
        await registerUser(email, password, displayName);
        // Mirror the name into the app profile that collaborators see.
        await apiFetch("/api/users/profile", { method: "POST", body: JSON.stringify({ displayName }) }).catch(() => {});
        window.location.href = "/dashboard";
      } else {
        await loginUser(email, password);
      }
    } catch (err) {
      busy.current = false;
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (key, err) => `cf-field ${touched[key] && err ? "has-error" : ""}`;
  const heading = mode === "reset" ? "Reset your password" : isRegister ? "Create your account" : "Sign in to CodeFusionAI";
  const sub = mode === "reset" ? "We'll email you a link to choose a new password." : isRegister ? "Start coding with your team in minutes." : "Welcome back. Continue to your workspace.";

  return (
    <div className="auth-page">
      <header className="auth-top">
        <Brand />
        <Link to="/" className="cf-quiet-button"><ArrowLeft size={15} /> Back to home</Link>
      </header>

      <main className="auth-main">
        <section className="auth-card cf-rise" aria-labelledby="auth-title">
          <div className="auth-head">
            <BrandMark size={20} />
            <h1 id="auth-title">{heading}</h1>
            <p>{sub}</p>
          </div>

          {mode !== "reset" && (
            <div className="cf-segmented auth-tabs" role="group" aria-label="Choose sign in or create account">
              <button type="button" aria-pressed={!isRegister} onClick={() => switchMode("signin")}>Sign in</button>
              <button type="button" aria-pressed={isRegister} onClick={() => switchMode("register")}>Create account</button>
            </div>
          )}

          {error && <div className="cf-message error" role="alert">{error}</div>}

          {mode === "reset" && resetSent ? (
            <div className="auth-sent">
              <MailCheck size={28} />
              <p>If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.</p>
              <button type="button" className="cf-primary-button" onClick={() => switchMode("signin")}>Back to sign in</button>
            </div>
          ) : (
            <>
              {mode !== "reset" && (
                <>
                  <button type="button" className="cf-secondary-button auth-google" onClick={google} disabled={loading}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="var(--color-google-blue)" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="var(--color-google-green)" />
                      <path d="M5.84 14.09A6.95 6.95 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.06H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85Z" fill="var(--color-google-yellow)" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z" fill="var(--color-google-red)" />
                    </svg>
                    {isRegister ? "Sign up with Google" : "Continue with Google"}
                  </button>
                  <div className="cf-divider">or {isRegister ? "sign up" : "continue"} with email</div>
                </>
              )}

              <form className="cf-form" onSubmit={submit} noValidate>
                {isRegister && (
                  <div className={fieldClass("name", nameError)}>
                    <label htmlFor="name">Full name</label>
                    <div className="auth-input">
                      <User size={16} aria-hidden="true" />
                      <input id="name" autoComplete="name" placeholder="Your name" value={name} maxLength={40}
                        onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        aria-invalid={Boolean(touched.name && nameError)} aria-describedby="name-help" />
                    </div>
                    {touched.name && nameError
                      ? <p className="cf-field-error" id="name-help"><CircleAlert size={13} /> {nameError}</p>
                      : <p className="cf-field-help" id="name-help">Shown to collaborators, on your cursor and in the dashboard.</p>}
                  </div>
                )}

                <div className={fieldClass("email", emailError)}>
                  <label htmlFor="email">Email</label>
                  <div className="auth-input">
                    <Mail size={16} aria-hidden="true" />
                    <input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      aria-invalid={Boolean(touched.email && emailError)} />
                  </div>
                  {touched.email && emailError && <p className="cf-field-error"><CircleAlert size={13} /> {emailError}</p>}
                </div>

                {mode !== "reset" && (
                  <div className={fieldClass("password", passwordError)}>
                    <div className="auth-label-row">
                      <label htmlFor="password">Password</label>
                      {!isRegister && <button type="button" className="auth-link" onClick={() => switchMode("reset")}>Forgot password?</button>}
                    </div>
                    <div className="auth-input">
                      <Lock size={16} aria-hidden="true" />
                      <input id="password" type={showPwd ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"}
                        placeholder={isRegister ? "At least 6 characters" : "Your password"} value={password}
                        onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        aria-invalid={Boolean(touched.password && passwordError)} />
                      <button type="button" className="auth-eye" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? "Hide password" : "Show password"}>
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {isRegister && password && (
                      <div className="auth-strength" aria-label={`Password strength ${strength} of 4`}>
                        {[0, 1, 2, 3].map((i) => <i key={i} className={i < strength ? `is-on s${strength}` : ""} />)}
                      </div>
                    )}
                    {touched.password && passwordError && <p className="cf-field-error"><CircleAlert size={13} /> {passwordError}</p>}
                  </div>
                )}

                <button type="submit" className="cf-primary-button auth-submit" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {mode === "reset" ? "Send reset link" : isRegister ? "Create account" : "Sign in"}
                </button>
              </form>

              {isRegister && name.trim().length >= 2 && (
                <div className="auth-preview" aria-live="polite">
                  <span>{initialsOf(name)}</span>
                  <div><strong>{name.trim()}</strong><small>This is how teammates will see you</small></div>
                </div>
              )}

              <p className="auth-foot">
                {mode === "reset" ? (
                  <button type="button" className="auth-link" onClick={() => switchMode("signin")}>Back to sign in</button>
                ) : isRegister ? (
                  <>Already have an account? <button type="button" className="auth-link" onClick={() => switchMode("signin")}>Sign in</button></>
                ) : (
                  <>No account? <button type="button" className="auth-link" onClick={() => switchMode("register")}>Create one</button></>
                )}
              </p>
              {isRegister && <p className="auth-note">Google sign-up uses the name on your Google account. You can change it later in Settings.</p>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
