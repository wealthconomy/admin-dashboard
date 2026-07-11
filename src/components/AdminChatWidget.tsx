"use client";

import { useState, useEffect, useMemo } from "react";
import { MessageSquare, X, Send, ChevronRight, CheckCheck, Minimize2 } from "lucide-react";
import Image from "next/image";
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
import { Loader2 } from "lucide-react";

export function AdminChatWidget() {
  const { data: teamData, isLoading: isTeamLoading } = useGetInternalTeamQuery();
  const team = Array.isArray(teamData) ? teamData : (teamData?.data || []);

  const { data: meData } = useGetMeQuery(undefined);
  const loggedInUser = useSelector((state: any) => state.auth.user);
  const userMe = meData?.data || loggedInUser || {};
  const currentUserId = userMe.id || userMe._id || loggedInUser?.id || loggedInUser?._id || "default";

  const [isOpen, setIsOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [inputText, setInputText] = useState("");

  const currentAdminId = selectedAdmin?.userId || selectedAdmin?.id || selectedAdmin?._id;
  const { data: messagesData, isFetching } = useGetInternalMessagesQuery(currentAdminId, {
    skip: !selectedAdmin,
    pollingInterval: isOpen && selectedAdmin ? 5000 : 0,
  });

  const [sendMessage] = useSendInternalMessageMutation();

  const [lastMessagesMap, setLastMessagesMap] = useState<Record<string, { text: string; time: string }>>({});

  // Load cache when currentUserId is resolved
  useEffect(() => {
    if (typeof window !== "undefined" && currentUserId !== "default") {
      try {
        const saved = localStorage.getItem(`admin_chat_last_messages_${currentUserId}`);
        if (saved) {
          setLastMessagesMap(JSON.parse(saved));
        } else {
          setLastMessagesMap({});
        }
      } catch {
        setLastMessagesMap({});
      }
    }
  }, [currentUserId]);

  // Save cache when lastMessagesMap or currentUserId changes
  useEffect(() => {
    if (typeof window !== "undefined" && currentUserId !== "default") {
      localStorage.setItem(`admin_chat_last_messages_${currentUserId}`, JSON.stringify(lastMessagesMap));
    }
  }, [lastMessagesMap, currentUserId]);

  const rawMessages = Array.isArray(messagesData) ? messagesData : (messagesData?.data || []);
  const activeMessages = useMemo(() => {
    return rawMessages.map((msg: any) => {
      const isMe = msg.senderId === currentUserId;
      const time = msg.createdAt 
        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";
      return {
        ...msg,
        isMe,
        time
      };
    });
  }, [rawMessages, currentUserId]);

  useEffect(() => {
    if (currentAdminId && activeMessages.length > 0 && !isFetching) {
      const lastMsg = activeMessages[activeMessages.length - 1];
      const timeStr = lastMsg.time || "";
      
      setLastMessagesMap(prev => {
        const existing = prev[currentAdminId];
        if (existing && existing.text === lastMsg.text && existing.time === timeStr) {
          return prev;
        }
        return {
          ...prev,
          [currentAdminId]: {
            text: lastMsg.text,
            time: timeStr
          }
        };
      });
    }
  }, [activeMessages, currentAdminId, isFetching]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedAdmin) return;
    
    try {
      const recipientId = selectedAdmin.userId || selectedAdmin.id || selectedAdmin._id;
      await sendMessage({ receiverId: recipientId, text: inputText }).unwrap();
      
      // Instantly update the last message map for better responsiveness
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastMessagesMap(prev => ({
        ...prev,
        [recipientId]: {
          text: inputText,
          time: timeStr
        }
      }));
      
      setInputText("");
    } catch (err) {
      console.error("Failed to send message: ", err);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-xl shadow-[#155D5F]/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50 group"
        >
          <MessageSquare className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform" />
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-[#155D5F]"></span>
          </span>
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
              </h3>
              <p className="text-[11px] text-white/70 font-medium">Internal administrative communication</p>
            </div>
            <button onClick={toggleOpen} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <Minimize2 className="h-4.5 w-4.5" />
            </button>
          </div>

          {!selectedAdmin ? (
            /* Admin List View */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              <div className="px-2 py-3">
                <span className="text-[11px] font-bold text-slate/50 uppercase tracking-widest">Active Team Members</span>
              </div>
              {team.map((admin: any) => {
                const adminId = admin.id || admin._id;
                const userObj = admin.user || admin;
                const displayName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.name || userObj.email || "Admin";
                const displayImage = userObj.imageUrl || admin.imageUrl || admin.avatarUrl || admin.image || "";
                const displayRole = admin.role === "CUSTOM" && admin.customRole ? admin.customRole.name : admin.role || "Admin";
                
                const recipientKey = userObj.userId || admin.userId || adminId;
                const lastMsgData = lastMessagesMap[recipientKey];
                const displayLastMsg = lastMsgData ? lastMsgData.text : "Click to view chat";
                const displayTime = lastMsgData ? lastMsgData.time : "";

                return (
                <div 
                  key={adminId} 
                  onClick={() => setSelectedAdmin({ ...admin, displayName, displayImage, displayRole })}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface/60 cursor-pointer transition-colors group"
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      <AvatarImage src={displayImage} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 font-bold text-primary flex items-center justify-center">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {admin.status === "online" && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-dark truncate leading-none">{displayName}</span>
                      <span className="text-[9px] text-slate/40 font-bold">{displayTime}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[11px] text-slate/50 truncate max-w-[140px] leading-none">{displayLastMsg}</span>
                      <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-bold px-1.5 py-0 leading-none">
                        {displayRole}
                      </Badge>
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
                <button onClick={() => setSelectedAdmin(null)} className="h-8 w-8 rounded-full hover:bg-surface flex items-center justify-center">
                  <ChevronRight className="h-4.5 w-4.5 rotate-180 text-slate/60" />
                </button>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={selectedAdmin.displayImage} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{selectedAdmin.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-dark leading-tight truncate">{selectedAdmin.displayName}</h4>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Online
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
                        {msg.isMe && <CheckCheck className="h-3 w-3 text-[#155D5F] opacity-60" />}
                      </div>
                    </div>
                  ))
                )}
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
                    className="h-8 w-8 rounded-lg bg-[#155D5F] hover:bg-[#0F4A4C] text-white shrink-0 shadow-md"
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
