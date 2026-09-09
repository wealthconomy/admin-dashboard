"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRightLeft,
  Users,
  ShieldCheck,
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    hasNext,
    hasPrev,
    fetchNextPage,
    fetchPrevPage,
    pageNumber,
    totalCount,
    isLoading,
    isFetching,
    refetch,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const tabs = [
    "All",
    "Financial",
    "Management",
    "Content",
    "Security",
    "System",
  ];

  const getTypeBadgeStyle = (type: string) => {
    const lower = (type || "").toLowerCase();
    switch (lower) {
      case "financial":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "management":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "content":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "security":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "system":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-teal-50 text-teal-700 border-teal-200";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "All" || n.type.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleClearAll = () => {
    clearAll();
    toast.success("Notification history cleared");
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast.success("Notification deleted");
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-border/40 shadow-sm w-full max-w-[1000px] h-fit shrink-0 mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="group flex items-center gap-2 -ml-2 text-slate/60 hover:text-primary transition-all font-bold text-xs"
        >
          <div className="h-8 w-8 rounded-full bg-surface group-hover:bg-primary/5 flex items-center justify-center transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-10 px-3 rounded-xl border-border/30 text-[11px] font-bold text-slate hover:bg-surface transition-all gap-1.5 cursor-pointer"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || notifications.length === 0}
            className="h-10 px-4 rounded-xl border-border/30 text-[11px] font-bold text-slate hover:bg-surface transition-all gap-2 cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="h-10 px-4 rounded-xl border-border/30 text-[11px] font-bold text-red-500 hover:bg-red-50 transition-all gap-2 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Header Area */}
      <div className="mb-8">
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-outfit text-dark tracking-tight flex items-center gap-3">
            Notification Center
            <Badge className="bg-primary/10 text-primary border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold">
              {unreadCount} New Alerts
            </Badge>
          </h1>
          <p className="text-[13px] font-medium text-slate/40">
            Keep track of your administrative and system alerts.
          </p>
        </div>
      </div>

      {/* Controls Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-1 bg-surface/30 rounded-2xl border border-border/10">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm ring-1 ring-border/10"
                  : "text-slate/60 hover:text-dark hover:bg-white/40"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[240px] px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate/40" />
          <Input
            placeholder="Search alerts..."
            className="h-9 pl-9 bg-white border-border/20 rounded-xl text-[11px] font-medium focus-visible:ring-primary/5 shadow-none border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 space-y-2.5 min-w-0">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`group relative p-4 bg-white border rounded-[20px] flex items-start gap-4 transition-all duration-300 hover:border-border/60 overflow-hidden ${
                n.status === "unread"
                  ? "border-red-200/80 bg-red-50/[0.01]"
                  : "border-border/30"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm ring-1 ${
                  n.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                    : n.color === "blue"
                      ? "bg-blue-50 text-blue-600 ring-blue-100"
                      : n.color === "purple"
                        ? "bg-purple-50 text-purple-600 ring-purple-100"
                        : n.color === "orange"
                          ? "bg-orange-50 text-orange-600 ring-orange-100"
                          : n.color === "red"
                            ? "bg-red-50 text-red-600 ring-red-100"
                            : "bg-slate-50 text-slate-500 ring-slate-100"
                }`}
              >
                <n.icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0 pr-8">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {n.status === "unread" && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-100 shadow-sm shrink-0"
                      title="Unread alert"
                    />
                  )}
                  <h3 className="text-[14px] font-bold font-outfit text-dark tracking-tight break-words">
                    {n.title}
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getTypeBadgeStyle(
                      n.type,
                    )}`}
                  >
                    {n.type}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-slate-800 leading-relaxed break-words">
                  {n.description}
                </p>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {n.date}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <div className="text-[10px] font-bold text-primary uppercase">
                    {n.time}
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {n.status === "unread" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markAsRead(n.id)}
                    className="h-8 w-8 rounded-full hover:bg-surface active:scale-90 text-primary"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-surface active:scale-90"
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-slate/30" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 rounded-xl border-border/40 shadow-xl p-1"
                  >
                    <DropdownMenuItem
                      onClick={() => handleDelete(n.id)}
                      className="py-2 px-3 text-[11px] font-bold focus:bg-red-50 rounded-lg gap-2 text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Alert
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-6 relative">
              <Bell className="h-7 w-7 text-slate/20" />
              <div className="absolute top-0 right-0 h-3 w-4 bg-primary/5 rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-dark font-outfit tracking-tight">
              No notifications found
            </h3>
            <p className="text-slate/40 text-xs font-medium max-w-[260px] mt-2 leading-relaxed">
              You've cleared all your alerts! Check back later for new updates.
            </p>
          </div>
        )}
      </div>

      {/* Cursor Pagination Controls */}
      {notifications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate/50">
            Page <span className="font-bold text-dark">{pageNumber}</span>
            {totalCount > 0 && (
              <>
                {" "}
                (<span className="font-bold text-dark">{totalCount}</span> total
                alerts)
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPrevPage}
              disabled={!hasPrev || isLoading || isFetching}
              className="h-9 px-3 text-xs font-bold gap-1 rounded-xl border-border/30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNextPage}
              disabled={!hasNext || isLoading || isFetching}
              className="h-9 px-3 text-xs font-bold gap-1 rounded-xl border-border/30 cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Footer Utility */}
      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-center">
          <p className="text-[10px] font-bold text-slate/20 uppercase tracking-widest flex items-center gap-2">
            Wealthconomy Admin Security Protocol
          </p>
        </div>
      )}
    </div>
  );
}
