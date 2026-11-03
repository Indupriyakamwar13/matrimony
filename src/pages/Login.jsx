// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const successMessage = location.state?.message || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsConfirmation(false);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.message?.toLowerCase() || "";
      if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid email or password") ||
        msg.includes("user not found")
      ) {
        setError("Invalid email address or password. Please verify your credentials.");
      } else if (
        msg.includes("email not confirmed") ||
        msg.includes("email_not_confirmed")
      ) {
        setNeedsConfirmation(true);
        setError("");
      } else if (msg.includes("fetch") || msg.includes("network")) {
        setError("Network connection issue. Please check your internet connectivity.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your registered email address first.");
      return;
    }
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (resendError) {
        setError(resendError.message || "Could not resend verification email.");
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError("Could not resend email. Please try again in a moment.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail("demo@matrimony.com");
    setPassword("Demo@12345");
    setError("");
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-text">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy to-royal flex items-center justify-center text-white text-2xl shadow-royal group-hover:scale-105 transition-transform">
              💍
            </span>
            <div className="text-left">
              <span className="font-serif text-3xl font-bold tracking-tight text-navy block leading-none">
                Matrimony<span className="text-royal">.</span>
              </span>
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
                Executive & NRI Matchmaking
              </span>
            </div>
          </Link>
          <h2 className="mt-6 font-serif text-3xl font-bold text-navy">
            Welcome Back
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Sign in to access verified candidate profiles & messages
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-border/80 shadow-heavy">
          {/* Post-registration message */}
          {successMessage && !needsConfirmation && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
              <span className="text-lg">✨</span>
              <div className="flex-1 font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Email not confirmed banner */}
          {needsConfirmation && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-900">
                <span>📧</span> Email Confirmation Pending
              </div>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                A verification link was sent to <strong>{email}</strong>. Check your inbox (and spam folder) to verify.
              </p>
              {resendSuccess ? (
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100/70 py-2 px-3 rounded-xl inline-block">
                  ✓ Verification link resent successfully!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="text-xs font-bold text-royal hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? "Resending email…" : "Didn't receive email? Click here to resend"}
                </button>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <span className="text-base">⚠️</span>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-navy placeholder-muted/60 focus:outline-none focus:border-royal text-sm transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-navy uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="text-xs text-royal hover:underline font-bold transition-colors cursor-pointer"
                >
                  Fill Demo
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-11 bg-cream border border-border rounded-xl text-navy placeholder-muted/60 focus:outline-none focus:border-royal text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy p-1 text-xs"
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 btn-stylish-primary rounded-xl font-bold text-sm shadow-royal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  "Sign In to Your Account"
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-royal hover:underline transition-colors"
              >
                Register free profile
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-muted">
          <span>🔒 Secured with 256-bit encryption & Supabase authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
