// src/components/Modal.jsx
import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-navy/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
      <div className="glass-panel bg-white/95 rounded-3xl shadow-heavy max-w-lg w-full p-6 sm:p-8 relative border border-white/60 animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-navy flex items-center justify-center transition-all"
        >
          ✕
        </button>
        {title && <h3 className="font-serif text-2xl font-bold text-navy mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
