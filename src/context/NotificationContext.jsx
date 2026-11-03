// src/context/NotificationContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  getUnreadCount,
} from "../lib/notificationService";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};

// ─── Toast Queue ─────────────────────────────────────────────────────────────
let toastId = 0;

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevNotifsRef = useRef([]);

  // Add a programmatic toast (type: "success" | "info" | "warning" | "error")
  const showToast = useCallback((message, type = "info", duration = 4500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Refresh badge count and detect new notifications to show toasts
  const refresh = useCallback(() => {
    if (!user?.id) return;
    const notifs = getNotifications(user.id);
    const count = getUnreadCount(user.id);
    setUnreadCount(count);

    // Detect brand-new notifications by comparing with previous snapshot
    const prevIds = new Set(prevNotifsRef.current.map((n) => n.id));
    const newOnes = notifs.filter((n) => !prevIds.has(n.id));

    newOnes.forEach((n) => {
      const icon =
        n.type === "interest_received" ? "💌"
        : n.type === "interest_accepted" ? "🎉"
        : n.type === "interest_declined" ? "😔"
        : n.type === "message_received" ? "💬"
        : "🔔";

      const toastType =
        n.type === "interest_accepted" ? "success"
        : n.type === "interest_declined" ? "warning"
        : "info";

      showToast(`${icon} ${n.title} — ${n.body}`, toastType, 5000);
    });

    prevNotifsRef.current = notifs;
  }, [user, showToast]);

  useEffect(() => {
    refresh();
    window.addEventListener("matrimony_data_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("matrimony_data_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ unreadCount, showToast, refresh }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
};

// ─── Toast Container UI ───────────────────────────────────────────────────────
const typeStyles = {
  success: {
    bar: "bg-emerald-500",
    icon: "✅",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
  },
  info: {
    bar: "bg-royal",
    icon: "💬",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
  },
  warning: {
    bar: "bg-amber-500",
    icon: "⚠️",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
  },
  error: {
    bar: "bg-rose-500",
    icon: "❌",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-800",
  },
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-24 right-4 z-[200] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: "360px", width: "calc(100vw - 2rem)" }}
    >
      {toasts.map((toast) => {
        const s = typeStyles[toast.type] || typeStyles.info;
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-heavy
              ${s.bg} animate-slide-in-right
              backdrop-blur-sm
            `}
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            {/* Colored bar on left */}
            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${s.bar}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold leading-snug ${s.text}`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className={`flex-shrink-0 text-lg leading-none opacity-60 hover:opacity-100 transition-opacity ${s.text} cursor-pointer`}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

