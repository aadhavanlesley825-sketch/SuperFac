import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed top-5 right-5 z-[60] flex flex-col gap-2.5 max-w-[340px]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="flex items-start gap-2.5 p-3.5 rounded-2xl cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(220,38,38,0.18)",
              boxShadow: "0 16px 38px -22px rgba(15, 23, 42, 0.25)",
              backdropFilter: "blur(14px)",
            }}
            onClick={() => onDismiss(t.id)}
          >
            <div
              className="w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(220,38,38,0.10)" }}
            >
              <AlertTriangle size={13} color="#b91c1c" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{t.title}</div>
              {t.desc && <div className="text-xs text-slate-600 mt-0.5 leading-snug">{t.desc}</div>}
            </div>
            <X size={14} className="text-slate-500 hover:text-slate-700 flex-shrink-0 mt-0.5" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastStack;
