// src/lib/matchService.js
import { supabase } from "./supabaseClient";
import { addNotification } from "./notificationService";

const PROFILES_KEY = "matrimony_custom_profiles";
const INTERESTS_KEY = "matrimony_interests";
const MESSAGES_KEY = "matrimony_messages_store";

// Notification broadcast for cross-component and cross-tab real-time reactivity
export const notifyChange = () => {
  window.dispatchEvent(new Event("matrimony_data_updated"));
};

// ─── CROSS-DEVICE SYNC ───
/**
 * Pull all profiles, interests and messages from Supabase
 * and merge them into localStorage so the data is available on any device.
 */
export const syncDataFromSupabase = async (userId = null) => {
  const uid = userId ? String(userId) : null;

  // ── 1. Sync ALL profiles (so Browse shows everyone on all devices) ──
  try {
    const { data: remoteProfiles, error: profErr } = await supabase
      .from("profiles")
      .select("*");

    if (!profErr && Array.isArray(remoteProfiles) && remoteProfiles.length > 0) {
      const local = getCustomProfiles();

      for (const r of remoteProfiles) {
        const remoteId = String(r.user_id || r.id);
        const idx = local.findIndex(
          (p) =>
            String(p.id) === remoteId ||
            String(p.userId) === remoteId ||
            (r.email && p.email && p.email.toLowerCase() === r.email.toLowerCase())
        );
        const mapped = {
          id: remoteId,
          userId: remoteId,
          email: r.email || "",
          name: r.name || "",
          age: r.age || 25,
          gender: r.gender || "Female",
          height: r.height || "5'6\"",
          motherTongue: r.mother_tongue || "Hindi",
          caste: r.caste || "",
          religion: r.religion || "Hindu",
          nri: r.nri || false,
          location: {
            city: r.city || "Mumbai",
            state: r.state || "Maharashtra",
            country: r.nri ? "Abroad" : "India",
          },
          college: r.college || "",
          education: r.education || "",
          occupation: r.occupation || "",
          income: r.income || "",
          photo: r.photo || null,
          family: {
            father: r.father || "",
            mother: r.mother || "",
            siblings: r.siblings || "",
          },
          preferences: {
            religion: [r.pref_religion || "Any"],
            ageRange: [r.pref_age_min || 22, r.pref_age_max || 35],
          },
          about: r.about || "",
        };
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...mapped };
        } else {
          local.unshift(mapped);
        }
      }
      localStorage.setItem(PROFILES_KEY, JSON.stringify(local));
      notifyChange();
    }
  } catch (err) {
    console.warn("Profiles sync error:", err);
  }

  if (!uid) return;

  // ── 2. Sync interests ──
  try {
    const { data: remoteInterests, error: intErr } = await supabase
      .from("interests")
      .select("*")
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`);

    if (!intErr && Array.isArray(remoteInterests) && remoteInterests.length > 0) {
      const local = (() => {
        try { return JSON.parse(localStorage.getItem(INTERESTS_KEY) || "[]"); } catch { return []; }
      })();

      const mapped = remoteInterests.map((r) => ({
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id || r.to_profile_id,
        fromUserName: r.from_user_name || "",
        toUserName: r.to_user_name || "",
        fromUserPhoto: r.from_user_photo || null,
        toUserPhoto: r.to_user_photo || null,
        fromUserCity: r.from_user_city || "",
        toUserCity: r.to_user_city || "",
        fromUserOccupation: r.from_user_occupation || "",
        toUserOccupation: r.to_user_occupation || "",
        status: r.status || "pending",
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      const merged = [...local];
      for (const remote of mapped) {
        const idx = merged.findIndex((l) => String(l.id) === String(remote.id));
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...remote };
        } else {
          merged.push(remote);
        }
      }
      localStorage.setItem(INTERESTS_KEY, JSON.stringify(merged));
    }
  } catch {
    // Supabase not available — keep local data as-is
  }

  // ── 3. Sync messages ──
  try {
    const allInterests = (() => {
      try { return JSON.parse(localStorage.getItem(INTERESTS_KEY) || "[]"); } catch { return []; }
    })();
    const acceptedConvIds = allInterests
      .filter(
        (i) =>
          i.status === "accepted" &&
          (String(i.fromUserId) === uid || String(i.toUserId) === uid)
      )
      .map((i) => {
        const sorted = [String(i.fromUserId), String(i.toUserId)].sort();
        return `conv_${sorted[0]}_${sorted[1]}`;
      });

    if (acceptedConvIds.length > 0) {
      const { data: remoteMessages, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", acceptedConvIds);

      if (!msgErr && Array.isArray(remoteMessages) && remoteMessages.length > 0) {
        const localMsgs = (() => {
          try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]"); } catch { return []; }
        })();

        const mappedMsgs = remoteMessages.map((r) => ({
          id: r.id,
          conversationId: r.conversation_id,
          senderId: String(r.sender_id),
          senderName: r.sender_name || "Member",
          text: r.content || r.text || "",
          createdAt: r.created_at,
          time: r.created_at
            ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
        }));

        const mergedMsgs = [...localMsgs];
        for (const remote of mappedMsgs) {
          const exists = mergedMsgs.some((l) => String(l.id) === String(remote.id));
          if (!exists) mergedMsgs.push(remote);
        }
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(mergedMsgs));
      }
    }
  } catch {
    // Supabase not available — keep local data as-is
  }

  notifyChange();
};

// ─── SAVE PROFILE TO SUPABASE ───
/**
 * Upsert a profile to the Supabase `profiles` table so it's visible on all devices.
 */
export const saveProfileToSupabase = async (profile) => {
  if (!profile) return;
  try {
    const { error } = await supabase.from("profiles").upsert({
      user_id: String(profile.userId || profile.id),
      email: profile.email || "",
      name: profile.name || "",
      age: profile.age || 25,
      gender: profile.gender || "Female",
      height: profile.height || "",
      mother_tongue: profile.motherTongue || "Hindi",
      caste: profile.caste || "",
      religion: profile.religion || "Hindu",
      nri: profile.nri || false,
      city: profile.location?.city || "Mumbai",
      state: profile.location?.state || "Maharashtra",
      college: profile.college || "",
      education: profile.education || "",
      occupation: profile.occupation || "",
      income: profile.income || "",
      photo: profile.photo || null,
      father: profile.family?.father || "",
      mother: profile.family?.mother || "",
      siblings: profile.family?.siblings || "",
      pref_religion: profile.preferences?.religion?.[0] || "Any",
      pref_age_min: profile.preferences?.ageRange?.[0] || 22,
      pref_age_max: profile.preferences?.ageRange?.[1] || 35,
      about: profile.about || "",
    }, { onConflict: "user_id" });

    if (error) {
      console.warn("saveProfileToSupabase warning:", error.message);
    }
  } catch (err) {
    console.warn("saveProfileToSupabase exception:", err);
  }
};

// ─── 1. PROFILES ───
export const getCustomProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    // Exclude any legacy mock dummy profiles
    return list.filter((p) => {
      if (!p) return false;
      const isNumericId = typeof p.id === "number" && p.id <= 50;
      return !p.isMock && !isNumericId;
    });
  } catch {
    return [];
  }
};

export const saveCustomProfile = (profile) => {
  try {
    const list = getCustomProfiles();
    const existingIndex = list.findIndex(
      (p) =>
        String(p.id) === String(profile.id) ||
        String(p.userId) === String(profile.userId) ||
        (profile.email && p.email && p.email.toLowerCase().trim() === profile.email.toLowerCase().trim())
    );
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...profile };
    } else {
      list.unshift(profile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
    notifyChange();
    // Also persist to Supabase for cross-device visibility
    saveProfileToSupabase(profile);
  } catch (e) {
    console.error("saveCustomProfile error:", e);
  }
};

export const ensureUserProfileInStore = (user) => {
  if (!user) return null;
  const list = getCustomProfiles();
  const userId = String(user.id);
  const userEmail = user.email ? user.email.toLowerCase().trim() : "";

  const existingIdx = list.findIndex(
    (p) =>
      String(p.id) === userId ||
      String(p.userId) === userId ||
      (userEmail && p.email && p.email.toLowerCase().trim() === userEmail)
  );

  const meta = user.user_metadata || {};
  const name =
    meta.full_name ||
    `${meta.first_name || ""} ${meta.last_name || ""}`.trim() ||
    user.email?.split("@")[0] ||
    "Member";

  const profileData = {
    id: userId,
    userId: userId,
    email: user.email || (existingIdx >= 0 ? list[existingIdx].email : ""),
    name: name,
    age: Number(meta.age) || (existingIdx >= 0 ? list[existingIdx].age : 26),
    gender: meta.gender || (existingIdx >= 0 ? list[existingIdx].gender : "Male"),
    height: meta.height || (existingIdx >= 0 ? list[existingIdx].height : (meta.gender === "Female" ? "5'6\"" : "5'11\"")),
    motherTongue: meta.mother_tongue || (existingIdx >= 0 ? list[existingIdx].motherTongue : "Hindi"),
    caste: meta.caste || (existingIdx >= 0 ? list[existingIdx].caste : ""),
    religion: meta.religion || (existingIdx >= 0 ? list[existingIdx].religion : "Hindu"),
    nri: meta.nri ?? (existingIdx >= 0 ? list[existingIdx].nri : false),
    location: {
      city: meta.city || (existingIdx >= 0 ? list[existingIdx].location?.city : "Mumbai"),
      state: meta.state || (existingIdx >= 0 ? list[existingIdx].location?.state : "Maharashtra"),
      country: meta.nri ? "Abroad" : "India",
    },
    college: meta.college || (existingIdx >= 0 ? list[existingIdx].college : "Premier University"),
    education: meta.education || (existingIdx >= 0 ? list[existingIdx].education : "Graduate Degree"),
    occupation: meta.occupation || (existingIdx >= 0 ? list[existingIdx].occupation : "Executive"),
    income: meta.income || (existingIdx >= 0 ? list[existingIdx].income : "Competitive"),
    photo:
      meta.photo ||
      (existingIdx >= 0 ? list[existingIdx].photo : null) ||
      (meta.gender === "Female"
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=600&h=600"
        : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=600&h=600"),
    family: {
      father: meta.father || (existingIdx >= 0 ? list[existingIdx].family?.father : ""),
      mother: meta.mother || (existingIdx >= 0 ? list[existingIdx].family?.mother : ""),
      siblings: meta.siblings || (existingIdx >= 0 ? list[existingIdx].family?.siblings : ""),
    },
    preferences: {
      religion: [meta.pref_religion || "Any"],
      ageRange: [Number(meta.pref_age_min) || 22, Number(meta.pref_age_max) || 35],
    },
    about: meta.about || "",
  };

  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...profileData };
  } else {
    list.unshift(profileData);
  }

  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  notifyChange();
  // Sync to Supabase so this profile is visible on all devices
  saveProfileToSupabase(profileData);
  return profileData;
};

// ─── 2. INTERESTS ───
export const getAllInterests = () => {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getInterestsForUser = (userId) => {
  if (!userId) return { sent: [], received: [] };
  const all = getAllInterests();
  const sent = all.filter((i) => String(i.fromUserId) === String(userId));
  const received = all.filter((i) => String(i.toUserId) === String(userId));
  return { sent, received };
};

export const sendInterest = async (fromUser, toProfile) => {
  if (!fromUser || !toProfile) return null;
  const fromUserId = String(fromUser.id);
  const toUserId = String(toProfile.userId || toProfile.id);

  const all = getAllInterests();
  // Check if interest already exists between these users
  const existing = all.find(
    (i) =>
      String(i.fromUserId) === fromUserId &&
      String(i.toUserId) === toUserId
  );
  if (existing) return existing;

  const meta = fromUser.user_metadata || {};
  const fromName = meta.full_name || fromUser.email?.split("@")[0] || "Verified Member";
  const fromPhoto =
    meta.photo ||
    (meta.gender === "Male"
      ? "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=600&h=600"
      : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=600&h=600");

  const newInterest = {
    id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    fromUserId,
    fromUserName: fromName,
    fromUserPhoto: fromPhoto,
    fromUserAge: meta.age || 26,
    fromUserCity: meta.city || "Mumbai",
    fromUserOccupation: meta.occupation || "Professional",
    fromUserCollege: meta.college || "",
    toUserId,
    toUserName: toProfile.name || "Member",
    toUserPhoto: toProfile.photo,
    toUserAge: toProfile.age,
    toUserCity: toProfile.location?.city || toProfile.city || "India",
    toUserOccupation: toProfile.occupation || "Executive",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  all.unshift(newInterest);
  localStorage.setItem(INTERESTS_KEY, JSON.stringify(all));

  // Notify the recipient
  addNotification(toUserId, {
    type: "interest_received",
    title: "New Interest Request 💌",
    body: `${fromName} sent you an interest request!`,
    from: fromUserId,
    link: "/dashboard",
  });

  // Also record in sent set for quick lookup
  try {
    const sentSet = JSON.parse(localStorage.getItem("matrimony_sent_interests") || "[]");
    if (!sentSet.includes(toUserId)) {
      sentSet.push(toUserId);
      localStorage.setItem("matrimony_sent_interests", JSON.stringify(sentSet));
    }
  } catch {
    // ignore
  }

  // Sync with Supabase if accessible
  try {
    await supabase.from("interests").insert({
      id: newInterest.id,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      to_profile_id: toUserId,
      from_user_name: fromName,
      to_user_name: toProfile.name || "Member",
      from_user_photo: fromPhoto,
      to_user_photo: toProfile.photo || null,
      from_user_city: meta.city || "Mumbai",
      to_user_city: toProfile.location?.city || toProfile.city || "India",
      from_user_occupation: meta.occupation || "Professional",
      to_user_occupation: toProfile.occupation || "Executive",
      status: "pending",
    });
  } catch {
    // fallback handled
  }

  notifyChange();
  return newInterest;
};

export const updateInterestStatus = async (interestId, status) => {
  const all = getAllInterests();
  const interest = all.find((i) => String(i.id) === String(interestId));

  const updated = all.map((i) => {
    if (String(i.id) === String(interestId)) {
      return {
        ...i,
        status,
        updatedAt: new Date().toISOString(),
      };
    }
    return i;
  });

  localStorage.setItem(INTERESTS_KEY, JSON.stringify(updated));

  if (interest) {
    const recipientId = status === "accepted" || status === "rejected"
      ? interest.fromUserId
      : interest.toUserId;

    if (status === "accepted") {
      addNotification(recipientId, {
        type: "interest_accepted",
        title: "Interest Accepted 🎉",
        body: `${interest.toUserName} accepted your interest request!`,
        from: interest.toUserId,
        link: "/dashboard",
      });
    } else if (status === "rejected") {
      addNotification(recipientId, {
        type: "interest_declined",
        title: "Interest Update",
        body: `${interest.toUserName} has reviewed your interest request.`,
        from: interest.toUserId,
        link: "/dashboard",
      });
    }
  }

  try {
    await supabase.from("interests").update({ status }).eq("id", interestId);
  } catch {
    // fallback
  }

  notifyChange();
};

export const getAcceptedMatches = (userId) => {
  if (!userId) return [];
  const all = getAllInterests();
  const accepted = all.filter(
    (i) =>
      i.status === "accepted" &&
      (String(i.fromUserId) === String(userId) || String(i.toUserId) === String(userId))
  );

  const profiles = getCustomProfiles();

  return accepted.map((match) => {
    const isOutgoing = String(match.fromUserId) === String(userId);
    const partnerId = isOutgoing ? match.toUserId : match.fromUserId;
    const partnerName = isOutgoing ? match.toUserName : match.fromUserName;
    const partnerPhoto = isOutgoing ? match.toUserPhoto : match.fromUserPhoto;
    const partnerCity = isOutgoing ? match.toUserCity : match.fromUserCity;
    const partnerOccupation = isOutgoing ? match.toUserOccupation : match.fromUserOccupation;

    const fullProfile = profiles.find(
      (p) => String(p.id) === String(partnerId) || String(p.userId) === String(partnerId)
    );

    const sortedIds = [String(userId), String(partnerId)].sort();
    const conversationId = `conv_${sortedIds[0]}_${sortedIds[1]}`;

    return {
      matchId: match.id,
      partnerId: String(partnerId),
      partnerName: fullProfile?.name || partnerName,
      partnerPhoto: fullProfile?.photo || partnerPhoto,
      partnerCity: fullProfile?.location?.city || partnerCity,
      partnerOccupation: fullProfile?.occupation || partnerOccupation,
      partnerCollege: fullProfile?.college || "",
      acceptedAt: match.updatedAt || match.createdAt,
      conversationId,
    };
  });
};

// ─── 3. MESSAGES ───
export const getAllMessages = () => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getMessagesForConversation = (conversationId) => {
  if (!conversationId) return [];
  const all = getAllMessages();
  return all.filter((m) => m.conversationId === conversationId);
};

export const sendChatMessage = async (conversationId, senderId, senderName, text) => {
  if (!conversationId || !senderId || !text?.trim()) return null;
  const all = getAllMessages();
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    conversationId,
    senderId: String(senderId),
    senderName: senderName || "You",
    text: text.trim(),
    createdAt: new Date().toISOString(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  all.push(newMsg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));

  // Notify partner
  try {
    const withoutPrefix = conversationId.replace(/^conv_/, "");
    const allInterests = getAllInterests();
    const relatedInterest = allInterests.find(
      (i) =>
        (String(i.fromUserId) === String(senderId) || String(i.toUserId) === String(senderId)) &&
        i.status === "accepted"
    );
    if (relatedInterest) {
      const partnerId =
        String(relatedInterest.fromUserId) === String(senderId)
          ? relatedInterest.toUserId
          : relatedInterest.fromUserId;

      const convCheck = (() => {
        const sorted = [String(senderId), String(partnerId)].sort();
        return `conv_${sorted[0]}_${sorted[1]}`;
      })();

      if (convCheck === conversationId) {
        const partnerName =
          String(relatedInterest.fromUserId) === String(senderId)
            ? relatedInterest.toUserName
            : relatedInterest.fromUserName;

        const preview = text.trim().length > 50
          ? text.trim().substring(0, 50) + "…"
          : text.trim();

        addNotification(partnerId, {
          type: "message_received",
          title: `New message from ${senderName || "Member"}`,
          body: preview,
          from: String(senderId),
          link: `/messages?with=${senderId}`,
        });
      }
    }
  } catch (e) {
    console.warn("Notification for message failed:", e);
  }

  try {
    await supabase.from("messages").insert({
      id: newMsg.id,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName || "Member",
      content: text.trim(),
    });
  } catch {
    // fallback
  }

  notifyChange();
  return newMsg;
};
