"use client";

import { useState } from "react";
import {
  Mail,
  Search,
  Download,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useGetNewsletterSubscribersQuery,
  useExportNewsletterSubscribersMutation,
  useSendNewsletterBroadcastMutation,
} from "@/lib/redux/features/newsletterApi";

const PERIODS = [
  { label: "All Time", value: "all_time" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last 6 Months", value: "last_6_months" },
  { label: "This Year", value: "year" },
];

export default function NewsletterManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("all_time");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [recipientSegment, setRecipientSegment] = useState<"SUBSCRIBERS_ONLY" | "ALL_USERS" | "ALL">("SUBSCRIBERS_ONLY");

  const { data: response, isLoading, isFetching, refetch } = useGetNewsletterSubscribersQuery({
    page: currentPage,
    limit: 10,
    status: statusFilter || undefined,
    q: searchQuery.trim() || undefined,
    period: periodFilter !== "all_time" ? periodFilter : undefined,
  });

  const [exportSubscribers, { isLoading: isExporting }] = useExportNewsletterSubscribersMutation();
  const [sendBroadcast, { isLoading: isSendingBroadcast }] = useSendNewsletterBroadcastMutation();

  const rawData = response?.data || response;
  const subscribers: any[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];

  const meta = rawData?.meta || {
    totalItems: subscribers.length,
    totalPages: 1,
    currentPage: 1,
  };

  const handleExportCsv = async () => {
    try {
      const csvData = await exportSubscribers({}).unwrap();
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `newsletter_subscribers_${format(new Date(), "yyyyMMdd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Subscribers list exported successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to export subscribers");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastSubject.trim() || !broadcastBody.trim()) {
      toast.error("Please fill in all broadcast fields.");
      return;
    }

    try {
      await sendBroadcast({
        title: broadcastTitle.trim(),
        subject: broadcastSubject.trim(),
        body: broadcastBody.trim(),
        recipientSegment,
      }).unwrap();

      toast.success("Newsletter broadcast dispatched successfully!");
      setShowBroadcastModal(false);
      setBroadcastTitle("");
      setBroadcastSubject("");
      setBroadcastBody("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to dispatch broadcast");
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[900px] mx-auto flex flex-col animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            Newsletter Subscriptions
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Subscribers Hub
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Manage subscriber records, export audience lists, and dispatch email briefings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCsv}
            disabled={isExporting}
            variant="outline"
            className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-[#155D5F]" />
            )}
            Export CSV
          </Button>

          <Button
            onClick={() => setShowBroadcastModal(true)}
            className="h-11 px-5 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Compose Broadcast
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold font-outfit text-primary">
              {meta.totalItems || subscribers.length}
            </p>
            <p className="text-[11px] font-semibold text-primary/80 mt-1">Total Subscribers</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#155D5F] flex items-center justify-center text-white">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold font-outfit text-emerald-600">
              {subscribers.filter((s) => s.status === "ACTIVE").length}
            </p>
            <p className="text-[11px] font-semibold text-primary/80 mt-1">Active Deliveries</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold font-outfit text-slate-700">
              {subscribers.filter((s) => s.status === "UNSUBSCRIBED").length}
            </p>
            <p className="text-[11px] font-semibold text-primary/80 mt-1">Unsubscribed</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-white">
            <Mail className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
          <Input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border/30">
            {[
              { label: "All", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Unsubscribed", value: "UNSUBSCRIBED" },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => {
                  setStatusFilter(st.value);
                  setCurrentPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st.value
                    ? "bg-white text-primary shadow-sm border border-border/30"
                    : "text-slate/60 hover:text-slate"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-[#155D5F]" />
                {PERIODS.find((p) => p.value === periodFilter)?.label || "All Time"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              {PERIODS.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  onClick={() => {
                    setPeriodFilter(p.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl py-2 px-3 text-xs font-medium cursor-pointer ${
                    periodFilter === p.value ? "bg-primary/10 text-primary font-bold" : "text-dark"
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
        <Table>
          <TableHeader className="bg-surface/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[240px]">ID</TableHead>
              <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Email Address</TableHead>
              <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">Subscribed Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-slate/40">Loading subscribers...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : subscribers.length > 0 ? (
              subscribers.map((sub: any) => {
                const isSubActive = sub.status === "ACTIVE";
                const dateStr = sub.subscribedAt || sub.createdAt;
                const formattedDate = dateStr ? format(new Date(dateStr), "MMM dd, yyyy · HH:mm") : "-";

                return (
                  <TableRow key={sub.id} className="border-border/50 hover:bg-surface/30 transition-all">
                    <TableCell className="py-4 px-4 font-mono text-[11px] text-slate/60 font-semibold">
                      {sub.id}
                    </TableCell>
                    <TableCell className="py-4 px-4 font-bold text-dark text-xs">
                      {sub.email}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-center">
                      {isSubActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Unsubscribed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-slate/60 text-xs font-medium">
                      {formattedDate}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <Mail className="h-8 w-8 text-slate/20 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate/40">No subscribers found matching your criteria.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate/50 font-medium">
            Page {meta.currentPage} of {meta.totalPages} ({meta.totalItems} total subscribers)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl h-9 text-xs font-semibold gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= meta.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-xl h-9 text-xs font-semibold gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Compose Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[24px] w-full max-w-[620px] max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">Create Newsletter Broadcast</h2>
                  <p className="text-xs text-slate/50 font-medium">Dispatch market briefings to your audience</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendBroadcast} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Internal Broadcast Title</label>
                <Input
                  required
                  placeholder="e.g. August 2026 High-Yield Market Update"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="h-11 bg-surface/50 border-border/50 text-xs font-medium rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Email Subject Line</label>
                <Input
                  required
                  placeholder="e.g. Discover Top Performing Wealthconomy Portfolios"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="h-11 bg-surface/50 border-border/50 text-xs font-medium rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Target Recipient Segment</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: "SUBSCRIBERS_ONLY", label: "Subscribers Only" },
                    { id: "ALL_USERS", label: "Registered Users" },
                    { id: "ALL", label: "Entire Community" },
                  ].map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setRecipientSegment(seg.id as any)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        recipientSegment === seg.id
                          ? "border-[#155D5F] bg-[#155D5F]/10 text-[#155D5F]"
                          : "border-border/50 bg-surface/40 text-slate/60 hover:bg-surface"
                      }`}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Email Body (HTML / Content)</label>
                <textarea
                  required
                  rows={8}
                  placeholder="<h1>Hello Investor,</h1><p>Here are your key macroeconomic insights this week...</p>"
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full p-4 rounded-xl border border-border/50 bg-surface/50 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="p-4 border-t border-border/30 flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl text-xs font-bold text-slate"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold px-6 h-11 shadow-md"
                >
                  {isSendingBroadcast ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" />
                      Dispatch Broadcast
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
