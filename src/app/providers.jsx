import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { AuthProvider } from "../auth/AuthContext.jsx";

/* Minimal global toast bus. Swap for TanStack Query / a real event stream
   once alerts come from a live backend — the ToastProvider contract stays
   the same, only the producer (mock interval vs. websocket) changes. */

const ToastContext = createContext(null);
let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = ++seq;
    setToasts((t) => [{ id, ...toast }, ...t].slice(0, 4));
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToasts must be used within ToastProvider");
  }

  return ctx;
}

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}