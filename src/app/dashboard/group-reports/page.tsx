"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Flag,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Trash2,
  Eye,
  ExternalLink,
  ShieldAlert,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetWealthGroupReportsQuery,
  useUpdateWealthGroupReportStatusMutation,
  useDeleteWealthGroupReportMutation,
  WealthGroupReport,
} from "@/lib/redux/features/supportApi";

function getInitials(name?: string): string {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function GroupReportsPage() {
  const [reportStatusFilter, setReportStatusFilter] = useState<
    "ALL" | "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<WealthGroupReport | any | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  const {
    data: reportsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetWealthGroupReportsQuery(
    {
      populate: "reporter,group",
      status: reportStatusFilter === "ALL" ? undefined : reportStatusFilter,
      search: searchQuery || undefined,
      limit: 100,
    },
    { pollingInterval: 15000 }
  );

  const [updateReportStatus, { isLoading: isUpdatingStatus }] =
    useUpdateWealthGroupReportStatusMutation();
  const [deleteReport, { isLoading: isDeletingReport }] =
    useDeleteWealthGroupReportMutation();

  const rawReportsList: (WealthGroupReport | any)[] = useMemo(() => {
    if (Array.isArray(reportsResponse?.data?.items)) return reportsResponse.data.items;
    if (Array.isArray(reportsResponse?.items)) return reportsResponse.items;
    if (Array.isArray(reportsResponse?.data?.reports)) return reportsResponse.data.reports;
    if (Array.isArray(reportsResponse?.reports)) return reportsResponse.reports;
    if (Array.isArray(reportsResponse?.data)) return reportsResponse.data;
    if (Array.isArray(reportsResponse)) return reportsResponse;
    return [];
  }, [reportsResponse]);

  const filteredReports = useMemo(() => {
    return rawReportsList.filter((r: any) => {
      if (reportStatusFilter !== "ALL") {
        const s = (r.status || "").toUpperCase();
        if (s !== reportStatusFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const gName = (r.group?.name || r.group?.groupName || "").toLowerCase();
        const reason = (r.reason || "").toLowerCase();
        const rName = `${r.reporter?.firstName || r.reporter?.name || ""} ${r.reporter?.lastName || ""}`.toLowerCase();
        const rEmail = (r.reporter?.email || "").toLowerCase();
        return gName.includes(q) || reason.includes(q) || rName.includes(q) || rEmail.includes(q);
      }
      return true;
    });
  }, [rawReportsList, reportStatusFilter, searchQuery]);

  const metrics = useMemo(() => {
    let pending = 0;
    let investigating = 0;
    let resolved = 0;
    let dismissed = 0;

    rawReportsList.forEach((r: any) => {
      const s = (r.status || "").toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "INVESTIGATING") investigating++;
      else if (s === "RESOLVED") resolved++;
      else if (s === "DISMISSED") dismissed++;
    });

    const total = reportsResponse?.data?.totalCount ?? rawReportsList.length;
    return { total, pending, investigating, resolved, dismissed };
  }, [reportsResponse, rawReportsList]);

  const handleOpenDetail = (report: any) => {
    setSelectedReport(report);
    setResolutionNoteInput(report.resolutionNote || "");
  };

  const handleUpdateStatus = async (
    id: string,
    status: "RESOLVED" | "DISMISSED" | "INVESTIGATING" | "PENDING",
    customNote?: string
  ) => {
    const noteToSubmit = (customNote !== undefined ? customNote : resolutionNoteInput).trim();
    if (!noteToSubmit) {
      toast.error("Please enter a resolution note or user feedback before proceeding.");
      return;
    }

    try {
      await updateReportStatus({ id, status, resolutionNote: noteToSubmit }).unwrap();
      toast.success(`Report status updated to ${status.toLowerCase()}`);
      setSelectedReport(null);
      setResolutionNoteInput("");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to update report status`);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Flag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
              WealthGroup Reports
            </h1>
            <p className="text-xs font-medium text-slate/60 mt-0.5">
              Review and resolve user-reported wealth groups and community policy violations
            </p>
          </div>
        </div>

        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          className="h-10 rounded-xl gap-2 text-xs font-bold border-border/60 text-slate hover:text-dark hover:bg-surface cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* API Notice Warning if 404 / error */}
      {isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-amber-900 font-outfit">
              Backend Integration Notice
            </h3>
            <p className="text-xs font-medium text-amber-700 leading-relaxed">
              The backend endpoint <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">GET /api/v1/admin/groups/reports</code> has not been mounted on the API server yet or returned an error ({ (error as any)?.status || "404" }).
            </p>
          </div>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border/60 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate/50 uppercase tracking-wide">Total Reports</p>
          <p className="text-2xl font-black font-outfit text-dark">{metrics.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-sm space-y-1 bg-amber-50/30">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Pending Review</p>
          <p className="text-2xl font-black font-outfit text-amber-600">{metrics.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-200/60 shadow-sm space-y-1 bg-blue-50/30">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Investigating</p>
          <p className="text-2xl font-black font-outfit text-blue-600">{metrics.investigating}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/60 shadow-sm space-y-1 bg-emerald-50/30">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Resolved</p>
          <p className="text-2xl font-black font-outfit text-emerald-600">{metrics.resolved}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-1 bg-slate-50/50">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Dismissed</p>
          <p className="text-2xl font-black font-outfit text-slate-600">{metrics.dismissed}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(["ALL", "PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setReportStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                reportStatusFilter === st
                  ? "bg-[#155D5F] text-white shadow-sm"
                  : "bg-surface text-slate/70 hover:text-dark hover:bg-surface/80"
              }`}
            >
              {st === "ALL" ? "All Statuses" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate/40" />
          <Input
            placeholder="Search group or reporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-surface border-border/40 text-xs font-medium focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-surface flex items-center justify-center mx-auto text-slate/40">
              <Flag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold font-outfit text-dark">No Group Reports Found</h3>
            <p className="text-xs text-slate/50 max-w-sm mx-auto">
              {searchQuery || reportStatusFilter !== "ALL"
                ? "No reports match your current filter or search criteria."
                : "There are currently no filed reports for any cooperative wealth groups."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate/60 uppercase">Reported Group</TableHead>
                <TableHead className="text-xs font-bold text-slate/60 uppercase">Reporter</TableHead>
                <TableHead className="text-xs font-bold text-slate/60 uppercase">Reason</TableHead>
                <TableHead className="text-xs font-bold text-slate/60 uppercase">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate/60 uppercase">Date Filed</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate/60 uppercase">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report: any) => {
                const groupName = report.group?.name || report.group?.groupName || "Unnamed Group";
                const reporterName = report.reporter
                  ? `${report.reporter.firstName || report.reporter.name || ""} ${report.reporter.lastName || ""}`.trim() || "User"
                  : "Anonymous User";

                const reporterEmail = report.reporter?.email || "—";
                const statusStr = (report.status || "PENDING").toUpperCase();

                return (
                  <TableRow key={report.id || report._id} className="hover:bg-surface/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        {report.group?.image || report.group?.icon || report.group?.avatarUrl ? (
                          <Avatar className="h-9 w-9 border rounded-xl shrink-0">
                            <AvatarImage src={report.group?.image || report.group?.icon || report.group?.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-[#155D5F]/10 text-[#155D5F] font-bold text-xs rounded-xl">
                              <Flag className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center font-bold text-xs shrink-0">
                            <Flag className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-dark">{groupName}</p>
                          <p className="text-[10px] text-slate/50 font-medium">ID: {report.groupId}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border">
                          <AvatarImage src={report.reporter?.avatarUrl || report.reporter?.image} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {getInitials(reporterName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-dark">{reporterName}</p>
                          <p className="text-[10px] text-slate/50">{reporterEmail}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-slate-700 line-clamp-1 max-w-[240px]">
                        {report.reason || "No reason provided"}
                      </p>
                    </TableCell>

                    <TableCell className="py-4">
                      {statusStr === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Pending
                        </span>
                      )}
                      {statusStr === "INVESTIGATING" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <AlertTriangle className="w-3 h-3 text-blue-500" />
                          Investigating
                        </span>
                      )}
                      {statusStr === "RESOLVED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Resolved
                        </span>
                      )}
                      {statusStr === "DISMISSED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Ban className="w-3 h-3 text-slate-400" />
                          Dismissed
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-4 text-xs font-medium text-slate/60">
                      {formatDate(report.createdAt)}
                    </TableCell>

                    <TableCell className="py-4 text-right">
                      <Button
                        onClick={() => handleOpenDetail(report)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-lg text-xs font-bold text-[#155D5F] hover:bg-[#155D5F]/10 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Resolution Modal / Drawer */}
      {selectedReport && (() => {
        const currentReportStatus = (selectedReport.status || "PENDING").toUpperCase();
        const isWorkedOn = currentReportStatus === "RESOLVED" || currentReportStatus === "DISMISSED";
        const groupObj = selectedReport.group || {};
        const reporterObj = selectedReport.reporter || {};

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedReport(null)}
            />
            <div className="relative bg-white rounded-[24px] p-6 sm:p-8 w-full max-w-[620px] shadow-2xl border border-border/50 space-y-6 animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                    <Flag className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-outfit text-dark">Group Report Details</h3>
                      {currentReportStatus === "PENDING" && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          PENDING
                        </Badge>
                      )}
                      {currentReportStatus === "INVESTIGATING" && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          INVESTIGATING
                        </Badge>
                      )}
                      {currentReportStatus === "RESOLVED" && (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          RESOLVED
                        </Badge>
                      )}
                      {currentReportStatus === "DISMISSED" && (
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                          DISMISSED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate/50 mt-0.5">Report ID: {selectedReport.id}</p>
                    <p className="text-[11px] text-slate/40 font-medium">Reported At: {formatDate(selectedReport.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-full hover:bg-surface text-slate/60 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                
                {/* Reported Wealth Group Section */}
                <div className="bg-surface/50 p-4 rounded-2xl border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate/50 uppercase tracking-wider">
                      Reported Wealth Group
                    </p>
                    <Link
                      href={`/dashboard/portfolio/wealthgroup`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#155D5F] hover:underline"
                    >
                      View in WealthGroup <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-3">
                    {groupObj.image || groupObj.icon || groupObj.avatarUrl ? (
                      <Avatar className="h-10 w-10 border rounded-xl shrink-0">
                        <AvatarImage src={groupObj.image || groupObj.icon || groupObj.avatarUrl} className="object-cover" />
                        <AvatarFallback className="text-xs font-bold bg-[#155D5F]/10 text-[#155D5F]">G</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center font-bold text-xs shrink-0">
                        <Flag className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      {groupObj.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#155D5F] bg-[#155D5F]/10 px-2 py-0.5 rounded-full inline-block mb-0.5">
                          {groupObj.category}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-dark">{groupObj.name || groupObj.groupName || "Salvation story"}</h4>
                    </div>
                  </div>

                  {/* Group Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/30 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate/40 block">Group ID</span>
                      <span className="font-mono font-medium text-[11px] text-dark truncate block">{groupObj.id || selectedReport.groupId || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate/40 block">Group Status</span>
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 mt-0.5 bg-white border-border/60">
                        {groupObj.status || "ACTIVE"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate/40 block">Creator ID</span>
                      <span className="font-mono font-medium text-[11px] text-dark truncate block">{groupObj.creatorId || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate/40 block">Created Date</span>
                      <span className="font-medium text-[11px] text-dark block">{formatDate(groupObj.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Reporting User Section */}
                <div className="bg-surface/50 p-4 rounded-2xl border border-border/40 space-y-2">
                  <p className="text-[10px] font-bold text-slate/50 uppercase tracking-wider">
                    Reporting User
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shrink-0">
                      <AvatarImage src={reporterObj.avatarUrl || reporterObj.image} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {getInitials(reporterObj ? `${reporterObj.firstName || ""} ${reporterObj.lastName || ""}` : "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-dark">
                        {reporterObj.firstName || reporterObj.name || reporterObj.lastName
                          ? `${reporterObj.firstName || reporterObj.name || ""} ${reporterObj.lastName || ""}`.trim()
                          : "Anonymous User"}
                      </h4>
                      <p className="text-[11px] text-slate/60 font-medium">{reporterObj.email || "—"}</p>
                      {reporterObj.phone && (
                        <p className="text-[11px] text-slate/50 font-mono">Phone: {reporterObj.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Violation Reason / Evidence */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark block">Violation Reason / Evidence</label>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 text-xs font-medium text-amber-950 leading-relaxed italic">
                    &ldquo;{selectedReport.reason || "No specific detail provided."}&rdquo;
                  </div>
                </div>

                {/* Admin Resolution Note / User Feedback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark block">
                    {isWorkedOn ? "Admin Resolution Note / Notes Left for User" : "Admin Resolution Note / User Feedback"} {!isWorkedOn && <span className="text-red-500">*</span>}
                  </label>
                  {isWorkedOn ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 leading-relaxed">
                      {selectedReport.resolutionNote || resolutionNoteInput || "No resolution note left."}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      placeholder="Enter a resolution message or feedback for the reporting user (e.g. 'We investigated this group and issued a warning to the group owner.')..."
                      value={resolutionNoteInput}
                      onChange={(e) => setResolutionNoteInput(e.target.value)}
                      className="w-full p-3.5 bg-white rounded-2xl border border-border/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                    />
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/30 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedReport(null)}
                  className="h-10 rounded-xl text-xs font-bold text-slate cursor-pointer"
                >
                  Close
                </Button>

                {isWorkedOn ? (
                  <div className="flex items-center gap-2">
                    {currentReportStatus === "RESOLVED" && (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Report Resolved
                      </Badge>
                    )}
                    {currentReportStatus === "DISMISSED" && (
                      <Badge className="bg-slate-100 text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Ban className="w-4 h-4 text-slate-400" />
                        Report Dismissed
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {currentReportStatus !== "INVESTIGATING" && (
                      <Button
                        onClick={() => handleUpdateStatus(selectedReport.id, "INVESTIGATING")}
                        disabled={isUpdatingStatus}
                        className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Investigate
                      </Button>
                    )}
                    <Button
                      onClick={() => handleUpdateStatus(selectedReport.id, "DISMISSED")}
                      disabled={isUpdatingStatus}
                      className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Dismiss
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedReport.id, "RESOLVED")}
                      disabled={isUpdatingStatus}
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Resolve Report
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
