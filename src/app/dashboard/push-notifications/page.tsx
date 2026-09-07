"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle2,
  ChevronDown,
  Search,
  X,
  History,
  Clock,
  Calendar,
  Eye,
  Radio,
  Mail,
  Users,
  Layers,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useGetUsersQuery } from "@/lib/redux/features/usersApi";
import {
  useGetWealthGroupsQuery,
  useGetBroadcastHistoryQuery,
  useBroadcastNotificationMutation,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function PushNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["push"]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery(undefined);
  const { data: groupsData, isLoading: isGroupsLoading } = useGetWealthGroupsQuery(undefined);
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useGetBroadcastHistoryQuery(undefined);
  const [broadcastNotification] = useBroadcastNotificationMutation();

  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [historySearch, setHistorySearch] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // User search
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Group search
  const [groupSearchTerm, setGroupSearchTerm] = useState("");

  // History detail preview modal
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);

  // Safely extract users
  const actualUsers: any[] = Array.isArray(usersData?.data)
    ? usersData.data
    : Array.isArray(usersData?.data?.users)
    ? usersData.data.users
    : Array.isArray(usersData?.data?.items)
    ? usersData.data.items
    : [];

  const filteredUsers = actualUsers.filter(
    (u: any) =>
      (u?.name || u?.firstName || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u?.email || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u?.id || "").toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Safely extract groups
  const actualGroups: any[] = Array.isArray(groupsData?.data)
    ? groupsData.data
    : Array.isArray(groupsData?.data?.items)
    ? groupsData.data.items
    : [];

  const filteredGroups = actualGroups.filter((g: any) =>
    (g?.name || g?.title || "").toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  // Safely extract history
  const actualHistory: any[] = Array.isArray(historyData?.data)
    ? historyData.data
    : Array.isArray(historyData?.data?.items)
    ? historyData.data.items
    : [];

  const filteredHistory = actualHistory.filter((log: any) => {
    const q = historySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (log?.title || "").toLowerCase().includes(q) ||
      (log?.body || log?.message || "").toLowerCase().includes(q) ||
      (log?.sentBy || log?.senderName || "").toLowerCase().includes(q)
    );
  });

  const SYSTEM_PLANS = [
    { id: "wealthflex", name: "WealthFlex Users" },
    { id: "wealthfix", name: "WealthFix Users" },
    { id: "wealthgoal", name: "WealthGoal Users" },
    { id: "wealthfam", name: "WealthFam Users" },
    { id: "wealthflow", name: "WealthFlow Users" },
    { id: "wealthgroup", name: "WealthGroup Users" },
  ];

  const toggleTarget = (id: string) => {
    setTargetIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || selectedChannels.length === 0) {
      toast.error("Please provide a title, message, and at least one channel.");
      return;
    }

    if (targetType !== "all" && targetIds.length === 0) {
      toast.error("Please select at least one recipient or target.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        channels: selectedChannels,
        title: title.trim(),
        body: message.trim(),
        scheduledFor:
          isScheduled && scheduledDate
            ? new Date(scheduledDate).toISOString()
            : undefined,
        target: {
          type: targetType.toUpperCase(),
          ...(targetType === "individual" && { userIds: targetIds }),
          ...(targetType === "group" && { groupIds: targetIds }),
          ...(targetType === "plan" && { plans: targetIds }),
        },
      };

      await broadcastNotification(payload).unwrap();

      toast.success("Broadcast notification queued successfully!");
      setIsSuccess(true);
      refetchHistory();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to broadcast notification.");
    } finally {
      setIsSubmitting(false);
    }

    // Reset form after short delay
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setTargetType("all");
      setTargetIds([]);
      setSelectedChannels(["push"]);
      setIsScheduled(false);
      setScheduledDate("");
      setIsSuccess(false);
    }, 2500);
  };

  // Strip HTML tags for clean preview
  const stripHtml = (htmlStr: string) => {
    if (!htmlStr) return "";
    return htmlStr.replace(/<[^>]*>?/gm, "").trim();
  };

  const getTargetBadge = (target: any, targetTypeFallback?: string) => {
    if (!target && !targetTypeFallback) return "All Users";
    if (typeof target === "string") return target;

    const type = target?.type || targetTypeFallback;
    if (type === "ALL") return "All Users";
    if (type === "GROUP") {
      const count = target?.groupIds?.length;
      return count ? `Wealth Groups (${count})` : "Wealth Groups";
    }
    if (type === "INDIVIDUAL") {
      const count = target?.userIds?.length;
      return count ? `Specific Users (${count})` : "Individual Users";
    }
    if (type === "PLAN") {
      const count = target?.plans?.length;
      return count ? `Wealth Plans (${count})` : "Wealth Plans";
    }
    if (target?.segment === "SUBSCRIBERS_ONLY") {
      return `Subscribers (${target?.recipientCount ?? 4})`;
    }
    return type || "All Users";
  };

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto flex flex-col animate-in fade-in duration-500 space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            Push Notifications
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Broadcast Central
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Dispatch announcements, marketing updates, and notifications directly to user devices.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab("send")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "send"
                ? "bg-white text-primary shadow-sm"
                : "text-slate/60 hover:text-dark"
            }`}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white text-primary shadow-sm"
                : "text-slate/60 hover:text-dark"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Broadcast History
            {actualHistory.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                {actualHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {activeTab === "send" &&
          (isSuccess ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center my-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-outfit text-emerald-800 mb-1">
                Notification Broadcast Queued!
              </h2>
              <p className="text-emerald-700/80 text-xs font-medium max-w-md">
                Your broadcast has been successfully dispatched to the target recipient channels.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
              {/* Delivery Channels */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-dark block">
                  Delivery Channels <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { id: "push", label: "Push Notification", icon: Radio },
                    { id: "email", label: "Email", icon: Mail },
                  ].map((channel) => {
                    const isChecked = selectedChannels.includes(channel.id);
                    const Icon = channel.icon;
                    return (
                      <label
                        key={channel.id}
                        className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                          isChecked
                            ? "bg-[#155D5F]/10 border-[#155D5F] text-[#155D5F]"
                            : "bg-surface/40 border-border/60 hover:bg-surface text-slate/70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => toggleChannel(channel.id)}
                        />
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked
                              ? "bg-[#155D5F] border-[#155D5F] text-white"
                              : "border-border bg-white"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{channel.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1 border-t border-border/40" />

              {/* Target Audience Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-dark block">
                  Target Recipient Segment <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-md">
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value);
                      setTargetIds([]);
                    }}
                    className="appearance-none w-full px-4 py-3 bg-surface border border-border/60 rounded-xl text-xs font-bold text-dark focus:ring-1 focus:ring-primary/30 transition-all outline-none cursor-pointer pr-10"
                  >
                    <option value="all">All Platform Users</option>
                    <option value="individual">Specific Individual Users</option>
                    <option value="group">Wealth Groups</option>
                    <option value="plan">Specific Wealth Plans</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate/50 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Sub-Selection: Individual Users */}
              {targetType === "individual" && (
                <div className="space-y-3 p-4 bg-surface/40 border border-border/50 rounded-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-dark block">
                      Select Users ({targetIds.length} selected)
                    </label>
                    {targetIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTargetIds([])}
                        className="text-[11px] text-red-500 hover:underline font-bold"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Selected Chips */}
                  {targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white rounded-xl border border-border/30">
                      {targetIds.map((id) => {
                        const user = actualUsers.find((u: any) => u.id === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-1.5 bg-[#155D5F]/10 text-[#155D5F] border border-[#155D5F]/20 px-2.5 py-1 rounded-lg text-xs font-bold"
                          >
                            <span className="truncate max-w-[140px]">
                              {user?.name || user?.firstName || id}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTarget(id)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Search and In-flow User Selector */}
                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3.5 w-4 h-4 text-slate/40" />
                      <Input
                        type="text"
                        placeholder="Search by name, email, or user ID..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 h-11 bg-white border-border/60 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div className="bg-white border border-border/60 rounded-xl max-h-52 overflow-y-auto divide-y divide-border/30">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.slice(0, 50).map((user: any) => {
                          const isSelected = targetIds.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              onClick={() => toggleTarget(user.id)}
                              className={`px-4 py-2.5 hover:bg-surface/70 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                                isSelected ? "bg-[#155D5F]/5" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="w-4 h-4 accent-[#155D5F] rounded shrink-0 pointer-events-none"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-dark truncate">
                                    {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
                                  </p>
                                  <p className="text-[11px] text-slate/60 font-medium truncate">
                                    {user.email || user.id}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate/40 px-2 py-0.5 bg-slate-100 rounded-md shrink-0">
                                {user.id?.slice(-6)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate/50">
                          {isUsersLoading ? "Loading users..." : `No users found matching "${userSearchTerm}"`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Selection: Wealth Groups */}
              {targetType === "group" && (
                <div className="space-y-3 p-4 bg-surface/40 border border-border/50 rounded-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-dark block">
                      Select Wealth Groups ({targetIds.length} selected)
                    </label>
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate/40" />
                      <Input
                        type="text"
                        placeholder="Search groups..."
                        value={groupSearchTerm}
                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                        className="h-8 pl-8 text-[11px] bg-white rounded-lg border-border/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group: any) => {
                        const isSelected = targetIds.includes(group.id);
                        return (
                          <label
                            key={group.id}
                            className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#155D5F] bg-[#155D5F]/5 shadow-sm"
                                : "border-border/60 hover:bg-surface"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTarget(group.id)}
                              className="w-4 h-4 accent-[#155D5F] rounded"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-dark truncate">
                                {group.name || group.title || "Group"}
                              </p>
                              {group.id && (
                                <p className="text-[10px] text-slate/40 font-mono truncate">
                                  {group.id}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-6 text-xs text-slate/50">
                        {isGroupsLoading ? "Loading groups..." : "No groups found."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Selection: Wealth Plans */}
              {targetType === "plan" && (
                <div className="space-y-3 p-4 bg-surface/40 border border-border/50 rounded-2xl animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-dark block">
                    Select Target Wealth Plans ({targetIds.length} selected)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SYSTEM_PLANS.map((plan) => {
                      const isSelected = targetIds.includes(plan.id);
                      return (
                        <label
                          key={plan.id}
                          className={`flex items-center gap-2.5 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#155D5F] bg-[#155D5F]/5"
                              : "border-border/60 hover:bg-surface"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTarget(plan.id)}
                            className="w-4 h-4 accent-[#155D5F] rounded"
                          />
                          <span className="text-xs font-bold text-dark truncate">
                            {plan.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-1 border-t border-border/40" />

              {/* Notification Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark block">
                  Broadcast Title <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g., Special Weekend Bonus or High-Yield Update"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 bg-surface/40 border-border/60 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-dark block">
                    Message Body <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      message.length > 200 ? "text-amber-600" : "text-slate/40"
                    }`}
                  >
                    {message.length}/250 characters
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your broadcast message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-xl border border-border/60 bg-surface/40 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none leading-relaxed"
                />
              </div>

              {/* Schedule Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50 p-4 rounded-2xl border border-border/50">
                <div>
                  <h4 className="text-xs font-bold text-dark flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#155D5F]" /> Schedule for Later
                  </h4>
                  <p className="text-[11px] text-slate/50 font-medium mt-0.5">
                    Queue this broadcast for automated dispatch at a specific timestamp.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isScheduled && (
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required={isScheduled}
                      className="px-3 py-1.5 bg-white border border-border/60 rounded-xl text-xs text-dark focus:ring-1 focus:ring-primary/30 outline-none"
                    />
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155D5F]"></div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !title.trim() ||
                    !message.trim() ||
                    selectedChannels.length === 0 ||
                    (targetType !== "all" && targetIds.length === 0) ||
                    (isScheduled && !scheduledDate)
                  }
                  className="h-11 px-8 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isScheduled ? "Scheduling..." : "Broadcasting..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isScheduled ? "Schedule Broadcast" : "Dispatch Broadcast"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ))}

        {/* Tab 2: Broadcast History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/40" />
                <Input
                  type="text"
                  placeholder="Filter history by title or message..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-10 h-10 bg-surface/50 border-border/50 text-xs rounded-xl"
                />
              </div>
              <p className="text-xs text-slate/50 font-medium">
                Showing {filteredHistory.length} recorded broadcasts
              </p>
            </div>

            {/* History Table */}
            <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
              <Table>
                <TableHeader className="bg-surface/50">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[160px]">
                      Date Sent
                    </TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[240px]">
                      Notification
                    </TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                      Channels
                    </TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                      Target Audience
                    </TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                      Status
                    </TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">
                      Sent By
                    </TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <p className="text-sm font-medium text-slate/40">Loading broadcast history...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredHistory.length > 0 ? (
                    filteredHistory.map((log: any) => {
                      const dateStr = log.createdAt || log.date;
                      const formattedDate = dateStr
                        ? format(new Date(dateStr), "MMM dd, yyyy · HH:mm")
                        : "-";
                      const cleanBody = stripHtml(log.body || log.message || "");
                      const channels: string[] = Array.isArray(log.channels)
                        ? log.channels
                        : ["push"];

                      const isDelivered =
                        log.status?.toUpperCase() === "DELIVERED" ||
                        log.status?.toUpperCase() === "SENT";

                      return (
                        <TableRow
                          key={log.id}
                          className="border-border/50 hover:bg-surface/30 transition-all"
                        >
                          <TableCell className="py-4 px-4 text-slate/60 text-xs font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate/40 shrink-0" />
                              <span>{formattedDate}</span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <div className="flex flex-col gap-0.5 max-w-[220px]">
                              <span className="font-bold text-dark text-xs truncate" title={log.title}>
                                {log.title}
                              </span>
                              <span className="text-[11px] text-slate/50 font-medium truncate" title={cleanBody}>
                                {cleanBody}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {channels.map((ch) => (
                                <Badge
                                  key={ch}
                                  variant="outline"
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                    ch.toLowerCase() === "push"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}
                                >
                                  {ch.toUpperCase()}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className="bg-surface text-slate-700 border-border/60 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            >
                              {getTargetBadge(log.target, log.targetType)}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-4 px-4 text-center">
                            {isDelivered ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {log.status || "SENT"}
                              </Badge>
                            ) : log.status?.toUpperCase() === "SCHEDULED" ? (
                              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Scheduled
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {log.status || "Pending"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="py-4 px-4 text-right text-xs font-bold text-dark whitespace-nowrap">
                            {log.sentBy || log.senderName || "Admin"}
                          </TableCell>

                          <TableCell className="py-4 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBroadcast(log)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#155D5F]/10 hover:text-[#155D5F] text-slate/60 cursor-pointer"
                              title="Preview Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <History className="w-10 h-10 text-slate/20 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-dark font-outfit">No broadcasts recorded</h3>
                        <p className="text-xs text-slate/50 mt-1">
                          Notifications you broadcast will appear in this audit list.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Preview Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[24px] w-full max-w-[620px] max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">Notification Details</h2>
                  <p className="text-xs text-slate/50 font-medium">
                    Dispatched on{" "}
                    {selectedBroadcast.createdAt
                      ? format(new Date(selectedBroadcast.createdAt), "PPP · p")
                      : "-"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBroadcast(null)}
                className="text-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-surface/50 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">
                    Broadcast Title
                  </span>
                  <span className="font-bold text-dark text-sm mt-0.5 block">
                    {selectedBroadcast.title}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">
                    Target Segment
                  </span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {getTargetBadge(selectedBroadcast.target, selectedBroadcast.targetType)}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">
                    Status
                  </span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {selectedBroadcast.status || "SENT"}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">
                    Dispatched By
                  </span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {selectedBroadcast.sentBy || selectedBroadcast.senderName || "Admin"}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">
                    Channels
                  </span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {(selectedBroadcast.channels || ["push"]).join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">
                    Broadcast ID
                  </span>
                  <span className="font-mono text-slate-500 mt-0.5 block truncate">
                    {selectedBroadcast.id}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark block">Message Content</label>
                <div className="p-4 rounded-xl border border-border/50 bg-slate-50 text-xs text-dark leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedBroadcast.body || selectedBroadcast.message || "No message content."}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/30 flex items-center justify-end bg-surface/20">
              <Button
                variant="outline"
                onClick={() => setSelectedBroadcast(null)}
                className="rounded-xl text-xs font-bold px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
