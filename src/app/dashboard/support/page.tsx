"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MoreVertical,
  Send,
  User,
  Check,
  CheckCheck,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  Copy,
  Sparkles,
  Paperclip,
  LifeBuoy,
  MessageSquare,
  Flag,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Clock,
  Ban,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetSupportChatsQuery,
  useGetSupportChatQuery,
  useReplySupportChatMutation,
  useClaimSupportChatMutation,
  useResolveSupportChatMutation,
  useReopenSupportChatMutation,
  useGetWealthGroupReportsQuery,
  useUpdateWealthGroupReportStatusMutation,
  useDeleteWealthGroupReportMutation,
  SupportChat,
  SupportMessage,
  WealthGroupReport,
} from "@/lib/redux/features/supportApi";
import { useSocket } from "@/context/SocketContext";
import { useUnreadCounts } from "@/context/UnreadCountContext";

function getDateLabel(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const CANNED_TOPICS = [
  {
    topic: "Greeting",
    icon: "👋",
    text: "Hello! How can I assist you with your Wealthconomy account today?",
  },
  {
    topic: "In Review",
    icon: "⏳",
    text: "We are currently reviewing your request with our operations team.",
  },
  {
    topic: "Verified",
    icon: "✅",
    text: "Your transaction has been verified and updated successfully.",
  },
  {
    topic: "Closing",
    icon: "🙏",
    text: "Thank you for contacting Wealthconomy support. Have a wonderful day!",
  },
];

function SupportCentreContent() {
  const searchParams = useSearchParams();
  const { socket, isConnected } = useSocket();
  const { markSupportRead } = useUnreadCounts();

  // Chat States
  const [selectedChat, setSelectedChat] = useState<SupportChat | any | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "active" | "resolved">("queue");
  const [liveMessages, setLiveMessages] = useState<SupportMessage[] | any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Map activeTab to stage query parameter
  const stageParam = activeTab === "queue" ? "queue" : activeTab === "active" ? "active" : "resolved";

  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useGetSupportChatsQuery(
    { stage: stageParam, search: searchTerm },
    { pollingInterval: 5000 }
  );

  const users: (SupportChat | any)[] = useMemo(() => {
    if (Array.isArray(usersData)) return usersData;
    if (Array.isArray(usersData?.data)) return usersData.data;
    return [];
  }, [usersData]);

  const currentChatId = selectedChat?.id || selectedChat?._id;
  const {
    data: chatData,
    isLoading: isChatLoading,
    refetch: refetchChat,
  } = useGetSupportChatQuery(currentChatId, {
    skip: !currentChatId,
  });

  const [replyChat] = useReplySupportChatMutation();
  const [claimChat] = useClaimSupportChatMutation();
  const [resolveChat] = useResolveSupportChatMutation();
  const [reopenChat] = useReopenSupportChatMutation();

  const totalChatUnread = useMemo(() => {
    return users.reduce(
      (acc: number, u: any) => acc + (u.adminUnreadCount ?? u.unreadCount ?? 0),
      0
    );
  }, [users]);

  const [lastMessagesMap, setLastMessagesMap] = useState<
    Record<string, { text: string; time: string; timestamp: number }>
  >({});

  // Helper to reliably classify if a message originated from Support/Admin vs Customer
  const isMessageFromSupport = useCallback(
    (msg: any): boolean => {
      if (!msg) return false;
      if (msg.senderRole === "ADMIN" || msg.senderRole === "SUPER_ADMIN") return true;
      if (msg.role === "ADMIN" || msg.role === "SUPER_ADMIN") return true;
      if (msg.isAdmin === true) return true;
      if (typeof msg.sender === "string" && msg.sender.toLowerCase() === "admin") return true;
      if (typeof msg.senderName === "string") {
        const name = msg.senderName.trim().toLowerCase();
        if (
          name === "admin support" ||
          name === "admin" ||
          /\b(admin\s*support|support\s*team|wealthconomy\s*support)\b/i.test(name)
        ) {
          return true;
        }
      }
      if (typeof msg.id === "string" && (msg.id.startsWith("temp_") || msg.id.startsWith("admin_temp_"))) {
        return true;
      }
      return false;
    },
    []
  );

  const updateLastMessageForChat = useCallback(
    (
      chatIds: (string | number | undefined)[],
      text: string,
      timeStr?: string,
      createdAtIso?: string
    ) => {
      const validIds = chatIds.filter(Boolean).map(String);
      if (validIds.length === 0) return;

      const formattedTime =
        timeStr ||
        (createdAtIso
          ? formatRelativeTime(createdAtIso)
          : formatRelativeTime(new Date().toISOString()));

      const timestamp = createdAtIso
        ? new Date(createdAtIso).getTime()
        : Date.now();

      setLastMessagesMap((prev) => {
        const next = { ...prev };
        validIds.forEach((id) => {
          next[id] = {
            text,
            time: formattedTime,
            timestamp,
          };
        });
        return next;
      });
    },
    []
  );

  // Sync messages from REST response
  useEffect(() => {
    if (chatData) {
      let loadedMessages: any[] = [];
      if (Array.isArray(chatData)) {
        loadedMessages = chatData;
      } else if (chatData.data && Array.isArray(chatData.data.messages)) {
        loadedMessages = chatData.data.messages;
      } else if (Array.isArray(chatData.messages)) {
        loadedMessages = chatData.messages;
      } else if (Array.isArray(chatData.data)) {
        loadedMessages = chatData.data;
      }

      setLiveMessages(loadedMessages);

      if (loadedMessages.length > 0) {
        const lastMsg = loadedMessages[loadedMessages.length - 1];
        const lastText = lastMsg.text || lastMsg.content || lastMsg.message || "";
        const rawTime = lastMsg.createdAt || lastMsg.time;
        updateLastMessageForChat(
          [
            currentChatId,
            selectedChat?.id,
            selectedChat?._id,
            selectedChat?.userId,
          ],
          lastText,
          undefined,
          rawTime
        );
      }
    }
  }, [chatData, currentChatId, selectedChat, updateLastMessageForChat]);

  // Sync selectedChat stage from live chatData if present
  useEffect(() => {
    if (chatData) {
      const resolvedChatObj = chatData.data || chatData;
      if (resolvedChatObj?.stage) {
        setSelectedChat((prev: any) =>
          prev && prev.stage !== resolvedChatObj.stage
            ? { ...prev, stage: resolvedChatObj.stage }
            : prev
        );
      }
    }
  }, [chatData]);

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleSupportNewMessage = (data: any) => {
      console.log("[SupportSocket] 📨 Incoming message event:", data);
      if (!data) return;

      const msg = data.message || data;
      const targetChatId = String(
        data.chatId || msg.chatId || msg.room || ""
      );

      const isCurrentActiveChat =
        Boolean(currentChatId) &&
        (targetChatId === String(currentChatId) ||
          targetChatId === String(selectedChat?.userId) ||
          targetChatId === String(selectedChat?.id) ||
          targetChatId === String(selectedChat?._id));

      const text = msg.text || msg.content || msg.message || "";
      const rawCreatedAt = msg.createdAt || msg.time || new Date().toISOString();

      updateLastMessageForChat(
        [
          targetChatId,
          msg.chatId,
          msg.userId,
          isCurrentActiveChat ? currentChatId : undefined,
        ],
        text,
        undefined,
        rawCreatedAt
      );

      if (isCurrentActiveChat) {
        setLiveMessages((prev) => {
          const alreadyExists = prev.some(
            (m) =>
              (msg.id && m.id === msg.id) ||
              (m.id &&
                m.id.startsWith("temp_") &&
                m.text === text &&
                isMessageFromSupport(msg) === isMessageFromSupport(m))
          );
          if (alreadyExists) {
            return prev.map((m) =>
              (msg.id && m.id === msg.id) ||
              (m.id &&
                m.id.startsWith("temp_") &&
                m.text === text &&
                isMessageFromSupport(msg) === isMessageFromSupport(m))
                ? { ...m, ...msg, isMe: isMessageFromSupport(msg) }
                : m
            );
          }
          return [...prev, { ...msg, isMe: isMessageFromSupport(msg) }];
        });

        markSupportRead(currentChatId);
      } else {
        refetchUsers();
        const sender = msg.senderName || msg.userName || "Customer";
        toast.info(`New message from ${sender}`, {
          description: text ? text.slice(0, 60) : "Sent a new message",
        });
      }
    };

    const handleStatusChange = (data: any) => {
      console.log("[SupportSocket] 👤 user:status_change received:", data);
      if (!data) return;

      const changedId = data.userId || data.adminId || data.id;
      const newStatus = data.status || "offline";

      setSelectedChat((prev: any) => {
        if (!prev) return prev;
        if (prev.userId === changedId || prev.id === changedId) {
          return { ...prev, status: newStatus };
        }
        return prev;
      });

      refetchUsers();
    };

    socket.on("support:new_message", handleSupportNewMessage);
    socket.on("chat:new_message", handleSupportNewMessage);
    socket.on("user:status_change", handleStatusChange);

    return () => {
      socket.off("support:new_message", handleSupportNewMessage);
      socket.off("chat:new_message", handleSupportNewMessage);
      socket.off("user:status_change", handleStatusChange);
    };
  }, [
    socket,
    currentChatId,
    selectedChat,
    markSupportRead,
    refetchUsers,
    updateLastMessageForChat,
    isMessageFromSupport,
  ]);

  // Format messages for rendering
  const formattedMessages = useMemo(() => {
    return liveMessages.map((msg: any) => {
      const isMe = isMessageFromSupport(msg);

      const time =
        msg.time ||
        (msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "");

      const customerDisplayName =
        selectedChat?.userName || selectedChat?.name || "Client";

      return {
        ...msg,
        isMe,
        time,
        sender: isMe
          ? "Admin Support"
          : msg.senderName || msg.sender || customerDisplayName,
      };
    });
  }, [liveMessages, selectedChat, isMessageFromSupport]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [formattedMessages]);

  const filteredUsers = useMemo(() => {
    return users.filter((user: any) => {
      const userStage = (user.stage || "").toLowerCase();
      let tabMatch = false;
      if (activeTab === "queue") {
        tabMatch = userStage === "queue" || userStage === "unassigned" || !userStage;
      } else if (activeTab === "active") {
        tabMatch = userStage === "active" || userStage === "assigned";
      } else if (activeTab === "resolved") {
        tabMatch = userStage === "resolved" || userStage === "closed";
      }

      if (!searchTerm) return tabMatch;

      const nameToSearch = (user.userName || user.name || "").toLowerCase();
      const idToSearch = String(user.id || user._id || "");
      const searchMatch =
        nameToSearch.includes(searchTerm.toLowerCase()) ||
        idToSearch.includes(searchTerm);

      return tabMatch && searchMatch;
    });
  }, [users, activeTab, searchTerm]);

  const toggleChat = (item: any) => {
    const currentId = item.id || item._id;
    const selectedId = selectedChat?.id || selectedChat?._id;
    if (selectedId === currentId) {
      setSelectedChat(null);
    } else {
      setSelectedChat({ ...item, adminUnreadCount: 0, unreadCount: 0 });
      markSupportRead(currentId);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !selectedChat || isSending) return;

    const activeId = selectedChat.id || selectedChat._id;
    setInputText("");
    setIsSending(true);

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: SupportMessage = {
      id: tempId,
      chatId: activeId,
      senderName: "Admin Support",
      sender: "admin",
      text: textToSend,
      isMe: true,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setLiveMessages((prev) => [...prev, optimisticMsg]);

    updateLastMessageForChat(
      [activeId, selectedChat.id, selectedChat._id],
      textToSend,
      undefined,
      new Date().toISOString()
    );

    if (
      selectedChat.stage === "queue" ||
      selectedChat.stage === "unassigned"
    ) {
      setSelectedChat((prev: any) =>
        prev ? { ...prev, stage: "active" } : null
      );
    }

    try {
      const res = await replyChat({ id: activeId, text: textToSend }).unwrap();

      if (res?.data || res?.id) {
        const serverMsg = res.data || res;
        setLiveMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...serverMsg,
                  isMe: true,
                  senderName: "Admin Support",
                  time:
                    serverMsg.time ||
                    new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                }
              : m
          )
        );
      }
      refetchUsers();
    } catch (err: any) {
      console.warn("replySupportChat error:", err);
      toast.error(
        err?.data?.message || "Failed to send message. Please try again."
      );
      setLiveMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleClaimChat = async (chatId: string | number) => {
    try {
      await claimChat(chatId.toString()).unwrap();
      setSelectedChat((prev: any) => (prev ? { ...prev, stage: "active" } : null));
      setActiveTab("active");
      refetchUsers();
      socket?.emit("chat:stage_change", { chatId: chatId.toString(), stage: "active" });
      socket?.emit("support:stage_change", { chatId: chatId.toString(), stage: "active" });
      toast.success("Ticket claimed and moved to Active");
    } catch (err: any) {
      console.error("Failed to claim chat: ", err);
      toast.error(err?.data?.message || "Failed to claim ticket");
    }
  };

  const handleCloseChat = async (chatId: string | number) => {
    try {
      await resolveChat(chatId.toString()).unwrap();
      setSelectedChat((prev: any) =>
        prev ? { ...prev, stage: "resolved" } : null
      );
      setActiveTab("resolved");
      refetchUsers();
      socket?.emit("chat:stage_change", { chatId: chatId.toString(), stage: "resolved" });
      socket?.emit("support:stage_change", { chatId: chatId.toString(), stage: "resolved" });
      toast.success("Ticket marked as Resolved");
    } catch (err: any) {
      console.error("Failed to close chat: ", err);
      toast.error(err?.data?.message || "Failed to resolve ticket");
    }
  };

  const handleReopenChat = async (chatId: string | number) => {
    try {
      await reopenChat(chatId.toString()).unwrap();
      setSelectedChat((prev: any) => (prev ? { ...prev, stage: "active" } : null));
      setActiveTab("active");
      refetchUsers();
      socket?.emit("chat:stage_change", { chatId: chatId.toString(), stage: "active" });
      socket?.emit("support:stage_change", { chatId: chatId.toString(), stage: "active" });
      toast.success("Ticket reopened and moved to Active");
    } catch (err: any) {
      console.error("Failed to reopen chat: ", err);
      toast.error(err?.data?.message || "Failed to reopen ticket");
    }
  };

  const copyToClipboard = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const currentStage = (selectedChat?.stage || "").toLowerCase();

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-5 pb-12 animate-in fade-in duration-500">
      {/* Top Support Navigation Bar */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#155D5F]/10 flex items-center justify-center text-[#155D5F]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-outfit text-dark tracking-tight">
              Support Centre
            </h1>
            <p className="text-xs font-medium text-slate/50">
              Manage live customer tickets and real-time support requests
            </p>
          </div>
        </div>
      </div>

      {/* Live Customer Support Chat */}
      <div className="bg-white rounded-[24px] border border-border/60 shadow-md w-full h-[860px] flex overflow-hidden animate-in fade-in duration-300">
          {/* Sidebar */}
          <aside className="w-[380px] border-r border-border/50 flex flex-col bg-white shrink-0">
            <div className="p-6 space-y-6 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    Support Tickets
                  </h2>
                  <p className="text-xs text-slate/50 font-medium mt-0.5">
                    Real-time conversations
                  </p>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    CONNECTING
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tickets by name..."
                  className="pl-10 text-xs h-10 rounded-xl border-border/60 bg-surface/50 focus-visible:ring-[#155D5F]/20"
                />
              </div>

              {/* Ticket Stage Tabs */}
              <div className="flex items-center bg-surface p-1 rounded-xl border border-border/50">
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "queue"
                      ? "bg-white text-[#155D5F] shadow-sm"
                      : "text-slate/60 hover:text-dark"
                  }`}
                >
                  Queue
                </button>
                <button
                  onClick={() => setActiveTab("active")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "active"
                      ? "bg-white text-[#155D5F] shadow-sm"
                      : "text-slate/60 hover:text-dark"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setActiveTab("resolved")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "resolved"
                      ? "bg-white text-[#155D5F] shadow-sm"
                      : "text-slate/60 hover:text-dark"
                  }`}
                >
                  Resolved
                </button>
              </div>

              {/* Ticket List */}
              <div className="space-y-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => {
                    const currentId = user.id || user._id;
                    const allKeys = [
                      user.id,
                      user._id,
                      user.chatId,
                      user.userId,
                    ].filter(Boolean);
                    const selectedId = selectedChat?.id || selectedChat?._id;
                    const isCurrentSelected =
                      selectedChat && allKeys.some((k) => k === selectedId);
                    
                    const unread =
                      user.adminUnreadCount ?? user.unreadCount ?? 0;
                    const displayName =
                      user.userName ||
                      user.name ||
                      `User ${String(currentId).slice(0, 6)}`;
                    const avatarUrl = user.avatarUrl || user.image;

                    let latestMsgText = "";
                    let latestMsgTime = "";
                    let latestTimestamp = 0;

                    if (isCurrentSelected && liveMessages.length > 0) {
                      const lastLive = liveMessages[liveMessages.length - 1];
                      latestMsgText =
                        lastLive.text ||
                        lastLive.content ||
                        lastLive.message ||
                        "";
                      latestMsgTime = lastLive.createdAt
                        ? formatRelativeTime(lastLive.createdAt)
                        : "";
                      latestTimestamp = lastLive.createdAt
                        ? new Date(lastLive.createdAt).getTime()
                        : Date.now();
                    }

                    allKeys.forEach((k) => {
                      const m = lastMessagesMap[k];
                      if (m && m.timestamp >= latestTimestamp) {
                        latestMsgText = m.text;
                        latestMsgTime = m.time;
                        latestTimestamp = m.timestamp;
                      }
                    });

                    const rawLastMsg =
                      user.lastMessage ||
                      user.latestMessage ||
                      user.last_message ||
                      user.recentMessage ||
                      user.messages?.[user.messages.length - 1];

                    if (rawLastMsg) {
                      if (typeof rawLastMsg === "string") {
                        if (!latestMsgText) latestMsgText = rawLastMsg;
                      } else if (typeof rawLastMsg === "object") {
                        const extractedText =
                          rawLastMsg.text ||
                          rawLastMsg.content ||
                          rawLastMsg.message ||
                          rawLastMsg.body ||
                          "";
                        const extractedTime =
                          rawLastMsg.createdAt ||
                          rawLastMsg.created_at ||
                          rawLastMsg.timestamp ||
                          rawLastMsg.time;
                        const apiTimestamp = extractedTime
                          ? new Date(extractedTime).getTime()
                          : 0;
                        if (apiTimestamp >= latestTimestamp || !latestMsgText) {
                          if (extractedText) latestMsgText = extractedText;
                          if (extractedTime) {
                            latestMsgTime = formatRelativeTime(extractedTime);
                          }
                        }
                      }
                    }

                    const displayLastMsg = latestMsgText || "No messages yet";
                    const displayTime =
                      latestMsgTime ||
                      (user.lastMessageTime
                        ? formatRelativeTime(user.lastMessageTime)
                        : "");

                    const isOnline = user.status === "online";

                    return (
                      <div
                        key={currentId}
                        onClick={() => toggleChat(user)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all group border ${
                          selectedId === currentId
                            ? "bg-[#E8F3F3]/80 border-[#155D5F]/20 shadow-sm border-l-4 border-l-[#155D5F]"
                            : "hover:bg-surface border-transparent"
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-11 w-11 mt-0.5 shrink-0 ring-1 ring-border/10">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-primary/5 font-bold text-[#155D5F]">
                              {(displayName || "U")[0]}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm font-bold truncate ${
                                selectedId === currentId
                                  ? "text-dark"
                                  : "text-dark/80 group-hover:text-dark"
                              }`}
                            >
                              {displayName}
                            </p>
                            {displayTime && (
                              <span className="text-[10px] font-semibold text-slate/40">
                                {displayTime}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate/50 truncate mt-0.5">
                            {displayLastMsg}
                          </p>
                        </div>
                        {unread > 0 && (
                          <div className="h-5 min-w-5 px-1.5 rounded-full bg-[#155D5F] flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm shrink-0 animate-in zoom-in-75">
                            {unread}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : isUsersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3.5 rounded-2xl border border-transparent animate-pulse"
                      >
                        <Skeleton className="h-11 w-11 rounded-full shrink-0 bg-slate-200" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-24 bg-slate-200 rounded" />
                            <Skeleton className="h-2.5 w-10 bg-slate-100 rounded" />
                          </div>
                          <Skeleton className="h-3 w-4/5 bg-slate-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 opacity-40">
                    <Search className="h-8 w-8 text-slate/40" />
                    <p className="text-xs font-bold font-outfit">
                      No tickets in {activeTab}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col bg-white min-w-0">
            {!selectedChat ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-0.5 bg-surface/50 rounded-full shadow-inner relative">
                  <Image
                    src="/logo1.png"
                    alt="Logo"
                    width={250}
                    height={200}
                    className=""
                  />
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full" />
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500/50 rounded-full animate-ping" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold font-outfit text-dark/90 tracking-tight">
                    No conversation selected
                  </h3>
                  <p className="text-sm font-medium text-slate/40 max-w-[320px] leading-relaxed">
                    Choose a ticket from the left queue to view customer inquiries and provide live assistance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
                {/* Chat Header */}
                <header className="px-8 py-4 border-b border-border/50 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/5 transition-transform duration-300 hover:scale-105">
                        <AvatarImage
                          src={selectedChat.avatarUrl || selectedChat.image}
                        />
                        <AvatarFallback className="bg-primary/5 font-bold text-[#155D5F]">
                          {((selectedChat.userName || selectedChat.name || "U")[0])}
                        </AvatarFallback>
                      </Avatar>
                      {selectedChat.status === "online" && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#10B981] border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-dark flex items-center gap-2">
                        {selectedChat.userName ||
                          selectedChat.name ||
                          `User ${String(selectedChat.id || selectedChat._id).slice(0, 6)}`}
                        {selectedChat.isAdmin && (
                          <Badge className="bg-primary/5 text-[#155D5F] border-none text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full">
                            {selectedChat.role || "ADMIN"}
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedChat.status === "online"
                              ? "bg-[#10B981]"
                              : "bg-slate-300"
                          }`}
                        />
                        <span className="text-[11px] font-bold text-slate/40 uppercase tracking-wider">
                          {selectedChat.status === "online" ? "Online" : "Offline"}
                        </span>
                        {!selectedChat.isAdmin && (
                          <Badge
                            className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              currentStage === "queue" || currentStage === "unassigned"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                : currentStage === "active"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {currentStage === "queue" || currentStage === "unassigned"
                              ? "In Queue"
                              : currentStage === "active"
                              ? "Active"
                              : "Resolved"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  {!selectedChat.isAdmin && (
                    <div className="flex items-center gap-3">
                      {(currentStage === "queue" || currentStage === "unassigned") && (
                        <Button
                          onClick={() => handleClaimChat(selectedChat.id || selectedChat._id)}
                          className="bg-[#155D5F] hover:bg-[#124e50] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <UserCheck className="h-4 w-4" />
                          Claim Ticket
                        </Button>
                      )}

                      {currentStage === "active" && (
                        <Button
                          onClick={() => handleCloseChat(selectedChat.id || selectedChat._id)}
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Resolve Ticket
                        </Button>
                      )}

                      {currentStage === "resolved" && (
                        <Button
                          onClick={() => handleReopenChat(selectedChat.id || selectedChat._id)}
                          variant="outline"
                          className="border-[#155D5F]/30 bg-[#E8F3F3] hover:bg-[#d4ecec] text-[#155D5F] font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <RotateCcw className="h-4 w-4 text-[#155D5F]" />
                          Reopen Ticket
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate/40 hover:text-dark rounded-full transition-colors outline-none cursor-pointer h-9 w-9"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white rounded-xl shadow-lg border-border/50 w-48 p-2"
                        >
                          {(currentStage === "queue" || currentStage === "unassigned") && (
                            <DropdownMenuItem
                              onClick={() => handleClaimChat(selectedChat.id || selectedChat._id)}
                              className="cursor-pointer font-bold text-xs text-[#155D5F] hover:bg-surface py-2.5 rounded-lg px-3"
                            >
                              Claim Ticket
                            </DropdownMenuItem>
                          )}
                          {currentStage === "active" && (
                            <DropdownMenuItem
                              onClick={() => handleCloseChat(selectedChat.id || selectedChat._id)}
                              className="cursor-pointer font-bold text-xs text-red-600 hover:bg-surface py-2.5 rounded-lg px-3"
                            >
                              Close / Resolve Ticket
                            </DropdownMenuItem>
                          )}
                          {currentStage === "resolved" && (
                            <DropdownMenuItem
                              onClick={() => handleReopenChat(selectedChat.id || selectedChat._id)}
                              className="cursor-pointer font-bold text-xs text-[#155D5F] hover:bg-surface py-2.5 rounded-lg px-3"
                            >
                              Reopen Ticket
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
                  {isChatLoading && formattedMessages.length === 0 ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="flex justify-center my-4">
                        <Skeleton className="h-6 w-24 rounded-full bg-slate-100" />
                      </div>
                      <div className="flex gap-3 items-start">
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-2 max-w-[65%] w-full">
                          <Skeleton className="h-3 w-20 bg-slate-200 rounded" />
                          <Skeleton className="h-16 w-full rounded-2xl rounded-tl-none bg-slate-100" />
                        </div>
                      </div>
                      <div className="flex gap-3 items-start justify-end flex-row-reverse">
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-2 max-w-[60%] w-full flex flex-col items-end">
                          <Skeleton className="h-12 w-full rounded-2xl rounded-tr-none bg-[#E8F3F3]/80" />
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-2 max-w-[50%] w-full">
                          <Skeleton className="h-10 w-full rounded-2xl rounded-tl-none bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  ) : formattedMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-2">
                      <p className="text-xs font-bold font-outfit">
                        No messages in this chat thread yet. Send a response to start.
                      </p>
                    </div>
                  ) : (
                    formattedMessages.map((msg: any, idx: number) => {
                      const currentDate = msg.time || msg.createdAt ? new Date(msg.time || msg.createdAt).toDateString() : "";
                      const prevMsg = idx > 0 ? formattedMessages[idx - 1] : null;
                      const prevDate = prevMsg && (prevMsg.time || prevMsg.createdAt) ? new Date(prevMsg.time || prevMsg.createdAt).toDateString() : "";
                      const showDate = !prevDate || currentDate !== prevDate;
                      const dateLabel = showDate ? getDateLabel(msg.time || msg.createdAt) : "";

                      const isTypeTransition = prevMsg && prevMsg.isMe !== msg.isMe && !showDate;

                      return (
                        <div key={msg.id || idx} className={isTypeTransition ? "mt-6" : "mt-2"}>
                          {showDate && dateLabel && (
                            <div className="flex items-center justify-center my-6">
                              <span className="bg-surface border border-border/50 text-slate/50 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                {dateLabel}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex gap-3 group ${
                              msg.isMe ? "flex-row-reverse" : "flex-row"
                            } animate-in slide-in-from-bottom-2 duration-300`}
                          >
                            <Avatar
                              className={`h-8 w-8 mt-1 shrink-0 ring-1 ring-border/10 ${
                                msg.isMe ? "bg-white p-0.5" : ""
                              }`}
                            >
                              {msg.isMe ? (
                                <Image
                                  src="/logo.png"
                                  alt="Wealthconomy"
                                  width={32}
                                  height={32}
                                  className="cover"
                                />
                              ) : (
                                <>
                                  <AvatarImage
                                    src={
                                      msg.senderImage ||
                                      selectedChat.avatarUrl ||
                                      selectedChat.image
                                    }
                                  />
                                  <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-[#155D5F]">
                                    {(msg.sender || "C")[0]}
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar>

                            <div
                              className={`flex flex-col space-y-1.5 max-w-[70%] ${
                                msg.isMe ? "items-end" : "items-start"
                              }`}
                            >
                              {!msg.isMe && (
                                <span className="text-[11px] font-bold text-[#155D5F] ml-1">
                                  {msg.sender}
                                </span>
                              )}
                              <div className="relative group/bubble flex items-center gap-2">
                                <div
                                  className={`p-4 rounded-2xl text-[13.5px] font-medium leading-relaxed shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all ${
                                    msg.isMe
                                      ? "bg-[#E8F3F3] text-dark rounded-tr-none hover:shadow-md"
                                      : "bg-[#F3F4F6] text-dark/85 rounded-tl-none hover:shadow-md"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>

                                <button
                                  onClick={() => copyToClipboard(msg.text)}
                                  title="Copy message"
                                  className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-surface text-slate/40 hover:text-dark cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[10px] font-semibold text-slate/30 uppercase tracking-tighter">
                                  {msg.time}
                                </span>
                                {msg.isMe && (
                                  <CheckCheck className="h-3 w-3 text-[#155D5F] opacity-70 shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Topics & Canned Replies Bar */}
                <div className="px-8 py-2.5 border-t border-border/40 bg-white flex items-center gap-3 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setShowCanned(!showCanned)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#155D5F] bg-[#E8F3F3] hover:bg-[#d6ecec] shrink-0 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Topics
                  </button>

                  {CANNED_TOPICS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(item.text)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate/70 hover:text-dark bg-surface hover:bg-slate-100 border border-border/60 shrink-0 transition-all cursor-pointer group"
                    >
                      <span>{item.icon}</span>
                      <span className="font-bold text-[#155D5F] text-[11px] group-hover:text-[#124e50]">
                        {item.topic}:
                      </span>
                      <span className="truncate max-w-[200px] text-slate/60 group-hover:text-dark">
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-8 pt-2">
                  <div className="relative group transition-all duration-300">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg group-focus-within:blur-xl transition-all opacity-0 group-focus-within:opacity-100" />
                    <div className="relative flex items-center gap-3 bg-white border border-border/50 rounded-2xl p-2 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-[#155D5F]/40 transition-all">
                      <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && handleSendMessage()
                        }
                        placeholder="Write a message to the customer..."
                        disabled={isSending}
                        className="flex-1 border-none shadow-none focus-visible:ring-0 text-sm font-medium h-12 bg-transparent disabled:opacity-50"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim() || isSending}
                        className="bg-[#155D5F] hover:bg-[#124e50] text-white rounded-xl h-10 w-10 shrink-0 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default function SupportCentrePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1200px] mx-auto bg-white rounded-2xl p-12 border border-border/50 shadow-sm flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#155D5F]" />
        </div>
      }
    >
      <SupportCentreContent />
    </Suspense>
  );
}
