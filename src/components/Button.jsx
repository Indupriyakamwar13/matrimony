// src/components/Button.jsx
import React from "react";

/**
 * Reusable button component with variant support.
 * Variants: primary, accent, surface, gold, ghost
 */
const Button = ({ children, onClick, type = "button", variant = "primary", className = "" }) => {
  const base = "px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer";
  const variants = {
    primary: "btn-stylish-primary",
    accent: "btn-stylish-gold",
    gold: "btn-stylish-gold",
    surface: "bg-white text-navy border border-border hover:border-royal hover:text-royal hover:bg-slate-50 shadow-sm",
    ghost: "bg-transparent text-muted hover:text-navy hover:bg-slate-100",
  };
  const classes = `${base} ${variants[variant] || variants.primary} ${className}`;
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export default Button;
