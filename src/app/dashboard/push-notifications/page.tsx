"use client";

import { useState } from "react";
import { Send, CheckCircle2, ChevronDown, Search, X, History, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PushNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetId, setTargetId] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  const [activeTab, setActiveTab] = useState<"send" | "history">("send");

  const [historyLogs, setHistoryLogs] = useState([
    {
      id: "1",
      title: "Welcome to Wealthconomy!",
      message: "Explore the new features available in your dashboard today.",
      target: "All Users",
      status: "Delivered",
      deliveryRate: "1,450 / 1,450",
      date: "May 28, 2026 10:00 AM",
      admin: "Super Admin",
    },
    {
      id: "2",
      title: "Lagos Tech Circle Milestone",
      message: "Congratulations on reaching 50% of your group target!",
      target: "Group: grp-1",
      status: "Delivered",
      deliveryRate: "6 / 6",
      date: "May 30, 2026 2:15 PM",
      admin: "Super Admin",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const MOCK_USERS = [
    { id: "U001", name: "Adewale Johnson", email: "adewale.j@gmail.com" },
    { id: "U002", name: "Simon Olabiran Odunayo", email: "simon.olabiran@gmail.com" },
    { id: "U003", name: "Fatima Yusuf", email: "fatima.y@live.com" },
    { id: "U004", name: "Chinelo Okoro", email: "c.okoro@outlook.com" },
    { id: "U005", name: "Emeka Obi", email: "emeka.obi@gmail.com" },
    { id: "U006", name: "Sarah Williams", email: "sarah.w@wealthconomy.com" },
  ];

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log("Push Notification Sent:", {
      title,
      message,
      targetType,
      targetId: targetType !== "all" ? targetId : null,
    });

    const dateFormatted = isScheduled && scheduledDate
      ? new Date(scheduledDate).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })
      : new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" });

    const newLog = {
      id: Math.random().toString(),
      title,
      message,
      target: targetType === "all" ? "All Users" : `${targetType === 'individual' ? 'User' : targetType === 'group' ? 'Group' : 'Plan'}: ${targetId || 'N/A'}`,
      status: isScheduled ? "Scheduled" : "Delivered",
      deliveryRate: isScheduled ? "Pending" : "100%",
      date: dateFormatted,
      admin: "Super Admin",
    };
    
    setHistoryLogs([newLog, ...historyLogs]);
    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setTargetType("all");
      setTargetId("");
      setIsScheduled(false);
      setScheduledDate("");
      setIsSuccess(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1137px] mx-auto min-h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-outfit text-dark">
            Push Notifications
          </h1>
          <p className="text-sm text-slate/50 mt-1">
            Broadcast messages or view your notification history.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab("send")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "send" ? "bg-white text-primary shadow-sm" : "text-slate/50 hover:text-dark"
            }`}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "history" ? "bg-white text-primary shadow-sm" : "text-slate/50 hover:text-dark"
            }`}
          >
            Broadcast History
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl w-full">
        {activeTab === "send" && (
          isSuccess ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold font-outfit text-emerald-800 mb-2">Notification Sent!</h2>
            <p className="text-emerald-600 text-sm">
              Your push notification has been successfully broadcasted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Target Audience Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark block">Target Audience</label>
              <div className="relative">
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    setTargetId("");
                  }}
                  className="appearance-none w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-dark focus:ring-1 focus:ring-primary/20 transition-all outline-none cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="individual">Specific Individual</option>
                  <option value="group">Wealth Group (By Group Target)</option>
                  <option value="plan">Specific Wealth Plan</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {targetType === "individual" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-dark block">Select Individual User</label>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-4 h-4 text-slate/40" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or user ID..."
                      value={targetId ? (MOCK_USERS.find(u => u.email === targetId)?.name || targetId) : userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setTargetId("");
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    />
                    {targetId && (
                      <button 
                        type="button"
                        onClick={() => { setTargetId(""); setUserSearchTerm(""); setIsUserDropdownOpen(true); }}
                        className="absolute right-4 p-1 hover:bg-slate-100 rounded-full text-slate/40 hover:text-slate/60 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-60 overflow-y-auto overflow-x-hidden">
                      {filteredUsers.length > 0 ? (
                        <div className="py-2">
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setTargetId(user.email);
                                setUserSearchTerm("");
                                setIsUserDropdownOpen(false);
                              }}
                              className="px-4 py-2.5 hover:bg-surface cursor-pointer transition-colors border-b border-border/40 last:border-0"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[13px] font-bold text-dark">{user.name}</span>
                                <span className="text-[10px] font-bold text-slate/40 px-2 py-0.5 bg-slate-100 rounded-full">{user.id}</span>
                              </div>
                              <span className="text-[12px] text-slate/60 font-medium">{user.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-slate/50">
                          No users found matching "{userSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {targetType === "group" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-dark block">Select Wealth Group</label>
                <div className="relative">
                  <select
                    required
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="appearance-none w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select a group...</option>
                    <option value="grp-1">Lagos Tech Circle (₦5,000,000)</option>
                    <option value="grp-2">Abuja Professional Fund (₦2,500,000)</option>
                    <option value="grp-3">Port Harcourt Women's Savings (₦800,000)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {targetType === "plan" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-dark block">Select Wealth Plan</label>
                <div className="relative">
                  <select
                    required
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="appearance-none w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select a plan...</option>
                    <option value="wealthflex">WealthFlex Users</option>
                    <option value="wealthfix">WealthFix Users</option>
                    <option value="wealthgoal">WealthGoal Users</option>
                    <option value="wealthfam">WealthFam Users</option>
                    <option value="wealthflow">WealthFlow Users</option>
                    <option value="wealthgroup">WealthGroup Users</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border/40" />

            {/* Notification Content Inputs */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark block">Notification Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Special Weekend Bonus!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark block">Message Content</label>
              <textarea
                required
                placeholder="Write your push notification message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
              />
              <div className="flex justify-end">
                <span className={`text-[11px] font-medium ${message.length > 150 ? 'text-orange-500' : 'text-slate/40'}`}>
                  {message.length}/200 characters ideally
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
              <div>
                <h4 className="text-sm font-bold text-dark flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Schedule Notification
                </h4>
                <p className="text-xs text-slate/50 mt-1">Send this notification at a later date and time.</p>
              </div>
              <div className="flex items-center gap-4">
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required={isScheduled}
                    className="px-3 py-2 bg-white border border-border rounded-lg text-sm text-dark focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !title || !message || (targetType !== 'all' && !targetId) || (isScheduled && !scheduledDate)}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 flex items-center gap-2 font-bold font-outfit shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isScheduled ? "Scheduling..." : "Sending..."}
                  </>
                ) : (
                  <>
                    {isScheduled ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {isScheduled ? "Schedule Notification" : "Send Notification"}
                  </>
                )}
              </Button>
            </div>

          </form>
          )
        )}
        
        {activeTab === "history" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-slate/40 font-medium text-xs pb-4">Date Sent</TableHead>
                  <TableHead className="text-slate/40 font-medium text-xs pb-4">Notification</TableHead>
                  <TableHead className="text-slate/40 font-medium text-xs pb-4">Target Audience</TableHead>
                  <TableHead className="text-slate/40 font-medium text-xs pb-4">Status</TableHead>
                  <TableHead className="text-slate/40 font-medium text-xs pb-4 text-right">Sent By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLogs.map((log) => (
                  <TableRow key={log.id} className="border-border/50 hover:bg-surface/30 transition-all">
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate/50 text-[12px] font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {log.date}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5 max-w-[300px]">
                        <span className="font-bold text-[13px] text-dark truncate font-outfit">{log.title}</span>
                        <span className="text-[11px] text-slate/50 font-medium truncate">{log.message}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="text-[12px] font-semibold text-slate bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        {log.target}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> {log.status}
                        </span>
                        <span className="text-[10px] text-slate/40 font-medium">{log.deliveryRate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right whitespace-nowrap">
                      <span className="text-[12px] font-bold text-dark">{log.admin}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {historyLogs.length === 0 && (
              <div className="text-center py-20 flex flex-col items-center justify-center">
                <History className="w-12 h-12 text-slate/20 mb-4" />
                <h3 className="text-lg font-bold text-dark font-outfit">No broadcasts yet</h3>
                <p className="text-sm text-slate/50">Notifications you send will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
