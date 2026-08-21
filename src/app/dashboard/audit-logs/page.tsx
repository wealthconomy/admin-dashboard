"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  MoreVertical,
  X,
  AlertCircle,
  Eye,
  Filter,
  Terminal,
  UserCheck,
  Globe,
  Monitor,
  Loader2,
  Repeat,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGetAuditLogsQuery, useGetTeamQuery } from "@/lib/redux/features/adminApi";
import { useGetMeQuery } from "@/lib/redux/features/authApi";
import { useGetUsersQuery } from "@/lib/redux/features/usersApi";

// Helper to extract the safe array from backend response wrapper
const getSafeArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data?.items)) return data.data.items;
  if (Array.isArray(data.data?.logs)) return data.data.logs;
  if (Array.isArray(data.data?.auditLogs)) return data.data.auditLogs;
  if (Array.isArray(data.data?.results)) return data.data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.logs)) return data.logs;
  if (Array.isArray(data.auditLogs)) return data.auditLogs;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const CATEGORIES = ["All Categories", "Authentication", "User Management", "Team Management", "Content Engine", "Support Operations", "Settings Update", "System Activity"];

const mapCategory = (model: string, action: string) => {
  const modelStr = String(model || "").toLowerCase();
  const actionStr = String(action || "").toLowerCase();

  if (actionStr.includes("auth") || actionStr.includes("login") || actionStr.includes("password")) return "Authentication";
  if (modelStr.includes("user")) return "User Management";
  if (modelStr.includes("admin") || modelStr.includes("role") || modelStr.includes("team")) return "Team Management";
  if (modelStr.includes("blog") || modelStr.includes("library") || modelStr.includes("broadcast")) return "Content Engine";
  if (modelStr.includes("ticket") || modelStr.includes("support")) return "Support Operations";
  if (modelStr.includes("setting") || modelStr.includes("config")) return "Settings Update";
  
  return "System Activity";
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: auditLogsData, isLoading, isFetching } = useGetAuditLogsQuery({ page, limit: 20 });
  const { data: teamData } = useGetTeamQuery(undefined);
  const { data: meData } = useGetMeQuery(undefined);
  const { data: usersData } = useGetUsersQuery({ limit: 100 });

  const team = getSafeArray(teamData);
  const me = meData?.data || meData;
  const usersList = getSafeArray(usersData?.data?.items || usersData?.data || usersData);

  const rawLogsArray = getSafeArray(auditLogsData);
  const logs = rawLogsArray.map((log: any) => {
    // Find admin details from team, me, or users
    const adminId = log.actorId || log.adminId || log.userId || log.actor?.id || log.user?.id;
    let matchingAdmin = team.find((member: any) => 
      member.userId === adminId || 
      member.user?.id === adminId || 
      member.id === adminId
    );
    
    // If not found in team, but matches current user
    if (!matchingAdmin && me?.id === adminId) {
      matchingAdmin = me;
    }

    // If still not found, check the regular users list
    if (!matchingAdmin) {
      matchingAdmin = usersList.find((u: any) => u.id === adminId);
    }

    const userObj = matchingAdmin?.user || matchingAdmin;
    const actorObj = log.actor || log.admin || log.user || {};
    const adminName = matchingAdmin 
      ? `${userObj?.firstName || ""} ${userObj?.lastName || ""}`.trim() 
      : (actorObj.name || `${actorObj.firstName || ""} ${actorObj.lastName || ""}`.trim() || log.adminName || log.actorName || log.performedBy || "Admin");
    const resolvedRole = matchingAdmin 
      ? (matchingAdmin.role === "CUSTOM" && matchingAdmin.customRole ? matchingAdmin.customRole.name : matchingAdmin.role) 
      : (actorObj.role || log.adminRole || log.role || "Admin");
    const adminRole = resolvedRole || "Admin";
    const adminEmail = matchingAdmin ? userObj?.email : (actorObj.email || log.admin?.email || log.adminEmail || log.user?.email || "Admin");
    const adminAvatar = userObj?.imageUrl || actorObj.imageUrl || actorObj.avatarUrl || log.admin?.imageUrl || log.adminImageUrl || log.user?.imageUrl || "";

    // Resolve Target Name
    let targetName = "";
    if (log.targetId) {
      let matchingTarget = usersList.find((u: any) => u.id === log.targetId) || team.find((u: any) => u.id === log.targetId);
      if (matchingTarget) {
        targetName = `${matchingTarget.firstName || ""} ${matchingTarget.lastName || ""}`.trim();
      } else if (log.targetId === me?.id) {
        targetName = `${me.firstName || ""} ${me.lastName || ""}`.trim();
      }
    }

    const rawDate = log.createdAt || log.created_at || log.timestamp || log.date;
    const formattedTimestamp = rawDate ? new Date(rawDate).toLocaleString() : (log.timestamp || "N/A");

    return {
      ...log,
      id: log.id || log._id,
      timestamp: formattedTimestamp,
      admin: {
        id: adminId || "1",
        name: adminName || "Unknown Admin",
        role: adminRole || "Admin",
        email: adminEmail,
        avatarUrl: adminAvatar,
      },
      category: mapCategory(log.model, log.action),
      action: log.action || log.description || "Performed an action",
      targetName: targetName,
      reason: log.changes ? JSON.stringify(log.changes) : log.reason || log.details || (log.targetId ? `Target ID: ${log.targetId}` : ""),
      ipAddress: log.ip || log.ipAddress || "Unknown",
      device: log.device || "Unknown",
      userAgent: log.userAgent || "Unknown",
    };
  });

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch =
      log.admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.id).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" || log.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const paginationData = auditLogsData?.data || auditLogsData?.meta || auditLogsData?.pagination || auditLogsData || {};
  const totalEvents = paginationData.total || paginationData.totalItems || paginationData.totalCount || paginationData.count || logs.length;
  const limit = paginationData.limit || 20;
  const totalPages = paginationData.pages || paginationData.totalPages || Math.ceil(totalEvents / limit) || 1;

  // Freeze the stats on first load so they don't fluctuate during pagination
  const [frozenStats, setFrozenStats] = useState<{flagged: number, permissions: number} | null>(null);
  
  useEffect(() => {
    if (logs.length > 0 && frozenStats === null) {
      setFrozenStats({
        flagged: logs.filter((l: any) => l.action.toLowerCase().includes("fail") || l.action.toLowerCase().includes("flag") || l.category.toLowerCase().includes("security")).length,
        permissions: logs.filter((l: any) => l.category.toLowerCase().includes("role") || l.category.toLowerCase().includes("team") || l.action.toLowerCase().includes("role") || l.action.toLowerCase().includes("permission")).length,
      });
    }
  }, [logs, frozenStats]);

  const flaggedIncidents = paginationData.flaggedIncidents ?? frozenStats?.flagged ?? 0;
  const permissionsAltered = paginationData.permissionsAltered ?? frozenStats?.permissions ?? 0;

  const handleDownloadReport = () => {
    toast.info("Preparing security audit report...");
    try {
      const headers = ["ID", "Admin Name", "Admin Email", "Action", "Category", "IP Address", "Device", "Date"];
      const rows = filteredLogs.map((log: any) => [
        log.id,
        `"${log.admin.name}"`,
        `"${log.admin.email}"`,
        `"${log.action}"`,
        log.category,
        log.ipAddress,
        `"${log.device}"`,
        `"${log.date} ${log.time}"`
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-logs-export-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Security audit report downloaded!");
    } catch (err) {
      toast.error("Failed to generate report.");
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto flex flex-col gap-6 sm:gap-8 mb-10 animate-in fade-in duration-500">
      
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            System Audit Logs
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Super Admin Only
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Complete dynamic monitoring of administrative activities across the dashboard.
          </p>
        </div>

        {/* Action Header controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:flex-1 md:w-[220px] md:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              placeholder="Search admin, task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Filter <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              {CATEGORIES.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className="rounded-xl py-2 px-3 text-xs font-medium cursor-pointer"
                >
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={handleDownloadReport}
            className="h-10 px-4 rounded-xl border-border/50 font-bold text-xs text-[#155D5F] hover:bg-[#E8F3F3] transition-all"
          >
            Export Sheet
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-start justify-between shadow-[0px_4px_10px_0px_rgba(0,0,0,0.02)]">
              <div className="space-y-1">
                {isLoading || isFetching ? (
                  <div className="h-7 flex items-center">
                    <Loader2 className="h-5 w-5 text-[#155D5F] animate-spin" />
                  </div>
                ) : (
                  <p className="text-[26px] font-extrabold text-[#155D5F] leading-none">{totalEvents}</p>
                )}
                <p className="text-[11px] font-bold text-[#155D5F] pt-1">Total Audit Events Traced</p>
              </div>
              <div className="h-9 w-9 bg-[#155D5F] text-white rounded-full flex items-center justify-center shrink-0">
                <Terminal className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-start justify-between shadow-[0px_4px_10px_0px_rgba(0,0,0,0.02)]">
              <div className="space-y-1">
                {isLoading || isFetching ? (
                  <div className="h-7 flex items-center">
                    <Loader2 className="h-5 w-5 text-[#155D5F] animate-spin" />
                  </div>
                ) : (
                  <p className="text-[26px] font-extrabold text-[#155D5F] leading-none">{flaggedIncidents}</p>
                )}
                <p className="text-[11px] font-bold text-[#155D5F] pt-1">Flagged Access Incidents</p>
              </div>
              <div className="h-9 w-9 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-red-500/10">
                <AlertCircle className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-start justify-between shadow-[0px_4px_10px_0px_rgba(0,0,0,0.02)]">
              <div className="space-y-1">
                {isLoading || isFetching ? (
                  <div className="h-7 flex items-center">
                    <Loader2 className="h-5 w-5 text-[#155D5F] animate-spin" />
                  </div>
                ) : (
                  <p className="text-[26px] font-extrabold text-[#155D5F] leading-none">{permissionsAltered}</p>
                )}
                <p className="text-[11px] font-bold text-[#155D5F] pt-1">Team Permissions Altered</p>
              </div>
              <div className="h-9 w-9 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-surface/50">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[10px] uppercase tracking-widest hidden md:table-cell w-[160px]">Timestamp</TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[10px] uppercase tracking-widest w-[200px] md:w-[250px]">Administrator</TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[10px] uppercase tracking-widest hidden sm:table-cell w-[180px]">Event Category</TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[10px] uppercase tracking-widest">Activity Traced</TableHead>
                    <TableHead className="py-4 px-4 w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-sm font-medium text-slate/40">Loading audit logs...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log: any) => (
                      <TableRow key={log.id} className="group border-border/50 hover:bg-surface/30 transition-all duration-200">
                        <TableCell className="py-4 px-4 hidden md:table-cell">
                          <span className="text-[11px] font-bold text-slate/50 block">{log.timestamp}</span>
                          <span className="text-[9px] font-bold text-primary/60 uppercase">{log.id}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-7 w-7 border border-primary/5 shadow-sm shrink-0">
                              <AvatarImage src={log.admin.avatarUrl} />
                              <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                {log.admin.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-[12px] text-dark leading-snug truncate">{log.admin.name}</span>
                                <Badge className={`px-1.5 py-0 border shadow-none text-[8px] font-bold rounded-md shrink-0 ${
                                  log.admin.role === "Super Admin" 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                                    : "bg-surface text-slate/70 border-border/30"
                                }`}>
                                  {log.admin.role}
                                </Badge>
                              </div>
                              <span className="text-[10px] font-medium text-slate/40 truncate">{log.admin.email}</span>
                              
                              {/* Mobile-only metadata */}
                              <div className="flex flex-col gap-0.5 mt-1 md:hidden">
                                <span className="text-[9px] font-semibold text-slate/40">{log.timestamp}</span>
                                <span className="text-[9px] font-bold text-primary/60 uppercase">{log.id}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 hidden sm:table-cell">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            log.category === "User Management" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            log.category === "Team Management" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                            log.category === "Content Engine" ? "bg-blue-50 text-blue-600 border border-[#A4C2E6]" :
                            "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}>
                            {log.category}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          {/* Mobile-only Category Badge */}
                          <div className="sm:hidden mb-1">
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              log.category === "User Management" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              log.category === "Team Management" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                              log.category === "Content Engine" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                              "bg-slate-50 text-slate-500 border border-slate-100"
                            }`}>
                              {log.category}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-extrabold text-dark leading-snug block">{log.action}</span>
                            {log.targetName && (
                              <span className="text-[10px] font-medium text-slate/50">
                                Target: <span className="font-bold text-primary">{log.targetName}</span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full">
                                <MoreVertical className="h-4 w-4 text-slate/40" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                              <DropdownMenuItem onClick={() => setSelectedLog(log)} className="py-2 px-3.5 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                                <Eye className="h-3.5 w-3.5 text-primary" /> View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Terminal className="h-8 w-8 text-slate/20" />
                          <p className="text-sm font-medium text-slate/40">No audit events match your search parameters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

      {/* Pagination indicators */}
      <div className="flex justify-between items-center text-xs font-bold text-slate/40 pt-2 px-1">
        <span>Showing {totalEvents === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, totalEvents)} of {totalEvents} records (Page {page} of {totalPages || 1})</span>
        <div className="flex items-center gap-1.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setPage(p => Math.max(1, p - 1));
              setTimeout(() => {
                const main = document.getElementById('main-scroll-container');
                if (main) main.scrollTo({ top: 0, behavior: "smooth" });
              }, 50);
            }}
            disabled={page === 1 || isFetching}
            className={`h-8 px-2 text-[11px] font-semibold ${page === 1 ? 'text-slate/40 border-slate-200 cursor-not-allowed' : 'text-black border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'}`}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages || 1 }).map((_, idx) => {
            const p = idx + 1;
            // Show first page, last page, current page, and +/- 1 from current
            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
              return (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage(p);
                    setTimeout(() => {
                      const main = document.getElementById('main-scroll-container');
                      if (main) main.scrollTo({ top: 0, behavior: "smooth" });
                    }, 50);
                  }}
                  disabled={isFetching}
                  className={`h-8 min-w-[32px] px-2 text-[11px] font-semibold ${
                    page === p
                      ? 'bg-[#155D5F]/10 text-[#155D5F] border-[#155D5F] hover:bg-[#155D5F]/20'
                      : 'text-black border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
                  }`}
                >
                  {p}
                </Button>
              );
            }
            // Add ellipsis for skipped pages
            if (p === page - 2 || p === page + 2) {
              return <span key={p} className="px-1 text-slate/40 font-bold text-xs tracking-widest">...</span>;
            }
            return null;
          })}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setPage(p => p + 1);
              setTimeout(() => {
                const main = document.getElementById('main-scroll-container');
                if (main) main.scrollTo({ top: 0, behavior: "smooth" });
              }, 50);
            }}
            disabled={page >= totalPages || isFetching}
            className={`h-8 px-2 text-[11px] font-semibold ${page >= totalPages ? 'text-slate/40 border-slate-200 cursor-not-allowed' : 'text-black border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'}`}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Audit Log Overview Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-[20px] w-full max-w-[620px] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button onClick={() => setSelectedLog(null)} className="text-red-500 hover:text-red-600 transition-colors">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-8 pb-3 border-b border-border/20 bg-surface/30">
              <span className="text-[9px] font-extrabold text-[#155D5F] uppercase tracking-widest">{selectedLog.category}</span>
              <h2 className="text-[20px] font-bold text-dark font-outfit mt-1 leading-snug">Audit Trace Details</h2>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              
              {/* Header profile info */}
              <div className="flex items-center gap-4 bg-surface/30 border border-border/20 rounded-2xl p-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-border/5">
                  <AvatarImage src={selectedLog.admin.avatarUrl} />
                  <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                    {selectedLog.admin.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[9px] font-bold text-slate/30 uppercase tracking-wider leading-none">Triggered By</p>
                  <p className="text-sm font-extrabold text-dark mt-1 leading-none">{selectedLog.admin.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold text-slate/50 leading-none">{selectedLog.admin.email}</span>
                    <div className="h-1 w-1 bg-slate-300 rounded-full" />
                    <Badge className="bg-[#155D5F]/5 text-[#155D5F] border-none text-[8px] font-bold px-1.5 py-0.2 rounded-md">{selectedLog.admin.role}</Badge>
                  </div>
                </div>
              </div>

              {/* Event particulars */}
              <div className="grid grid-cols-2 gap-y-5 gap-x-8 pt-2">
                <div>
                  <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wider">Log Entry ID</p>
                  <p className="text-xs font-extrabold text-dark mt-1 block">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wider">Timestamp</p>
                  <p className="text-xs font-extrabold text-dark mt-1 block">{selectedLog.timestamp}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wider">Activity Description</p>
                  <p className="text-xs font-extrabold text-dark mt-1 leading-relaxed bg-[#E8F3F3]/25 border border-[#155D5F]/10 rounded-xl p-3">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wider">Reason / Parameters</p>
                  <div className="mt-1">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.reason);
                        return typeof parsed === "object" && parsed !== null ? (
                          <div className="flex flex-col gap-2.5 bg-surface/30 p-4 rounded-xl border border-border/20">
                            {Object.entries(parsed).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="text-[11px] font-bold text-slate/40 capitalize w-[110px] shrink-0">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-[11px] font-semibold text-dark break-words flex-1">
                                  {typeof value === "string" && (value.endsWith("Z") || value.includes("T0"))
                                    ? new Date(value).toLocaleString() 
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-slate/60 leading-relaxed whitespace-pre-wrap">
                            {selectedLog.reason}
                          </p>
                        );
                      } catch {
                        return (
                          <p className="text-xs font-semibold text-slate/60 leading-relaxed whitespace-pre-wrap">
                            {selectedLog.reason}
                          </p>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Security Context */}
              <div className="border-t border-border/20 pt-6 space-y-4">
                <h4 className="text-[11px] font-bold text-dark uppercase tracking-widest flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Security Execution Context
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface/50 border border-border/20 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-slate/40 uppercase tracking-wide flex items-center gap-1"><Monitor className="h-3 w-3" /> System / OS</span>
                    <p className="text-xs font-extrabold text-dark leading-none">{selectedLog.device}</p>
                  </div>
                  <div className="p-3 bg-surface/50 border border-border/20 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-slate/40 uppercase tracking-wide flex items-center gap-1"><Globe className="h-3 w-3" /> Context IP Address</span>
                    <p className="text-xs font-extrabold text-dark leading-none">{selectedLog.ipAddress}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate/40 uppercase tracking-wider">Full Browser User-Agent</p>
                  <p className="text-[10px] font-semibold text-slate/50 leading-relaxed font-mono truncate max-w-full bg-slate-50 border border-slate-200/50 p-2 rounded-lg">{selectedLog.userAgent}</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-8 py-4 border-t border-border/20 flex justify-center bg-surface/10">
              <Button onClick={() => setSelectedLog(null)} variant="outline" className="rounded-xl px-8 h-10 border-border font-semibold text-xs text-dark hover:bg-surface cursor-pointer">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
}
