"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Calendar,
  Loader2,
  Users,
  Wallet,
  TrendingUp,
  Gift,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  useApproveReferralPayoutMutation,
} from "@/lib/redux/features/referralsApi";

const TIME_FILTERS = ["All time", "Today", "Yesterday", "Last month", "6 months", "1 year"];
type ActiveTab = "referrals" | "payouts";

function getSafeArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.referrals && Array.isArray(data.referrals)) return data.referrals;
  if (data?.payouts && Array.isArray(data.payouts)) return data.payouts;
  return [];
}

function isWithinDateRange(dateStr: string, filter: string) {
  if (!dateStr || filter === "All time") return true;
  const diffDays = Math.ceil(
    (new Date().setHours(0,0,0,0) - new Date(dateStr).setHours(0,0,0,0)) / 86400000
  );
  if (filter === "Today") return diffDays === 0;
  if (filter === "Yesterday") return diffDays === 1;
  if (filter === "Last month") return diffDays <= 30;
  if (filter === "6 months") return diffDays <= 180;
  if (filter === "1 year") return diffDays <= 365;
  return true;
}

function formatCurrency(val: any) {
  if (val === null || val === undefined) return null;
  return `₦${Number(val).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: any) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getName(item: any) {
  return `${item?.firstName || ""} ${item?.lastName || ""}`.trim()
    || item?.name
    || item?.username
    || item?.email
    || "Unknown";
}

// Renders a KPI stat card — only if `value` is not null/undefined
function StatCard({ icon: Icon, label, value, color, bgColor }: {
  icon: any; label: string; value: string | number; color: string; bgColor: string;
}) {
  return (
    <div className="bg-white border border-border/50 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${bgColor} shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate/40 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-dark mt-1 font-outfit">{value}</p>
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("referrals");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("All time");

  const { data: statsData } = useGetReferralStatsQuery(undefined);
  const { data: referralsData, isLoading: referralsLoading } = useGetReferralsListQuery(undefined);
  const { data: payoutsData, isLoading: payoutsLoading } = useGetReferralPayoutsQuery(undefined);
  const [approvePayout, { isLoading: isApproving }] = useApproveReferralPayoutMutation();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approvePayout(id).unwrap();
      toast.success("Payout approved and wallet credited successfully.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to approve payout.");
    } finally {
      setApprovingId(null);
    }
  };

  // Flatten stats — only render cards for fields that actually have a value
  const stats = statsData?.data || statsData || {};

  // Build stat cards dynamically from what the backend sends
  const statCards = [
    stats.totalReferrals !== undefined && {
      icon: Users, label: "Total Referrals", value: stats.totalReferrals,
      color: "text-primary", bgColor: "bg-primary/5",
    },
    stats.totalEarnings !== undefined && {
      icon: Wallet, label: "Total Earnings Paid", value: formatCurrency(stats.totalEarnings),
      color: "text-emerald-600", bgColor: "bg-emerald-50",
    },
    stats.totalPaid !== undefined && {
      icon: Wallet, label: "Total Paid Out", value: formatCurrency(stats.totalPaid),
      color: "text-emerald-600", bgColor: "bg-emerald-50",
    },
    stats.pendingPayouts !== undefined && {
      icon: Gift, label: "Pending Payouts", value: stats.pendingPayouts,
      color: "text-amber-500", bgColor: "bg-amber-50",
    },
    stats.conversionRate !== undefined && {
      icon: TrendingUp, label: "Conversion Rate", value: `${stats.conversionRate}%`,
      color: "text-blue-500", bgColor: "bg-blue-50",
    },
    stats.pendingCount !== undefined && {
      icon: Gift, label: "Pending Payouts", value: stats.pendingCount,
      color: "text-amber-500", bgColor: "bg-amber-50",
    },
    stats.rate !== undefined && {
      icon: TrendingUp, label: "Conversion Rate", value: `${stats.rate}%`,
      color: "text-blue-500", bgColor: "bg-blue-50",
    },
    stats.total !== undefined && stats.totalReferrals === undefined && {
      icon: Users, label: "Total Referrals", value: stats.total,
      color: "text-primary", bgColor: "bg-primary/5",
    },
  ].filter(Boolean) as any[];

  const referralList = getSafeArray(referralsData);
  const payoutList = getSafeArray(payoutsData);

  const filteredReferrals = referralList.filter((ref: any) => {
    const name = getName(ref).toLowerCase();
    const email = (ref.email || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesDate = isWithinDateRange(ref.joinedDate ?? ref.createdAt, timeFilter);
    return matchesSearch && matchesDate;
  });

  const filteredPayouts = payoutList.filter((p: any) => {
    const name = getName(p.referrer ?? p).toLowerCase();
    const email = (p.referrer?.email || p.email || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold font-outfit text-dark">Users Referrals</h1>
        <p className="text-sm text-slate/50">Monitor top referrals and their earnings</p>
      </div>

      {/* KPI Cards — only shown if stats come back from the backend */}
      {statCards.length > 0 && (
        <div className={`grid gap-4 ${statCards.length === 1 ? "grid-cols-1 max-w-xs" : statCards.length === 2 ? "grid-cols-2" : statCards.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {statCards.map((card: any, i: number) => (
            <StatCard key={i} {...card} />
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
          {payoutList.length > 0 && (
            <span className="bg-primary text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {payoutList.length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Time filter */}
      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1 md:max-w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate/30" />
          <input
            type="text"
            placeholder="Search for Name or Email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2 bg-surface border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        {activeTab === "referrals" && (
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none h-10 pl-10 pr-10 rounded-2xl bg-white border border-border text-slate text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-surface"
            >
              {TIME_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Name</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Email</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Total Earnings</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Number of Referrals</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Joined Date</TableHead>
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
                filteredReferrals.map((ref: any, i: number) => (
                  <TableRow key={ref.id || i} className="border-border/50 hover:bg-surface/30 transition-all font-outfit">
                    <TableCell className="py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/5">
                          <AvatarImage src={ref.imageUrl || ""} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs">
                            {getName(ref).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-dark text-[13px]">{getName(ref)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 whitespace-nowrap">
                      <Link href={`mailto:${ref.email}`} className="text-primary hover:underline text-[12px] font-medium">
                        {ref.email || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="py-6 text-[12px] text-dark font-medium">
                      {formatCurrency(ref.totalEarnings ?? ref.earnings) ?? "₦0.00"}
                    </TableCell>
                    <TableCell className="py-6 text-[12px] text-dark font-medium">
                      {ref.referralCount ?? ref.totalInvites ?? ref.count ?? 0}
                    </TableCell>
                    <TableCell className="py-6 text-[12px] text-dark font-medium">
                      {formatDate(ref.joinedDate ?? ref.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payout History Tab */}
      {activeTab === "payouts" && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Referrer</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Referred User</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Reward Amount</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Status</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Date</TableHead>
                <TableHead className="text-slate/40 font-medium text-xs pb-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutsLoading ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={5} className="py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPayouts.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="py-24 text-center">
                    <p className="text-dark font-bold text-base">No payout records</p>
                    <p className="text-slate/50 text-sm mt-1">No referral rewards have been recorded yet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((payout: any, i: number) => (
                  <TableRow key={payout.id || i} className="border-border/50 hover:bg-surface/30 transition-all font-outfit">
                    <TableCell className="py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/5">
                          <AvatarImage src={payout.referrer?.imageUrl || ""} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs">
                            {getName(payout.referrer ?? payout).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-dark text-[13px]">{getName(payout.referrer ?? payout)}</p>
                          <Link href={`mailto:${payout.referrer?.email || payout.email}`} className="text-primary hover:underline text-[11px]">
                            {payout.referrer?.email || payout.email || "—"}
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-[12px] text-dark font-medium">
                      {getName(payout.referee ?? payout.referredUser ?? {})}
                    </TableCell>
                    <TableCell className="py-6 text-[12px] font-bold text-emerald-600">
                      {formatCurrency(payout.rewardAmount ?? payout.amount) ?? "—"}
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge className={`shadow-none text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                        (payout.status || "").toUpperCase() === "PAID" || (payout.status || "").toUpperCase() === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {payout.status || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-[12px] text-dark font-medium">
                      {formatDate(payout.createdAt ?? payout.date)}
                    </TableCell>
                    <TableCell className="py-6">
                      {(payout.status || "").toUpperCase() === "PENDING" && (
                        <button
                          onClick={() => handleApprove(payout.id)}
                          disabled={isApproving && approvingId === payout.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-lg text-[11px] font-bold disabled:opacity-50"
                        >
                          {isApproving && approvingId === payout.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
