// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";

// Protected route wrapper with loading protection
const Protected = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-royal/20 border-t-royal rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-muted tracking-wider">Verifying session...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-text selection:bg-royal/20 selection:text-royal">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/browse"      element={<Browse />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/dashboard"   element={<Protected><Dashboard /></Protected>} />
          <Route path="/messages"    element={<Protected><Messages /></Protected>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-navy-dark text-slate-400 text-center py-10 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💍</span>
            <span className="font-serif text-white font-bold text-lg">Matrimony<span className="text-royal-light">.</span></span>
            <span className="text-gradient-gold text-[10px] font-bold uppercase tracking-widest ml-2 px-2.5 py-0.5 rounded-full border border-gold/30 glass-dark">
              Executive & NRI
            </span>
          </div>
          <div className="text-slate-400 text-xs font-light">
            © {new Date().getFullYear()} Matrimony Elite. All rights reserved. 100% Privacy & Data Protected.
          </div>
          <div className="flex gap-6 font-medium text-slate-300">
            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gold transition-colors">Trust & Safety</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
