// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getCustomProfiles } from "../lib/matchService";
import {
  getNotifications,
  markAllRead,
  clearNotifications,
  timeAgo,
  notifIcon,
} from "../lib/notificationService";

const Navbar = () => {
  const { user, logout, switchUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  const loadProfiles = () => {
    setProfiles(getCustomProfiles());
  };

  const loadNotifications = () => {
    if (user?.id) {
      setNotifications(getNotifications(user.id));
    }
  };

  useEffect(() => {
    loadProfiles();
    loadNotifications();
    window.addEventListener("matrimony_data_updated", loadProfiles);
    window.addEventListener("matrimony_data_updated", loadNotifications);
    window.addEventListener("storage", loadProfiles);
    window.addEventListener("storage", loadNotifications);
    return () => {
      window.removeEventListener("matrimony_data_updated", loadProfiles);
      window.removeEventListener("matrimony_data_updated", loadNotifications);
      window.removeEventListener("storage", loadProfiles);
      window.removeEventListener("storage", loadNotifications);
    };
  }, [user]);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLink = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
      isActive
        ? "bg-navy text-white shadow-md shadow-navy/20"
        : "text-muted hover:text-navy hover:bg-slate-100/80"
    }`;

  const currentName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const currentPhoto =
    user?.user_metadata?.photo ||
    profiles.find((p) => String(p.id) === String(user?.id) || String(p.userId) === String(user?.id))?.photo ||
    null;

  const handleBellClick = () => {
    setBellOpen((v) => !v);
    setProfileDropdown(false);
    if (!bellOpen && user?.id) {
      loadNotifications();
    }
  };

  const handleNotifClick = (notif) => {
    if (user?.id) markAllRead(user.id);
    setBellOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    if (user?.id) {
      markAllRead(user.id);
      loadNotifications();
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (user?.id) {
      clearNotifications(user.id);
      loadNotifications();
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-navy via-royal to-navy flex items-center justify-center text-white text-xl shadow-[0_4px_12px_rgba(30,64,175,0.25)] group-hover:shadow-[0_4px_16px_rgba(198,146,52,0.4)] group-hover:scale-105 transition-all duration-300">
              💍
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-navy leading-none">
                Matrimony<span className="text-royal">.</span>
              </span>
              <span className="text-[10px] font-bold text-gradient-gold uppercase tracking-widest mt-0.5">
                Executive & NRI Matchmaking
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/70 shadow-inner">
            <NavLink to="/" end className={navLink}>
              Home
            </NavLink>
            <NavLink to="/browse" className={navLink}>
              Browse Profiles
            </NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={navLink}>
                  Dashboard
                </NavLink>
                <NavLink to="/messages" className={navLink}>
                  Messages
                </NavLink>
              </>
            )}
          </div>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* ── Notification Bell ── */}
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={handleBellClick}
                    className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50/90 hover:bg-slate-100 border border-border shadow-sm transition-all cursor-pointer"
                    aria-label="Notifications"
                  >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {bellOpen && (
                    <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-heavy border border-border z-50 animate-fade-in overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="text-sm font-bold text-navy">Notifications</span>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[10px] font-bold text-royal hover:underline cursor-pointer"
                            >
                              Mark all read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={handleClearAll}
                              className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notification List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <span className="text-4xl mb-2">🔕</span>
                            <p className="text-sm font-semibold text-navy">All caught up!</p>
                            <p className="text-xs text-muted mt-1">No notifications yet.</p>
                          </div>
                        ) : (
                          notifications.slice(0, 15).map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-all hover:bg-slate-50/80 cursor-pointer ${
                                !notif.read ? "bg-blue-50/60" : ""
                              }`}
                            >
                              <span className="text-xl flex-shrink-0 mt-0.5">
                                {notifIcon(notif.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className={`text-xs font-bold truncate ${!notif.read ? "text-navy" : "text-slate-600"}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-royal flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-border bg-slate-50/60">
                          <p className="text-[10px] text-center text-muted">
                            Showing {Math.min(notifications.length, 15)} of {notifications.length} notifications
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Pill & Switcher */}
                <div className="relative">
                  <button
                    onClick={() => { setProfileDropdown((v) => !v); setBellOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/90 hover:bg-slate-100 rounded-2xl border border-border shadow-sm transition-all text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-navy to-royal flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                      {currentPhoto ? (
                        <img
                          src={currentPhoto}
                          alt={currentName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        currentName[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-navy truncate max-w-[110px]">
                        {currentName}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                        {profiles.length > 1 && <span className="text-muted ml-0.5">▾</span>}
                      </span>
                    </div>
                  </button>

                  {/* Switch Profile Dropdown */}
                  {profileDropdown && (
                    <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-heavy border border-border p-3 z-50 animate-fade-in space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                          Switch Active Profile
                        </span>
                        <Link
                          to="/register"
                          onClick={() => setProfileDropdown(false)}
                          className="text-[11px] font-bold text-royal hover:underline"
                        >
                          + New
                        </Link>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {profiles.map((p) => {
                          const isCurrent = String(p.id) === String(user.id) || String(p.userId) === String(user.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                switchUser({
                                  id: String(p.userId || p.id),
                                  email: p.email || `${p.name.toLowerCase().replace(/\s+/g, "")}@demo.com`,
                                  user_metadata: {
                                    full_name: p.name,
                                    gender: p.gender,
                                    age: p.age,
                                    occupation: p.occupation,
                                    city: p.location?.city,
                                    college: p.college,
                                    photo: p.photo,
                                  },
                                });
                                setProfileDropdown(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-royal/10 text-royal font-bold"
                                  : "hover:bg-slate-100 text-navy"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px]">
                                  {p.photo ? (
                                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    p.name[0]?.toUpperCase()
                                  )}
                                </div>
                                <span className="truncate">{p.name}</span>
                              </div>
                              {isCurrent && <span className="text-[10px] flex-shrink-0">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 text-xs font-bold text-muted hover:text-navy border border-border hover:border-slate-400 rounded-xl transition-all hover:bg-slate-50 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-xs font-bold text-navy hover:text-royal transition-all rounded-xl hover:bg-slate-100/80"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-stylish-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <span>✨</span> Register Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Bell */}
            {user && (
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-xl text-navy hover:bg-slate-100 border border-border"
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              className="p-2 rounded-xl text-navy hover:bg-slate-100 border border-border"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bell Dropdown (shown below navbar) */}
      {bellOpen && user && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-md shadow-lg animate-fade-in">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <span className="text-sm font-bold text-navy">Notifications</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-royal cursor-pointer">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} className="text-[10px] font-bold text-rose-500 cursor-pointer">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted">No notifications yet 🔕</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-all ${
                    !notif.read ? "bg-blue-50/60" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{notifIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy truncate">{notif.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-md px-4 py-4 space-y-2 animate-fade-in shadow-lg">
          <NavLink to="/" end className={navLink} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/browse" className={navLink} onClick={() => setMenuOpen(false)}>
            Browse Profiles
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={navLink} onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/messages" className={navLink} onClick={() => setMenuOpen(false)}>
                Messages
              </NavLink>
            </>
          )}
          {user ? (
            <div className="pt-2 border-t border-border space-y-2">
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block text-center py-2 text-xs font-bold text-royal bg-blue-50 rounded-xl"
              >
                + Register Another Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-3 border-t border-border">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 text-xs font-bold text-navy border border-border rounded-xl"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 text-xs font-bold text-white btn-stylish-primary rounded-xl"
                onClick={() => setMenuOpen(false)}
              >
                Register Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
