"use client";

import { useState } from "react";
import { Send, CheckCircle2, ChevronDown, Search, X, History, Clock, Calendar } from "lucide-react";
import { useGetUsersQuery } from "@/lib/redux/features/usersApi";
import { 
  useGetWealthGroupsQuery, 
  useGetBroadcastHistoryQuery, 
  useBroadcastNotificationMutation 
} from "@/lib/redux/features/adminApi";
import { toast } from "sonner";
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
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["push"]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  const { data: usersData } = useGetUsersQuery(undefined);
  const { data: groupsData } = useGetWealthGroupsQuery(undefined);
  const { data: historyData } = useGetBroadcastHistoryQuery(undefined);
  const [broadcastNotification] = useBroadcastNotificationMutation();

  const [activeTab, setActiveTab] = useState<"send" | "history">("send");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Safely extract the users array from the API response
  const actualUsers = Array.isArray(usersData?.data) ? usersData.data 
    : (Array.isArray(usersData?.data?.users) ? usersData.data.users 
    : (Array.isArray(usersData?.data?.items) ? usersData.data.items : []));

  const filteredUsers = actualUsers.filter((u: any) => 
    (u?.name || u?.firstName || "").toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    (u?.email || "").toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    (u?.id || "").toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const actualGroups = Array.isArray(groupsData?.data) ? groupsData.data 
    : (Array.isArray(groupsData?.data?.items) ? groupsData.data.items : []);

  const actualHistory = Array.isArray(historyData?.data) ? historyData.data 
    : (Array.isArray(historyData?.data?.items) ? historyData.data.items : []);

  const MOCK_PLANS = [
    { id: "wealthflex", name: "WealthFlex Users" },
    { id: "wealthfix", name: "WealthFix Users" },
    { id: "wealthgoal", name: "WealthGoal Users" },
    { id: "wealthfam", name: "WealthFam Users" },
    { id: "wealthflow", name: "WealthFlow Users" },
    { id: "wealthgroup", name: "WealthGroup Users" },
  ];

  const toggleTarget = (id: string) => {
    setTargetIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };
  
  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || selectedChannels.length === 0) return;

    setIsSubmitting(true);
    
    try {
      const payload = {
        channels: selectedChannels, 
        title,
        body: message,
        scheduledFor: isScheduled && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        target: {
          type: targetType.toUpperCase(),
          ...(targetType === "individual" && { userIds: targetIds }),
          ...(targetType === "group" && { groupIds: targetIds }),
          ...(targetType === "plan" && { plans: targetIds }),
        }
      };

      await broadcastNotification(payload).unwrap();
      
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to broadcast notification.");
    } finally {
      setIsSubmitting(false);
    }

    // Reset form after 3 seconds
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setTargetType("all");
      setTargetIds([]);
      setSelectedChannels(["push"]);
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
            
            {/* Delivery Channels */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-dark block">Delivery Channels</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "push", label: "Push Notification" },
                  { id: "email", label: "Email" }
                ].map(channel => (
                  <label key={channel.id} className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    selectedChannels.includes(channel.id) 
                      ? 'bg-primary/5 border-primary/40 text-primary' 
                      : 'bg-white border-border/60 hover:border-primary/20 text-slate/70'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                    />
                    <span className="text-sm font-bold">{channel.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/40" />

            {/* Target Audience Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark block">Target Audience</label>
              <div className="relative">
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    setTargetIds([]);
                  }}
                  className="appearance-none w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-dark focus:ring-1 focus:ring-primary/20 transition-all outline-none cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="individual">Specific Individuals</option>
                  <option value="group">Wealth Groups</option>
                  <option value="plan">Specific Wealth Plans</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {targetType === "individual" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-dark block">Select Individual Users</label>
                
                {/* Selected Chips */}
                {targetIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {targetIds.map(id => {
                      const user = actualUsers.find((u: any) => u.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-[#155D5F]/10 text-[#155D5F] border border-[#155D5F]/20 px-3 py-1.5 rounded-full text-xs font-bold">
                          {user?.name || user?.firstName || id}
                          <button type="button" onClick={() => toggleTarget(id)} className="hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-4 h-4 text-slate/40" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or user ID..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-60 overflow-y-auto overflow-x-hidden">
                      {filteredUsers.length > 0 ? (
                        <div className="py-2">
                          {filteredUsers.map((user: any) => {
                            const isSelected = targetIds.includes(user.id);
                            return (
                              <div
                                key={user.id}
                                onClick={() => {
                                  toggleTarget(user.id);
                                }}
                                className={`px-4 py-2.5 hover:bg-surface cursor-pointer transition-colors border-b border-border/40 last:border-0 ${isSelected ? 'bg-primary/5' : ''}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-primary rounded-md" />
                                    <span className="text-[13px] font-bold text-dark">{user.name || user.firstName}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate/40 px-2 py-0.5 bg-slate-100 rounded-full">{user.id}</span>
                                </div>
                                <span className="text-[12px] text-slate/60 font-medium ml-7">{user.email}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-slate/50">
                          No users found matching "{userSearchTerm}"
                        </div>
                      )}
                      <div className="p-2 border-t border-border bg-surface text-center">
                        <button type="button" onClick={() => setIsUserDropdownOpen(false)} className="text-xs font-bold text-primary hover:underline">Done selecting</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {targetType === "group" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-dark block">Select Wealth Groups</label>
                
                {/* Selected Chips */}
                {targetIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {targetIds.map(id => {
                      const group = actualGroups.find((g: any) => g.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-[#155D5F]/10 text-[#155D5F] border border-[#155D5F]/20 px-3 py-1.5 rounded-full text-xs font-bold">
                          {group?.name || id}
                          <button type="button" onClick={() => toggleTarget(id)} className="hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface/50 border border-border rounded-xl">
                  {actualGroups.map((group: any) => (
                    <label key={group.id} className="flex items-center gap-3 p-3 bg-white border border-border/60 hover:border-primary/30 rounded-lg cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={targetIds.includes(group.id)} 
                        onChange={() => toggleTarget(group.id)}
                        className="w-4 h-4 accent-primary rounded-md"
                      />
                      <span className="text-sm font-bold text-dark">{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {targetType === "plan" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-dark block">Select Wealth Plans</label>
                
                {/* Selected Chips */}
                {targetIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {targetIds.map(id => {
                      const plan = MOCK_PLANS.find(p => p.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-[#155D5F]/10 text-[#155D5F] border border-[#155D5F]/20 px-3 py-1.5 rounded-full text-xs font-bold">
                          {plan?.name || id}
                          <button type="button" onClick={() => toggleTarget(id)} className="hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-surface/50 border border-border rounded-xl">
                  {MOCK_PLANS.map(plan => (
                    <label key={plan.id} className="flex items-center gap-3 p-3 bg-white border border-border/60 hover:border-primary/30 rounded-lg cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={targetIds.includes(plan.id)} 
                        onChange={() => toggleTarget(plan.id)}
                        className="w-4 h-4 accent-primary rounded-md"
                      />
                      <span className="text-[13px] font-bold text-dark">{plan.name}</span>
                    </label>
                  ))}
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
                disabled={isSubmitting || !title || !message || selectedChannels.length === 0 || (targetType !== 'all' && targetIds.length === 0) || (isScheduled && !scheduledDate)}
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
                {actualHistory.map((log: any) => (
                  <TableRow key={log.id} className="border-border/50 hover:bg-surface/30 transition-all">
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate/50 text-[12px] font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : (log.date || 'N/A')}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5 max-w-[300px]">
                        <span className="font-bold text-[13px] text-dark truncate font-outfit">{log.title}</span>
                        <span className="text-[11px] text-slate/50 font-medium truncate">{log.body || log.message}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="text-[12px] font-semibold text-slate bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        {(log.target && typeof log.target === 'object') ? log.target.type : (log.targetType || log.target || 'N/A')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className={`inline-flex w-fit items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          (log.status?.toUpperCase() === 'SCHEDULED')
                            ? 'text-blue-600 bg-blue-50'
                            : (log.status?.toUpperCase() === 'FAILED')
                            ? 'text-red-600 bg-red-50'
                            : 'text-emerald-600 bg-emerald-50'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" /> {log.status || 'Sent'}
                        </span>
                        <span className="text-[10px] text-slate/40 font-medium">{log.deliveryRate || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right whitespace-nowrap">
                      <span className="text-[12px] font-bold text-dark">{log.senderName || log.admin || 'System'}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {actualHistory.length === 0 && (
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
