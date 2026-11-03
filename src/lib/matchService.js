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
    status: "pending", // 'pending' | 'accepted' | 'rejected'
    createdAt: new Date().toISOString(),
  };

  all.unshift(newInterest);
  localStorage.setItem(INTERESTS_KEY, JSON.stringify(all));

  // Notify the recipient that they received an interest
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
      from_user_id: fromUserId,
      to_profile_id: toUserId,
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

  // Send notification based on status change
  if (interest) {
    if (status === "accepted") {
      // Notify the person who originally sent the interest
      addNotification(interest.fromUserId, {
        type: "interest_accepted",
        title: "Interest Accepted! 🎉",
        body: `${interest.toUserName} accepted your interest request! You can now chat.`,
        from: interest.toUserId,
        link: "/messages",
      });
    } else if (status === "rejected") {
      // Optionally notify sender of decline (soft notification)
      addNotification(interest.fromUserId, {
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

    // Check if we have an enriched custom profile
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

  // Derive partner ID from conversationId pattern: conv_<id1>_<id2>
  // conv_ prefix is 5 chars, then two IDs separated by _
  try {
    const withoutPrefix = conversationId.replace(/^conv_/, "");
    // Find which part is NOT the sender
    // IDs can contain underscores themselves, so we use the interests store to find the partner
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
      conversation_id: conversationId,
      sender_id: senderId,
      content: text.trim(),
    });
  } catch {
    // fallback
  }

  notifyChange();
  return newMsg;
};

