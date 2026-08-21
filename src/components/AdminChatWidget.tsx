"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { MessageSquare, X, Send, ChevronRight, CheckCheck, Minimize2, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { useGetMeQuery } from "@/lib/redux/features/authApi";
import { 
  useGetInternalTeamQuery, 
  useGetInternalMessagesQuery, 
  useSendInternalMessageMutation 
} from "@/lib/redux/features/chatApi";
import { useSocket } from "@/context/SocketContext";
import { useUnreadCounts } from "@/context/UnreadCountContext";
import { Loader2 } from "lucide-react";

export function AdminChatWidget() {
  const { socket, isConnected } = useSocket();
  const { totalInternalUnread, markInternalRead, refetchSummary } = useUnreadCounts();

  const { data: teamData, isLoading: isTeamLoading, refetch: refetchTeam } = useGetInternalTeamQuery(undefined, {
    pollingInterval: 4000,
  });
  const rawTeam = Array.isArray(teamData) ? teamData : (teamData?.data || []);

  const { data: meData } = useGetMeQuery(undefined);
  const loggedInUser = useSelector((state: any) => state.auth.user);
  const userMe = meData?.data || loggedInUser || {};
  const currentUserId = userMe.id || userMe._id || loggedInUser?.id || loggedInUser?._id || "default";

  const [isOpen, setIsOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [inputText, setInputText] = useState("");
  const [liveOnlineStatus, setLiveOnlineStatus] = useState<Record<string, string>>({});
  const [liveMessages, setLiveMessages] = useState<any[]>([]);

  const currentAdminId = selectedAdmin?.userId || selectedAdmin?.adminId || selectedAdmin?.id || selectedAdmin?._id;
  const { data: messagesData, isFetching, refetch: refetchMessages } = useGetInternalMessagesQuery(currentAdminId, {
    skip: !selectedAdmin,
    pollingInterval: selectedAdmin ? 3000 : 0,
  });

  const [sendMessage] = useSendInternalMessageMutation();
  const [lastMessagesMap, setLastMessagesMap] = useState<Record<string, { text: string; time: string; timestamp: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync initial REST messages into local state when switching admin or fetching
  useEffect(() => {
    const raw = Array.isArray(messagesData) ? messagesData : (messagesData?.data || []);
    if (!raw || raw.length === 0) {
      setLiveMessages((prev) => prev.filter(m => String(m.id).startsWith("temp_")));
      return;
    }
    setLiveMessages((prev) => {
      // Keep optimistic messages that haven't been confirmed yet
      const pendingOptimistic = prev.filter((m) => 
        String(m.id).startsWith("temp_") && 
        !raw.some((r: any) => 
          (r.text === m.text || r.content === m.text) && 
          r.senderId === m.senderId
        )
      );
      return [...raw, ...pendingOptimistic];
    });
  }, [messagesData, currentAdminId]);

  // When selecting an admin, mark conversation as read
  useEffect(() => {
    if (selectedAdmin && currentAdminId) {
      markInternalRead(currentAdminId);
      refetchTeam();
    }
  }, [selectedAdmin, currentAdminId, markInternalRead, refetchTeam]);

  const updateLastMessageForAdmin = (adminIds: (string | undefined)[], text: string, timeStr?: string, createdAt?: string) => {
    const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();
    const time = timeStr || new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLastMessagesMap((prev) => {
      const next = { ...prev };
      adminIds.forEach((id) => {
        if (id) {
          const existing = next[id];
          if (!existing || existing.timestamp <= timestamp) {
            next[id] = { text, time, timestamp };
          }
        }
      });
      return next;
    });
  };

  // Pre-seed and sync lastMessagesMap from REST team list
  useEffect(() => {
    if (!rawTeam || !Array.isArray(rawTeam)) return;

    rawTeam.forEach((member: any) => {
      const u = member.user || member;
      const keys = [member.userId, u.userId, u.id, u._id, member.adminId, member.id, member._id].filter(Boolean);
      const rawMsg = member.lastMessage || member.latestMessage || member.last_message || member.recentMessage || u.lastMessage || u.latestMessage;

      if (rawMsg) {
        let text = "";
        let time = "";
        let timestamp = 0;

        if (typeof rawMsg === "string") {
          text = rawMsg;
        } else if (typeof rawMsg === "object") {
          text = rawMsg.text || rawMsg.content || rawMsg.message || rawMsg.body || "";
          const createdAt = rawMsg.createdAt || rawMsg.created_at || rawMsg.timestamp || rawMsg.time;
          if (createdAt) {
            timestamp = new Date(createdAt).getTime();
            try {
              time = new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            } catch (e) {}
          }
        }

        if (text) {
          updateLastMessageForAdmin(keys, text, time, timestamp ? new Date(timestamp).toISOString() : undefined);
        }
      }
    });
  }, [rawTeam]);

  // Announce presence and request current online users on mount / socket connect
  useEffect(() => {
    if (!socket || !isConnected) return;

    const payload = {
      userId: currentUserId,
      adminId: currentUserId,
      status: "online",
    };

    socket.emit("presence:join", payload);
    socket.emit("user:join", payload);
    socket.emit("admin:join", payload);
    socket.emit("presence:get_online");
    socket.emit("get_online_users");
  }, [socket, isConnected, currentUserId]);

  // Listen to WebSocket events: internal:new_message, messages_read & presence events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      console.log("[WebSocket] internal:new_message received:", data);

      const msg = data.message || data;
      const sender = data.senderId || msg.senderId || msg.sender || msg.sender_id;
      const receiver = data.receiverId || msg.receiverId || msg.receiver || msg.receiver_id;
      const text = msg.text || msg.content || msg.message || msg.body || (typeof msg === "string" ? msg : "");
      const createdAt = msg.createdAt || msg.created_at || msg.timestamp;

      updateLastMessageForAdmin([sender, receiver], text, undefined, createdAt);

      // Refresh team list & unread count badge in real time
      refetchTeam();
      refetchSummary();

      // If this conversation is currently open, append or replace optimistic message
      if (currentAdminId && (sender === currentAdminId || receiver === currentAdminId)) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;

          // Replace optimistic message if one matches
          const tempIdx = prev.findIndex((m) => 
            String(m.id).startsWith("temp_") && 
            m.senderId === sender && 
            (m.text === text || m.content === text)
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = msg;
            return next;
          }

          return [...prev, msg];
        });
        markInternalRead(currentAdminId);
      }
    };

    const handleMessagesRead = (data: any) => {
      console.log("[WebSocket] internal:messages_read received:", data);
      setLiveMessages((prev) =>
        prev.map((m) => {
          if (m.senderId === currentUserId) {
            return { ...m, isRead: true, read: true, status: "read" };
          }
          return m;
        })
      );
    };

    const handleStatusChange = (event: any) => {
      console.log("[WebSocket] user:status_change:", event);
      const targetId = typeof event === "string" ? event : (event.userId || event.adminId || event.id || event._id);
      const status = typeof event === "string" 
        ? "online" 
        : (event.status || (event.isOnline === false ? "offline" : "online")).toLowerCase();
      if (targetId) {
        setLiveOnlineStatus((prev) => ({
          ...prev,
          [targetId]: status,
        }));
      }
    };

    const handlePresenceList = (data: any) => {
      console.log("[WebSocket] presence list received:", data);
      const list = Array.isArray(data) ? data : (data?.users || data?.onlineUsers || data?.data || []);
      if (Array.isArray(list)) {
        setLiveOnlineStatus((prev) => {
          const next = { ...prev };
          list.forEach((item: any) => {
            const id = typeof item === "string" ? item : (item.userId || item.adminId || item.id || item._id);
            if (id) next[id] = "online";
          });
          return next;
        });
      }
    };

    const handleUserOnline = (data: any) => {
      const targetId = typeof data === "string" ? data : (data?.userId || data?.adminId || data?.id);
      if (targetId) {
        setLiveOnlineStatus((prev) => ({ ...prev, [targetId]: "online" }));
      }
    };

    const handleUserOffline = (data: any) => {
      const targetId = typeof data === "string" ? data : (data?.userId || data?.adminId || data?.id);
      if (targetId) {
        setLiveOnlineStatus((prev) => ({ ...prev, [targetId]: "offline" }));
      }
    };

    socket.on("internal:new_message", handleNewMessage);
    socket.on("chat:new_message", handleNewMessage);
    socket.on("internal:messages_read", handleMessagesRead);
    socket.on("chat:messages_read", handleMessagesRead);
    socket.on("user:status_change", handleStatusChange);
    socket.on("admin:status_change", handleStatusChange);
    socket.on("presence:status_change", handleStatusChange);
    socket.on("presence:list", handlePresenceList);
    socket.on("online_users", handlePresenceList);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);
    socket.on("admin:online", handleUserOnline);
    socket.on("admin:offline", handleUserOffline);

    return () => {
      socket.off("internal:new_message", handleNewMessage);
      socket.off("chat:new_message", handleNewMessage);
      socket.off("internal:messages_read", handleMessagesRead);
      socket.off("chat:messages_read", handleMessagesRead);
      socket.off("user:status_change", handleStatusChange);
      socket.off("admin:status_change", handleStatusChange);
      socket.off("presence:status_change", handleStatusChange);
      socket.off("presence:list", handlePresenceList);
      socket.off("online_users", handlePresenceList);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.off("admin:online", handleUserOnline);
      socket.off("admin:offline", handleUserOffline);
    };
  }, [socket, currentAdminId, currentUserId, markInternalRead, refetchTeam, refetchSummary]);

  const activeMessages = useMemo(() => {
    return liveMessages.map((msg: any) => {
      const isMe = msg.senderId === currentUserId;
      const isRead = Boolean(msg.isRead || msg.read || msg.is_read || msg.readAt || msg.status === "read" || msg.status === "READ");
      const time = msg.createdAt 
        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";
      return {
        ...msg,
        isMe,
        isRead,
        time
      };
    });
  }, [liveMessages, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedAdmin) return;
    
    const textToSend = inputText.trim();
    const recipientId = selectedAdmin.userId || selectedAdmin.adminId || selectedAdmin.id || selectedAdmin._id;
    setInputText("");

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Optimistic local message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: currentUserId,
      receiverId: recipientId,
      text: textToSend,
      createdAt: nowIso,
    };
    setLiveMessages((prev) => [...prev, optimisticMsg]);

    const allRecipientKeys = [
      recipientId,
      selectedAdmin.userId,
      selectedAdmin.adminId,
      selectedAdmin.id,
      selectedAdmin._id,
    ];
    updateLastMessageForAdmin(allRecipientKeys, textToSend, timeStr, nowIso);

    // Send via REST endpoint (backend saves to DB and broadcasts via WebSocket)
    try {
      const res = await sendMessage({ receiverId: recipientId, text: textToSend }).unwrap();
      if (res?.data || res?.id) {
        const savedMsg = res.data || res;
        setLiveMessages((prev) => prev.map((m) => m.id === tempId ? { ...savedMsg, text: savedMsg.text || textToSend } : m));
      }
      refetchTeam();
    } catch (err) {
      // Fallback: If REST fails, try socket emit
      if (socket && isConnected) {
        socket.emit("internal:send_message", {
          receiverId: recipientId,
          text: textToSend,
        });
      }
    }
  };

  return (
    <>
      {/* Floating Button with Live Badge */}
      {!isOpen && (
        <button 
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-xl shadow-[#155D5F]/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50 group cursor-pointer"
        >
          <MessageSquare className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform" />
          {totalInternalUnread > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-extrabold border-2 border-white shadow-sm animate-in zoom-in-75 duration-200">
              {totalInternalUnread}
            </span>
          ) : (
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#155D5F]"></span>
            </span>
          )}
        </button>
      )}

      {/* Chat Drawer/Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[600px] bg-white rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-[#155D5F] text-white flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold font-outfit text-lg flex items-center gap-2">
                Team Chat
                {isConnected && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" title="Connected" />
                )}
              </h3>
              <p className="text-[11px] text-white/70 font-medium">Internal administrative communication</p>
            </div>
            <button onClick={toggleOpen} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
              <Minimize2 className="h-4.5 w-4.5" />
            </button>
          </div>

          {!selectedAdmin ? (
            /* Admin List View */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              <div className="px-2 py-3 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate/50 uppercase tracking-widest">Active Team Members</span>
                {totalInternalUnread > 0 && (
                  <span className="text-[10px] font-extrabold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                    {totalInternalUnread} unread
                  </span>
                )}
              </div>
              {rawTeam.map((admin: any) => {
                const adminId = admin.adminId || admin.id || admin._id;
                const userObj = admin.user || admin;
                const targetKey = admin.userId || userObj.userId || userObj.id || adminId;
                const allKeys = [admin.userId, userObj.userId, userObj.id, userObj._id, adminId, admin.id, admin._id].filter(Boolean);
                const displayName = admin.name || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.email || "Admin";
                const displayImage = admin.avatarUrl || userObj.imageUrl || admin.imageUrl || admin.image || "";
                const displayRole = admin.role || (admin.customRole ? admin.customRole.name : "Admin");
                const unreadCount = admin.unreadCount ?? 0;

                const isCurrentLoggedInUser = currentUserId !== "default" && allKeys.some(k => k === currentUserId);

                const isOnline = isCurrentLoggedInUser || Boolean(
                  allKeys.some(k => liveOnlineStatus[k] === "online") ||
                  admin.isOnline === true ||
                  admin.is_online === true ||
                  userObj.isOnline === true ||
                  userObj.is_online === true
                );

                // Dynamically determine true latest message between active messages, map, and API
                const isCurrentSelected = selectedAdmin && allKeys.some(k => k === currentAdminId);
                let latestMsgText = "";
                let latestMsgTime = "";
                let latestTimestamp = 0;

                // 1. Direct active chat messages in current view
                if (isCurrentSelected && liveMessages.length > 0) {
                  const lastLive = liveMessages[liveMessages.length - 1];
                  latestMsgText = lastLive.text || lastLive.content || "";
                  latestMsgTime = lastLive.createdAt ? new Date(lastLive.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                  latestTimestamp = lastLive.createdAt ? new Date(lastLive.createdAt).getTime() : Date.now();
                }

                // 2. Real-time message map
                allKeys.forEach((k) => {
                  const m = lastMessagesMap[k];
                  if (m && m.timestamp >= latestTimestamp) {
                    latestMsgText = m.text;
                    latestMsgTime = m.time;
                    latestTimestamp = m.timestamp;
                  }
                });

                // 3. API provided lastMessage
                const rawLastMsg = admin.lastMessage || admin.latestMessage || admin.last_message || admin.recentMessage || userObj.lastMessage || userObj.latestMessage;

                if (rawLastMsg) {
                  if (typeof rawLastMsg === "string") {
                    if (!latestMsgText) {
                      latestMsgText = rawLastMsg;
                    }
                  } else if (typeof rawLastMsg === "object") {
                    const extractedText = rawLastMsg.text || rawLastMsg.content || rawLastMsg.message || rawLastMsg.body || "";
                    const extractedTime = rawLastMsg.createdAt || rawLastMsg.created_at || rawLastMsg.timestamp || rawLastMsg.time;
                    const apiTimestamp = extractedTime ? new Date(extractedTime).getTime() : 0;
                    if (apiTimestamp >= latestTimestamp || !latestMsgText) {
                      if (extractedText) latestMsgText = extractedText;
                      if (extractedTime) {
                        try {
                          latestMsgTime = new Date(extractedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } catch (e) {}
                      }
                    }
                  }
                }

                const displayLastMsg = latestMsgText || "Click to start chat";
                const displayTime = latestMsgTime;

                return (
                <div 
                  key={adminId || targetKey} 
                  onClick={() => setSelectedAdmin({ ...admin, userId: targetKey, displayName, displayImage, displayRole, isOnline })}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface/60 cursor-pointer transition-colors group"
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      <AvatarImage src={displayImage} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 font-bold text-primary flex items-center justify-center">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isOnline ? (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white shadow-sm ring-1 ring-emerald-500/20" title="Online" />
                    ) : (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" title="Offline" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm text-dark truncate leading-none">{displayName}</span>
                        {isOnline && (
                          <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" title="Online" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate/40 font-bold shrink-0">{displayTime}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className={`text-[11px] truncate max-w-[140px] leading-none ${unreadCount > 0 ? "font-bold text-dark" : "text-slate/50"}`}>
                        {displayLastMsg}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-bold px-1.5 py-0 leading-none">
                          {displayRole}
                        </Badge>
                        {unreadCount > 0 && (
                          <span className="h-4 min-w-4 px-1 rounded-full bg-[#155D5F] text-white text-[9px] font-extrabold flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            /* Direct Chat View */
            <div className="flex-1 flex flex-col min-h-0 bg-surface/10">
              
              {/* Back Header */}
              <div className="p-3 border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 flex items-center gap-3 shrink-0">
                <button onClick={() => setSelectedAdmin(null)} className="h-8 w-8 rounded-full hover:bg-surface flex items-center justify-center cursor-pointer">
                  <ChevronRight className="h-4.5 w-4.5 rotate-180 text-slate/60" />
                </button>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={selectedAdmin.displayImage} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{selectedAdmin.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-dark leading-tight truncate">{selectedAdmin.displayName}</h4>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${selectedAdmin.isOnline ? "text-emerald-600" : "text-slate/40"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedAdmin.isOnline ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                    {selectedAdmin.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
                {isFetching && activeMessages.length === 0 ? (
                  <div className="m-auto text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#155D5F]" />
                    <p className="text-xs text-slate/40 font-semibold">Loading messages...</p>
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="m-auto text-center space-y-2 opacity-50">
                    <MessageSquare className="h-8 w-8 mx-auto text-slate/40" />
                    <p className="text-xs font-medium text-slate">Start conversation with {selectedAdmin.displayName}</p>
                  </div>
                ) : (
                  activeMessages.map((msg: any) => (
                    <div key={msg.id || msg._id || Math.random()} className={`flex flex-col max-w-[85%] ${msg.isMe ? "self-end items-end" : "self-start items-start"}`}>
                      <div className={`p-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${msg.isMe ? "bg-[#155D5F] text-white rounded-tr-sm" : "bg-white border border-border/30 text-dark rounded-tl-sm"}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[9px] font-bold text-slate/40 uppercase">{msg.time}</span>
                        {msg.isMe && (
                          <span title={msg.isRead ? "Read" : "Sent"}>
                            {String(msg.id).startsWith("temp_") ? (
                              <Check className="h-3 w-3 text-slate-400" />
                            ) : msg.isRead ? (
                              <CheckCheck className="h-3 w-3 text-[#3B82F6]" />
                            ) : (
                              <CheckCheck className="h-3 w-3 text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-border/50 shrink-0">
                <div className="flex items-center gap-2 bg-surface border border-border/40 rounded-xl p-1.5 pr-2 focus-within:border-primary/30 transition-colors">
                  <Input 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    placeholder="Message..." 
                    className="flex-1 h-9 bg-transparent border-none shadow-none focus-visible:ring-0 text-xs px-2"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="h-8 w-8 rounded-lg bg-[#155D5F] hover:bg-[#0F4A4C] text-white shrink-0 shadow-md cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 -ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
