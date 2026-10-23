import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import AuthShell from "../auth/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

/* ------------------------------------------------------------------ */
/*  ForgotPassword — two stages on one route:                          */
/*    /forgot-password            → request a reset link               */
/*    /forgot-password?token=...  → set a new password                 */
/*  A real backend emails the link; here it's surfaced inline (dev      */
/*  mode) since there's no mail server to send it through.              */
/* ------------------------------------------------------------------ */

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  return token ? <ResetStage token={token} /> : <RequestStage />;
}

function RequestStage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter the email associated with your account.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(email);
      setResult(res);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.sent) {
    return (
      <AuthShell
        eyebrow="Forgot password"
        title="Check your inbox"
        subtitle={`If an account exists for ${email}, a reset link is on its way.`}
      >
        <div className="auth-success">
          <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Reset link sent. It expires in 30 minutes.</span>
        </div>

        {result.devToken && (
          <div style={{ marginTop: 14 }}>
            <p className="auth-field-label">No mail server wired up yet — here's the link directly:</p>
            <Link to={`/forgot-password?token=${result.devToken}`} className="auth-link">
              Continue to reset password →
            </Link>
          </div>
        )}

        <Link to="/login" className="auth-btn-primary">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="Enter your work email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} noValidate>
        <label className="auth-field-label" htmlFor="fp-email">Work email</label>
        <div className="auth-input-wrap">
          <Mail size={15} className="auth-input-icon" />
          <input
            id="fp-email"
            type="email"
            autoComplete="username"
            className="auth-input"
            placeholder="you@superfac.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="auth-btn-primary" disabled={submitting}>
          <KeyRound size={15} />
          {submitting ? "Sending link…" : "Send reset link"}
        </button>

        <div className="auth-link-row" style={{ justifyContent: "center" }}>
          <Link to="/login" className="auth-link">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

function ResetStage({ token }) {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const passwordLongEnough = useMemo(() => password.length >= 8, [password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!passwordLongEnough) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell eyebrow="Forgot password" title="Password updated" subtitle="Redirecting you to sign in…">
        <div className="auth-success">
          <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Your password has been reset successfully.</span>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Set a new password"
      subtitle="Choose a new password for your SuperFac account."
    >
      <form onSubmit={handleSubmit} noValidate>
        <label className="auth-field-label" htmlFor="rp-password">New password</label>
        <div className="auth-input-wrap" style={{ marginBottom: 16 }}>
          <Lock size={15} className="auth-input-icon" />
          <input
            id="rp-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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

        <label className="auth-field-label" htmlFor="rp-confirm">Confirm password</label>
        <div className="auth-input-wrap">
          <Lock size={15} className="auth-input-icon" />
          <input
            id="rp-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="auth-input"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="auth-btn-primary" disabled={submitting}>
          <KeyRound size={15} />
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
