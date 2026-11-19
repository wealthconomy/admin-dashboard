"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Calendar,
  Loader2,
  Users,
  Wallet,
  TrendingUp,
  Gift,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetReferralStatsQuery,
  useGetReferralsListQuery,
  useGetReferralPayoutsQuery,
} from "@/lib/redux/features/referralsApi";

const TIME_FILTERS = ["All time", "Today", "Yesterday", "Last 7 days", "Last month", "6 months", "1 year"];
type ActiveTab = "referrals" | "payouts";

function getSafeArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.referrals && Array.isArray(data.referrals)) return data.referrals;
  if (data?.payouts && Array.isArray(data.payouts)) return data.payouts;
  return [];
}

function isWithinDateRange(dateStr: string, filter: string) {
  if (!dateStr || filter === "All time") return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const diffDays = Math.round(
    (new Date().setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000
  );
  if (filter === "Today") return diffDays === 0;
  if (filter === "Yesterday") return diffDays === 1;
  if (filter === "Last 7 days") return diffDays >= 0 && diffDays <= 7;
  if (filter === "Last month") return diffDays >= 0 && diffDays <= 30;
  if (filter === "6 months") return diffDays >= 0 && diffDays <= 180;
  if (filter === "1 year") return diffDays >= 0 && diffDays <= 365;
  return true;
}

function formatCurrency(val: any) {
  if (val === null || val === undefined) return "₦0.00";
  const num = Number(val);
  if (isNaN(num)) return "₦0.00";
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: any) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getName(item: any) {
  if (!item) return "Unknown";
  return `${item.firstName || ""} ${item.lastName || ""}`.trim()
    || item.name
    || item.username
    || item.email
    || "Unknown";
}

// Renders a KPI stat card — only if `value` is not null/undefined
function StatCard({ icon: Icon, label, value, color, bgColor, isLoading }: {
  icon: any; label: string; value: string | number; color: string; bgColor: string; isLoading?: boolean;
}) {
  return (
    <div className="bg-white border border-border/50 rounded-2xl p-5 sm:p-6 flex items-start gap-3.5 sm:gap-4 shadow-sm min-w-0">
      <div className={`p-3 rounded-xl ${bgColor} shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate/40 uppercase tracking-wider truncate">{label}</p>
        {isLoading ? (
          <div className="h-8 flex items-center mt-1">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        ) : (
          <p className="text-xl sm:text-2xl font-extrabold text-dark mt-1 font-outfit truncate" title={String(value)}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("referrals");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("All time");

  // Pagination & Filter states
  const [referralPage, setReferralPage] = useState(1);
  const [referralPageSize, setReferralPageSize] = useState(10);

  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutPageSize, setPayoutPageSize] = useState(10);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  useEffect(() => {
    setReferralPage(1);
    setPayoutPage(1);
  }, [searchQuery, timeFilter, activeTab, payoutStatusFilter, payoutPageSize, referralPageSize]);

  const { data: statsData, isLoading: statsLoading, isFetching: statsFetching, refetch: refetchStats } = useGetReferralStatsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: referralsData, isLoading: referralsLoading, isFetching: referralsFetching, refetch: refetchReferrals } = useGetReferralsListQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: payoutsData, isLoading: payoutsLoading, isFetching: payoutsFetching, refetch: refetchPayouts } = useGetReferralPayoutsQuery(undefined, { refetchOnMountOrArgChange: true });

  const isFetching = statsFetching || referralsFetching || payoutsFetching;
  const handleRefresh = () => {
    refetchStats();
    refetchReferrals();
    refetchPayouts();
  };

  // Extract stats
  const stats = statsData?.data || statsData || {};
  const totalReferralsVal = stats.totalReferrals ?? stats.total ?? stats.totalCount;
  const payoutVolVal = stats.payoutVolumeKobo !== undefined
    ? Number(stats.payoutVolumeKobo) / 100
    : (stats.totalEarnings !== undefined
      ? (Number(stats.totalEarnings) >= 100 ? Number(stats.totalEarnings) / 100 : Number(stats.totalEarnings))
      : (stats.totalPaid !== undefined ? (Number(stats.totalPaid) >= 100 ? Number(stats.totalPaid) / 100 : Number(stats.totalPaid)) : null));
  const pendingVal = stats.pendingPayouts ?? stats.pendingCount ?? stats.pending;
  const conversionRateVal = stats.conversionRate ?? stats.rate;

  const statCards = [
    totalReferralsVal !== undefined && {
      icon: Users, label: "Total Referrals", value: totalReferralsVal,
      color: "text-primary", bgColor: "bg-primary/5",
    },
    payoutVolVal !== null && payoutVolVal !== undefined && {
      icon: Wallet, label: "Total Payout Volume", value: formatCurrency(payoutVolVal),
      color: "text-emerald-600", bgColor: "bg-emerald-50",
    },
    pendingVal !== undefined && {
      icon: Gift, label: "Pending Payouts", value: pendingVal,
      color: "text-amber-500", bgColor: "bg-amber-50",
    },
    conversionRateVal !== undefined && {
      icon: TrendingUp, label: "Conversion Rate", value: `${conversionRateVal}%`,
      color: "text-blue-500", bgColor: "bg-blue-50",
    },
  ].filter(Boolean) as any[];

  const rawReferralList = getSafeArray(referralsData);

  // Group referral events by Referrer for Tab 1 ("Referrals")
  const groupedReferrers = (() => {
    const map = new Map<string, any>();

    rawReferralList.forEach((item: any) => {
      const refUser = item.referrer || (item.firstName || item.email ? item : null);
      const key = item.referrerId || refUser?.id || item.id || item.email || "unknown";

      const amt = item.amountKobo !== undefined
        ? Number(item.amountKobo) / 100
        : (item.amount !== undefined ? (Number(item.amount) >= 100 ? Number(item.amount) / 100 : Number(item.amount)) : 0);

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: getName(refUser || item),
          email: refUser?.email || item.email || "—",
          imageUrl: refUser?.imageUrl || item.imageUrl || "",
          totalEarnings: 0,
          referralCount: 0,
          joinedDate: refUser?.createdAt || item.joinedDate || item.createdAt,
        });
      }

      const existing = map.get(key);
      existing.totalEarnings += amt;
      existing.referralCount += 1;
    });

    return Array.from(map.values());
  })();

  const filteredReferrals = groupedReferrers.filter((ref: any) => {
    const name = ref.name.toLowerCase();
    const email = ref.email.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesDate = isWithinDateRange(ref.joinedDate, timeFilter);
    return matchesSearch && matchesDate;
  });

  // Combine payouts for Tab 2 ("Payout History")
  const combinedPayouts = (() => {
    const rawReferrals = getSafeArray(referralsData);
    const rawPayouts = getSafeArray(payoutsData);
    const map = new Map<string, any>();

    // Add all referrals first (contains full history of both paid and pending rewards)
    rawReferrals.forEach((r: any) => {
      if (r.id) map.set(r.id, r);
    });

    // Merge pending payouts data
    rawPayouts.forEach((p: any) => {
      if (p.id) {
        map.set(p.id, { ...(map.get(p.id) || {}), ...p });
      }
    });

    const list = Array.from(map.values());

    // Sort strictly by date descending: newest first
    return list.sort((a: any, b: any) => {
      const dateA = new Date(a.paidAt || a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.paidAt || b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });
  })();

  const filteredPayouts = combinedPayouts.filter((p: any) => {
    const referrerObj = p.referrer || (p.firstName ? p : null);
    const refereeObj = p.referee || p.referredUser;

    const rName = getName(referrerObj || p).toLowerCase();
    const rEmail = (referrerObj?.email || p.email || "").toLowerCase();
    const refName = getName(refereeObj || {}).toLowerCase();
    const code = (p.code || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = !query || rName.includes(query) || rEmail.includes(query) || refName.includes(query) || code.includes(query);

    // Filter strictly by date!
    const payoutDate = p.paidAt || p.createdAt || p.date;
    const matchesDate = isWithinDateRange(payoutDate, timeFilter);

    // Filter by status if selected
    const statusStr = (p.status || "PENDING").toUpperCase();
    const matchesStatus =
      payoutStatusFilter === "ALL" ||
      (payoutStatusFilter === "PAID" && (statusStr === "PAID" || statusStr === "COMPLETED" || statusStr === "SUCCESSFUL")) ||
      (payoutStatusFilter === "PENDING" && statusStr === "PENDING");

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Paginated slices
  const totalReferralPages = Math.ceil(filteredReferrals.length / referralPageSize) || 1;
  const paginatedReferrals = filteredReferrals.slice(
    (referralPage - 1) * referralPageSize,
    referralPage * referralPageSize
  );

  const totalPayoutPages = Math.ceil(filteredPayouts.length / payoutPageSize) || 1;
  const paginatedPayouts = filteredPayouts.slice(
    (payoutPage - 1) * payoutPageSize,
    payoutPage * payoutPageSize
  );

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] h-auto shrink-0 mx-auto flex flex-col gap-6 sm:gap-8 mb-12 animate-in fade-in duration-500">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold font-outfit text-dark">Users Referrals</h1>
        <p className="text-sm text-slate/50">Monitor top referrals and their earnings</p>
      </div>

      {/* KPI Cards — only shown if stats come back from the backend */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card: any, i: number) => (
            <StatCard key={i} {...card} isLoading={statsLoading || referralsLoading} />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface/50 rounded-xl p-1 w-fit border border-border/30">
        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === "referrals" ? "bg-white text-dark shadow-sm border border-border/30" : "text-slate/60 hover:text-dark"}`}
        >
          Referrals
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 ${activeTab === "payouts" ? "bg-white text-dark shadow-sm border border-border/30" : "text-slate/60 hover:text-dark"}`}
        >
          Payout History
          {combinedPayouts.length > 0 && (
            <span className="bg-primary text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {combinedPayouts.length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface/50 border border-border/40 rounded-xl text-xs font-medium focus:ring-1 focus:ring-primary/20 transition-all outline-none"
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter — available for BOTH tabs! */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setReferralPage(1);
                setPayoutPage(1);
              }}
              className="appearance-none h-9 pl-9 pr-8 rounded-xl bg-white border border-border/60 text-slate text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-surface"
            >
              {TIME_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter — available in Payout History tab */}
          {activeTab === "payouts" && (
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={payoutStatusFilter}
                onChange={(e) => {
                  setPayoutStatusFilter(e.target.value as any);
                  setPayoutPage(1);
                }}
                className="appearance-none h-9 pl-9 pr-8 rounded-xl bg-white border border-border/60 text-slate text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-surface"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid / Completed</option>
                <option value="PENDING">Pending Rewards</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Page Size selector for Payout History */}
          {activeTab === "payouts" && (
            <div className="flex items-center gap-1.5 bg-surface/60 border border-border/60 px-2.5 h-9 rounded-xl">
              <span className="text-[11px] font-bold text-slate/50">Show:</span>
              <select
                value={payoutPageSize}
                onChange={(e) => {
                  setPayoutPageSize(Number(e.target.value));
                  setPayoutPage(1);
                }}
                className="bg-transparent text-xs font-bold text-dark outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh Referrals & Payouts"
            className="h-9 px-3 rounded-xl bg-white border border-border/60 text-slate text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-surface cursor-pointer shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#155D5F] ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface/50 border-b border-border/40">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Name</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Email</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Total Earnings</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Number of Referrals</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4 text-right">Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralsLoading ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={5} className="py-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredReferrals.length === 0 ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={5} className="py-24 text-center">
                      <p className="text-dark font-bold text-base">No referrals found</p>
                      <p className="text-slate/50 text-sm mt-1">No verified client invitations match your filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReferrals.map((ref: any, i: number) => (
                    <TableRow key={ref.id || i} className="border-border/40 hover:bg-surface/30 transition-all font-outfit">
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/5">
                            <AvatarImage src={ref.imageUrl || ""} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs">
                              {ref.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-dark text-[13px]">{ref.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <Link href={`mailto:${ref.email}`} className="text-primary hover:underline text-[12px] font-medium">
                          {ref.email || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-[12px] text-dark font-medium">
                        {formatCurrency(ref.totalEarnings)}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-[12px] text-dark font-medium">
                        {ref.referralCount}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-[12px] text-dark font-medium text-right">
                        {formatDate(ref.joinedDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Referrals Pagination Footer */}
          {filteredReferrals.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-border/40 bg-surface/30">
              <span className="text-xs text-slate/60 font-medium">
                Showing <strong className="text-dark">{Math.min((referralPage - 1) * referralPageSize + 1, filteredReferrals.length)}</strong> to{" "}
                <strong className="text-dark">{Math.min(referralPage * referralPageSize, filteredReferrals.length)}</strong> of{" "}
                <strong className="text-dark">{filteredReferrals.length}</strong> referrers
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReferralPage((p) => Math.max(p - 1, 1))}
                  disabled={referralPage === 1}
                  className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate/70 px-2">
                  Page {referralPage} of {totalReferralPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReferralPage((p) => Math.min(p + 1, totalReferralPages))}
                  disabled={referralPage >= totalReferralPages}
                  className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payout History Tab */}
      {activeTab === "payouts" && (
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface/50 border-b border-border/40">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Referrer</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Referred User</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Reward Amount</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4">Status</TableHead>
                  <TableHead className="text-slate/60 font-bold text-[10px] uppercase h-11 px-4 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsLoading && referralsLoading ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={5} className="py-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredPayouts.length === 0 ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={5} className="py-24 text-center">
                      <p className="text-dark font-bold text-base">No payout records found</p>
                      <p className="text-slate/50 text-sm mt-1">No referral rewards match the selected date or status filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayouts.map((payout: any, i: number) => {
                    const referrerObj = payout.referrer || (payout.firstName ? payout : null);
                    const refereeObj = payout.referee || payout.referredUser;

                    const rawAmt = payout.amountKobo !== undefined
                      ? Number(payout.amountKobo) / 100
                      : (payout.rewardAmount !== undefined
                        ? (Number(payout.rewardAmount) >= 100 ? Number(payout.rewardAmount) / 100 : Number(payout.rewardAmount))
                        : (payout.amount !== undefined ? (Number(payout.amount) >= 100 ? Number(payout.amount) / 100 : Number(payout.amount)) : 0));

                    const statusStr = (payout.status || "PENDING").toUpperCase();

                    return (
                      <TableRow key={payout.id || i} className="border-border/40 hover:bg-surface/30 transition-all font-outfit">
                        <TableCell className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-primary/5">
                              <AvatarImage src={referrerObj?.imageUrl || ""} />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                {getName(referrerObj || payout).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-dark text-[13px]">{getName(referrerObj || payout)}</p>
                              <Link href={`mailto:${referrerObj?.email || payout.email}`} className="text-primary hover:underline text-[11px]">
                                {referrerObj?.email || payout.email || "—"}
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[12px] text-dark font-medium">
                          {refereeObj ? getName(refereeObj) : (payout.referredUserName || "—")}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[12px] font-bold text-emerald-600">
                          {formatCurrency(rawAmt)}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Badge className={`shadow-none text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            statusStr === "PAID" || statusStr === "COMPLETED" || statusStr === "SUCCESSFUL"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {statusStr}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[12px] text-dark font-medium text-right">
                          {formatDate(payout.paidAt ?? payout.createdAt ?? payout.date)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Payouts Pagination Footer */}
          {filteredPayouts.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-border/40 bg-surface/30">
              <span className="text-xs text-slate/60 font-medium">
                Showing <strong className="text-dark">{Math.min((payoutPage - 1) * payoutPageSize + 1, filteredPayouts.length)}</strong> to{" "}
                <strong className="text-dark">{Math.min(payoutPage * payoutPageSize, filteredPayouts.length)}</strong> of{" "}
                <strong className="text-dark">{filteredPayouts.length}</strong> payout records
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayoutPage((p) => Math.max(p - 1, 1))}
                  disabled={payoutPage === 1}
                  className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate/70 px-2">
                  Page {payoutPage} of {totalPayoutPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayoutPage((p) => Math.min(p + 1, totalPayoutPages))}
                  disabled={payoutPage >= totalPayoutPages}
                  className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
