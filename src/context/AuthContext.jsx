// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureUserProfileInStore, syncDataFromSupabase } from "../lib/matchService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const trimmedEmail = email?.trim().toLowerCase();

    // 1. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (!error && data?.user) {
        setUser(data.user);
        localStorage.setItem("matrimony_active_user", JSON.stringify(data.user));
        ensureUserProfileInStore(data.user);
        // Sync all cross-device data (interests, messages, notifications) from Supabase
        syncDataFromSupabase(data.user.id).catch(() => {});
        return data.user;
      }
      if (error && !error.message?.toLowerCase().includes("network") && !error.message?.toLowerCase().includes("fetch")) {
        // If Supabase returned explicit invalid credentials, throw or check local fallback
      }
    } catch {
      // network/sandbox fallback
    }

    // 2. Check locally registered custom profiles
    try {
      const local = JSON.parse(localStorage.getItem("matrimony_custom_profiles") || "[]");
      const found = local.find((p) => p.email?.toLowerCase() === trimmedEmail);
      if (found) {
        if (found.password && found.password !== password) {
          throw new Error("Invalid password. Please check your credentials.");
        }
        const fallbackUser = {
          id: String(found.userId || found.id),
          email: found.email,
          user_metadata: {
            full_name: found.name,
            first_name: found.name?.split(" ")[0] || found.name,
            last_name: found.name?.split(" ").slice(1).join(" ") || "",
            gender: found.gender || "Female",
            age: found.age || 26,
            mother_tongue: found.motherTongue || "Hindi",
            caste: found.caste || "",
            religion: found.religion || "Hindu",
            city: found.location?.city || "Mumbai",
            state: found.location?.state || "Maharashtra",
            college: found.college || "University",
            education: found.education || "Graduate",
            occupation: found.occupation || "Executive",
            income: found.income || "",
            nri: Boolean(found.nri),
            photo: found.photo,
          },
        };
        setUser(fallbackUser);
        localStorage.setItem("matrimony_active_user", JSON.stringify(fallbackUser));
        ensureUserProfileInStore(fallbackUser);
        return fallbackUser;
      }
    } catch (e) {
      if (e.message?.includes("Invalid password")) throw e;
    }

    throw new Error("Invalid email or password. Please verify your credentials or register a new profile.");
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem("matrimony_active_user");
    setUser(null);
  };

  const switchUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem("matrimony_active_user", JSON.stringify(newUser));
    ensureUserProfileInStore(newUser);
    window.dispatchEvent(new Event("matrimony_data_updated"));
  };

  const updateProfile = async (metadata) => {
    let updatedUser = null;
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });
      if (!error && data?.user) {
        updatedUser = data.user;
      }
    } catch {
      // fallback
    }

    if (!updatedUser && user) {
      updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...metadata,
        },
      };
    }

    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem("matrimony_active_user", JSON.stringify(updatedUser));
      ensureUserProfileInStore(updatedUser);
      window.dispatchEvent(new Event("matrimony_data_updated"));
    }

    return updatedUser;
  };

  // Load session on mount and listen for changes
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem("matrimony_active_user", JSON.stringify(session.user));
          ensureUserProfileInStore(session.user);
          // Sync cross-device data on session restore
          syncDataFromSupabase(session.user.id).catch(() => {});
        } else {
          const stored = localStorage.getItem("matrimony_active_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            ensureUserProfileInStore(parsed);
          }
        }
      } catch {
        const stored = localStorage.getItem("matrimony_active_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          ensureUserProfileInStore(parsed);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("matrimony_active_user", JSON.stringify(session.user));
        ensureUserProfileInStore(session.user);
        // Sync data whenever auth state changes (e.g. login on new device)
        syncDataFromSupabase(session.user.id).catch(() => {});
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
