// src/components/ProfileCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ProfileCard = ({ profile, onShortlist, onSendInterest }) => {
  const { id, name, age, height, religion, caste, occupation, location, photo, nri, college } = profile;
  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col group card-hover-effect">
      {/* Photo with gradient overlay */}
      <div className="relative h-56 overflow-hidden bg-slate-900">
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name
            )}&size=600&background=0f172a&color=f8fafc`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {nri && (
            <span className="bg-gold-light/95 backdrop-blur text-gold-dark text-[11px] font-bold px-2.5 py-1 rounded-full border border-gold/40 shadow-sm flex items-center gap-1">
              <span>🌍</span> NRI
            </span>
          )}
          <span className="bg-navy/80 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/20">
            {religion || "Hindu"}
          </span>
        </div>

        {/* Name and age */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-serif font-bold text-xl leading-tight drop-shadow-sm">
            {name}, {age}
          </h3>
          <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
            <span>📍</span> {location?.city || "India"}, {location?.state || ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5 text-xs">
          <p className="text-muted flex items-center gap-1.5">
            <span>📏</span> {height} • {religion}{caste ? ` • ${caste}` : ""}
          </p>
          <p className="text-navy font-semibold flex items-center gap-1.5">
            <span>💼</span> {occupation}
          </p>
          {college && (
            <div className="flex items-center gap-1.5 text-royal font-semibold bg-blue-50/70 border border-blue-100 rounded-xl px-2.5 py-1 mt-1">
              <span>🎓</span>
              <span className="truncate">{college}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2 pt-3 border-t border-border">
          {onSendInterest && (
            <button
              onClick={() => onSendInterest(profile)}
              className="flex-1 btn-stylish-primary py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <span>💌</span> Interest
            </button>
          )}
          {onShortlist && (
            <button
              onClick={() => onShortlist(profile)}
              className="btn-stylish-gold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <span>⭐</span>
            </button>
          )}
          <Link
            to={`/profile/${id}`}
            className="flex-1 btn-stylish-secondary py-2 px-2 rounded-xl text-xs text-center flex items-center justify-center"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
