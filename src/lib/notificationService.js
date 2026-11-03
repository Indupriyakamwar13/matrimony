// src/lib/notificationService.js
// Manages in-app notifications stored in localStorage

const NOTIF_KEY = "matrimony_notifications";

/**
 * Get all notifications for ALL users
 */
const _getAll = () => {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const _saveAll = (data) => {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
};

/**
 * Add a notification for a specific user.
 * @param {string} userId - recipient user ID
 * @param {{ type: string, title: string, body: string, from?: string, link?: string }} notif
 */
export const addNotification = (userId, notif) => {
  if (!userId || !notif) return;
  const all = _getAll();
  const uid = String(userId);
  if (!all[uid]) all[uid] = [];

  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: notif.type || "info",
    title: notif.title || "Notification",
    body: notif.body || "",
    from: notif.from || null,
    link: notif.link || null,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Keep only latest 50 notifications per user
  all[uid] = [newNotif, ...all[uid]].slice(0, 50);
  _saveAll(all);

  // Broadcast so other tabs/components react
  window.dispatchEvent(new Event("matrimony_data_updated"));
};

/**
 * Get notifications for a user, sorted newest first.
 */
export const getNotifications = (userId) => {
  if (!userId) return [];
  const all = _getAll();
  return all[String(userId)] || [];
};

/**
 * Count of unread notifications for a user.
 */
export const getUnreadCount = (userId) => {
  return getNotifications(userId).filter((n) => !n.read).length;
};

/**
 * Mark all notifications as read for a user.
 */
export const markAllRead = (userId) => {
  if (!userId) return;
  const all = _getAll();
  const uid = String(userId);
  if (!all[uid]) return;
  all[uid] = all[uid].map((n) => ({ ...n, read: true }));
  _saveAll(all);
  window.dispatchEvent(new Event("matrimony_data_updated"));
};

/**
 * Mark a single notification as read.
 */
export const markRead = (userId, notifId) => {
  if (!userId || !notifId) return;
  const all = _getAll();
  const uid = String(userId);
  if (!all[uid]) return;
  all[uid] = all[uid].map((n) =>
    n.id === notifId ? { ...n, read: true } : n
  );
  _saveAll(all);
  window.dispatchEvent(new Event("matrimony_data_updated"));
};

/**
 * Clear all notifications for a user.
 */
export const clearNotifications = (userId) => {
  if (!userId) return;
  const all = _getAll();
  all[String(userId)] = [];
  _saveAll(all);
  window.dispatchEvent(new Event("matrimony_data_updated"));
};

/** Helper: format relative time */
export const timeAgo = (isoString) => {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/** Notification type → emoji icon */
export const notifIcon = (type) => {
  switch (type) {
    case "interest_received": return "💌";
    case "interest_accepted": return "🎉";
    case "interest_declined": return "😔";
    case "message_received":  return "💬";
    default:                  return "🔔";
  }
};

