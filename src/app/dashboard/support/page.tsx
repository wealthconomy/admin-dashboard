"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  MoreVertical,
  Send,
  ChevronRight,
  User,
  Check,
  CheckCheck,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/redux/features/supportApi";
import { useSocket } from "@/context/SocketContext";
import { useUnreadCounts } from "@/context/UnreadCountContext";

export default function SupportCentrePage() {
  const { socket, isConnected } = useSocket();
  const { markSupportRead } = useUnreadCounts();

  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "active" | "resolved">("queue");
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Map activeTab to stage query parameter (queue -> UNASSIGNED / queue, active -> ACTIVE / active, resolved -> RESOLVED / resolved)
  const stageParam = activeTab === "queue" ? "queue" : activeTab === "active" ? "active" : "resolved";
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useGetSupportChatsQuery({ 
    stage: stageParam, 
    search: searchTerm 
  });
  
  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);

  const currentChatId = selectedChat?.id || selectedChat?._id;
  const { data: chatData, isLoading: isChatLoading, refetch: refetchChat } = useGetSupportChatQuery(currentChatId, { 
    skip: !selectedChat,
  });

  const [replyChat] = useReplySupportChatMutation();
  const [claimChat] = useClaimSupportChatMutation();
  const [resolveChat] = useResolveSupportChatMutation();
  const [reopenChat] = useReopenSupportChatMutation();

  // Sync REST messages when switching chats or fetching
  useEffect(() => {
    const raw = Array.isArray(chatData?.messages) ? chatData.messages : (chatData?.data?.messages || []);
    setLiveMessages(raw);
  }, [chatData, currentChatId]);

  // When selecting a chat, mark it as read
  useEffect(() => {
    if (selectedChat && currentChatId) {
      markSupportRead(currentChatId);
    }
  }, [selectedChat, currentChatId, markSupportRead]);

  // Real-time support chat messages via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleSupportNewMessage = (data: {
      message: {
        id: string;
        chatId: string;
        sender: "client" | "admin";
        senderId: string;
        text: string;
        createdAt?: string;
      };
      chatId: string;
    }) => {
      console.log("[WebSocket] support:new_message received:", data);

      const msg = data.message || data;
      const targetChatId = data.chatId || msg.chatId;

      // If active ticket is open, append message immediately
      if (currentChatId && targetChatId === currentChatId) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              ...msg,
              isMe: msg.sender === "admin",
              time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ];
        });
        markSupportRead(currentChatId);
      } else {
        // Refresh ticket list to update badge and preview
        refetchUsers();
      }
    };

    socket.on("support:new_message", handleSupportNewMessage);

    return () => {
      socket.off("support:new_message", handleSupportNewMessage);
    };
  }, [socket, currentChatId, markSupportRead, refetchUsers]);

  // Format messages for rendering
  const formattedMessages = useMemo(() => {
    return liveMessages.map((msg: any) => {
      const isMe = msg.isMe !== undefined ? msg.isMe : (msg.sender === "admin" || msg.senderRole === "ADMIN");
      const time = msg.time || (msg.createdAt 
        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "");
      return {
        ...msg,
        isMe,
        time,
        sender: msg.sender || (isMe ? "Admin" : (selectedChat?.name || "Client")),
      };
    });
  }, [liveMessages, selectedChat]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [formattedMessages]);

  const filteredUsers = users.filter(
    (user: any) => {
      const userStage = (user.stage || "").toLowerCase();
      const tabMatch = activeTab === "queue" 
        ? (userStage === "queue" || userStage === "unassigned")
        : userStage === activeTab;
      
      const searchMatch = !searchTerm || (
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.id || user._id)?.toString().includes(searchTerm)
      );

      return tabMatch && searchMatch;
    }
  );

  const toggleChat = (item: any) => {
    const currentId = item.id || item._id;
    const selectedId = selectedChat?.id || selectedChat?._id;
    if (selectedId === currentId) {
      setSelectedChat(null);
    } else {
      setSelectedChat({ ...item, unreadCount: 0 });
      markSupportRead(currentId);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;
    
    const textToSend = inputText.trim();
    const activeId = selectedChat.id || selectedChat._id;
    setInputText("");

    // Optimistic local message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      chatId: activeId,
      sender: "admin",
      senderId: "me",
      text: textToSend,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    };
    setLiveMessages((prev) => [...prev, optimisticMsg]);

    // 1. Emit real-time WebSocket event
    if (socket && isConnected) {
      socket.emit("support:send_message", {
        chatId: activeId,
        text: textToSend,
      });
    }

    // 2. Execute REST mutation for persistence & tag invalidation
    try {
      await replyChat({ id: activeId, text: textToSend }).unwrap();
    } catch (err) {
      console.warn("REST replySupportChat fallback handled:", err);
    }
  };

  const handleClaimChat = async (userId: string | number) => {
    try {
      await claimChat(userId.toString()).unwrap();
      setActiveTab("active");
    } catch (err) {
      console.error("Failed to claim chat: ", err);
    }
  };

  const handleCloseChat = async (userId: string | number) => {
    try {
      await resolveChat(userId.toString()).unwrap();
      setActiveTab("resolved");
    } catch (err) {
      console.error("Failed to close chat: ", err);
    }
  };

  const handleReopenChat = async (userId: string | number) => {
    try {
      await reopenChat(userId.toString()).unwrap();
      setActiveTab("active");
    } catch (err) {
      console.error("Failed to reopen chat: ", err);
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-border/50 shadow-sm w-full max-w-[1137px] h-[850px] mx-auto flex overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className="w-[380px] border-r border-border/50 flex flex-col bg-white shrink-0">
        <div className="p-6 space-y-6 flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
              Support Chats
            </h1>
            {isConnected && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              placeholder="Search for user or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-surface/50 border-border/30 rounded-2xl text-sm font-medium focus-visible:ring-primary/20 transition-all shadow-none"
            />
          </div>

          {/* Users Stage Tabs */}
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex bg-surface/80 p-1 rounded-xl gap-1 shrink-0">
              <button
                onClick={() => setActiveTab("queue")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "queue"
                    ? "bg-white text-[#155D5F] shadow-sm"
                    : "text-slate/60 hover:text-dark"
                }`}
              >
                Queue ({users.filter((u: any) => {
                  const st = (u.stage || "").toLowerCase();
                  return st === "queue" || st === "unassigned";
                }).length})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "active"
                    ? "bg-white text-[#155D5F] shadow-sm"
                    : "text-slate/60 hover:text-dark"
                }`}
              >
                Active ({users.filter((u: any) => (u.stage || "").toLowerCase() === "active").length})
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "resolved"
                    ? "bg-white text-[#155D5F] shadow-sm"
                    : "text-slate/60 hover:text-dark"
                }`}
              >
                Resolved ({users.filter((u: any) => (u.stage || "").toLowerCase() === "resolved").length})
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => {
                  const currentId = user.id || user._id;
                  const selectedId = selectedChat?.id || selectedChat?._id;
                  const unread = user.unreadCount ?? 0;

                  return (
                  <div
                    key={currentId}
                    onClick={() => toggleChat(user)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all group border ${
                      selectedId === currentId
                        ? "bg-[#E8F3F3] border-[#155D5F]/10 shadow-sm"
                        : "hover:bg-surface border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-11 w-11 mt-1 shrink-0 ring-1 ring-border/10">
                        <AvatarImage src={user.image || user.avatarUrl} />
                        <AvatarFallback className="bg-primary/5 font-bold text-primary">
                          {(user.name || "U")[0]}
                        </AvatarFallback>
                      </Avatar>
                      {user.status === "online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${selectedId === currentId ? "text-dark" : "text-dark/80 group-hover:text-dark"}`}
                      >
                        {user.name || `User ${currentId.slice(0, 6)}`}
                      </p>
                      <p className="text-[11px] font-medium text-slate/50 truncate">
                        {user.lastMessage || "No messages yet"}
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
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-40">
                  <Search className="h-8 w-8 text-slate/40" />
                  <p className="text-xs font-bold font-outfit">
                    No users found in {activeTab}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-white min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-.5 bg-surface/50 rounded-full shadow-inner relative">
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
              <h2 className="text-2xl font-bold font-outfit text-dark/90 tracking-tight">
                No support chat selected
              </h2>
              <p className="text-sm font-medium text-slate/40 max-w-[320px] leading-relaxed">
                Click on a customer ticket from the list on the left to start a real-time conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
            {/* Chat Header */}
            <header className="px-8 py-5 border-b border-border/50 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/5 transition-transform duration-300 hover:scale-105">
                    <AvatarImage src={selectedChat.image || selectedChat.avatarUrl} />
                    <AvatarFallback className="bg-primary/5 font-bold text-primary">
                      {(selectedChat.name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  {selectedChat.status === "online" && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#10B981] border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-dark flex items-center gap-2">
                    {selectedChat.name || `User ${selectedChat.id?.slice(0, 6)}`}
                    {selectedChat.isAdmin && (
                      <Badge className="bg-primary/5 text-primary border-none text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full hover:bg-primary/5 select-none">
                        {selectedChat.role}
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] font-bold text-slate/40 uppercase tracking-wider">
                      Online
                    </span>
                    {!selectedChat.isAdmin && (
                      <Badge
                        className={`text-[10px] px-2 py-0.5 rounded-md ${
                          selectedChat.stage === "queue" || selectedChat.stage === "UNASSIGNED"
                            ? "bg-orange-100 text-orange-600 hover:bg-orange-100"
                            : selectedChat.stage === "active" || selectedChat.stage === "ACTIVE"
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-100"
                              : "bg-green-100 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {selectedChat.stage === "queue" || selectedChat.stage === "UNASSIGNED"
                          ? "In Queue"
                          : selectedChat.stage === "active" || selectedChat.stage === "ACTIVE"
                            ? "Active"
                            : "Resolved"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!selectedChat.isAdmin && (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate/40 hover:text-dark rounded-full transition-colors outline-none cursor-pointer"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white rounded-xl shadow-lg border-border/50 w-48 p-2"
                    >
                      {(selectedChat.stage === "queue" || selectedChat.stage === "UNASSIGNED") && (
                        <DropdownMenuItem
                          onClick={() => handleClaimChat(selectedChat.id)}
                          className="cursor-pointer font-bold text-xs text-[#155D5F] hover:bg-surface py-2.5 rounded-lg px-3"
                        >
                          Claim Chat
                        </DropdownMenuItem>
                      )}
                      {(selectedChat.stage === "active" || selectedChat.stage === "ACTIVE") && (
                        <DropdownMenuItem
                          onClick={() => handleCloseChat(selectedChat.id)}
                          className="cursor-pointer font-bold text-xs text-red-600 hover:bg-surface py-2.5 rounded-lg px-3"
                        >
                          Close / Resolve Chat
                        </DropdownMenuItem>
                      )}
                      {(selectedChat.stage === "resolved" || selectedChat.stage === "RESOLVED") && (
                        <DropdownMenuItem
                          onClick={() => handleReopenChat(selectedChat.id)}
                          className="cursor-pointer font-bold text-xs text-[#155D5F] hover:bg-surface py-2.5 rounded-lg px-3"
                        >
                          Reopen / Claim Chat
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
              {formattedMessages.map((msg: any, idx: number) => (
                <div
                  key={msg.id || idx}
                  className={`flex gap-4 ${msg.isMe ? "flex-row-reverse" : "flex-row"} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <Avatar
                    className={`h-8 w-8 mt-1 shrink-0 ring-1 ring-border/10 ${msg.isMe ? "bg-white p-0.5" : ""}`}
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
                        <AvatarImage src={msg.senderImage || selectedChat.image} />
                        <AvatarFallback className="bg-primary/5 text-[10px] font-bold">
                          {(msg.sender || "C")[0]}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>

                  <div
                    className={`flex flex-col space-y-2 max-w-[70%] ${msg.isMe ? "items-end" : "items-start"}`}
                  >
                    {!msg.isMe && (
                      <span className="text-[11px] font-bold text-[#155D5F] ml-1">
                        {msg.sender}
                      </span>
                    )}
                    <div
                      className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all ${
                        msg.isMe
                          ? "bg-[#E8F3F3] text-dark rounded-tr-none hover:shadow-md"
                          : "bg-[#F3F4F6] text-dark/80 rounded-tl-none hover:shadow-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[10px] font-semibold text-slate/30 uppercase tracking-tighter">
                        {msg.time}
                      </span>
                      {msg.isMe && (
                        <CheckCheck className="h-3 w-3 text-[#155D5F] opacity-40 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 pt-4">
              <div className="relative group transition-all duration-300">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg group-focus-within:blur-xl transition-all opacity-0 group-focus-within:opacity-100" />
                <div className="relative flex items-center gap-3 bg-white border border-border/40 rounded-2xl p-2 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-primary/20 transition-all">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Write a message..."
                    className="flex-1 border-none shadow-none focus-visible:ring-0 text-sm font-medium h-12 bg-transparent"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="bg-transparent hover:bg-surface text-[#155D5F] rounded-xl h-10 w-10 shrink-0 transition-all active:scale-90 cursor-pointer"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
