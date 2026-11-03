// src/pages/Browse.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCustomProfiles,
  sendInterest as serviceSendInterest,
  getAllInterests,
} from "../lib/matchService";

const MOTHER_TONGUES = [
  "All",
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
];

const CASTES = [
  "All",
  "Brahmin",
  "Maratha",
  "Patel",
  "Agarwal",
  "Reddy",
  "Nair",
  "Khatri",
  "Sunni",
  "Roman Catholic",
];

const STATES = [
  "All",
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Telangana",
  "Gujarat",
  "Tamil Nadu",
  "Punjab",
  "West Bengal",
  "California",
  "New York",
  "Ontario",
  "England",
  "Dubai",
];

const CITIES = [
  "All",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Delhi",
  "Hyderabad",
  "Ahmedabad",
  "San Francisco",
  "New York",
  "Toronto",
  "London",
  "Dubai",
];

const COLLEGES = [
  "All",
  "IIT",
  "IIM",
  "BITS Pilani",
  "AIIMS",
  "Stanford University",
  "Cambridge University",
  "Columbia Law School",
  "SRCC Delhi",
  "NID Ahmedabad",
  "St. Stephen's College",
];

const RELIGIONS = ["All", "Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"];

const Browse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customProfiles, setCustomProfiles] = useState([]);
  const [interestMap, setInterestMap] = useState({});
  const [toasting, setToasting] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");

  // Filters State
  const initialFilters = {
    search: "",
    motherTongue: "All",
    caste: "All",
    city: "All",
    state: "All",
    nri: "All", // "All" | "NRI" | "India"
    college: "All",
    collegeKeyword: "",
    religion: "All",
    ageMin: 21,
    ageMax: 40,
  };

  const [filters, setFilters] = useState(initialFilters);

  // Collapsible section state for sidebar
  const [openSections, setOpenSections] = useState({
    cultural: true,
    location: true,
    education: true,
    demographics: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const loadData = () => {
    const list = getCustomProfiles();
    setCustomProfiles(list);

    const allInt = getAllInterests();
    const map = {};
    if (user) {
      allInt.forEach((i) => {
        const fromMatch = String(i.fromUserId) === String(user.id);
        const toMatch = String(i.toUserId) === String(user.id);

        if (fromMatch) {
          map[String(i.toUserId)] = i.status; // 'pending' | 'accepted' | 'rejected'
        }
        if (toMatch) {
          if (i.status === "accepted") {
            map[String(i.fromUserId)] = "accepted";
          } else if (i.status === "pending") {
            map[String(i.fromUserId)] = "received_pending";
          }
        }
      });
    }
    setInterestMap(map);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("matrimony_data_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("matrimony_data_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [user]);

  const sendInterest = async (profile) => {
    if (!user) {
      navigate("/login", { state: { message: "Please sign in to send an interest." } });
      return;
    }
    await serviceSendInterest(user, profile);
    showToast(`💌 Interest successfully sent to ${profile.name}!`);
    loadData();
  };

  const showToast = (msg) => {
    setToasting(msg);
    setTimeout(() => setToasting(""), 3500);
  };

  // Only real user-created profiles, excluding the current user themselves
  const allProfiles = useMemo(() => {
    return customProfiles.filter((p) => {
      if (!user) return true;
      return String(p.id) !== String(user.id) && String(p.userId) !== String(user.id);
    });
  }, [customProfiles, user]);

  // Filtering Logic
  const filtered = useMemo(() => {
    let result = allProfiles.filter((p) => {
      // Keyword search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesCity = p.location?.city?.toLowerCase().includes(q);
        const matchesCaste = p.caste?.toLowerCase().includes(q);
        const matchesCollege = p.college?.toLowerCase().includes(q);
        const matchesOccupation = p.occupation?.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesCaste && !matchesCollege && !matchesOccupation) {
          return false;
        }
      }

      // Mother Tongue
      if (filters.motherTongue !== "All") {
        if (!p.motherTongue || p.motherTongue.toLowerCase() !== filters.motherTongue.toLowerCase()) {
          return false;
        }
      }

      // Caste
      if (filters.caste !== "All") {
        if (!p.caste || !p.caste.toLowerCase().includes(filters.caste.toLowerCase())) {
          return false;
        }
      }

      // City
      if (filters.city !== "All") {
        if (!p.location?.city || p.location.city.toLowerCase() !== filters.city.toLowerCase()) {
          return false;
        }
      }

      // State
      if (filters.state !== "All") {
        if (!p.location?.state || p.location.state.toLowerCase() !== filters.state.toLowerCase()) {
          return false;
        }
      }

      // NRI
      if (filters.nri === "NRI") {
        if (!p.nri) return false;
      } else if (filters.nri === "India") {
        if (p.nri) return false;
      }

      // College
      if (filters.college !== "All") {
        if (!p.college || !p.college.toLowerCase().includes(filters.college.toLowerCase())) {
          return false;
        }
      }

      if (filters.collegeKeyword) {
        if (
          !p.college ||
          !p.college.toLowerCase().includes(filters.collegeKeyword.toLowerCase())
        ) {
          return false;
        }
      }

      // Religion
      if (filters.religion !== "All") {
        if (!p.religion || p.religion.toLowerCase() !== filters.religion.toLowerCase()) {
          return false;
        }
      }

      // Age range
      if (p.age < filters.ageMin || p.age > filters.ageMax) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === "age-asc") {
      result.sort((a, b) => a.age - b.age);
    } else if (sortBy === "age-desc") {
      result.sort((a, b) => b.age - a.age);
    } else if (sortBy === "nri-first") {
      result.sort((a, b) => (b.nri ? 1 : 0) - (a.nri ? 1 : 0));
    }

    return result;
  }, [allProfiles, filters, sortBy]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.motherTongue !== "All") count++;
    if (filters.caste !== "All") count++;
    if (filters.city !== "All") count++;
    if (filters.state !== "All") count++;
    if (filters.nri !== "All") count++;
    if (filters.college !== "All" || filters.collegeKeyword) count++;
    if (filters.religion !== "All") count++;
    if (filters.search) count++;
    if (filters.ageMin > 21 || filters.ageMax < 40) count++;
    return count;
  }, [filters]);

  const removeFilter = (key, defaultVal) => {
    setFilters((prev) => ({ ...prev, [key]: defaultVal }));
  };

  return (
    <div className="min-h-screen bg-cream text-text py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toasting && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-6 py-3 rounded-full shadow-heavy text-sm font-semibold flex items-center gap-2 border border-gold/40 animate-bounce">
          <span className="text-gold">✨</span>
          <span>{toasting}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-light/60 border border-gold/30 rounded-full text-xs font-bold text-gold uppercase tracking-wider mb-2">
              <span>👑</span> Verified Executive Profiles
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
              Browse Matches
            </h1>
            <p className="text-muted text-sm mt-1">
              Refine by mother tongue, caste, location, NRI status, and top colleges
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <span>⚙️</span>
              <span>Filters ({activeFilterCount})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-surface border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-royal text-xs shadow-sm cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="age-asc">Age: Youngest First</option>
                <option value="age-desc">Age: Oldest First</option>
                <option value="nri-first">NRI Profiles First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3.5 bg-surface rounded-2xl border border-border shadow-sm">
            <span className="text-xs font-bold text-navy uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {filters.motherTongue !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                Mother Tongue: {filters.motherTongue}
                <button
                  onClick={() => removeFilter("motherTongue", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.caste !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                Caste: {filters.caste}
                <button
                  onClick={() => removeFilter("caste", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.city !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                City: {filters.city}
                <button
                  onClick={() => removeFilter("city", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.state !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                State: {filters.state}
                <button
                  onClick={() => removeFilter("state", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.nri !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-gold text-xs font-semibold rounded-full">
                Status: {filters.nri === "NRI" ? "NRI Only 🌍" : "India Only 🇮🇳"}
                <button
                  onClick={() => removeFilter("nri", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.college !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                College: {filters.college}
                <button
                  onClick={() => removeFilter("college", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.collegeKeyword && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                College Keyword: "{filters.collegeKeyword}"
                <button
                  onClick={() => removeFilter("collegeKeyword", "")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.religion !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                Religion: {filters.religion}
                <button
                  onClick={() => removeFilter("religion", "All")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                Search: "{filters.search}"
                <button
                  onClick={() => removeFilter("search", "")}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {(filters.ageMin > 21 || filters.ageMax < 40) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-royal text-xs font-semibold rounded-full">
                Age: {filters.ageMin} - {filters.ageMax} yrs
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, ageMin: 21, ageMax: 40 }));
                  }}
                  className="hover:text-navy font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              onClick={() => setFilters(initialFilters)}
              className="text-xs text-rose-600 hover:underline font-bold ml-auto cursor-pointer"
            >
              Reset All ↺
            </button>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="flex gap-8 items-start">
          {/* Left-Hand Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 glass-panel rounded-3xl border border-border/80 p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 font-serif text-lg font-bold text-navy">
                <span>⚡</span> Filter Criteria
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters(initialFilters)}
                  className="text-xs font-semibold text-royal hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Quick Keyword Search */}
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Quick Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, company, keyword…"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal transition-all placeholder-muted/60"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-navy"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 1. NRI Status Filter */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                NRI Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-cream rounded-xl border border-border text-xs font-semibold text-center">
                {[
                  { label: "All", value: "All" },
                  { label: "NRI 🌍", value: "NRI" },
                  { label: "India 🇮🇳", value: "India" },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, nri: value }))}
                    className={`py-1.5 px-1 rounded-lg transition-all ${
                      filters.nri === value
                        ? "bg-navy text-white shadow-sm"
                        : "text-muted hover:text-navy"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Cultural Background (Mother Tongue & Caste) */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => toggleSection("cultural")}
                className="w-full flex items-center justify-between text-xs font-bold text-navy uppercase tracking-wider mb-3"
              >
                <span>🗣️ Community & Language</span>
                <span>{openSections.cultural ? "▾" : "▸"}</span>
              </button>

              {openSections.cultural && (
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">
                      Mother Tongue
                    </label>
                    <select
                      value={filters.motherTongue}
                      onChange={(e) => setFilters((f) => ({ ...f, motherTongue: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal cursor-pointer"
                    >
                      {MOTHER_TONGUES.map((mt) => (
                        <option key={mt} value={mt}>
                          {mt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Caste</label>
                    <select
                      value={filters.caste}
                      onChange={(e) => setFilters((f) => ({ ...f, caste: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal cursor-pointer"
                    >
                      {CASTES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Religion</label>
                    <select
                      value={filters.religion}
                      onChange={(e) => setFilters((f) => ({ ...f, religion: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal cursor-pointer"
                    >
                      {RELIGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Location (City & State) */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => toggleSection("location")}
                className="w-full flex items-center justify-between text-xs font-bold text-navy uppercase tracking-wider mb-3"
              >
                <span>📍 Location (City / State)</span>
                <span>{openSections.location ? "▾" : "▸"}</span>
              </button>

              {openSections.location && (
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">City</label>
                    <select
                      value={filters.city}
                      onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal cursor-pointer"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">
                      State / Region
                    </label>
                    <select
                      value={filters.state}
                      onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal cursor-pointer"
                    >
                      {STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Education & College */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => toggleSection("education")}
                className="w-full flex items-center justify-between text-xs font-bold text-navy uppercase tracking-wider mb-3"
              >
                <span>🎓 College & Institute</span>
                <span>{openSections.education ? "▾" : "▸"}</span>
              </button>

              {openSections.education && (
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">
                      Premier Colleges
                    </label>
                    <select
                      value={filters.college}
                      onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal cursor-pointer"
                    >
                      {COLLEGES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">
                      Search Other College
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford, BITS, AIIMS…"
                      value={filters.collegeKeyword}
                      onChange={(e) => setFilters((f) => ({ ...f, collegeKeyword: e.target.value }))}
                      className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy focus:outline-none focus:border-royal transition-all placeholder-muted/60"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Age Range Slider */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Age Range
                </span>
                <span className="text-xs font-bold text-navy">
                  {filters.ageMin} – {filters.ageMax} yrs
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-6">Min:</span>
                  <input
                    type="range"
                    min={21}
                    max={50}
                    value={filters.ageMin}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, ageMin: Math.min(+e.target.value, f.ageMax) }))
                    }
                    className="w-full accent-royal cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-navy w-6">{filters.ageMin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-6">Max:</span>
                  <input
                    type="range"
                    min={21}
                    max={50}
                    value={filters.ageMax}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, ageMax: Math.max(+e.target.value, f.ageMin) }))
                    }
                    className="w-full accent-royal cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-navy w-6">{filters.ageMax}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Results Column */}
          <div className="flex-1 min-w-0">
            {/* Header info bar */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-navy">
                Showing <strong className="text-royal font-bold">{filtered.length}</strong> verified
                profiles
              </span>
              {!user && (
                <Link
                  to="/register"
                  className="text-xs font-bold text-royal hover:underline hidden sm:inline"
                >
                  Create Profile to Connect Directly →
                </Link>
              )}
            </div>

            {/* Profile Grid */}
            {allProfiles.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-3xl border border-border p-8 shadow-card max-w-lg mx-auto">
                <div className="w-16 h-16 bg-blue-50 text-royal rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  👤
                </div>
                <h3 className="font-serif text-2xl font-bold text-navy mb-2">
                  No Member Profiles Yet
                </h3>
                <p className="text-muted text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Dummy profiles have been removed. Create or register candidate profiles to start browsing, sending interest requests, accepting matches, and chatting in real time!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/register"
                    className="btn-stylish-primary px-6 py-3 text-xs sm:text-sm font-bold rounded-xl shadow-royal flex items-center justify-center gap-2"
                  >
                    <span>✨</span> Register A Profile
                  </Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-3xl border border-border p-8 shadow-card">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-serif text-2xl font-bold text-navy mb-2">
                  No Profiles Match Filters
                </h3>
                <p className="text-muted text-sm max-w-md mx-auto mb-6">
                  No member profiles matched your active filters. Try clearing some filters.
                </p>
                <button
                  onClick={() => setFilters(initialFilters)}
                  className="px-6 py-2.5 btn-stylish-secondary text-sm font-semibold rounded-xl"
                >
                  Reset All Filters ↺
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    interestStatus={interestMap[String(profile.userId || profile.id)]}
                    onSendInterest={() => sendInterest(profile)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-over Drawer for Filters */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-surface h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <h3 className="font-serif text-xl font-bold text-navy">Refine Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center font-bold text-sm text-navy"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Filter Sections */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">NRI Status</label>
                  <select
                    value={filters.nri}
                    onChange={(e) => setFilters((f) => ({ ...f, nri: e.target.value }))}
                    className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs font-semibold text-navy"
                  >
                    <option value="All">All Profiles</option>
                    <option value="NRI">NRI Only 🌍</option>
                    <option value="India">India Only 🇮🇳</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Mother Tongue</label>
                  <select
                    value={filters.motherTongue}
                    onChange={(e) => setFilters((f) => ({ ...f, motherTongue: e.target.value }))}
                    className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy"
                  >
                    {MOTHER_TONGUES.map((mt) => (
                      <option key={mt} value={mt}>
                        {mt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Caste</label>
                  <select
                    value={filters.caste}
                    onChange={(e) => setFilters((f) => ({ ...f, caste: e.target.value }))}
                    className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy"
                  >
                    {CASTES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">City</label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">State</label>
                  <select
                    value={filters.state}
                    onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
                    className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy"
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">College</label>
                  <select
                    value={filters.college}
                    onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))}
                    className="w-full px-3 py-2 bg-cream border border-border rounded-xl text-xs text-navy"
                  >
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex gap-2">
              <button
                onClick={() => setFilters(initialFilters)}
                className="flex-1 py-2.5 bg-cream border border-border text-navy rounded-xl text-xs font-bold"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-navy text-white rounded-xl text-xs font-bold shadow"
              >
                Apply ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileCard = ({ profile, interestStatus, onSendInterest }) => {
  const {
    id,
    name,
    age,
    height = "5'8\"",
    religion,
    caste,
    motherTongue,
    occupation,
    college,
    education,
    location,
    photo,
    nri,
    income,
  } = profile;

  return (
    <div className="glass-card rounded-3xl overflow-hidden card-hover-effect flex flex-col group">
      {/* Photo with Overlays */}
      <div className="relative h-64 overflow-hidden bg-slate-900">
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

        {/* Top Badges */}
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

        {/* Name, Age & City */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-serif font-bold text-xl leading-tight drop-shadow-sm">
            {name}, {age}
          </h3>
          <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
            <span>📍</span> {location?.city || "India"}, {location?.state || ""}
          </p>
        </div>
      </div>

      {/* Card Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Cultural & College Details */}
        <div className="space-y-2 text-xs">
          {/* Mother Tongue & Caste */}
          <div className="flex items-center gap-1.5 text-navy font-semibold">
            <span className="text-muted">🗣️</span>
            <span>{motherTongue || "Hindi"}</span>
            {caste && (
              <>
                <span className="text-muted">•</span>
                <span className="text-muted font-normal">{caste}</span>
              </>
            )}
          </div>

          {/* Profession & Income */}
          <div className="flex items-center gap-1.5 text-navy font-semibold">
            <span className="text-muted">💼</span>
            <span className="truncate">{occupation || "Professional"}</span>
            {income && (
              <>
                <span className="text-muted">•</span>
                <span className="text-gold font-bold">{income}</span>
              </>
            )}
          </div>

          {/* College / Education Tag */}
          {(college || education) && (
            <div className="flex items-center gap-1.5 text-royal font-semibold bg-blue-50/70 border border-blue-100 rounded-xl px-2.5 py-1.5">
              <span>🎓</span>
              <span className="truncate">
                {college ? college : education}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-border">
          {interestStatus === "accepted" ? (
            <Link
              to={`/messages?with=${profile.userId || profile.id}`}
              className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl btn-stylish-primary flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>💬</span> Chat Now
            </Link>
          ) : interestStatus === "pending" ? (
            <button
              disabled
              className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 cursor-default flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>⏳</span> Interest Sent
            </button>
          ) : interestStatus === "received_pending" ? (
            <Link
              to="/dashboard"
              className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>💌</span> Review Request
            </Link>
          ) : (
            <button
              onClick={onSendInterest}
              className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl btn-stylish-primary flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>💌</span> Send Interest
            </button>
          )}
          <Link
            to={`/profile/${id}`}
            className="py-2.5 px-4 text-xs font-bold text-navy btn-stylish-secondary rounded-xl transition-all text-center flex items-center justify-center"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Browse;
