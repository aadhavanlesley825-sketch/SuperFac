import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserCircle2, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { ROLE_LABELS } from "./roles.js";

/* ------------------------------------------------------------------ */
/*  AuthHeaderControls — a small floating session pill (name, role,     */
/*  sign out) rendered once at the App level. It sits on top of        */
/*  whatever page is active without editing PulsePlantDashboard.jsx     */
/*  or any other existing screen.                                       */
/* ------------------------------------------------------------------ */

export default function AuthHeaderControls() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="auth-hc-wrap">
      <style>{`
        .auth-hc-wrap { position: relative; z-index: 10; font-family: 'Inter', sans-serif; }
        .auth-hc-pill {
          display: flex; align-items: center; gap: 8px; cursor: pointer; border: none;
          background: rgba(255,255,255,0.94); border: 1px solid rgba(148,163,184,0.24);
          border-radius: 10px; padding: 6px 10px 6px 8px;
          min-width: 0;
          box-shadow: 0 8px 20px -18px rgba(15, 23, 42, 0.22);
        }
        .auth-hc-avatar { width: 26px; height: 26px; border-radius: 999px; background: linear-gradient(140deg, #f7d9b0, #f4c98f); display: flex; align-items: center; justify-content: center; color: #8a4a11; flex-shrink: 0; }
        .auth-hc-name { font-size: 0.78rem; font-weight: 600; color: #0f172a; line-height: 1.1; display: block; text-align: left; }
        .auth-hc-role { font-size: 0.66rem; color: #475569; line-height: 1.2; display: block; text-align: left; }
        .auth-hc-text { display: inline-flex; flex-direction: column; gap: 1px; min-width: 0; }
        .auth-hc-menu {
          margin-top: 8px; background: rgba(255,255,255,0.96); border: 1px solid rgba(148,163,184,0.28);
          border-radius: 14px; padding: 8px; min-width: 180px;
          box-shadow: 0 20px 50px -18px rgba(15, 23, 42, 0.18);
        }
        @media (max-width: 960px) {
          .auth-hc-pill {
            gap: 6px;
            padding: 6px 8px;
          }
          .auth-hc-text { display: none; }
          .auth-hc-avatar { width: 30px; height: 30px; }
          .auth-hc-pill svg:last-of-type { display: none; }
        }
        .auth-hc-logout {
          display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
          font-size: 0.8rem; color: #b91c1c; background: none; border: none; cursor: pointer;
          padding: 8px 9px; border-radius: 9px;
        }
        .auth-hc-logout:hover { background: rgba(220,38,38,0.08); }
      `}</style>

      <button className="auth-hc-pill" onClick={() => setOpen((o) => !o)}>
        <span className="auth-hc-avatar"><UserCircle2 size={16} /></span>
        <span>
          <span className="auth-hc-name">{user.name}</span>
          <span className="auth-hc-role">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown size={14} style={{ color: "#64748b" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="auth-hc-menu"
          >
            <button className="auth-hc-logout" onClick={logout}>
              <LogOut size={14} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
