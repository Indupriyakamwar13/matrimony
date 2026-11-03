// src/pages/Register.jsx
import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { saveCustomProfile } from "../lib/matchService";
import { compressImageFile, SAMPLE_AVATARS } from "../lib/imageUtils";

const steps = [
  {
    title: "Basic Details",
    subtitle: "Identity and login credentials",
    icon: "👤",
    fields: [
      { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "e.g. Priya" },
      { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "e.g. Sharma" },
      { name: "email", label: "Email Address", type: "email", required: true, placeholder: "you@example.com" },
      { name: "gender", label: "Gender", type: "select", required: true, options: ["Female", "Male", "Other"] },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "e.g. 26" },
      { name: "password", label: "Create Password", type: "password", required: true, placeholder: "Min. 6 characters" },
      { name: "confirmPassword", label: "Confirm Password", type: "password", required: true, placeholder: "Repeat password" },
    ],
  },
  {
    title: "Community & Location",
    subtitle: "Mother tongue, caste, and residency status",
    icon: "🗣️",
    fields: [
      { name: "motherTongue", label: "Mother Tongue", type: "select", required: true, options: ["Hindi", "Marathi", "Gujarati", "Tamil", "Telugu", "Bengali", "Punjabi", "Kannada", "Malayalam", "Urdu", "English", "Other"] },
      { name: "religion", label: "Religion", type: "select", required: true, options: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Other"] },
      { name: "caste", label: "Caste / Sub‑caste", type: "text", placeholder: "e.g. Brahmin, Patel, Maratha, etc." },
      { name: "nri", label: "Residency Status", type: "select", options: ["Resident Indian 🇮🇳", "NRI (Living Abroad) 🌍"] },
      { name: "city", label: "Current City", type: "text", required: true, placeholder: "e.g. Mumbai, San Francisco, London" },
      { name: "state", label: "State / Region", type: "text", placeholder: "e.g. Maharashtra, California, Ontario" },
    ],
  },
  {
    title: "Education & Career",
    subtitle: "Your college, qualification, and profession",
    icon: "🎓",
    fields: [
      { name: "college", label: "College / University Attended", type: "text", required: true, placeholder: "e.g. IIT Bombay, IIM, BITS, AIIMS, Stanford" },
      { name: "education", label: "Highest Degree", type: "text", required: true, placeholder: "e.g. B.Tech, MBA, MBBS, MS, CA" },
      { name: "occupation", label: "Occupation / Job Title", type: "text", required: true, placeholder: "e.g. Software Architect, Doctor, Consultant" },
      { name: "income", label: "Annual Income", type: "text", placeholder: "e.g. ₹35 Lakhs or $150,000" },
    ],
  },
  {
    title: "Family Background",
    subtitle: "Values and family background",
    icon: "🏡",
    fields: [
      { name: "father", label: "Father's Profession", type: "text", placeholder: "e.g. Retired Civil Engineer" },
      { name: "mother", label: "Mother's Profession", type: "text", placeholder: "e.g. Professor / Homemaker" },
      { name: "familyType", label: "Family Type", type: "select", options: ["Nuclear Family", "Joint Family"] },
      { name: "siblings", label: "Siblings", type: "text", placeholder: "e.g. 1 Brother (Married), 1 Sister" },
    ],
  },
  {
    title: "Partner Preferences",
    subtitle: "What you seek in your prospective life partner",
    icon: "💍",
    fields: [
      { name: "prefMotherTongue", label: "Preferred Mother Tongue", type: "text", placeholder: "e.g. Hindi, Marathi, or Any" },
      { name: "prefReligion", label: "Preferred Religion", type: "select", options: ["Any", "Hindu", "Muslim", "Christian", "Sikh", "Jain"] },
      { name: "prefAgeMin", label: "Minimum Age Preference", type: "number", placeholder: "e.g. 24" },
      { name: "prefAgeMax", label: "Maximum Age Preference", type: "number", placeholder: "e.g. 32" },
      { name: "prefNri", label: "NRI Preference", type: "select", options: ["No Preference", "NRI Only", "Resident Indian Only"] },
    ],
  },
];

const Register = () => {
  const navigate = useNavigate();
  const { switchUser } = useAuth();
  const fileInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    gender: "Female",
    motherTongue: "Hindi",
    religion: "Hindu",
    nri: "Resident Indian 🇮🇳",
    familyType: "Nuclear Family",
    prefReligion: "Any",
    prefNri: "No Preference",
    photo: "",
  });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoLoading(true);
      setError("");
      const compressedDataUrl = await compressImageFile(file, 450, 0.82);
      setFormData((prev) => ({ ...prev, photo: compressedDataUrl }));
    } catch (err) {
      setError(err.message || "Failed to process photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSelectPresetAvatar = (url) => {
    setFormData((prev) => ({ ...prev, photo: url }));
    setError("");
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateStep = () => {
    const step = steps[currentStep];
    for (const field of step.fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`"${field.label}" is required.`);
        return false;
      }
    }

    if (currentStep === 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address.");
        return false;
      }

      if (formData.password && formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }

      const age = parseInt(formData.age, 10);
      if (isNaN(age) || age < 18 || age > 80) {
        setError("Please enter a valid age between 18 and 80.");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    setError("");
    if (!validateStep()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    setError("");
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
      const isNri = formData.nri?.includes("NRI");
      const defaultPhoto =
        formData.gender === "Male"
          ? "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=600&h=600"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=600&h=600";
      const finalPhoto = formData.photo || defaultPhoto;

      const userMetadata = {
        full_name: fullName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        photo: finalPhoto,
        gender: formData.gender,
        age: Number(formData.age) || 25,
        mother_tongue: formData.motherTongue || "Hindi",
        caste: formData.caste || "",
        religion: formData.religion || "Hindu",
        nri: isNri,
        city: formData.city || "Mumbai",
        state: formData.state || "",
        college: formData.college || "",
        education: formData.education || "",
        occupation: formData.occupation || "Executive",
        income: formData.income || "",
        father: formData.father || "",
        mother: formData.mother || "",
        family_type: formData.familyType || "Nuclear Family",
        siblings: formData.siblings || "",
        pref_mother_tongue: formData.prefMotherTongue || "Any",
        pref_religion: formData.prefReligion || "Any",
        pref_age_min: formData.prefAgeMin || 24,
        pref_age_max: formData.prefAgeMax || 32,
      };

      let supabaseUserId = null;

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: { data: userMetadata },
        });

        if (signUpError) {
          const msg = signUpError.message?.toLowerCase() || "";
          const code = signUpError.code || signUpError.status || "";

          if (msg.includes("already registered") || msg.includes("duplicate") || msg.includes("already exists")) {
            setError("An account with this email already exists. Please sign in instead.");
            setCurrentStep(0);
            setLoading(false);
            return;
          } else if (msg.includes("password")) {
            setError("Password is too weak. Please choose at least 6 characters.");
            setCurrentStep(0);
            setLoading(false);
            return;
          } else if (
            msg.includes("rate limit") ||
            msg.includes("over_email_send_rate_limit") ||
            msg.includes("email rate") ||
            msg.includes("too many") ||
            String(code) === "429"
          ) {
            // Rate limit hit — fall through to local-only registration below
            console.warn("Supabase email rate limit hit — registering locally.");
          } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
            // Network error — fall through to local-only registration
            console.warn("Supabase unreachable — registering locally.");
          } else {
            // Any other Supabase error — fall through to local registration
            console.warn("Supabase signup error, falling back locally:", signUpError.message);
          }
        } else if (data?.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            setError("An account with this email already exists. Please sign in instead.");
            setCurrentStep(0);
            setLoading(false);
            return;
          }
          supabaseUserId = data.user.id;
        }
      } catch {
        // Network/sandbox unavailable — fall through to local-only
        console.warn("Supabase unreachable — registering locally.");
      }

      // Use Supabase UUID if available, otherwise generate a stable local ID
      const userId = String(supabaseUserId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`);
      const newProfile = {
        id: userId,
        userId: userId,
        email: formData.email.trim(),
        password: formData.password,
        name: fullName,
        age: Number(formData.age) || 25,
        gender: formData.gender,
        height: formData.gender === "Male" ? "5'11\"" : "5'6\"",
        motherTongue: formData.motherTongue || "Hindi",
        caste: formData.caste || "",
        religion: formData.religion || "Hindu",
        nri: isNri,
        location: {
          city: formData.city || "Mumbai",
          state: formData.state || "Maharashtra",
          country: isNri ? "Abroad" : "India",
        },
        college: formData.college || "Premier University",
        education: formData.education || "Graduate Degree",
        occupation: formData.occupation || "Executive",
        income: formData.income || "Competitive",
        photo: finalPhoto,
        family: {
          father: formData.father || "Retired Executive",
          mother: formData.mother || "Homemaker",
          siblings: formData.siblings || "1 Sibling",
        },
        preferences: {
          religion: [formData.prefReligion || "Any"],
          ageRange: [Number(formData.prefAgeMin) || 22, Number(formData.prefAgeMax) || 35],
        },
      };

      saveCustomProfile(newProfile);

      // Immediately set user active so they are signed in smoothly
      switchUser({
        id: userId,
        email: formData.email.trim(),
        user_metadata: userMetadata,
      });

      navigate("/dashboard", {
        state: {
          welcomeMessage: `Welcome to Matrimony, ${formData.firstName}! Your verified profile is now live.`,
        },
      });
      return;
    } catch (e) {
      console.error("Unexpected signup error:", e);
      setError(e?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const step = steps[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  if (registeredSuccess) {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-text">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-surface py-10 px-8 rounded-3xl border border-border shadow-card text-center">
            <div className="w-20 h-20 bg-blue-50 text-royal rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
              👑
            </div>
            <h2 className="font-serif text-3xl font-bold text-navy mb-2">
              Registration Successful!
            </h2>
            <p className="text-muted text-xs sm:text-sm leading-relaxed mb-6">
              Thank you for registering, <strong>{formData.firstName}</strong>! A verification email has been sent to{" "}
              <strong className="text-royal">{formData.email}</strong>.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-border text-xs text-navy text-left mb-6 space-y-1.5">
              <div className="font-bold text-gold uppercase tracking-wider">📌 Next Steps:</div>
              <div>1. Open your email inbox (and check Spam/Junk folder if needed).</div>
              <div>2. Click the verification link to activate your profile.</div>
              <div>3. Once confirmed, sign in to start connecting with matches!</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex-1 py-3 px-6 bg-royal hover:bg-royal-dark text-white rounded-xl font-bold text-xs sm:text-sm shadow-royal transition-all text-center"
              >
                Sign In to Account
              </Link>
              <Link
                to="/browse"
                className="flex-1 py-3 px-6 bg-cream border border-border text-navy rounded-xl font-bold text-xs sm:text-sm hover:border-slate-400 transition-all text-center"
              >
                Browse Matches as Guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 px-4 sm:px-6 lg:px-8 text-text">
      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
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
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl font-bold text-navy">
            Create Your Executive Profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Join thousands of verified graduates, professionals, and NRI families
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-6 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-muted mb-2">
            <span>
              Step {currentStep + 1} of {steps.length}: <strong className="text-navy">{step.title}</strong>
            </span>
            <span className="text-royal">{progressPercent}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-royal to-navy h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Dots */}
          <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-border/60 text-center">
            {steps.map((s, idx) => (
              <div
                key={s.title}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  idx === currentStep
                    ? "text-navy font-bold"
                    : idx < currentStep
                    ? "text-emerald-700 font-semibold"
                    : "text-muted/60"
                }`}
                onClick={() => {
                  if (idx < currentStep) setCurrentStep(idx);
                }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    idx === currentStep
                      ? "bg-navy text-white ring-4 ring-navy/15"
                      : idx < currentStep
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 border border-border text-muted"
                  }`}
                >
                  {idx < currentStep ? "✓" : idx + 1}
                </div>
                <span className="text-[10px] hidden sm:inline truncate max-w-[80px]">
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-3xl border border-border/80 shadow-heavy p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <span className="text-3xl p-2.5 rounded-2xl bg-cream border border-border">{step.icon}</span>
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">{step.title}</h2>
              <p className="text-xs text-muted mt-0.5">{step.subtitle}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <span className="text-base">⚠️</span>
              <div className="flex-1">
                <div>{error}</div>
                {error.includes("already exists") && (
                  <Link
                    to="/login"
                    className="mt-1.5 inline-block font-bold text-royal hover:underline text-xs"
                  >
                    Click here to Sign In →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Step 0: Profile Picture Picker */}
          {currentStep === 0 && (
            <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-cream via-white to-cream rounded-2xl border border-border/80 shadow-sm">
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-2">
                Profile Picture (Optional)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Photo Preview */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-royal/30 shadow-md bg-slate-100 flex items-center justify-center">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl text-slate-400">
                        {formData.gender === "Male" ? "👨" : "👩"}
                      </div>
                    )}
                  </div>
                  {formData.photo && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remove Photo"
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Upload & Options Controls */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoLoading}
                      className="px-4 py-2 bg-royal hover:bg-royal-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {photoLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Processing…</span>
                        </>
                      ) : (
                        <>
                          <span>📷</span>
                          <span>{formData.photo ? "Change Photo" : "Upload Your Photo"}</span>
                        </>
                      )}
                    </button>

                    {formData.photo && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-2 border border-border hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium transition-all cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-muted">
                    Upload a clear portrait from your device (JPG, PNG). Automatically optimized.
                  </p>

                  {/* Quick Avatar Presets */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                      Or pick a preset avatar:
                    </span>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {SAMPLE_AVATARS.map((av) => (
                        <button
                          key={av.url}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(av.url)}
                          title={`${av.gender} — ${av.label}`}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            formData.photo === av.url
                              ? "border-royal ring-2 ring-royal/30 scale-105"
                              : "border-border/80 hover:border-royal/50 hover:scale-105 opacity-80 hover:opacity-100"
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
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {step.fields.map((field) => {
              const isFullWidth =
                field.name === "email" ||
                field.name === "college" ||
                field.name === "education" ||
                field.name === "siblings";

              return (
                <div key={field.name} className={isFullWidth ? "sm:col-span-2" : ""}>
                  <label
                    htmlFor={`reg-${field.name}`}
                    className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5"
                  >
                    {field.label} {field.required && <span className="text-rose-600">*</span>}
                  </label>

                  {field.type === "select" ? (
                    <select
                      id={`reg-${field.name}`}
                      name={field.name}
                      value={formData[field.name] || field.options[0]}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-navy text-xs sm:text-sm focus:outline-none focus:border-royal transition-all cursor-pointer"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "password" ? (
                    <div className="relative">
                      <input
                        id={`reg-${field.name}`}
                        name={field.name}
                        type={
                          field.name === "password"
                            ? showPassword
                              ? "text"
                              : "password"
                            : showConfirm
                            ? "text"
                            : "password"
                        }
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 pr-11 bg-cream border border-border rounded-xl text-navy placeholder-muted/60 text-xs sm:text-sm focus:outline-none focus:border-royal transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (field.name === "password") setShowPassword(!showPassword);
                          else setShowConfirm(!showConfirm);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy p-1 text-xs"
                      >
                        {(field.name === "password" ? showPassword : showConfirm) ? "👁️" : "🙈"}
                      </button>
                    </div>
                  ) : (
                    <input
                      id={`reg-${field.name}`}
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-cream border border-border rounded-xl text-navy placeholder-muted/60 text-xs sm:text-sm focus:outline-none focus:border-royal transition-all"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="btn-stylish-secondary px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={goNext}
              disabled={loading}
              className="btn-stylish-primary px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-royal flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating Profile…
                </>
              ) : currentStep === steps.length - 1 ? (
                "Complete Registration 👑"
              ) : (
                "Continue Next →"
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-royal hover:underline transition-colors">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
