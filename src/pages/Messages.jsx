// src/pages/Messages.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAcceptedMatches,
  getMessagesForConversation,
  sendChatMessage,
} from "../lib/matchService";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetWithId = searchParams.get("with");

  const [matches, setMatches] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(targetWithId || null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // Load matches
  const loadMatchesAndMessages = () => {
    if (!user) return;
    const acceptedList = getAcceptedMatches(user.id);
    setMatches(acceptedList);

    // Determine which match is active
    let activeId = activePartnerId;
    if (targetWithId && acceptedList.some((m) => String(m.partnerId) === String(targetWithId))) {
      activeId = String(targetWithId);
    } else if (!activeId || !acceptedList.some((m) => String(m.partnerId) === String(activeId))) {
      activeId = acceptedList[0]?.partnerId || null;
    }
    setActivePartnerId(activeId);

    if (activeId) {
      const activeMatch = acceptedList.find((m) => String(m.partnerId) === String(activeId));
      if (activeMatch) {
        const msgs = getMessagesForConversation(activeMatch.conversationId);
        setMessages(msgs);
      }
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadMatchesAndMessages();

    const handleSync = () => loadMatchesAndMessages();
    window.addEventListener("matrimony_data_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("matrimony_data_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [user, targetWithId]);

  // When active partner changes, fetch conversation messages
  useEffect(() => {
    if (activePartnerId && user) {
      const activeMatch = matches.find((m) => String(m.partnerId) === String(activePartnerId));
      if (activeMatch) {
        const msgs = getMessagesForConversation(activeMatch.conversationId);
        setMessages(msgs);
      }
    }
  }, [activePartnerId, matches]);

  // Scroll to bottom on message change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activePartnerId]);

  const activeMatch = matches.find((m) => String(m.partnerId) === String(activePartnerId)) || matches[0];

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMsg.trim() || sending || !activeMatch) return;

    setSending(true);
    const senderName = user.user_metadata?.full_name || user.email?.split("@")[0] || "You";

    await sendChatMessage(
      activeMatch.conversationId,
      user.id,
      senderName,
      newMsg.trim()
    );

    setNewMsg("");
    setSending(false);
    loadMatchesAndMessages();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream py-6 px-4 sm:px-6 lg:px-8 text-text">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy">Messages</h1>
            <p className="text-muted text-xs sm:text-sm mt-0.5">
              Private, verified conversations with your accepted matches
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
            ● 100% Private Match Chat
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-border/80 p-12 text-center max-w-lg mx-auto shadow-heavy">
            <div className="w-16 h-16 bg-blue-50 text-royal rounded-3xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-sm">
              💬
            </div>
            <h2 className="font-serif text-2xl font-bold text-navy mb-2">
              No Accepted Matches Yet
            </h2>
            <p className="text-muted text-xs sm:text-sm leading-relaxed mb-6">
              You can chat with members once an interest request has been accepted between both profiles.
              Send an interest to someone on Browse Profiles, or accept incoming requests on your Dashboard!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/browse"
                className="btn-stylish-primary px-6 py-3 text-xs font-bold rounded-xl shadow-royal"
              >
                Browse Profiles
              </Link>
              <Link
                to="/dashboard"
                className="btn-stylish-secondary px-6 py-3 text-xs font-bold rounded-xl"
              >
                Check Received Interests
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="flex glass-panel rounded-3xl border border-border/80 overflow-hidden shadow-heavy"
            style={{ height: "76vh" }}
          >
            {/* Sidebar */}
            <aside className="w-72 sm:w-80 flex-shrink-0 border-r border-border flex flex-col bg-surface">
              <div className="p-4 border-b border-border bg-slate-50/60">
                <h2 className="font-serif font-bold text-navy text-base">Matched Connections</h2>
                <p className="text-[11px] text-muted">{matches.length} active conversation{matches.length > 1 ? "s" : ""}</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {matches.map((m) => {
                  const isSelected = String(m.partnerId) === String(activePartnerId);
                  const convMsgs = getMessagesForConversation(m.conversationId);
                  const lastMsg = convMsgs[convMsgs.length - 1];

                  return (
                    <button
                      key={m.partnerId}
                      onClick={() => setActivePartnerId(m.partnerId)}
                      className={`w-full text-left p-4 flex items-center gap-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 border-l-4 border-l-royal shadow-inner"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <img
                        src={
                          m.partnerPhoto ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=400&h=400"
                        }
                        alt={m.partnerName}
                        className="w-11 h-11 rounded-2xl object-cover border border-border flex-shrink-0 shadow-sm"
                      />
                      <div className="overflow-hidden flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-bold text-navy text-xs sm:text-sm truncate">
                            {m.partnerName}
                          </span>
                          {lastMsg && (
                            <span className="text-[10px] text-muted flex-shrink-0 ml-1">
                              {lastMsg.time}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted truncate">
                          {lastMsg ? lastMsg.text : `${m.partnerOccupation || "Match"} • 📍 ${m.partnerCity}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Chat Window */}
            <section className="flex-1 flex flex-col min-w-0 bg-surface">
              {/* Header */}
              {activeMatch ? (
                <>
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          activeMatch.partnerPhoto ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=400&h=400"
                        }
                        alt={activeMatch.partnerName}
                        className="w-10 h-10 rounded-2xl object-cover border border-border flex-shrink-0 shadow-sm"
                      />
                      <div>
                        <h3 className="font-serif font-bold text-navy text-base sm:text-lg leading-tight flex items-center gap-2">
                          <span>{activeMatch.partnerName}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            Accepted Match
                          </span>
                        </h3>
                        <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          <span className="truncate">
                            {activeMatch.partnerOccupation} • 📍 {activeMatch.partnerCity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-muted text-xs">
                        <div className="text-3xl mb-2">🎉</div>
                        <p className="font-semibold text-navy text-sm mb-1">
                          You and {activeMatch.partnerName} are matched!
                        </p>
                        <p className="text-muted text-xs">
                          Break the ice and start your private conversation below.
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isSelf = String(m.senderId) === String(user.id);
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                                isSelf
                                  ? "bg-royal text-white rounded-br-sm"
                                  : "bg-surface text-navy border border-border rounded-bl-sm"
                              }`}
                            >
                              <p className="break-words">{m.text}</p>
                              <span
                                className={`text-[10px] block mt-1 text-right font-medium ${
                                  isSelf ? "text-blue-100" : "text-muted"
                                }`}
                              >
                                {m.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Send a message to ${activeMatch.partnerName}...`}
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        className="flex-1 px-4 py-3 bg-cream border border-border rounded-xl text-xs sm:text-sm text-navy focus:outline-none focus:border-royal transition-all placeholder-muted/60"
                      />
                      <button
                        type="submit"
                        disabled={!newMsg.trim() || sending}
                        className="btn-stylish-primary px-6 py-3 font-bold text-xs sm:text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-royal flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Send</span>
                        <span>↗</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-muted text-xs">
                  Select a matched profile to start chatting.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
