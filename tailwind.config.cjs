/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0f172a", // Slate-900 / Deep Midnight Navy
          dark: "#090d16",    // Ultra Obsidian Navy
          light: "#1e293b",   // Slate-800
          subtle: "#334155",  // Slate-700
        },
        royal: {
          DEFAULT: "#1e40af", // Deep Royal Blue
          dark: "#1e3a8a",
          light: "#3b82f6",
          accent: "#2563eb",
        },
        primary: {
          DEFAULT: "#1e40af",
          dark: "#1e3a8a",
          light: "#3b82f6",
        },
        accent: {
          DEFAULT: "#d97706",
          dark: "#b45309",
          light: "#f59e0b",
        },
        gold: {
          DEFAULT: "#c69234", // Royal Gold
          light: "#fef3c7",   // Champagne cream
          dark: "#92400e",    // Deep Amber Gold
          accent: "#d97706",  // Rich Gold
          border: "#fde68a",
        },
        surface: "#ffffff",
        card: "#ffffff",
        cream: "#f8fafc",    // Clean Slate-50 background
        text: "#0f172a",     // High-contrast slate navy
        muted: "#64748b",    // Slate-500
        border: "#e2e8f0",   // Slate-200
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px -2px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.03)",
        heavy: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
        royal: "0 10px 25px -5px rgba(37, 99, 235, 0.25)",
        gold: "0 10px 25px -5px rgba(217, 119, 6, 0.25)",
        luxury: "0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)",
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.08)",
        "glow-royal": "0 0 25px -5px rgba(37, 99, 235, 0.35)",
        "glow-gold": "0 0 25px -5px rgba(217, 119, 6, 0.35)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 4s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
