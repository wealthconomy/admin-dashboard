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
  DollarSign,
  Shield,
  Server,
  Calendar,
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

export default function ActivitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: activitiesResponse, isLoading, isError, refetch } = useGetActivitiesQuery({
    q: searchQuery.trim() || undefined,
    type: selectedType || undefined,
    period: selectedPeriod !== "all_time" ? selectedPeriod : undefined,
    limit: 50,
  });

  // Extract items array from the standardized API structure: { data: { items: [...] } }
  const rawData = activitiesResponse?.data || activitiesResponse;
  const activitiesList: any[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];

  const renderTypeBadge = (type: string) => {
    const normalized = (type || "").toUpperCase();
    switch (normalized) {
      case "FINANCIAL":
        return (
          <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            Financial
          </Badge>
        );
      case "SECURITY":
        return (
          <Badge className="bg-amber-50 hover:bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <Shield className="h-3 w-3 text-amber-600" />
            Security
          </Badge>
        );
      case "SYSTEM":
        return (
          <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <Server className="h-3 w-3 text-blue-600" />
            System
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-50 hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full gap-1 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <Activity className="h-3 w-3 text-slate-500" />
            {type || "General"}
          </Badge>
        );
    }
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
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[900px] mx-auto flex flex-col animate-in fade-in duration-500">
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <DropdownMenuContent className="w-44 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              {ACTIVITY_TYPES.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`rounded-xl py-2 px-3 text-xs font-medium cursor-pointer ${
                    selectedType === t.value ? "bg-primary/10 text-primary font-bold" : "text-dark"
                  }`}
                >
                  {t.label}
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
                  onClick={() => setSelectedPeriod(p.value)}
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
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[140px]">Timestamp</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[190px]">User</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[180px]">Activity Title</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[130px]">Type</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[120px]">Status</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[200px]">Description</TableHead>
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
              ) : activitiesList.length > 0 ? (
                activitiesList.map((act: any) => {
                  const userObj = act.user || {};
                  const displayName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.email || act.userName || `User ${act.userId?.slice(0, 6) || ""}`;
                  const displayEmail = userObj.email || act.email || "";
                  const displayAvatar = userObj.imageUrl || act.imageUrl || "";
                  const dateStr = act.createdAt || act.timestamp;
                  const formattedDate = dateStr ? format(new Date(dateStr), "HH:mm, MMM dd, yyyy") : "-";
                  const title = act.title || act.action || "Activity";
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
                        {renderTypeBadge(act.type)}
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

      {/* Activity Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[640px] max-h-[85vh] shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">

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
                    <div className="mt-1">{renderTypeBadge(selectedLog.type)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-slate/50">Activity Title</p>
                    <p className="text-sm font-extrabold text-dark mt-0.5">{selectedLog.title || selectedLog.action || "N/A"}</p>
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
