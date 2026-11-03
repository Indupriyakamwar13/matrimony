// src/pages/Profile.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCustomProfiles,
  sendInterest as serviceSendInterest,
  getAllInterests,
} from "../lib/matchService";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customProfiles, setCustomProfiles] = useState([]);
  const [interestStatus, setInterestStatus] = useState("none"); // 'none' | 'pending' | 'accepted' | 'received_pending'
  const [toast, setToast] = useState("");
  const [activePhoto, setActivePhoto] = useState(null);

  const loadProfileData = () => {
    const list = getCustomProfiles();
    setCustomProfiles(list);

    if (user && id) {
      const allInt = getAllInterests();
      const strId = String(id);
      const outgoing = allInt.find(
        (i) => String(i.fromUserId) === String(user.id) && (String(i.toUserId) === strId || String(i.toProfileId) === strId)
      );
      const incoming = allInt.find(
        (i) => (String(i.fromUserId) === strId) && String(i.toUserId) === String(user.id)
      );

      if (outgoing) {
        setInterestStatus(outgoing.status);
      } else if (incoming) {
        setInterestStatus(incoming.status === "accepted" ? "accepted" : "received_pending");
      } else {
        setInterestStatus("none");
      }
    }
  };

  useEffect(() => {
    loadProfileData();
    window.addEventListener("matrimony_data_updated", loadProfileData);
    window.addEventListener("storage", loadProfileData);
    return () => {
      window.removeEventListener("matrimony_data_updated", loadProfileData);
      window.removeEventListener("storage", loadProfileData);
    };
  }, [id, user]);

  const profile = useMemo(() => {
    return customProfiles.find((p) => String(p.id) === String(id) || String(p.userId) === String(id));
  }, [id, customProfiles]);

  const isOwnProfile = Boolean(
    user && profile && (String(profile.id) === String(user.id) || String(profile.userId) === String(user.id))
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleSendInterest = async () => {
    if (!user) {
      navigate("/login", { state: { message: "Please sign in to send an interest." } });
      return;
    }
    if (String(profile.id) === String(user.id) || String(profile.userId) === String(user.id)) {
      showToast("This is your own profile.");
      return;
    }

    await serviceSendInterest(user, profile);
    setInterestStatus("pending");
    showToast(`💌 Interest successfully sent to ${profile?.name}!`);
    loadProfileData();
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center bg-surface p-8 rounded-3xl border border-border shadow-card max-w-md w-full">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="font-serif text-3xl font-bold text-navy mb-2">Profile Not Found</h2>
          <p className="text-muted text-sm mb-6">
            The profile you are looking for may have been updated or is no longer available.
          </p>
          <Link
            to="/browse"
            className="inline-block px-6 py-2.5 bg-navy text-white text-xs font-bold rounded-xl shadow hover:bg-navy-light transition-all"
          >
            ← Return to Browse Profiles
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    age,
    height = "5'8\"",
    religion = "Hindu",
    caste = "General",
    motherTongue = "Hindi",
    occupation = "Professional",
    education = "Graduate Degree",
    college = "Premier Institute",
    income = "Not disclosed",
    location = { city: "Mumbai", state: "Maharashtra", country: "India" },
    photo,
    gallery = [],
    family = {},
    preferences = {},
    nri = false,
    about = "",
  } = profile;

  const allPhotos = [photo, ...gallery].filter(Boolean);

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8 text-text">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-6 py-3 rounded-full shadow-heavy text-sm font-semibold flex items-center gap-2 border border-gold/40 animate-bounce">
          <span className="text-gold">✨</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Full-Screen Lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={activePhoto}
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-navy rounded-full flex items-center justify-center font-bold text-sm shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/browse"
            className="text-xs font-bold text-royal hover:underline flex items-center gap-1"
          >
            ← Back to All Matches
          </Link>
          <span className="text-xs text-muted font-medium">Profile Ref: #{profile.id}</span>
        </div>

        {/* Hero Card */}
        <div className="glass-panel rounded-3xl border border-border/80 shadow-heavy overflow-hidden">
          <div className="relative h-80 sm:h-96 bg-slate-900">
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  name
                )}&size=800&background=0f172a&color=f8fafc`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/40 to-transparent" />

            {/* Badges Top Right */}
            <div className="absolute top-4 right-4 flex gap-2">
              {nri && (
                <span className="bg-gold-light text-gold-dark text-xs font-bold px-3 py-1.5 rounded-full border border-gold/40 shadow">
                  🌍 NRI Profile
                </span>
              )}
              <span className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-navy shadow">
                {religion} {caste ? `• ${caste}` : ""}
              </span>
            </div>

            {/* Title & Action Strip Bottom */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div>
                <h1 className="font-serif text-3xl sm:text-5xl font-bold drop-shadow">
                  {name}, {age}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-1 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>
                    {location.city}, {location.state} {location.country ? `(${location.country})` : ""}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {isOwnProfile ? (
                  <Link
                    to="/dashboard"
                    className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-gold-accent hover:bg-gold-dark text-white shadow-gold flex items-center gap-2 transition-all"
                  >
                    <span>✎</span> Edit My Profile & Photo
                  </Link>
                ) : interestStatus === "accepted" ? (
                  <Link
                    to={`/messages?with=${profile.userId || profile.id}`}
                    className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm btn-stylish-primary shadow-royal flex items-center gap-2"
                  >
                    <span>💬</span> Chat With Match
                  </Link>
                ) : interestStatus === "pending" ? (
                  <button
                    disabled
                    className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-2 shadow"
                  >
                    <span>⏳</span> Interest Sent (Pending)
                  </button>
                ) : interestStatus === "received_pending" ? (
                  <Link
                    to="/dashboard"
                    className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm btn-stylish-primary shadow-royal flex items-center gap-2"
                  >
                    <span>💌</span> Review Request on Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={handleSendInterest}
                    className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm btn-stylish-primary shadow-royal flex items-center gap-2 cursor-pointer"
                  >
                    <span>💌</span> Connect / Send Interest
                  </button>
                )}
                {interestStatus === "accepted" && !isOwnProfile && (
                  <span className="py-3 px-4 bg-emerald-500/20 backdrop-blur text-emerald-300 rounded-2xl font-bold text-xs flex items-center border border-emerald-400/30">
                    ✓ Matched
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Key Facts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border bg-slate-50/70">
            {[
              { label: "Mother Tongue", value: motherTongue },
              { label: "College / University", value: college },
              { label: "Profession", value: occupation },
              { label: "Annual Income", value: income },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 text-center">
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                  {label}
                </div>
                <div className="font-bold text-navy text-xs sm:text-sm truncate">{value}</div>
              </div>
            ))}
          </div>

          {/* Detailed Profile Sections */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* About / Bio */}
            {about && (
              <div>
                <h2 className="font-serif text-xl font-bold text-navy mb-2">About</h2>
                <p className="text-sm text-slate-700 leading-relaxed bg-cream p-4 rounded-2xl border border-border">
                  {about}
                </p>
              </div>
            )}

            {/* Photo Gallery */}
            {allPhotos.length > 1 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-navy mb-3">Photo Gallery</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allPhotos.map((imgUrl, i) => (
                    <img
                      key={i}
                      src={imgUrl}
                      alt={`Photo ${i + 1}`}
                      onClick={() => setActivePhoto(imgUrl)}
                      className="w-24 h-24 object-cover rounded-2xl border border-border cursor-pointer hover:opacity-90 hover:scale-105 transition-all flex-shrink-0 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Education & Career */}
            <div>
              <h2 className="font-serif text-xl font-bold text-navy mb-4">
                Education & Career Credentials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    College / University
                  </div>
                  <div className="font-bold text-navy text-sm flex items-center gap-1.5">
                    <span>🎓</span>
                    <span>{college}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Degree & Highest Qualification
                  </div>
                  <div className="font-bold text-navy text-sm">{education}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Profession & Designation
                  </div>
                  <div className="font-bold text-navy text-sm">{occupation}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Annual Package
                  </div>
                  <div className="font-bold text-gold-accent text-sm">{income}</div>
                </div>
              </div>
            </div>

            {/* Cultural & Regional Roots */}
            <div>
              <h2 className="font-serif text-xl font-bold text-navy mb-4">
                Cultural & Regional Background
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Mother Tongue
                  </div>
                  <div className="font-bold text-navy text-sm">{motherTongue}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Religion & Caste
                  </div>
                  <div className="font-bold text-navy text-sm">
                    {religion} {caste ? `(${caste})` : ""}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Residency Status
                  </div>
                  <div className="font-bold text-navy text-sm">
                    {nri ? "NRI (Global Citizen)" : "Citizen of India"}
                  </div>
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div>
              <h2 className="font-serif text-xl font-bold text-navy mb-4">Family Background</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Father's Profession
                  </div>
                  <div className="font-medium text-navy text-xs sm:text-sm">
                    {family?.father || "Executive / Retired"}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Mother's Profession
                  </div>
                  <div className="font-medium text-navy text-xs sm:text-sm">
                    {family?.mother || "Homemaker / Professional"}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-border">
                  <div className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1">
                    Siblings
                  </div>
                  <div className="font-medium text-navy text-xs sm:text-sm">
                    {family?.siblings || "1 Sibling"}
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Expectations */}
            <div>
              <h2 className="font-serif text-xl font-bold text-navy mb-4">Partner Expectations</h2>
              <div className="p-5 bg-gold-light/40 rounded-2xl border border-gold/30 flex flex-wrap gap-6 text-xs sm:text-sm">
                <div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
                    Preferred Age
                  </div>
                  <div className="font-bold text-navy">
                    {preferences?.ageRange
                      ? `${preferences.ageRange[0]} – ${preferences.ageRange[1]} yrs`
                      : "24 – 32 yrs"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
                    Preferred Community
                  </div>
                  <div className="font-bold text-navy">
                    {preferences?.religion?.join(", ") || religion}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
                    Preferred Languages
                  </div>
                  <div className="font-bold text-navy">
                    {preferences?.motherTongue?.join(", ") || motherTongue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
