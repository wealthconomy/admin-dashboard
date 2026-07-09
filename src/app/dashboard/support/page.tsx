"use client";

import { useState } from "react";
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


export default function SupportCentrePage() {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "active" | "resolved">("queue");

  const { data: usersData, isLoading: isUsersLoading } = useGetSupportChatsQuery({ stage: activeTab, search: searchTerm });
  
  // Try to extract .data if the backend wraps the response, otherwise use it directly. Default to empty array.
  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);

  const currentChatId = selectedChat?.id || selectedChat?._id;
  const { data: chatData, isLoading: isChatLoading } = useGetSupportChatQuery(currentChatId, { 
    skip: !selectedChat,
    pollingInterval: selectedChat ? 5000 : 0 
  });
  const messages = Array.isArray(chatData?.messages) ? chatData.messages : (chatData?.data?.messages || []);

  const [replyChat] = useReplySupportChatMutation();
  const [claimChat] = useClaimSupportChatMutation();
  const [resolveChat] = useResolveSupportChatMutation();
  const [reopenChat] = useReopenSupportChatMutation();

  const filteredUsers = users.filter(
    (user: any) =>
      user.stage === activeTab &&
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.id || user._id)?.toString().includes(searchTerm)),
  );

  const toggleChat = (item: any) => {
    const currentId = item.id || item._id;
    const selectedId = selectedChat?.id || selectedChat?._id;
    if (selectedId === currentId) {
      setSelectedChat(null);
    } else {
      setSelectedChat({ ...item, unreadCount: 0 });
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;
    try {
      const currentChatId = selectedChat.id || selectedChat._id;
      await replyChat({ id: currentChatId, text: inputText }).unwrap();
      setInputText("");
    } catch (err) {
      console.error("Failed to send message: ", err);
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
              Chats
            </h1>
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
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "queue"
                    ? "bg-white text-[#155D5F] shadow-sm"
                    : "text-slate/60 hover:text-dark"
                }`}
              >
                Queue ({users.filter((u: any) => u.stage === "queue").length})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "active"
                    ? "bg-white text-[#155D5F] shadow-sm"
                    : "text-slate/60 hover:text-dark"
                }`}
              >
                Active ({users.filter((u: any) => u.stage === "active").length})
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "resolved"
                    ? "bg-white text-[#155D5F] shadow-sm"
                    : "text-slate/60 hover:text-dark"
                }`}
              >
                Resolved ({users.filter((u: any) => u.stage === "resolved").length})
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => {
                  const currentId = user.id || user._id;
                  const selectedId = selectedChat?.id || selectedChat?._id;
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
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="bg-primary/5 font-bold text-primary">
                          {user.name[0]}
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
                        {user.name}
                      </p>
                      <p className="text-[11px] font-medium text-slate/50 truncate">
                        {user.lastMessage}
                      </p>
                    </div>
                    {(user.unreadCount ?? 0) > 0 && (
                      <div className="h-5 w-5 rounded-full bg-[#155D5F] flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
                        {user.unreadCount}
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
                No chat selected
              </h2>
              <p className="text-sm font-medium text-slate/40 max-w-[320px] leading-relaxed">
                Click on a user or admin from the list on the left to start a
                conversation and manage support requests.
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
                    <AvatarImage src={selectedChat.image} />
                    <AvatarFallback className="bg-primary/5 font-bold text-primary">
                      {selectedChat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {selectedChat.status === "online" && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#10B981] border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-dark flex items-center gap-2">
                    {selectedChat.name}
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
                          selectedChat.stage === "queue"
                            ? "bg-orange-100 text-orange-600 hover:bg-orange-100"
                            : selectedChat.stage === "active"
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-100"
                              : "bg-green-100 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {selectedChat.stage === "queue"
                          ? "In Queue"
                          : selectedChat.stage === "active"
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
                        className="text-slate/40 hover:text-dark rounded-full transition-colors outline-none"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white rounded-xl shadow-lg border-border/50 w-48 p-2"
                    >
                      {selectedChat.stage === "queue" && (
                        <DropdownMenuItem
                          onClick={() => handleClaimChat(selectedChat.id)}
                          className="cursor-pointer font-bold text-xs text-[#155D5F] hover:bg-surface py-2.5 rounded-lg px-3"
                        >
                          Claim Chat
                        </DropdownMenuItem>
                      )}
                      {selectedChat.stage === "active" && (
                        <DropdownMenuItem
                          onClick={() => handleCloseChat(selectedChat.id)}
                          className="cursor-pointer font-bold text-xs text-red-600 hover:bg-surface py-2.5 rounded-lg px-3"
                        >
                          Close / Resolve Chat
                        </DropdownMenuItem>
                      )}
                      {selectedChat.stage === "resolved" && (
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
              {messages.map((msg: any, idx: number) => (
                <div
                  key={msg.id}
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
                        <AvatarImage src={msg.senderImage} />
                        <AvatarFallback className="bg-primary/5 text-[10px] font-bold">
                          {msg.sender[0]}
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
            </div>

            {/* Input Area */}
            <div className="p-8 pt-4">
              <div className="relative group transition-all duration-300">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg group-focus-within:blur-xl transition-all opacity-0 group-focus-within:opacity-100" />
                <div className="relative flex items-center gap-3 bg-white border border-border/40 rounded-2xl p-2 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-primary/20 transition-all">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Write a message..."
                    className="flex-1 border-none shadow-none focus-visible:ring-0 text-sm font-medium h-12 bg-transparent"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="bg-transparent hover:bg-surface text-[#155D5F] rounded-xl h-10 w-10 shrink-0 transition-all active:scale-90"
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
