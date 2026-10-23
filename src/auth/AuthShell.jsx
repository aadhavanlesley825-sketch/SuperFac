import React from "react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  AuthShell — the "Control Deck" chrome (graphite glass, amber/cyan   */
/*  gradient wash, Space Grotesk + Inter type) reused for Login,        */
/*  Forgot Password, and Unauthorized so the auth module feels like     */
/*  part of PulsePlant rather than a bolted-on form.                    */
/* ------------------------------------------------------------------ */

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="auth-root min-h-screen w-full flex items-center justify-center px-4 py-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .auth-root {
          background: #f5f4f2;
          font-family: 'Inter', sans-serif;
          color: #111111;
          position: relative;
        }
        .auth-root::before {
          content: "";
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.2), rgba(17,17,17,0.02));
        }
        .auth-root > * { position: relative; z-index: 1; }

        .auth-card {
          width: 100%; max-width: 450px;
          background: rgba(255,255,255,0.96);
          border: 1px solid #e7e3df;
          border-radius: 18px;
          padding: 28px 26px 22px;
          box-shadow: none;
        }

        .auth-logo-mark {
          width: 82px; height: 62px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          background: #ffffff;
          overflow: hidden;
          border: 1px solid #ebe5e0;
          padding: 8px;
        }
        .auth-logo-mark img {
          width: 100%; height: 100%; object-fit: contain; display: block;
          object-position: center;
        }
        .auth-app-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; font-weight: 700; letter-spacing: -0.04em; color: #111111; }
        .auth-app-sub { font-size: 0.7rem; color: #696661; margin-top: 2px; }
        .auth-eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #4d4a47; margin-top: 24px; }
        .auth-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; line-height: 1.1; font-weight: 700; color: #111111; margin-top: 8px; letter-spacing: -0.06em; }
        .auth-subtitle { font-size: 0.9rem; color: #4d4a47; margin-top: 8px; line-height: 1.6; }

        .auth-field-label { font-size: 0.74rem; font-weight: 600; color: #2d2b29; margin-bottom: 7px; display: block; }
        .auth-input-wrap { position: relative; display: flex; align-items: center; }
        .auth-input {
          width: 100%; background: #ffffff; border: 1px solid #ddd7d2;
          border-radius: 12px; padding: 10px 38px 10px 38px; font-size: 0.88rem; color: #111111;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .auth-input::placeholder { color: #9a9591; }
        .auth-input:focus { outline: none; border-color: rgba(17,17,17,0.6); box-shadow: 0 0 0 4px rgba(17,17,17,0.04); }
        .auth-input-icon { position: absolute; left: 12px; color: #696661; pointer-events: none; }
        .auth-input-adorn { position: absolute; right: 10px; color: #696661; cursor: pointer; background: none; border: none; display: flex; }
        .auth-input-adorn:hover { color: #111111; }

        .auth-error {
          display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: #171717;
          background: rgba(17,17,17,0.03); border: 1px solid rgba(17,17,17,0.1);
          border-radius: 10px; padding: 9px 11px; margin-top: 14px; line-height: 1.4;
        }
        .auth-success {
          display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: #171717;
          background: rgba(17,17,17,0.03); border: 1px solid rgba(17,17,17,0.1);
          border-radius: 10px; padding: 9px 11px; margin-top: 14px; line-height: 1.4;
        }

        .auth-btn-primary {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 0.86rem; font-weight: 600; color: #ffffff; background: #111111;
          padding: 11px 16px; border-radius: 12px; margin-top: 18px; text-decoration: none; border: none; cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .auth-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .auth-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .auth-link-row { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 0.78rem; }
        .auth-link { color: #111111; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }

        .auth-footer { margin-top: 22px; padding-top: 18px; border-top: 1px solid #e7e3df; font-size: 0.72rem; color: #6d6965; line-height: 1.6; }
        .auth-demo-chip {
          font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #2d2b29; cursor: pointer;
          background: #f7f6f4; border: 1px solid #ddd7d2;
          border-radius: 8px; padding: 4px 8px; transition: background 0.15s ease, border-color 0.15s ease;
        }
        .auth-demo-chip:hover { background: #f0efed; border-color: #cfc8c2; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="auth-card"
      >
        <div className="flex items-center gap-3">
          <div className="auth-logo-mark">
            <img src={`${import.meta.env.BASE_URL}superfac-logo.svg`} alt="SuperFac logo" />
          </div>
          <div>
            <p className="auth-app-title">SuperFac</p>
            <p className="auth-app-sub">Nike Chennai Manufacturing Facility · Operations Command Center</p>
          </div>
        </div>

        {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
        {title && <h1 className="auth-title">{title}</h1>}
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}

        <div style={{ marginTop: 22 }}>{children}</div>

        {footer && <div className="auth-footer">{footer}</div>}
      </motion.div>
    </div>
  );
}

export function AuthLoadingScreen() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "linear-gradient(180deg, #0A0E13 0%, #0B1017 100%)" }}
    >
      <style>{`
        .auth-loading-spin {
          width: 30px; height: 30px; border-radius: 999px;
          border: 2px solid rgba(63,208,234,0.2); border-top-color: #3FD0EA;
          animation: authloadingspin 0.85s linear infinite;
        }
        @keyframes authloadingspin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="auth-loading-spin" aria-label="Checking session" role="status" />
    </div>
  );
}
