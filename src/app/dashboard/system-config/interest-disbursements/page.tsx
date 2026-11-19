"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowLeft,
  RotateCw,
  Download,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  useGetInterestDisbursementsQuery,
} from "@/lib/redux/features/adminApi";

export default function InterestDisbursementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [limit, setLimit] = useState<number>(20);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);

  // Build query params
  const queryParams: any = {
    limit,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  if (selectedYear !== "all") {
    queryParams.year = Number(selectedYear);
  }
  if (selectedMonth !== "all") {
    queryParams.month = Number(selectedMonth);
  }
  if (currentCursor) {
    queryParams.after = currentCursor;
  }

  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useGetInterestDisbursementsQuery(queryParams);

  // Extract items & pagination metadata
  const rawData: any = responseData?.data || responseData;
  const rawItems: any[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];

  const totalCount: number =
    typeof rawData?.totalCount === "number"
      ? rawData.totalCount
      : typeof rawData?.total === "number"
      ? rawData.total
      : rawItems.length;

  const nextCursor: string | null = rawData?.nextCursor || null;
  const hasNext: boolean = Boolean(rawData?.hasNext || (nextCursor && rawItems.length === limit));

  // Client-side search filtering (by reference or portfolioId)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return rawItems;
    const q = searchQuery.toLowerCase().trim();
    return rawItems.filter(
      (item: any) =>
        item.reference?.toLowerCase().includes(q) ||
        item.portfolioId?.toLowerCase().includes(q) ||
        item.id?.toLowerCase().includes(q)
    );
  }, [rawItems, searchQuery]);

  // Aggregate metrics
  const totalYieldKobo = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      try {
        return acc + BigInt(item.amountKobo || 0);
      } catch {
        return acc + BigInt(Number(item.amountKobo || 0));
      }
    }, BigInt(0));
  }, [filteredItems]);

  const today = new Date();
  const todayDateString = today.toDateString();

  const hasRunToday = useMemo(() => {
    return rawItems.some((log: any) => {
      if (log.createdAt) {
        const d = new Date(log.createdAt);
        if (d.toDateString() === todayDateString) return true;
      }
      if (log.year && log.month && log.day !== undefined && log.day !== null) {
        return (
          log.year === today.getFullYear() &&
          log.month === today.getMonth() + 1 &&
          log.day === today.getDate()
        );
      }
      return false;
    });
  }, [rawItems, todayDateString, today]);

  const formatNaira = (koboVal: any) => {
    if (!koboVal && koboVal !== 0) return "₦0.00";
    const num = Number(koboVal) / 100;
    return `₦${num.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // CSV Report Generator
  const handleDownloadReport = () => {
    if (filteredItems.length === 0) {
      toast.error("No disbursement logs available to download for the current filters.");
      return;
    }

    toast.info("Preparing interest disbursement report...");

    try {
      const headers = [
        "Log ID",
        "Reference",
        "Portfolio ID",
        "Cycle Year",
        "Cycle Month",
        "Cycle Day",
        "Annual Rate (%)",
        "Yield Credited (NGN)",
        "Amount (Kobo)",
        "Processed Timestamp",
      ];

      const rows = filteredItems.map((item: any) => {
        const amountKobo = item.amountKobo ? String(item.amountKobo) : "0";
        const amountNgn = (Number(amountKobo) / 100).toFixed(2);
        const processedAt = item.createdAt
          ? format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")
          : "";

        return [
          `"${item.id || ""}"`,
          `"${item.reference || ""}"`,
          `"${item.portfolioId || ""}"`,
          item.year || "",
          item.month || "",
          item.day || "",
          item.annualRatePct ?? "",
          `"NGN ${amountNgn}"`,
          `"${amountKobo}"`,
          `"${processedAt}"`,
        ];
      });

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      const timestamp = format(new Date(), "yyyy-MM-dd");
      link.setAttribute(
        "download",
        `wealthconomy-interest-disbursements-${selectedYear !== "all" ? selectedYear : "all-years"}-${timestamp}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Interest disbursement report downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to generate disbursement report.");
    }
  };

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory((prev) => [...prev, currentCursor || ""]);
      setCurrentCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursors = [...cursorHistory];
      const prev = prevCursors.pop();
      setCursorHistory(prevCursors);
      setCurrentCursor(prev || undefined);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <Link
            href="/dashboard/system-config"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate/60 hover:text-dark transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to System Configuration
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
              Interest Disbursement History
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Automated Daily Cron Active
            </Badge>
          </div>
          <p className="text-xs text-slate/60 max-w-2xl">
            Detailed ledger of daily interest calculations and direct portfolio balance credits. Filter by cycle, search references, or export reports for auditing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-10 px-3.5 rounded-xl border-border/50 text-xs font-bold text-slate/70 hover:bg-white hover:text-dark transition-all gap-1.5 cursor-pointer shadow-none"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleDownloadReport}
            className="h-10 px-4 rounded-xl text-xs font-bold bg-[#155D5F] hover:bg-[#155D5F]/90 text-white gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Download Report (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-border/50 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate/60 uppercase tracking-wider">
              Total Yield Credited
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-outfit text-dark">
            {formatNaira(totalYieldKobo.toString())}
          </div>
          <p className="text-[11px] text-slate/50 font-medium">
            Accumulated for current filtered view
          </p>
        </div>

        <div className="p-5 bg-white border border-border/50 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate/60 uppercase tracking-wider">
              Total Disbursements Logged
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-outfit text-dark">
            {totalCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate/50 font-medium">
            Historical portfolio credit operations
          </p>
        </div>

        <div className="p-5 bg-white border border-border/50 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate/60 uppercase tracking-wider">
              Today's Cycle Status
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              hasRunToday ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}>
              {hasRunToday ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-lg font-bold font-outfit text-dark flex items-center gap-1.5">
            {hasRunToday ? (
              <span className="text-emerald-700">Completed</span>
            ) : (
              <span className="text-amber-700">Pending Tonight</span>
            )}
          </div>
          <p className="text-[11px] text-slate/50 font-medium">
            {hasRunToday ? "Portfolios credited for today" : "Scheduled at 00:00 UTC"}
          </p>
        </div>

        <div className="p-5 bg-white border border-border/50 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate/60 uppercase tracking-wider">
              Idempotency Security
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold font-outfit text-dark">
            Hardware Guarded
          </div>
          <p className="text-[11px] text-slate/50 font-medium">
            Guaranteed 0 duplicate transactions
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-border/60 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by reference, portfolio ID, or log ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl text-xs bg-surface/50 border-border/60 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-slate/40 hover:text-dark absolute right-3 top-1/2 -translate-y-1/2 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-surface/60 border border-border/60 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate/50" />
              <span className="text-xs font-bold text-slate/60">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentCursor(undefined);
                  setCursorHistory([]);
                }}
                className="bg-transparent text-xs font-bold text-dark outline-none cursor-pointer"
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-surface/60 border border-border/60 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate/50" />
              <span className="text-xs font-bold text-slate/60">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentCursor(undefined);
                  setCursorHistory([]);
                }}
                className="bg-transparent text-xs font-bold text-dark outline-none cursor-pointer"
              >
                <option value="all">All Months</option>
                <option value="1">January (1)</option>
                <option value="2">February (2)</option>
                <option value="3">March (3)</option>
                <option value="4">April (4)</option>
                <option value="5">May (5)</option>
                <option value="6">June (6)</option>
                <option value="7">July (7)</option>
                <option value="8">August (8)</option>
                <option value="9">September (9)</option>
                <option value="10">October (10)</option>
                <option value="11">November (11)</option>
                <option value="12">December (12)</option>
              </select>
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-1.5 bg-surface/60 border border-border/60 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate/60">Per Page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentCursor(undefined);
                  setCursorHistory([]);
                }}
                className="bg-transparent text-xs font-bold text-dark outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-surface/50">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11">Reference</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11">Portfolio ID</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11">Cycle Period</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11">Rate (% P.A.)</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11">Yield Credited</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-11 text-right">Processed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-xs text-slate/50">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#155D5F]" />
                  Loading interest disbursement records...
                </TableCell>
              </TableRow>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: any) => (
                <TableRow key={item.id || item.reference} className="border-border/30 hover:bg-surface/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-dark">
                    {item.reference || item.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate/60">
                    {item.portfolioId}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    {item.year}-{String(item.month).padStart(2, "0")}
                    {item.day ? `-${String(item.day).padStart(2, "0")}` : ""}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-primary">
                    {item.annualRatePct}%
                  </TableCell>
                  <TableCell className="text-xs font-bold text-emerald-700">
                    {formatNaira(item.amountKobo)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Credited
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate/50 text-right font-medium">
                    {item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy, HH:mm:ss") : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-xs text-slate/50">
                  <Coins className="w-10 h-10 text-slate/20 mx-auto mb-3" />
                  No interest disbursement records found matching your filters.
                  <p className="text-[11px] text-slate/40 mt-1 max-w-sm mx-auto">
                    Try adjusting the year or month filters, or clear your search query.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-border/40 bg-surface/30">
          <span className="text-xs text-slate/60 font-medium">
            Showing <strong className="text-dark">{filteredItems.length}</strong> of{" "}
            <strong className="text-dark">{totalCount}</strong> total records
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0 || isLoading || isFetching}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNext || isLoading || isFetching}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}