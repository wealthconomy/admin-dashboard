"use client";

import { useState } from "react";
import {
  Mail,
  Search,
  Download,
  Send,
  Users,
  CheckCircle2,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  Eye,
  CheckCircle,
  Radio,
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
  useGetNewsletterBroadcastsQuery,
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
  // Active Tab: "subscribers" | "broadcasts"
  const [activeTab, setActiveTab] = useState<"subscribers" | "broadcasts">("subscribers");

  // Filter states
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

  // Broadcast Details / Preview Modal State
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);

  // Queries
  const {
    data: subscribersResponse,
    isLoading: isSubscribersLoading,
    isFetching: isSubscribersFetching,
  } = useGetNewsletterSubscribersQuery(
    {
      page: currentPage,
      limit: 10,
      status: statusFilter || undefined,
      q: searchQuery.trim() || undefined,
      period: periodFilter !== "all_time" ? periodFilter : undefined,
    },
    { skip: activeTab !== "subscribers" }
  );

  const {
    data: broadcastsResponse,
    isLoading: isBroadcastsLoading,
    isFetching: isBroadcastsFetching,
  } = useGetNewsletterBroadcastsQuery(
    {
      page: currentPage,
      limit: 10,
      q: searchQuery.trim() || undefined,
      period: periodFilter !== "all_time" ? periodFilter : undefined,
    },
    { skip: activeTab !== "broadcasts" }
  );

  const [exportSubscribers, { isLoading: isExporting }] = useExportNewsletterSubscribersMutation();
  const [sendBroadcast, { isLoading: isSendingBroadcast }] = useSendNewsletterBroadcastMutation();

  // Subscribers Data Parsing
  const rawSubData = subscribersResponse?.data || subscribersResponse;
  const subscribers: any[] = Array.isArray(rawSubData?.items)
    ? rawSubData.items
    : Array.isArray(rawSubData)
    ? rawSubData
    : [];

  const subMeta = rawSubData?.meta || {
    totalItems: subscribers.length,
    totalPages: 1,
    currentPage: 1,
  };

  // Broadcasts Data Parsing
  const rawBcData = broadcastsResponse?.data || broadcastsResponse;
  const broadcasts: any[] = Array.isArray(rawBcData?.items)
    ? rawBcData.items
    : Array.isArray(rawBcData)
    ? rawBcData
    : [];

  const bcMeta = rawBcData?.meta || {
    totalItems: broadcasts.length,
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
      // Switch to broadcasts tab to see the new campaign!
      setActiveTab("broadcasts");
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to dispatch broadcast");
    }
  };

  const getSegmentLabel = (segment?: string) => {
    switch (segment) {
      case "SUBSCRIBERS_ONLY":
        return "Subscribers Only";
      case "ALL_USERS":
        return "Registered Users";
      case "ALL":
        return "Entire Community";
      default:
        return segment || "General Audience";
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[900px] mx-auto flex flex-col animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            Newsletter Hub
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Communications
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Manage subscriber records, dispatch targeted email briefings, and monitor past broadcast performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "subscribers" && (
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
          )}

          <Button
            onClick={() => setShowBroadcastModal(true)}
            className="h-11 px-5 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Compose Broadcast
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-border/40 gap-6">
        <button
          onClick={() => {
            setActiveTab("subscribers");
            setCurrentPage(1);
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 pb-3.5 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "subscribers"
              ? "text-[#155D5F] border-b-2 border-[#155D5F]"
              : "text-slate/60 hover:text-slate"
          }`}
        >
          <Users className="h-4 w-4" />
          Audience Subscribers
          {subMeta.totalItems > 0 && (
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {subMeta.totalItems}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("broadcasts");
            setCurrentPage(1);
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 pb-3.5 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "broadcasts"
              ? "text-[#155D5F] border-b-2 border-[#155D5F]"
              : "text-slate/60 hover:text-slate"
          }`}
        >
          <History className="h-4 w-4" />
          Broadcast Campaigns History
          {bcMeta.totalItems > 0 && (
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-[#155D5F]/10 text-[#155D5F] font-semibold">
              {bcMeta.totalItems}
            </span>
          )}
        </button>
      </div>

      {/* KPI Cards: Dynamic depending on tab */}
      {activeTab === "subscribers" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-outfit text-primary">
                {subMeta.totalItems || subscribers.length}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-outfit text-primary">
                {bcMeta.totalItems || broadcasts.length}
              </p>
              <p className="text-[11px] font-semibold text-primary/80 mt-1">Total Campaigns Dispatched</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#155D5F] flex items-center justify-center text-white">
              <Radio className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-outfit text-emerald-600">
                {broadcasts.filter((b) => b.status === "DELIVERED" || b.status === "SENT").length}
              </p>
              <p className="text-[11px] font-semibold text-primary/80 mt-1">Successfully Dispatched</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-outfit text-slate-700">
                100%
              </p>
              <p className="text-[11px] font-semibold text-primary/80 mt-1">Avg. Delivery Rate</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-white">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
          <Input
            type="text"
            placeholder={
              activeTab === "subscribers"
                ? "Search by subscriber email..."
                : "Search campaigns by title..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter (Only on Subscribers tab) */}
          {activeTab === "subscribers" && (
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
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === st.value
                      ? "bg-white text-primary shadow-sm border border-border/30"
                      : "text-slate/60 hover:text-slate"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}

          {/* Period Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0 cursor-pointer">
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

      {/* Tab 1: Subscribers Table */}
      {activeTab === "subscribers" && (
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[220px]">ID</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Email Address</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">Subscribed Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSubscribersLoading || isSubscribersFetching ? (
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
      )}

      {/* Tab 2: Broadcast Campaigns History Table */}
      {activeTab === "broadcasts" && (
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[280px]">
                  Campaign Title & Subject
                </TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                  Target Segment
                </TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                  Recipients
                </TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                  Delivery Rate
                </TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">
                  Dispatched Date
                </TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBroadcastsLoading || isBroadcastsFetching ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm font-medium text-slate/40">Loading past campaigns...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : broadcasts.length > 0 ? (
                broadcasts.map((bc: any) => {
                  const isDelivered = bc.status === "DELIVERED" || bc.status === "SENT";
                  const dateStr = bc.createdAt;
                  const formattedDate = dateStr ? format(new Date(dateStr), "MMM dd, yyyy · HH:mm") : "-";
                  const recipientCount = bc.target?.recipientCount ?? bc.recipientCount ?? "-";
                  const segment = bc.target?.segment ?? bc.recipientSegment;
                  const subject = bc.target?.subject ?? bc.subject;

                  return (
                    <TableRow key={bc.id} className="border-border/50 hover:bg-surface/30 transition-all">
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5 max-w-[260px]">
                          <span className="font-bold text-dark text-xs truncate" title={bc.title}>
                            {bc.title}
                          </span>
                          {subject && (
                            <span className="text-[11px] text-slate/60 font-medium truncate" title={subject}>
                              {subject}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge variant="outline" className="bg-surface text-slate-700 border-border/60 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          {getSegmentLabel(segment)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center font-bold text-dark text-xs">
                        {recipientCount}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        {isDelivered ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Delivered
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {bc.status || "Pending"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center font-bold text-emerald-700 text-xs">
                        {bc.deliveryRate || "100%"}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right text-slate/60 text-xs font-medium whitespace-nowrap">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBroadcast(bc)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-[#155D5F]/10 hover:text-[#155D5F] text-slate/60 cursor-pointer"
                          title="Preview Broadcast"
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
                    <History className="h-8 w-8 text-slate/20 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate/40">No broadcast campaigns found.</p>
                    <Button
                      onClick={() => setShowBroadcastModal(true)}
                      variant="outline"
                      className="mt-3 text-xs font-bold rounded-xl border-[#155D5F]/30 text-[#155D5F]"
                    >
                      Dispatch Your First Campaign
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {activeTab === "subscribers" && subMeta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate/50 font-medium">
            Page {subMeta.currentPage} of {subMeta.totalPages} ({subMeta.totalItems} total subscribers)
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
              disabled={currentPage >= subMeta.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-xl h-9 text-xs font-semibold gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {activeTab === "broadcasts" && bcMeta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate/50 font-medium">
            Page {bcMeta.currentPage} of {bcMeta.totalPages} ({bcMeta.totalItems} total broadcasts)
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
              disabled={currentPage >= bcMeta.totalPages}
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
          <div className="relative bg-white rounded-[24px] w-full max-w-[640px] max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
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
                  className="rounded-xl text-xs font-bold text-slate cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold px-6 h-11 shadow-md cursor-pointer"
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

      {/* Broadcast Preview Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[24px] w-full max-w-[680px] max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">Campaign Details</h2>
                  <p className="text-xs text-slate/50 font-medium">
                    Dispatched on {selectedBroadcast.createdAt ? format(new Date(selectedBroadcast.createdAt), "PPP · p") : "-"}
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

            {/* Campaign Metadata */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-surface/50 p-4 rounded-xl border border-border/40 text-xs">
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">Internal Title</span>
                  <span className="font-bold text-dark text-sm mt-0.5 block">{selectedBroadcast.title}</span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">Subject Line</span>
                  <span className="font-semibold text-dark text-sm mt-0.5 block">
                    {selectedBroadcast.target?.subject || selectedBroadcast.subject || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">Recipient Segment</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {getSegmentLabel(selectedBroadcast.target?.segment || selectedBroadcast.recipientSegment)}
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">Recipients Reached</span>
                  <span className="font-bold text-dark mt-0.5 block">
                    {selectedBroadcast.target?.recipientCount ?? selectedBroadcast.recipientCount ?? "-"} recipients
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">Status</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {selectedBroadcast.status || "DELIVERED"} ({selectedBroadcast.deliveryRate || "100%"})
                  </span>
                </div>
                <div>
                  <span className="text-slate/50 block text-[10px] uppercase font-bold tracking-wider">Dispatch Channels</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {(selectedBroadcast.channels || ["EMAIL"]).join(", ")}
                  </span>
                </div>
              </div>

              {/* Email Body Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark block">Email Content Body</label>
                <div className="p-5 rounded-2xl border border-border/50 bg-slate-50/50 text-xs text-dark font-sans leading-relaxed max-h-[300px] overflow-y-auto">
                  {selectedBroadcast.body ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedBroadcast.body }}
                      className="prose prose-sm max-w-none"
                    />
                  ) : (
                    <p className="text-slate/40 italic">No message body recorded for this broadcast.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/30 flex items-center justify-end bg-surface/20">
              <Button
                variant="outline"
                onClick={() => setSelectedBroadcast(null)}
                className="rounded-xl text-xs font-bold px-5"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
