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

// Mock Data
const ADMINS = [
  {
    id: 1,
    name: "Simon",
    lastMessage: "Quick update on the... ",
    time: "10:00am",
    status: "online",
    image: "https://i.pravatar.cc/150?u=a1",
  },
  {
    id: 2,
    name: "Fatima",
    lastMessage: "Ready when you are",
    time: "11:30am",
    status: "online",
    image: "https://i.pravatar.cc/150?u=a2",
  },
  {
    id: 3,
    name: "Jessica",
    lastMessage: "Let's review the... ",
    time: "9:45am",
    status: "online",
    image: "https://i.pravatar.cc/150?u=a3",
  },
  {
    id: 4,
    name: "John",
    lastMessage: "I'll handle the... ",
    time: "12:00pm",
    status: "offline",
    image: "https://i.pravatar.cc/150?u=a4",
  },
  {
    id: 5,
    name: "Ali",
    lastMessage: "Meeting in 5",
    time: "2:00pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=a5",
  },
];

const USERS = [
  {
    id: 101,
    name: "Alice Thompson",
    lastMessage: "Thanks for your help",
    time: "2:00pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s1",
    unreadCount: 2,
  },
  {
    id: 102,
    name: "Bob Richards",
    lastMessage: "I have a question",
    time: "1:50pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s2",
    unreadCount: 0,
  },
  {
    id: 103,
    name: "Charlie Davis",
    lastMessage: "Problem with deposit",
    time: "1:45pm",
    status: "offline",
    image: "https://i.pravatar.cc/150?u=s3",
    unreadCount: 1,
  },
  {
    id: 104,
    name: "Diana Prince",
    lastMessage: "App is crashing",
    time: "1:30pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s4",
    unreadCount: 0,
  },
  {
    id: 105,
    name: "Ethan Hunt",
    lastMessage: "Mission accomplished",
    time: "1:15pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s5",
    unreadCount: 5,
  },
  {
    id: 106,
    name: "Fiona Gallagher",
    lastMessage: "Help me please",
    time: "1:00pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s6",
    unreadCount: 0,
  },
  {
    id: 107,
    name: "George Miller",
    lastMessage: "Login issues",
    time: "12:45pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s7",
    unreadCount: 0,
  },
  {
    id: 108,
    name: "Hannah Montana",
    lastMessage: "Best of both worlds",
    time: "12:30pm",
    status: "online",
    image: "https://i.pravatar.cc/150?u=s8",
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "Alice Thompson",
    text: "Good morning! I just registered but when I try to make my first deposit, the app crashes. Please help!",
    time: "2:00pm",
    isMe: false,
    senderImage: "https://i.pravatar.cc/150?u=s1",
  },
  {
    id: 2,
    sender: "Wealthconomy",
    text: "Good morning, Fatima! Welcome to Wealthconomy! 🚀",
    time: "2:10pm",
    isMe: true,
  },
  {
    id: 3,
    sender: "Wealthconomy",
    text: "I'm sorry you're experiencing this. Let's fix it together. What step exactly does the crash happen?",
    time: "2:10pm",
    isMe: true,
  },
  {
    id: 4,
    sender: "Alice Thompson",
    text: "When I click 'Win-Up' then 'Deposit' and choose the amount, it crashes immediately after I enter ₦5,000.",
    time: "2:00pm",
    isMe: false,
    senderImage: "https://i.pravatar.cc/150?u=s1",
  },
  {
    id: 5,
    sender: "Wealthconomy",
    text: "Thank you for those details. This helps a lot! Let's try three quick things:\n\n1. Close the app completely (swipe it away)\n2. Clear your app cache (Settings → Apps → Wealthconomy)\n3. Update to the latest version (v1.2.4)",
    time: "2:10pm",
    isMe: true,
  },
];

export default function SupportCentrePage() {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toString().includes(searchTerm),
  );

  const toggleChat = (item: any) => {
    if (selectedChat?.id === item.id) {
      setSelectedChat(null);
    } else {
      setSelectedChat(item);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: messages.length + 1,
      sender: "Wealthconomy",
      text: inputText,
      time: new Date()
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        .toLowerCase(),
      isMe: true,
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="bg-white rounded-[20px] border border-border/50 shadow-sm w-full max-w-[1137px] h-[850px] mx-auto flex overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className="w-[380px] border-r border-border/50 flex flex-col bg-white">
        <div className="p-6 space-y-6 flex flex-col h-full">
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

          {/* Admins */}
          <div className="space-y-3">
            <h2 className="text-[13px] font-bold text-slate/70 ml-1">Admins</h2>
            <div className="bg-surface/30 border border-border/30 rounded-[20px] p-4 pr-2 flex items-center gap-2 overflow-x-auto custom-scrollbar scrollbar-hide">
              <div className="flex items-center gap-4 min-w-max pr-2">
                {ADMINS.map((admin) => (
                  <div
                    key={admin.id}
                    onClick={() => toggleChat(admin)}
                    className={`flex flex-col items-center gap-2 cursor-pointer group px-1 rounded-xl transition-all ${selectedChat?.id === admin.id ? "opacity-100 scale-105" : "opacity-70 hover:opacity-100"}`}
                  >
                    <div
                      className={`relative p-0.5 rounded-full ring-2 transition-all ${selectedChat?.id === admin.id ? "ring-primary" : "ring-transparent"}`}
                    >
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarImage src={admin.image} />
                        <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary">
                          {admin.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {admin.status === "online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold transition-colors ${selectedChat?.id === admin.id ? "text-primary" : "text-slate/60 group-hover:text-dark"}`}
                    >
                      {admin.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="sticky right-0 flex items-center justify-center bg-surface/90 backdrop-blur-sm h-10 w-8 ml-auto">
                <ChevronRight className="h-4 w-4 text-slate/40" />
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-slate/70 ml-1">
                Users
              </h2>
              <Badge className="bg-[#EF4444] hover:bg-[#EF4444] text-white rounded-lg px-2.5 py-0.5 text-[11px] font-bold border-none">
                Queue(21)
              </Badge>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleChat(user)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all group border ${
                      selectedChat?.id === user.id
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
                        className={`text-sm font-bold truncate ${selectedChat?.id === user.id ? "text-dark" : "text-dark/80 group-hover:text-dark"}`}
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
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-40">
                  <Search className="h-8 w-8 text-slate/40" />
                  <p className="text-xs font-bold font-outfit">
                    No users found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-white">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-3 bg-surface/50 rounded-full shadow-inner relative">
              <div className=" " />
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
                  <h3 className="text-base font-bold text-dark">
                    {selectedChat.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] font-bold text-slate/40 uppercase tracking-wider">
                      Online
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate/40 hover:text-dark rounded-full transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
              {messages.map((msg, idx) => (
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
