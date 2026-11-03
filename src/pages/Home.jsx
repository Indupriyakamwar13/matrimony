// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const stats = [
  { label: "Verified Profiles", value: "5 Lakh+", icon: "🛡️" },
  { label: "Successful Marriages", value: "50,000+", icon: "💍" },
  { label: "Premier Colleges", value: "500+", icon: "🎓" },
  { label: "Global NRI Presence", value: "35+ Countries", icon: "🌍" },
];

const features = [
  {
    icon: "🎓",
    title: "Premier Education & Careers",
    desc: "Connect with graduates from IITs, IIMs, BITS, AIIMS, Ivy League, and verified executives.",
  },
  {
    icon: "🛡️",
    title: "100% Verified Profiles",
    desc: "Every profile undergoes strict ID, contact, and employment verification for safe matrimonial matchmaking.",
  },
  {
    icon: "🗣️",
    title: "Community & Language Filters",
    desc: "Refine by mother tongue, caste, family traditions, and native states with precision.",
  },
  {
    icon: "🌍",
    title: "Global NRI Network",
    desc: "Dedicated filters for Indian singles living across USA, UK, Canada, UAE, Singapore, and Australia.",
  },
];

const testimonials = [
  {
    names: "Aarav & Priya",
    location: "Mumbai • Married Dec 2024",
    college: "IIT Bombay & AIIMS Delhi",
    quote:
      "We both prioritized careers while holding deep respect for our cultural roots. This platform’s college and community filters made finding each other effortless.",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=400&h=400",
  },
  {
    names: "Vikram & Simran",
    location: "Toronto & Delhi • Married 2024",
    college: "Rotman MBA & SRCC",
    quote:
      "As an NRI in Canada, finding someone with shared Punjabi family values and professional ambition was tough. We connected within 2 weeks here!",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=400&h=400",
  },
  {
    names: "Rohan & Ananya",
    location: "San Francisco • Married 2023",
    college: "Stanford & IIM Ahmedabad",
    quote:
      "The privacy controls, clean modern design, and direct chat helped us align on family expectations before introducing our parents. Highly recommend!",
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=400&h=400",
  },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-text">
      {/* ── Hero Section (Deep Navy & Champagne Gold) ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-dark via-navy to-navy-dark text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        {/* Ambient atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-royal rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-10 w-[450px] h-[350px] bg-gold rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-gold-light text-xs sm:text-sm font-semibold shadow-inner border border-gold/30">
            <span className="text-gold">👑</span> India's Premier Executive & NRI Matchmaking Platform
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12]">
            Find Your Ideal Partner with <br />
            <span className="text-gradient-luxury">
              Shared Values & Ambition
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            Curated matchmaking for educated professionals and NRI families. Refine by mother tongue,
            caste, city, state, and premier colleges.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {user ? (
              <Link
                to="/browse"
                className="btn-stylish-primary w-full sm:w-auto px-8 py-4 font-bold text-base rounded-2xl text-center"
              >
                Explore Matches →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-stylish-primary w-full sm:w-auto px-8 py-4 font-bold text-base rounded-2xl text-center flex items-center justify-center gap-2"
                >
                  <span>Register Free Profile</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/browse"
                  className="w-full sm:w-auto px-8 py-4 glass-dark hover:bg-white/15 text-white font-bold text-base rounded-2xl border border-white/25 hover:-translate-y-0.5 transition-all text-center"
                >
                  Browse Matches as Guest
                </Link>
              </>
            )}
          </div>

          {/* Quick Search Badges */}
          <div className="pt-8 flex flex-wrap justify-center items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Popular Searches:</span>
            {["IIT & IIM Graduates", "USA & Canada NRIs", "Doctors (MBBS/MD)", "CA & Finance", "Delhi & Mumbai"].map((tag) => (
              <Link
                key={tag}
                to="/browse"
                className="px-3.5 py-1.5 glass-dark hover:border-gold/50 rounded-xl text-slate-200 transition-all text-[11px]"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Statistics Bar ── */}
      <section className="glass-panel border-y border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-4 hover-float">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-navy">
                {s.value}
              </div>
              <div className="text-muted text-xs sm:text-sm font-semibold uppercase tracking-wider mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by Preferences Quick Grid ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">
            Search Precision
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mt-1.5 mb-3">
            Search by What Matters to You
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Detailed criteria ensuring cultural compatibility, family harmony, and professional alignment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Mother Tongue & Caste",
              icon: "🗣️",
              desc: "Filter by Hindi, Gujarati, Marathi, Tamil, Telugu, Bengali, Punjabi, and exact caste/community.",
            },
            {
              title: "NRI & Global Locations",
              icon: "🌍",
              desc: "Search verified Indian singles in USA (Silicon Valley, NY), Canada, UK, UAE, and Singapore.",
            },
            {
              title: "Top Colleges & Universities",
              icon: "🎓",
              desc: "Match with alumni from IITs, IIMs, BITS, AIIMS, Stanford, Cambridge, Columbia, and SRCC.",
            },
            {
              title: "City & Native State",
              icon: "📍",
              desc: "Find matches living in Mumbai, Delhi NCR, Bengaluru, Hyderabad, Pune, or your home state.",
            },
            {
              title: "Verified Income & Career",
              icon: "💼",
              desc: "Profiles with authenticated professional backgrounds: Tech Leads, Doctors, CAs, Civil Servants.",
            },
            {
              title: "Family Values & Lifestyle",
              icon: "🏡",
              desc: "Understand family backgrounds, joint vs. nuclear living preferences, and vegetarian/diet habits.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass-card p-7 rounded-3xl flex flex-col justify-between card-hover-effect"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-border flex items-center justify-center text-2xl mb-4 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="font-serif font-bold text-xl text-navy mb-2">{item.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60">
                <Link
                  to="/browse"
                  className="text-xs font-bold text-royal hover:text-royal-dark inline-flex items-center gap-1.5 group"
                >
                  <span>Explore Profiles</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-navy-dark text-white py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">
              Trust & Security
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1.5 mb-3">
              Why Executive Families Trust Matrimony
            </h2>
            <p className="text-slate-400 text-sm">
              We provide the highest level of privacy, verified identity checks, and dedicated matchmaking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-dark p-6 rounded-3xl border border-slate-700/60 shadow-lg hover:border-gold/40 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-serif font-bold text-lg text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">
            Success Stories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mt-1.5 mb-3">
            Real Couples Who Found Their Match
          </h2>
          <p className="text-muted text-sm">
            Read inspiring stories from verified members who started their journey here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.names}
              className="glass-card p-7 rounded-3xl flex flex-col justify-between card-hover-effect"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={t.photo}
                    alt={t.names}
                    className="w-12 h-12 rounded-full object-cover border border-border shadow-sm"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-base text-navy">{t.names}</h4>
                    <p className="text-[11px] text-muted">{t.location}</p>
                    <p className="text-[10px] text-royal font-bold">{t.college}</p>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border/50 text-gold text-xs font-semibold">
                ★★★★★ Verified Couple
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA Banner ── */}
      {!user && (
        <section className="bg-gradient-to-r from-navy via-navy-light to-navy text-white py-20 px-4 text-center border-t border-slate-800">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
              Ready to Begin Your Matrimonial Journey?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              Create your verified profile in less than 2 minutes. Free registration with full control over privacy and contact visibility.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="btn-stylish-primary inline-flex items-center gap-2 px-9 py-4 font-bold text-base rounded-2xl"
              >
                <span>Create Your Profile Today</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
