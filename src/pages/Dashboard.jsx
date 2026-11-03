// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  getInterestsForUser,
  updateInterestStatus,
  getAcceptedMatches,
} from "../lib/matchService";
import { compressImageFile, SAMPLE_AVATARS } from "../lib/imageUtils";

const MOTHER_TONGUES = [
  "Hindi",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Bengali",
  "Punjabi",
  "Kannada",
  "Malayalam",
  "Urdu",
  "English",
  "Other",
];

const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Other"];

const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [interests, setInterests] = useState({ sent: 0, received: 0 });
  const [recentInterests, setRecentInterests] = useState([]);
  const [sentList, setSentList] = useState([]);
  const [acceptedMatchesList, setAcceptedMatchesList] = useState([]);
  const [activeTab, setActiveTab] = useState("received"); // 'received' | 'sent' | 'matches'
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoToast, setPhotoToast] = useState("");

  const bannerFileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  const welcomeBanner = location.state?.welcomeMessage || "";

  // Edit form state
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchStats();
    initFormData();

    const handleSync = () => fetchStats();
    window.addEventListener("matrimony_data_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("matrimony_data_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [user]);

  const initFormData = () => {
    const meta = user?.user_metadata || {};
    setFormData({
      full_name: meta.full_name || "",
      photo: meta.photo || "",
      age: meta.age || 26,
      gender: meta.gender || "Female",
      height: meta.height || "5'7\"",
      mother_tongue: meta.mother_tongue || "Hindi",
      caste: meta.caste || "",
      religion: meta.religion || "Hindu",
      nri: meta.nri ?? false,
      city: meta.city || "Mumbai",
      state: meta.state || "Maharashtra",
      college: meta.college || "",
      education: meta.education || "",
      occupation: meta.occupation || "",
      income: meta.income || "",
      father: meta.father || "",
      mother: meta.mother || "",
      siblings: meta.siblings || "",
      family_type: meta.family_type || "Nuclear Family",
      about: meta.about || "",
      pref_age_min: meta.pref_age_min || 24,
      pref_age_max: meta.pref_age_max || 32,
      pref_religion: meta.pref_religion || "Any",
    });
  };

  // Direct 1-click photo update from header banner
  const handleBannerPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const dataUrl = await compressImageFile(file, 450, 0.82);
      await updateProfile({ photo: dataUrl });
      setFormData((prev) => ({ ...prev, photo: dataUrl }));
      setPhotoToast("Profile picture updated successfully! ✨");
      setTimeout(() => setPhotoToast(""), 3500);
    } catch (err) {
      setPhotoToast("Failed to upload photo. Please try again.");
      setTimeout(() => setPhotoToast(""), 3500);
    } finally {
      setPhotoUploading(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  };

  // Photo update inside edit modal
  const handleModalPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const dataUrl = await compressImageFile(file, 450, 0.82);
      setFormData((prev) => ({ ...prev, photo: dataUrl }));
    } catch (err) {
      setSaveError(err.message || "Failed to process photo.");
    } finally {
      setPhotoUploading(false);
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    if (!user) return;

    try {
      const { sent, received } = getInterestsForUser(user.id);
      const matches = getAcceptedMatches(user.id);

      setInterests({ sent: sent.length, received: received.length });
      setRecentInterests(received);
      setSentList(sent);
      setAcceptedMatchesList(matches);
    } catch (e) {
      console.warn("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInterest = async (interestId) => {
    await updateInterestStatus(interestId, "accepted");
    fetchStats();
  };

  const handleDeclineInterest = async (interestId) => {
    await updateInterestStatus(interestId, "rejected");
    fetchStats();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      console.error("Profile save error:", err);
      setSaveError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const meta = user?.user_metadata || {};
  const name = meta.full_name || user?.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Recently";

  // Profile completeness calculation across 8 key attributes
  const fields = [
    "full_name",
    "mother_tongue",
    "caste",
    "college",
    "education",
    "occupation",
    "city",
    "about",
  ];
  const filled = fields.filter((f) => meta[f] && String(meta[f]).trim().length > 0).length;
  const completion = Math.round((filled / fields.length) * 100);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8 text-text">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Toast Feedback */}
        {photoToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <span className="text-xl">✨</span>
            <div className="font-semibold text-xs sm:text-sm">{photoToast}</div>
          </div>
        )}

        {/* Welcome Celebration Banner */}
        {welcomeBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <span className="text-2xl">🎉</span>
            <div className="font-semibold text-xs sm:text-sm">{welcomeBanner}</div>
          </div>
        )}

        {/* Executive Header Banner */}
        <div className="bg-gradient-to-r from-navy via-navy-light to-navy rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-card">
          {/* Avatar with Quick Upload Camera Overlay */}
          <div className="relative group flex-shrink-0">
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerPhotoChange}
              className="hidden"
            />
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
              {meta.photo ? (
                <img
                  src={meta.photo}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold font-serif text-white">
                  {initials}
                </span>
              )}
            </div>

            {/* Camera Overlay Button */}
            <button
              type="button"
              onClick={() => bannerFileInputRef.current?.click()}
              disabled={photoUploading}
              title="Change Profile Picture"
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-gold-accent hover:bg-gold-dark text-white flex items-center justify-center shadow-lg border border-white/30 transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
            >
              {photoUploading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <span className="text-sm">📷</span>
              )}
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-light/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider text-gold-border mb-2 border border-gold-border/30">
              <span>👑</span> Verified Executive Member
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-1">
              Namaste, {name.split(" ")[0]}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Member since {joinedDate} • {user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-gold-accent hover:bg-gold-dark text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-gold flex items-center gap-1.5 cursor-pointer"
            >
              <span>✎</span>
              <span>Edit Profile Details</span>
            </button>
            <Link
              to="/browse"
              className="px-5 py-2.5 bg-royal hover:bg-royal-dark text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-royal"
            >
              Browse Matches
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Interests Sent",
              value: interests.sent,
              icon: "💌",
              color: "bg-blue-50/60 border-blue-200",
              textColor: "text-royal",
            },
            {
              label: "Interests Received",
              value: interests.received,
              icon: "💝",
              color: "bg-amber-50/60 border-amber-200",
              textColor: "text-gold",
            },
            {
              label: "Profile Complete",
              value: `${completion}%`,
              icon: "📋",
              color: "bg-emerald-50/60 border-emerald-200",
              textColor: "text-emerald-700",
            },
            {
              label: "Account Status",
              value: "Active",
              icon: "🛡️",
              color: "bg-slate-100 border-slate-300",
              textColor: "text-navy",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.color} rounded-2xl p-5 border shadow-sm flex flex-col justify-between card-hover-effect backdrop-blur-sm`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div>
                <div className={`font-serif text-3xl font-bold ${s.textColor}`}>
                  {loading ? "…" : s.value}
                </div>
                <div className="text-muted text-[11px] font-bold uppercase tracking-wider mt-1">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Completion Bar with Direct Action */}
        <div className="glass-card border border-gold/40 rounded-3xl p-6 shadow-luxury flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gold-light flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              {completion === 100 ? "🎉" : "⚡"}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-navy text-sm sm:text-base">
                  {completion === 100
                    ? "Your profile is 100% complete and fully verified!"
                    : "Complete your profile details to unlock verified matching recommendations"}
                </span>
                <span className="text-xs font-bold text-gradient-gold ml-2">{completion}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-border">
                <div
                  className="bg-gradient-to-r from-gold via-amber-400 to-royal h-full rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              {completion < 100 && (
                <p className="text-[11px] text-muted mt-1.5">
                  Missing details:{" "}
                  {fields
                    .filter((f) => !meta[f] || String(meta[f]).trim().length === 0)
                    .map((f) => f.replace("_", " "))
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="btn-stylish-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-royal transition-all flex-shrink-0 cursor-pointer"
          >
            {completion === 100 ? "Edit Profile ✎" : "Complete Details Now →"}
          </button>
        </div>

        {/* 2-Column: Details & Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Member Details */}
          <div className="glass-panel rounded-3xl border border-border/80 p-6 shadow-card">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy">Profile Attributes</h2>
                <p className="text-[11px] text-muted">Your public details visible to matched profiles</p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-royal hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>✎ Edit</span>
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {[
                { label: "Full Name", value: meta.full_name || "—" },
                { label: "Email Address", value: user.email },
                { label: "Age & Gender", value: `${meta.age || "—"} yrs • ${meta.gender || "—"}` },
                { label: "Mother Tongue", value: meta.mother_tongue || "—" },
                { label: "Caste / Community", value: meta.caste || "—" },
                { label: "College / University", value: meta.college || "—" },
                { label: "Degree / Qualification", value: meta.education || "—" },
                { label: "Profession", value: meta.occupation || "—" },
                { label: "Annual Income", value: meta.income || "—" },
                { label: "Current Location", value: `${meta.city || "—"}${meta.state ? `, ${meta.state}` : ""}` },
                { label: "Residency Status", value: meta.nri ? "NRI Profile 🌍" : "Resident Indian 🇮🇳" },
                { label: "About Me", value: meta.about || "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2 border-b border-border/60 last:border-0"
                >
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="font-bold text-navy text-right truncate max-w-[200px]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests Activity & Real-Time Matches */}
          <div className="glass-panel rounded-3xl border border-border/80 p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy">Interests & Matches</h2>
                  <p className="text-[11px] text-muted">Manage your connection requests & active matches</p>
                </div>
                <Link to="/browse" className="text-xs font-bold text-royal hover:underline">
                  Browse Profiles →
                </Link>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-2xl mb-4 border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setActiveTab("received")}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "received"
                      ? "bg-white text-navy shadow-sm"
                      : "text-muted hover:text-navy"
                  }`}
                >
                  Received ({recentInterests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sent")}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "sent"
                      ? "bg-white text-navy shadow-sm"
                      : "text-muted hover:text-navy"
                  }`}
                >
                  Sent ({sentList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("matches")}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "matches"
                      ? "bg-white text-royal shadow-sm"
                      : "text-muted hover:text-navy"
                  }`}
                >
                  Matches ({acceptedMatchesList.length})
                </button>
              </div>

              {loading ? (
                <div className="text-muted text-xs text-center py-10">Updating requests…</div>
              ) : activeTab === "received" ? (
                recentInterests.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">💌</div>
                    <h3 className="font-serif text-lg font-bold text-navy mb-1">
                      No received interests yet
                    </h3>
                    <p className="text-xs text-muted max-w-xs mx-auto mb-5 leading-relaxed">
                      When other members send an interest to your profile, their requests will appear here so you can accept them and chat!
                    </p>
                    <Link
                      to="/browse"
                      className="btn-stylish-primary inline-block px-5 py-2.5 text-xs font-bold rounded-xl"
                    >
                      Browse Candidate Profiles
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {recentInterests.map((interest) => (
                      <div
                        key={interest.id}
                        className="p-3.5 bg-slate-50/90 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              interest.fromUserPhoto ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=400&h=400"
                            }
                            alt={interest.fromUserName}
                            className="w-11 h-11 rounded-2xl object-cover border border-border shadow-sm flex-shrink-0"
                          />
                          <div>
                            <div className="font-serif font-bold text-navy text-sm">
                              {interest.fromUserName}
                              {interest.fromUserAge ? `, ${interest.fromUserAge}` : ""}
                            </div>
                            <div className="text-[11px] text-muted">
                              {interest.fromUserOccupation || "Professional"} • 📍 {interest.fromUserCity || "India"}
                            </div>
                            {interest.fromUserCollege && (
                              <div className="text-[10px] text-royal font-semibold mt-0.5">
                                🎓 {interest.fromUserCollege}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {interest.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleAcceptInterest(interest.id)}
                                className="btn-stylish-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <span>✓</span> Accept
                              </button>
                              <button
                                onClick={() => handleDeclineInterest(interest.id)}
                                className="btn-stylish-secondary px-3 py-1.5 text-xs font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          ) : interest.status === "accepted" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
                                ✓ Accepted
                              </span>
                              <Link
                                to={`/messages?with=${interest.fromUserId}`}
                                className="btn-stylish-primary px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
                              >
                                <span>💬</span> Chat
                              </Link>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === "sent" ? (
                sentList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">📤</div>
                    <h3 className="font-serif text-lg font-bold text-navy mb-1">
                      No sent interests yet
                    </h3>
                    <p className="text-xs text-muted max-w-xs mx-auto mb-5 leading-relaxed">
                      You haven't sent interest to any profiles yet. Browse verified profiles and connect with matches that share your values!
                    </p>
                    <Link
                      to="/browse"
                      className="btn-stylish-primary inline-block px-5 py-2.5 text-xs font-bold rounded-xl"
                    >
                      Browse Profiles
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {sentList.map((interest) => (
                      <div
                        key={interest.id}
                        className="p-3.5 bg-slate-50/90 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              interest.toUserPhoto ||
                              "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=400&h=400"
                            }
                            alt={interest.toUserName}
                            className="w-11 h-11 rounded-2xl object-cover border border-border shadow-sm flex-shrink-0"
                          />
                          <div>
                            <div className="font-serif font-bold text-navy text-sm">
                              {interest.toUserName}
                              {interest.toUserAge ? `, ${interest.toUserAge}` : ""}
                            </div>
                            <div className="text-[11px] text-muted">
                              {interest.toUserOccupation || "Professional"} • 📍 {interest.toUserCity || "India"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {interest.status === "accepted" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
                                ✓ Accepted!
                              </span>
                              <Link
                                to={`/messages?with=${interest.toUserId}`}
                                className="btn-stylish-primary px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
                              >
                                <span>💬</span> Chat Now
                              </Link>
                            </div>
                          ) : interest.status === "rejected" ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
                              Declined
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                              <span>⏳</span> Pending Acceptance
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                acceptedMatchesList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">💬</div>
                    <h3 className="font-serif text-lg font-bold text-navy mb-1">
                      No Accepted Matches Yet
                    </h3>
                    <p className="text-xs text-muted max-w-xs mx-auto mb-5 leading-relaxed">
                      Once you accept an interest request (or someone accepts yours), your private chat room will unlock right here!
                    </p>
                    <Link
                      to="/browse"
                      className="btn-stylish-primary inline-block px-5 py-2.5 text-xs font-bold rounded-xl"
                    >
                      Find Matches
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {acceptedMatchesList.map((match) => (
                      <div
                        key={match.matchId}
                        className="p-3.5 bg-gradient-to-r from-blue-50/50 to-amber-50/40 rounded-2xl border border-blue-200/60 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              match.partnerPhoto ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=400&h=400"
                            }
                            alt={match.partnerName}
                            className="w-11 h-11 rounded-2xl object-cover border border-border shadow-sm flex-shrink-0"
                          />
                          <div>
                            <div className="font-serif font-bold text-navy text-sm flex items-center gap-1.5">
                              <span>{match.partnerName}</span>
                              <span className="text-[10px] text-emerald-600 font-bold">● Active Match</span>
                            </div>
                            <div className="text-[11px] text-muted">
                              {match.partnerOccupation} • 📍 {match.partnerCity}
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/messages?with=${match.partnerId}`}
                          className="btn-stylish-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <span>💬</span> Open Chat
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>Looking to connect?</span>
              <Link to="/messages" className="font-bold text-royal hover:underline flex items-center gap-1">
                <span>Go to Messenger</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Edit Profile Details",
              icon: "✎",
              onClick: () => setIsEditing(true),
              color: "bg-navy text-white hover:bg-navy-light",
            },
            {
              label: "Search by College",
              icon: "🎓",
              to: "/browse",
              color: "bg-royal text-white hover:bg-royal-dark",
            },
            {
              label: "NRI Profiles",
              icon: "🌍",
              to: "/browse",
              color: "bg-surface border border-border text-navy hover:bg-slate-50",
            },
            {
              label: "Chat Messenger",
              icon: "💬",
              to: "/messages",
              color: "bg-surface border border-border text-navy hover:bg-slate-50",
            },
          ].map((action) =>
            action.to ? (
              <Link
                key={action.label}
                to={action.to}
                className={`${action.color} rounded-2xl p-5 text-center shadow-card hover:-translate-y-1 transition-all duration-200`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="text-xs font-bold uppercase tracking-wider">{action.label}</div>
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`${action.color} rounded-2xl p-5 text-center shadow-card hover:-translate-y-1 transition-all duration-200 cursor-pointer`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="text-xs font-bold uppercase tracking-wider">{action.label}</div>
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Complete / Edit Profile Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-surface w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-navy">
                  Complete Your Profile Details
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Update your background to reach 100% profile completeness
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-sm hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2">
                <span>✅</span> Profile details saved successfully! Updating completion status…
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
                <span>⚠️</span> {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Section 0: Profile Picture */}
              <div className="p-4 bg-gradient-to-r from-cream via-white to-cream rounded-2xl border border-border">
                <h3 className="text-xs font-bold text-royal uppercase tracking-wider mb-3">
                  0. Profile Picture
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-royal/30 shadow-md bg-slate-100 flex items-center justify-center">
                      {formData.photo ? (
                        <img
                          src={formData.photo}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-3xl text-slate-400">
                          {formData.gender === "Male" ? "👨" : "👩"}
                        </div>
                      )}
                    </div>
                    {formData.photo && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photo: "" }))}
                        title="Remove Photo"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        ref={modalFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleModalPhotoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        disabled={photoUploading}
                        className="px-3.5 py-1.5 bg-royal hover:bg-royal-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {photoUploading ? "Processing…" : "📷 Upload New Photo"}
                      </button>

                      {formData.photo && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, photo: "" }))}
                          className="px-3 py-1.5 border border-border hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                        Or select a stylish avatar:
                      </span>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                        {SAMPLE_AVATARS.map((av) => (
                          <button
                            key={av.url}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, photo: av.url }))}
                            title={`${av.gender} — ${av.label}`}
                            className={`w-8 h-8 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                              formData.photo === av.url
                                ? "border-royal ring-2 ring-royal/30 scale-105"
                                : "border-border hover:border-royal/50 opacity-80 hover:opacity-100"
                            }`}
                          >
                            <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Basic Identity */}
              <div>
                <h3 className="text-xs font-bold text-royal uppercase tracking-wider mb-3">
                  1. Basic Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleFormChange}
                      required
                      min={18}
                      max={80}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Height</label>
                    <input
                      type="text"
                      name="height"
                      value={formData.height}
                      onChange={handleFormChange}
                      placeholder="e.g. 5'7&quot;"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-navy mb-1">
                      About Me / Bio
                    </label>
                    <textarea
                      name="about"
                      rows={3}
                      value={formData.about}
                      onChange={handleFormChange}
                      placeholder="Share a short summary about your hobbies, values, and lifestyle…"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Community & Location */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-royal uppercase tracking-wider mb-3">
                  2. Community & Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Mother Tongue</label>
                    <select
                      name="mother_tongue"
                      value={formData.mother_tongue}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    >
                      {MOTHER_TONGUES.map((mt) => (
                        <option key={mt} value={mt}>
                          {mt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Caste / Sub‑caste
                    </label>
                    <input
                      type="text"
                      name="caste"
                      value={formData.caste}
                      onChange={handleFormChange}
                      placeholder="e.g. Brahmin, Patel, Maratha…"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Religion</label>
                    <select
                      name="religion"
                      value={formData.religion}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    >
                      {RELIGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Residency Status
                    </label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                        <input
                          type="checkbox"
                          name="nri"
                          checked={formData.nri}
                          onChange={handleFormChange}
                          className="w-4 h-4 accent-royal rounded"
                        />
                        <span>I am an NRI living abroad 🌍</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Current City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      placeholder="e.g. Mumbai, New York, London"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">State / Region</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      placeholder="e.g. Maharashtra, California"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Education & Career */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-royal uppercase tracking-wider mb-3">
                  3. Education & Career
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-navy mb-1">
                      College / University Attended
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleFormChange}
                      placeholder="e.g. IIT Bombay, IIM Ahmedabad, BITS, AIIMS, Stanford…"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Highest Degree
                    </label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleFormChange}
                      placeholder="e.g. B.Tech, MBA, MBBS, MS, PhD"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Occupation / Job Title
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleFormChange}
                      placeholder="e.g. Software Architect, Cardiologist"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Annual Income
                    </label>
                    <input
                      type="text"
                      name="income"
                      value={formData.income}
                      onChange={handleFormChange}
                      placeholder="e.g. ₹35 Lakhs or $160,000"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Family Details */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-royal uppercase tracking-wider mb-3">
                  4. Family Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Father's Profession
                    </label>
                    <input
                      type="text"
                      name="father"
                      value={formData.father}
                      onChange={handleFormChange}
                      placeholder="e.g. Chief Engineer (Retd.)"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Mother's Profession
                    </label>
                    <input
                      type="text"
                      name="mother"
                      value={formData.mother}
                      onChange={handleFormChange}
                      placeholder="e.g. Professor / Homemaker"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Siblings</label>
                    <input
                      type="text"
                      name="siblings"
                      value={formData.siblings}
                      onChange={handleFormChange}
                      placeholder="e.g. 1 Elder Brother (Married)"
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Family Type</label>
                    <select
                      name="family_type"
                      value={formData.family_type}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal"
                    >
                      <option value="Nuclear Family">Nuclear Family</option>
                      <option value="Joint Family">Joint Family</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-5 py-2.5 border border-border text-navy rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 bg-royal hover:bg-royal-dark text-white rounded-xl text-xs font-bold shadow-royal transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving Changes…
                    </>
                  ) : (
                    "Save & Update Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
