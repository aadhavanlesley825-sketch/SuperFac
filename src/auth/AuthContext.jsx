import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { ROLES, hasPermission } from "./roles.js";

/* ------------------------------------------------------------------ */
/*  PulsePlant Auth — session + RBAC context.                          */
/*                                                                      */
/*  This is a demo-grade, backend-free auth layer: it stores a seed    */
/*  user list and reset tokens in localStorage so Login / Forgot       */
/*  Password work end-to-end in the browser. The rest of the app only  */
/*  ever talks to `useAuth()` — swap the three `mockApi` methods below  */
/*  for real endpoints (POST /api/auth/login, /api/auth/request-reset, */
/*  /api/auth/reset-password) when a backend is wired up, and nothing  */
/*  else in the app needs to change.                                   */
/* ------------------------------------------------------------------ */

const SESSION_KEY = "pulseplant.auth.session";
const USERS_KEY = "pulseplant.auth.users";
const RESET_KEY = "pulseplant.auth.resetTokens";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h shift-length session

const SEED_USERS = [
  { id: "u-001", name: "Ashwin Rao", email: "admin@superfac.io", password: "Admin@123", role: ROLES.ADMIN },
  { id: "u-002", name: "Priya Menon", email: "manager@superfac.io", password: "Manager@123", role: ROLES.PLANT_MANAGER },
  { id: "u-003", name: "Karthik Iyer", email: "engineer@superfac.io", password: "Engineer@123", role: ROLES.SERVICE_ENGINEER },
  { id: "u-004", name: "Divya Suresh", email: "technician@superfac.io", password: "Technician@123", role: ROLES.TECHNICIAN },
];

/* ------------------------------ storage ------------------------------ */
function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (e.g. private mode) — session just won't persist */
  }
}
function currentUserEmails() {
  return new Set(SEED_USERS.map((u) => u.email.toLowerCase()));
}

function getUsers() {
  const stored = readJSON(USERS_KEY, null);
  const hasValidSeed = Array.isArray(stored) && stored.length && stored.every((user) => {
    if (!user || typeof user.email !== "string") return false;
    return currentUserEmails().has(user.email.toLowerCase());
  });

  if (!hasValidSeed) {
    writeJSON(USERS_KEY, SEED_USERS);
    return SEED_USERS;
  }

  return stored;
}
function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}
function genToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------ mock API ------------------------------ */
const mockApi = {
  async login(email, password) {
    await delay(450);
    const users = getUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match || match.password !== password) {
      const err = new Error("Invalid email or password.");
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }
    const { password: _pw, ...safeUser } = match;
    return safeUser;
  },

  async requestPasswordReset(email) {
    await delay(450);
    const users = getUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    // Resolve "sent" either way so the UI never leaks whether an email is
    // registered — only mint a token when the account is real.
    if (!match) return { sent: true };
    const tokens = readJSON(RESET_KEY, {});
    const token = genToken();
    tokens[token] = { email: match.email, expiresAt: Date.now() + 30 * 60 * 1000 };
    writeJSON(RESET_KEY, tokens);
    // In production this token is only ever emailed to the user. It's
    // returned here purely so the reset flow is demoable without a mail
    // server — a real backend would never include `devToken` in the response.
    return { sent: true, devToken: token };
  },

  async resetPassword(token, newPassword) {
    await delay(450);
    const tokens = readJSON(RESET_KEY, {});
    const record = tokens[token];
    if (!record || record.expiresAt < Date.now()) {
      const err = new Error("This reset link is invalid or has expired.");
      err.code = "INVALID_TOKEN";
      throw err;
    }
    const users = getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === record.email.toLowerCase());
    if (idx === -1) {
      const err = new Error("We couldn't find an account for this reset link.");
      err.code = "NOT_FOUND";
      throw err;
    }
    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
    delete tokens[token];
    writeJSON(RESET_KEY, tokens);
    return { success: true };
  },
};

/* ------------------------------ context ------------------------------ */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore an existing, unexpired session on first mount.
  useEffect(() => {
    const session = readJSON(SESSION_KEY, null);
    const sessionUserEmail = session?.user?.email?.toLowerCase();
    const isKnownUser = sessionUserEmail && currentUserEmails().has(sessionUserEmail);

    if (session && session.expiresAt > Date.now() && session.user && isKnownUser) {
      setUser(session.user);
    } else if (session) {
      writeJSON(SESSION_KEY, null);
    }
    setInitializing(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const safeUser = await mockApi.login(email, password);
    writeJSON(SESSION_KEY, { user: safeUser, expiresAt: Date.now() + SESSION_TTL_MS });
    setUser(safeUser);
    return safeUser;
  }, []);

  const logout = useCallback(() => {
    writeJSON(SESSION_KEY, null);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback((email) => mockApi.requestPasswordReset(email), []);
  const resetPassword = useCallback((token, newPassword) => mockApi.resetPassword(token, newPassword), []);

  const can = useCallback((resource) => (user ? hasPermission(user.role, resource) : false), [user]);

  const value = useMemo(
    () => ({ user, initializing, login, logout, requestPasswordReset, resetPassword, can }),
    [user, initializing, login, logout, requestPasswordReset, resetPassword, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be called within an <AuthProvider>.");
  return ctx;
}
