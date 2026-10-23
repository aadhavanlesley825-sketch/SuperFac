import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import AuthShell from "../auth/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

/* ------------------------------------------------------------------ */
/*  Login — email + password, routed to the page the user was headed   */
/*  to before ProtectedRoute redirected them (defaults to Overview).    */
/* ------------------------------------------------------------------ */

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@superfac.io", password: "Admin@123" },
  { role: "Plant Manager", email: "manager@superfac.io", password: "Manager@123" },
  { role: "Service Engineer", email: "engineer@superfac.io", password: "Engineer@123" },
  { role: "Technician", email: "technician@superfac.io", password: "Technician@123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Sign in to access the plant floor command center."
      footer={
        <>
          <p style={{ marginBottom: 8 }}>Demo accounts — tap a role to autofill:</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.role} type="button" className="auth-demo-chip" onClick={() => fillDemo(acc)}>
                {acc.role}
              </button>
            ))}
          </div>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <label className="auth-field-label" htmlFor="login-email">Work email</label>
        <div className="auth-input-wrap" style={{ marginBottom: 16 }}>
          <Mail size={15} className="auth-input-icon" />
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            className="auth-input"
            placeholder="you@superfac.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="auth-field-label" htmlFor="login-password">Password</label>
        <div className="auth-input-wrap">
          <Lock size={15} className="auth-input-icon" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="auth-input-adorn"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="auth-link-row">
          <span />
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="auth-btn-primary" disabled={submitting}>
          <LogIn size={15} />
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
