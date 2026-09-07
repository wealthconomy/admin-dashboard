"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  MoreVertical,
  Activity,
  Filter,
  Lock,
  XCircle,
  Clock,
  CheckCircle2,
  X,
  User,
  FileText,
  Shield,
  Server,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useGetActivitiesQuery } from "@/lib/redux/features/usersApi";
import { format } from "date-fns";

const ACTIVITY_TYPES = [
  { label: "All Types", value: "" },
  { label: "Financial", value: "FINANCIAL" },
  { label: "Security", value: "SECURITY" },
  { label: "Profile", value: "PROFILE" },
  { label: "Engagement", value: "ENGAGEMENT" },
  { label: "System", value: "SYSTEM" },
];

const PERIODS = [
  { label: "All Time", value: "all_time" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "week" },
  { label: "Last Week", value: "last_week" },
  { label: "This Month", value: "month" },
  { label: "Last 6 Months", value: "last_6_months" },
  { label: "This Year", value: "year" },
];

function getFriendlyActivityTitle(act: any): string {
  const rawDesc = String(act?.description || act?.details || "");
  const desc = rawDesc.toLowerCase();
  const rawTitle = act?.title || act?.action || "Activity";

  // 1. Withdrawal / Refund from portfolio (e.g. "withdrawal from portfolio: Benz", "withdrawl from porfolio:Benz", "refund from terminated portfolio: Benz")
  const withdrawPortMatch = rawDesc.match(
    /(?:withdraw(?:al|l|n)?|refund)\s+(?:to\s+\w+\s+)?from\s+(?:terminated\s+)?por?tfolio:?\s*(.+?)(\s*\(|$)/i
  );
  if (withdrawPortMatch?.[1]) {
    const target = withdrawPortMatch[1]
      .replace(/₦\s*[\d,]+(?:\.\d+)?/gi, "")
      .replace(/\b\d+(?:\.\d+)?\s*kobos?\b/gi, "")
      .trim();
    return target ? `Withdrawal from Portfolio — ${target}` : "Withdrawal from Portfolio";
  }
  if (
    desc.includes("withdrawal from portfolio") ||
    desc.includes("withdrawl from porfolio") ||
    desc.includes("refund from terminated") ||
    desc.includes("portfolio refund") ||
    rawTitle.toLowerCase().includes("portfolio refund")
  ) {
    return "Withdrawal from Portfolio";
  }

  // 2. Top up for portfolio
  const topUpMatch = rawDesc.match(/top up for portfolio:?\s*(.+?)(\s*\(|$)/i);
  if (topUpMatch?.[1]) {
    const target = topUpMatch[1].trim();
    return target ? `Portfolio Top-up — ${target}` : "Portfolio Top-up";
  }
  if (desc.includes("top up for portfolio")) {
    return "Portfolio Top-up";
  }

  // 3. Funded portfolio
  const fundedMatch = rawDesc.match(/funded\s+\w*\s*portfolio:?\s*(.+?)(\s*\(|$)/i);
  if (fundedMatch?.[1]) {
    const target = fundedMatch[1].trim();
    return target ? `Portfolio Funding — ${target}` : "Portfolio Funding";
  }
  if (desc.includes("funded") && desc.includes("portfolio")) {
    return "Portfolio Funding";
  }

  // 4. Contribution to wealthgroup
  const groupContribMatch = rawDesc.match(/contribution to wealthgroup:?\s*(.+?)(\s*\(|$)/i);
  if (groupContribMatch?.[1]) {
    const target = groupContribMatch[1].trim();
    return target ? `Group Contribution — ${target}` : "Group Contribution";
  }
  if (desc.includes("contribution to wealthgroup")) {
    return "Group Contribution";
  }

  // 5. Refund from terminated wealth group
  const termGroupMatch = rawDesc.match(/refund from terminated wealth group:?\s*(.+?)(\s*\(|$)/i);
  if (termGroupMatch?.[1]) {
    const target = termGroupMatch[1].trim();
    return target ? `Group Refund — ${target}` : "Group Refund";
  }

  // 6. Downloaded library material
  const downloadMatch = rawDesc.match(/downloaded library material:?\s*"?(.+?)"?$/i);
  if (downloadMatch?.[1]) {
    return `Library Download — ${downloadMatch[1].trim()}`;
  }
  if (desc.includes("downloaded library material")) {
    return "Library Download";
  }

  // 7. Profile update
  if (desc.includes("profile")) {
    return "Profile Updated";
  }

  return rawTitle;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const limit = 20;

  const { data: activitiesResponse, isLoading, isFetching, isError, refetch } = useGetActivitiesQuery({
    q: searchQuery.trim() || undefined,
    type: selectedType || undefined,
    period: selectedPeriod !== "all_time" ? selectedPeriod : undefined,
    after: currentCursor,
    limit,
  });

  // Extract items array from the standardized API structure: { data: { items: [...] } }
  const rawData = activitiesResponse?.data || activitiesResponse;
  const activitiesList: any[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData?.activities)
    ? rawData.activities
    : Array.isArray(rawData)
    ? rawData
    : [];

  const nextCursor = rawData?.nextCursor;
  const hasNext = Boolean(rawData?.hasNext ?? (nextCursor != null));
  const displayedActivities = activitiesList;

  const renderTypeBadge = (type: string, act?: any) => {
    const rawType = (type || "").toUpperCase();
    const desc = String(act?.description || act?.details || "").toUpperCase();
    const title = String(act?.title || act?.action || "").toUpperCase();

    if (rawType.includes("FINANCIAL") || (!rawType && (desc.includes("PORTFOLIO") || desc.includes("WEALTHGROUP") || desc.includes("WALLET") || desc.includes("FUND")))) {
      return (
        <Badge className="bg-indigo-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
          <span className="text-[11px] font-bold text-indigo-600 leading-none">₦</span>
          Financial
        </Badge>
      );
    }
    if (rawType.includes("SECURITY") || (!rawType && (desc.includes("PASSWORD") || desc.includes("PIN") || desc.includes("LOGIN") || desc.includes("AUTH")))) {
      return (
        <Badge className="bg-amber-50 hover:bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
          <Shield className="h-3 w-3 text-amber-600" />
          Security
        </Badge>
      );
    }
    if (rawType.includes("PROFILE") || rawType.includes("USER") || rawType.includes("ACCOUNT") || (!rawType && (desc.includes("PROFILE") || title.includes("PROFILE")))) {
      return (
        <Badge className="bg-sky-50 hover:bg-sky-50 text-sky-700 border border-sky-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
          <User className="h-3 w-3 text-sky-600" />
          Profile
        </Badge>
      );
    }
    if (rawType.includes("ENGAGEMENT") || rawType.includes("INTERACTION") || (!rawType && (desc.includes("LIBRARY") || desc.includes("DOWNLOAD") || desc.includes("REFERRAL")))) {
      return (
        <Badge className="bg-pink-50 hover:bg-pink-50 text-pink-700 border border-pink-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
          <Sparkles className="h-3 w-3 text-pink-600" />
          Engagement
        </Badge>
      );
    }
    if (rawType.includes("SYSTEM")) {
      return (
        <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
          <Server className="h-3 w-3 text-blue-600" />
          System
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full gap-1 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
        <Activity className="h-3 w-3 text-slate-500" />
        {type || "General"}
      </Badge>
    );
  };

  const renderStatusBadge = (status?: string) => {
    const normalized = (status || "SUCCESS").toUpperCase();
    if (normalized.includes("FAIL") || normalized.includes("ERROR") || normalized.includes("REJECT")) {
      return (
        <Badge className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full gap-1 font-bold text-[10px] shadow-none inline-flex items-center">
          <XCircle className="h-3 w-3 text-red-500" />
          Failed
        </Badge>
      );
    }
    if (normalized.includes("PEND")) {
      return (
        <Badge className="bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full gap-1 font-bold text-[10px] shadow-none inline-flex items-center">
          <Clock className="h-3 w-3 text-orange-500" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full gap-1 font-bold text-[10px] shadow-none inline-flex items-center">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        Successful
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            User Activities
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Live Logs
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Real-time audit trails of user transactions, security changes, and system interactions.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search user, action, title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCursorStack([]);
                setCurrentCursor(undefined);
              }}
              className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
            />
          </div>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0">
                <Filter className="h-3.5 w-3.5 text-[#155D5F]" />
                {ACTIVITY_TYPES.find((t) => t.value === selectedType)?.label || "All Types"}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              {ACTIVITY_TYPES.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => {
                    setSelectedType(t.value);
                    setCursorStack([]);
                    setCurrentCursor(undefined);
                  }}
                  className={`rounded-xl py-2 px-3 text-xs font-medium cursor-pointer flex items-center justify-between ${
                    selectedType === t.value ? "bg-primary/10 text-primary font-bold" : "text-dark"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {t.value === "FINANCIAL" && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                    {t.value === "SECURITY" && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    {t.value === "PROFILE" && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                    {t.value === "ENGAGEMENT" && <span className="w-2 h-2 rounded-full bg-pink-500" />}
                    {t.value === "SYSTEM" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    {!t.value && <span className="w-2 h-2 rounded-full bg-slate-300" />}
                    {t.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Period Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-[#155D5F]" />
                {PERIODS.find((p) => p.value === selectedPeriod)?.label || "All Time"}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              {PERIODS.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  onClick={() => {
                    setSelectedPeriod(p.value);
                    setCursorStack([]);
                    setCurrentCursor(undefined);
                  }}
                  className={`rounded-xl py-2 px-3 text-xs font-medium cursor-pointer ${
                    selectedPeriod === p.value ? "bg-primary/10 text-primary font-bold" : "text-dark"
                  }`}
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-full table-fixed">
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider w-[140px]">Timestamp</TableHead>
                <TableHead className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider w-[190px]">User</TableHead>
                <TableHead className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider w-[180px]">Activity Title</TableHead>
                <TableHead className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider w-[130px]">Type</TableHead>
                <TableHead className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider w-[120px]">Status</TableHead>
                <TableHead className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider w-[200px]">Description</TableHead>
                <TableHead className="py-4 px-4 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-slate/40">Loading user activities...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-500/60" />
                      <p className="text-sm font-semibold text-red-500">Failed to load user activities.</p>
                      <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayedActivities.length > 0 ? (
                displayedActivities.map((act: any) => {
                  const userObj = act.user || {};
                  const displayName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.email || act.userName || `User ${act.userId?.slice(0, 6) || ""}`;
                  const displayEmail = userObj.email || act.email || "";
                  const displayAvatar = userObj.imageUrl || act.imageUrl || "";
                  const dateStr = act.createdAt || act.timestamp;
                  const formattedDate = dateStr ? format(new Date(dateStr), "HH:mm, MMM dd, yyyy") : "-";
                  const title = getFriendlyActivityTitle(act);
                  const desc = act.description || act.details || "-";
                  const status = act.metadata?.status || act.status || "SUCCESS";

                  return (
                    <TableRow key={act.id} className="group border-border/50 hover:bg-surface/30 transition-all duration-200">
                      <TableCell className="py-4 px-4">
                        <span className="text-[11px] font-semibold text-slate/60 block leading-snug">
                          {formattedDate}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-7 w-7 border border-primary/5 shadow-sm shrink-0">
                            <AvatarImage src={displayAvatar} />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[12px] text-dark truncate leading-tight">{displayName}</span>
                            {displayEmail && (
                              <span className="text-[10px] text-slate/50 truncate">{displayEmail}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <span className="text-[12px] font-bold text-dark block truncate max-w-[170px]" title={title}>
                          {title}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        {renderTypeBadge(act.type, act)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        {renderStatusBadge(status)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <span className="text-[11px] text-slate/60 font-medium line-clamp-2 leading-snug" title={desc}>
                          {desc}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full cursor-pointer">
                              <MoreVertical className="h-4 w-4 text-slate/40" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                            {act.userId && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/users/${act.userId}`)}
                                className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                              >
                                <User className="h-3.5 w-3.5 text-primary" />
                                View Profile
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setSelectedLog(act)}
                              className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate/50" />
                              Log Overview
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8 text-slate/20" />
                      <p className="text-sm font-medium text-slate/40">No user activities match your search parameters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold text-slate/50 pt-6 px-1">
        <span>
          Showing {displayedActivities.length} record{displayedActivities.length === 1 ? "" : "s"} &bull; Page {cursorStack.length + 1}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (cursorStack.length === 0) return;
              const prev = cursorStack[cursorStack.length - 1];
              setCursorStack(s => s.slice(0, -1));
              setCurrentCursor(prev || undefined);
              window.scrollTo({ top: 0, behavior: "smooth" });
              const main = document.getElementById('main-scroll-container');
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={cursorStack.length === 0 || isFetching}
            className={`h-8 px-3 text-[11px] font-bold rounded-lg ${
              cursorStack.length === 0
                ? 'text-slate/40 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-dark border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
            }`}
          >
            Prev
          </Button>

          <span className="px-2 text-xs font-bold text-dark">
            Page {cursorStack.length + 1}
          </span>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (!hasNext || !nextCursor) return;
              setCursorStack(s => [...s, currentCursor || ""]);
              setCurrentCursor(nextCursor);
              window.scrollTo({ top: 0, behavior: "smooth" });
              const main = document.getElementById('main-scroll-container');
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={!hasNext || isFetching}
            className={`h-8 px-3 text-[11px] font-bold rounded-lg ${
              !hasNext
                ? 'text-slate/40 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-dark border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
            }`}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[640px] max-h-[90vh] shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden my-auto">

            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">User Activity Trace</h2>
                  <p className="text-xs text-slate/50 font-medium">Log ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate/40 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Basic Information */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate/40 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-surface/40 p-4 rounded-2xl border border-border/40">
                  <div>
                    <p className="text-[11px] font-bold text-slate/50">User Name</p>
                    <p className="text-sm font-bold text-dark mt-0.5">
                      {selectedLog.user ? `${selectedLog.user.firstName || ""} ${selectedLog.user.lastName || ""}`.trim() : (selectedLog.userName || "N/A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate/50">User ID</p>
                    <p
                      className="text-sm font-bold text-[#1D84D9] mt-0.5 cursor-pointer hover:underline truncate"
                      onClick={() => {
                        setSelectedLog(null);
                        router.push(`/dashboard/users/${selectedLog.userId || selectedLog.user?.id}`);
                      }}
                    >
                      {selectedLog.userId || selectedLog.user?.id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate/50">Email</p>
                    <p className="text-xs font-semibold text-slate/70 mt-0.5 truncate">
                      {selectedLog.user?.email || selectedLog.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate/50">Activity Type</p>
                    <div className="mt-1">{renderTypeBadge(selectedLog.type, selectedLog)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-slate/50">Activity Title</p>
                    <p className="text-sm font-extrabold text-dark mt-0.5">{getFriendlyActivityTitle(selectedLog)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-slate/50">Description</p>
                    <p className="text-xs font-medium text-dark/80 mt-0.5 bg-white p-3 rounded-xl border border-border/30 whitespace-pre-wrap">
                      {selectedLog.description || selectedLog.details || "No description recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate/50">Timestamp</p>
                    <p className="text-xs font-semibold text-slate/60 mt-0.5">
                      {selectedLog.createdAt ? format(new Date(selectedLog.createdAt), "HH:mm:ss, MMM dd, yyyy") : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate/50">Status</p>
                    <div className="mt-1">{renderStatusBadge(selectedLog.metadata?.status || selectedLog.status)}</div>
                  </div>
                </div>
              </div>

              {/* Security & Metadata */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate/40 mb-3">Security & Metadata</h3>
                <div className="bg-surface/40 p-4 rounded-2xl border border-border/40 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate/50">IP Address</p>
                      <p className="text-xs font-bold text-dark mt-0.5">
                        {selectedLog.metadata?.ip || selectedLog.ip || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate/50">User Agent</p>
                      <p className="text-xs font-medium text-slate/70 mt-0.5 truncate" title={selectedLog.metadata?.userAgent || selectedLog.userAgent}>
                        {selectedLog.metadata?.userAgent || selectedLog.userAgent || "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[11px] font-bold text-slate/50 mb-1.5">Raw Metadata Parameters</p>
                      <div className="bg-white p-3 rounded-xl border border-border/30 font-mono text-[11px] text-slate/70 overflow-x-auto">
                        <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-border/30 flex items-center justify-between bg-surface/20">
              <Button
                variant="ghost"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl text-xs font-bold text-slate hover:bg-surface cursor-pointer"
              >
                Close
              </Button>
              {selectedLog.userId && (
                <Button
                  onClick={() => {
                    setSelectedLog(null);
                    router.push(`/dashboard/users/${selectedLog.userId || selectedLog.user?.id}`);
                  }}
                  className="rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold px-5 h-10 shadow-md cursor-pointer"
                >
                  View User Profile
                </Button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
