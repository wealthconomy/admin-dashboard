"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Wallet, Target, Crosshair, Users, Activity,
  Briefcase, TrendingUp, Minus, Calendar, FileText, FileSpreadsheet,
  ShieldCheck, ChevronDown, ChevronUp, Leaf, BarChart2, Blend, Loader2,
  AlertCircle, RotateCw
} from "lucide-react";
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  useGetPortfoliosByTypeQuery, 
  useGetTribesQuery,
  useLazyExportTribesQuery,
  useLazyExportPortfoliosByTypeQuery,
} from "@/lib/redux/features/portfolioApi";
import { useGetUsersQuery } from "@/lib/redux/features/usersApi";
import { toast } from "sonner";

const getInitials = (name: string): string => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<
  string,
  { label: string; description: string; color: string; accent: string; icon: any; backendType?: string }
> = {
  wealthflex: { label: "WealthFlex", description: "Flexible savings plan with variable interest rates", color: "text-red-500", accent: "bg-red-50 border-red-100", icon: Wallet, backendType: "WEALTH_FLEX" },
  wealthgoal: { label: "WealthGoal", description: "Goal-based savings plan to achieve personal targets", color: "text-pink-500", accent: "bg-pink-50 border-pink-100", icon: Target, backendType: "WEALTH_GOAL" },
  wealthfix: { label: "WealthFix", description: "Fixed-term savings with a guaranteed maturity date", color: "text-orange-500", accent: "bg-orange-50 border-orange-100", icon: Crosshair, backendType: "WEALTH_FIX" },
  wealthfam: { label: "WealthFam", description: "Family-oriented group savings plan", color: "text-purple-500", accent: "bg-purple-50 border-purple-100", icon: Users, backendType: "WEALTH_FAM" },
  wealthflow: { label: "WealthFlow", description: "Automated recurring savings and investment plan", color: "text-blue-500", accent: "bg-blue-50 border-blue-100", icon: Activity, backendType: "WEALTH_FLOW" },
  wealthgroup: { label: "WealthGroup", description: "Cooperative group savings and contributions", color: "text-gray-600", accent: "bg-gray-50 border-gray-200", icon: Briefcase },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SavingType = "interest" | "impact" | "mixed";

type PlanUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  balance: number;
  savingType: SavingType;
  hasInterest: boolean;
  interestRate?: number;
  interestAmount?: number;
  wealthPactAmount?: number;
  maturityDate?: string;
  fixStartDate?: string;
  goalName?: string;
  goalTarget?: number;
  goalDeadline?: string;
  goalStartDate?: string;
  planName?: string;
  createdAt?: string;
  status: "ACTIVE" | "COMPLETED" | "MATURED" | "WITHDRAWN" | "CLOSED" | "TERMINATED";
};

type GroupMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  contribution: number;
  savingType: SavingType;
  interestRate?: number;
  interestAmount?: number;
  wealthPactAmount?: number;
  isAdmin: boolean;
};

type WealthGroupData = {
  id: string;
  groupName: string;
  image?: string;
  groupTarget: number;
  startDate: string;
  endDate: string;
  totalSaved?: number;
  interestEarned?: number;
  members: GroupMember[];
  status?: string;
  isTerminated?: boolean;
  isCompleted?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PlanStatusBadge({ status }: { status?: string }) {
  const s = String(status || "").toUpperCase();
  if (
    s.includes("TERMINAT") ||
    s.includes("CANCEL") ||
    s.includes("LIQUIDAT") ||
    s.includes("DISBAND") ||
    s === "TERMINATED"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Terminated
      </span>
    );
  }
  if (s.includes("WITHDRAW")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        Withdrawn
      </span>
    );
  }
  if (s.includes("MATUR")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Matured
      </span>
    );
  }
  if (s.includes("COMPLET")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#155D5F]/10 text-[#155D5F] border border-[#155D5F]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#155D5F]" />
      Active
    </span>
  );
}

function formatCurrency(n: number | string) {
  const num = Number(n) || 0;
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return d;
  }
}
function getDaysRemaining(d: string) {
  try {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  } catch (e) {
    return 0;
  }
}
function daysLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  return `${days} days left`;
}

// ─── Saving-type badge ────────────────────────────────────────────────────────

function SavingTypeBadge({ type }: { type: SavingType }) {
  if (type === "interest") return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
      <BarChart2 className="w-2.5 h-2.5" />Interest
    </span>
  );
  if (type === "impact") return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
      <Leaf className="w-2.5 h-2.5" />Impact
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 whitespace-nowrap">
      <Blend className="w-2.5 h-2.5" />Mixed
    </span>
  );
}

// ─── Interest-earned cell ─────────────────────────────────────────────────────

function InterestEarnedCell({ savingType, interestAmount, wealthPactAmount }: { savingType: SavingType; interestAmount?: number; wealthPactAmount?: number }) {
  const total = (Number(interestAmount) || 0) + (Number(wealthPactAmount) || 0);

  if (total === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap">
        <Minus className="w-2.5 h-2.5" />N/A
      </span>
    );
  }

  return (
    <span className="text-[12px] font-black font-outfit text-[#155D5F]">
      {formatCurrency(total)}
    </span>
  );
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function buildCsvRows(plan: string, users: PlanUser[], isWealthFix: boolean, isWealthGoal: boolean) {
  const baseH = ["Name", "Email", "Phone", "Saving Type", "Status", "Balance (₦)", "Interest Rate (%)", "Interest Earned (₦)"];
  const fixH = ["Fixed For", "Fix Start Date", "Maturity Date", "Days to Maturity"];
  const goalH = ["Saving For", "Goal Target (₦)", "Amount Saved (₦)", "Started", "Deadline"];
  const headers = [...baseH, ...(isWealthFix ? fixH : []), ...(isWealthGoal ? goalH : [])];

  const rows = users.map((u) => {
    const base = [
      u.name, u.email, u.phone,
      u.savingType.charAt(0).toUpperCase() + u.savingType.slice(1),
      u.status,
      (Number(u.balance) || 0).toFixed(2),
      u.hasInterest ? (Number(u.interestRate) || 0).toFixed(1) : "0",
      u.hasInterest ? (Number(u.interestAmount) || 0).toFixed(2) : "0",
    ];
    const fix = isWealthFix ? [u.planName || u.goalName || "", u.fixStartDate ? formatDate(u.fixStartDate) : "", u.maturityDate ? formatDate(u.maturityDate) : "", u.maturityDate ? String(getDaysRemaining(u.maturityDate)) : ""] : [];
    const goal = isWealthGoal ? [u.goalName ?? "", (Number(u.goalTarget) || 0).toFixed(2) ?? "", (Number(u.balance) || 0).toFixed(2), u.goalStartDate ? formatDate(u.goalStartDate) : "", u.goalDeadline ? formatDate(u.goalDeadline) : ""] : [];
    return [...base, ...fix, ...goal];
  });
  return [headers, ...rows];
}

function buildGroupCsvRows(groups: WealthGroupData[]) {
  const headers = ["Group Name", "Group Target (₦)", "Start Date", "End Date", "Days Remaining", "Role", "Member Name", "Email", "Phone", "Saving Type", "Individual Contribution (₦)", "Interest Rate (%)", "Interest Earned (₦)", "Group Total (₦)"];
  const rows: string[][] = [];
  for (const g of groups) {
    const total = g.members.reduce((s, m) => s + (Number(m.contribution) || 0), 0);
    const daysRem = getDaysRemaining(g.endDate);
    for (const m of g.members) {
      rows.push([
        g.groupName,
        (Number(g.groupTarget) || 0).toFixed(2),
        formatDate(g.startDate),
        formatDate(g.endDate),
        daysRem < 0 ? "Ended" : String(daysRem) + " days left",
        m.isAdmin ? "Admin" : "Member",
        m.name, m.email, m.phone,
        m.savingType.charAt(0).toUpperCase() + m.savingType.slice(1),
        (Number(m.contribution) || 0).toFixed(2),
        m.savingType !== "impact" ? (Number(m.interestRate) || 0).toFixed(1) : "0",
        m.savingType !== "impact" ? (Number(m.interestAmount) || 0).toFixed(2) : "0",
        total.toFixed(2),
      ]);
    }
  }
  return [headers, ...rows];
}

async function downloadPDF(plan: string, users: PlanUser[], groups: WealthGroupData[], label: string, isWealthFix: boolean, isWealthGoal: boolean, isWealthGroup: boolean) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`${label} — Member Report`, 14, 18);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
    const count = isWealthGroup ? groups.reduce((s, g) => s + g.members.length, 0) : users.length;
    doc.text(`Generated: ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}  ·  ${count} members`, 14, 25);
    doc.setTextColor(0);
    const rows = isWealthGroup ? buildGroupCsvRows(groups) : buildCsvRows(plan, users, isWealthFix, isWealthGoal);
    const [head, ...body] = rows;
    autoTable(doc, { startY: 30, head: [head], body, styles: { fontSize: 7.5, cellPadding: 2.5 }, headStyles: { fillColor: [21, 93, 95], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] }, margin: { left: 14, right: 14 } });
    doc.save(`${label.toLowerCase().replace(/\s+/g, "-")}-members.pdf`);
  } catch (err) {
    toast.error("Failed to generate PDF");
  }
}

// ─── WealthGroup card ─────────────────────────────────────────────────────────

function GroupCard({ group }: { group: WealthGroupData }) {
  const [expanded, setExpanded] = useState(true);
  const membersSaved = group.members.reduce((s, m) => s + (Number(m.contribution) || 0), 0);
  const total = group.totalSaved != null && group.totalSaved > 0 ? group.totalSaved : membersSaved;

  const membersInterest = group.members.reduce((s, m) => s + (Number(m.interestAmount) || 0), 0);
  const totalInterest = group.interestEarned != null && group.interestEarned > 0 ? group.interestEarned : membersInterest;

  const totalWealthpact = group.members.reduce((s, m) => s + (Number(m.wealthPactAmount) || 0), 0);
  const admin = group.members.find((m) => m.isAdmin);

  return (
    <div className="border border-border/30 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 bg-surface/60 cursor-pointer hover:bg-surface/90 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-4">
          {group.image ? (
            <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-border/20 bg-white">
              <img src={group.image} alt={group.groupName} className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-black text-dark font-outfit">{group.groupName}</p>
              {group.isTerminated ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Terminated
                </span>
              ) : group.isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#155D5F]/10 text-[#155D5F] border border-[#155D5F]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#155D5F]" />
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-[11px] text-slate/50 font-medium">
                {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                {admin && <> · Admin: <span className="text-dark font-semibold">{admin.name}</span></>}
              </span>
              <span className="text-[10px] text-slate/40 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(group.startDate)} → {formatDate(group.endDate)}
                {group.isTerminated ? (
                  <span className="ml-1 font-bold text-red-500">
                    · Terminated
                  </span>
                ) : (
                  <span className={`ml-1 font-bold ${getDaysRemaining(group.endDate) < 0 ? "text-emerald-500" :
                    getDaysRemaining(group.endDate) <= 30 ? "text-orange-500" : "text-slate/40"
                    }`}>
                    · {getDaysRemaining(group.endDate) < 0 ? "Ended" : `${getDaysRemaining(group.endDate)}d left`}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wide">Group Target</p>
            <p className="text-[13px] font-black text-dark font-outfit">{formatCurrency(group.groupTarget)}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wide">Interest Earned</p>
            <p className="text-[13px] font-black text-emerald-600 font-outfit">{formatCurrency(totalInterest)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wide">Total Saved</p>
            <p className="text-[15px] font-black text-dark font-outfit">{formatCurrency(total)}</p>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate/40 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-slate/40 shrink-0" />
          }
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-border/15 bg-white">
                <th className="text-left py-2.5 px-5 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Member</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Contact</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Role</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Saving Type</th>
                <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Contribution</th>
                <th className="text-right py-2.5 px-5 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Interest / Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {group.members
                .slice()
                .sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0))
                .map((member) => (
                  <tr key={member.id} className={`transition-colors ${member.isAdmin ? "bg-gray-50/80" : "hover:bg-surface/30"}`}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-border/5 shrink-0">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[12px] font-bold text-dark whitespace-nowrap">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-dark">{member.email}</span>
                        <span className="text-[10px] text-slate/50 font-medium">{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {member.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-white">
                          <ShieldCheck className="w-3 h-3" />Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                          <Users className="w-3 h-3" />Member
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <SavingTypeBadge type={member.savingType} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[12px] font-black text-dark font-outfit">{formatCurrency(member.contribution)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <InterestEarnedCell savingType={member.savingType} interestAmount={member.interestAmount} wealthPactAmount={member.wealthPactAmount} />
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border/20 bg-surface/40">
                <td colSpan={4} className="py-3 px-5 text-[11px] font-bold text-slate/50 uppercase tracking-wide">
                  Group Total ({group.members.length} members)
                </td>
                <td className="py-3 px-4 text-right text-[14px] font-black text-dark font-outfit">{formatCurrency(total)}</td>
                <td className="py-3 px-5 text-right text-[14px] font-black text-[#155D5F] font-outfit">
                  {formatCurrency(totalInterest + totalWealthpact)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanUsersPage() {
  const { plan } = useParams<{ plan: string }>();
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState("all_time");
  const [isExpanded, setIsExpanded] = useState(false);
  const [planTab, setPlanTab] = useState<"active" | "completed" | "terminated" | "all">("active");

  const planKey = plan?.toLowerCase();
  const meta = PLAN_META[planKey as string];

  const isWealthFix = planKey === "wealthfix";
  const isWealthGoal = planKey === "wealthgoal";
  const isWealthGroup = planKey === "wealthgroup";

  // Data Fetching
  const { data: portfoliosRes, isLoading: isLoadingPortfolios, isFetching: isFetchingPortfolios, refetch: refetchPortfolios } = useGetPortfoliosByTypeQuery(
    { type: meta?.backendType || "", period: dateFilter, status: "ALL" },
    { skip: !meta?.backendType || isWealthGroup, refetchOnMountOrArgChange: true }
  );

  const { data: tribesRes, isLoading: isLoadingTribes, isFetching: isFetchingTribes, refetch: refetchTribes } = useGetTribesQuery(
    { period: dateFilter, status: "ALL" },
    { skip: !isWealthGroup, refetchOnMountOrArgChange: true }
  );

  const { data: allUsersData } = useGetUsersQuery({ limit: 500 });

  const [exportTribes] = useLazyExportTribesQuery();
  const [exportPortfolios] = useLazyExportPortfoliosByTypeQuery();

  const isLoading = isLoadingPortfolios || isLoadingTribes;
  const isFetching = isFetchingPortfolios || isFetchingTribes;
  const handleRefresh = () => {
    if (isWealthGroup) {
      refetchTribes();
    } else {
      refetchPortfolios();
    }
  };

  // Build a lookup map of all platform users by ID and email
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    const rawList = Array.isArray(allUsersData)
      ? allUsersData
      : Array.isArray(allUsersData?.data)
        ? allUsersData.data
        : Array.isArray(allUsersData?.data?.items)
          ? allUsersData.data.items
          : Array.isArray(allUsersData?.items)
            ? allUsersData.items
            : [];

    rawList.forEach((u: any) => {
      if (u.id) map.set(String(u.id), u);
      if (u._id) map.set(String(u._id), u);
      if (u.userId) map.set(String(u.userId), u);
      if (u.email) map.set(String(u.email).toLowerCase(), u);
    });
    return map;
  }, [allUsersData]);

  // Helper to convert kobo (lowest currency unit) to naira
  const fromKobo = (val: any): number => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return 0;
    return num / 100;
  };

  // Mappers
  const users = useMemo<PlanUser[]>(() => {
    if (isWealthGroup || !portfoliosRes) return [];
    const items = Array.isArray(portfoliosRes)
      ? portfoliosRes
      : Array.isArray(portfoliosRes?.data)
        ? portfoliosRes.data
        : Array.isArray(portfoliosRes?.data?.items)
          ? portfoliosRes.data.items
          : Array.isArray(portfoliosRes?.data?.portfolios)
            ? portfoliosRes.data.portfolios
            : Array.isArray(portfoliosRes?.items)
              ? portfoliosRes.items
              : Array.isArray(portfoliosRes?.portfolios)
                ? portfoliosRes.portfolios
                : [];

    return items.map((u: any): PlanUser => {
      const userObj = (typeof u.user === "object" && u.user !== null ? u.user : null) || (typeof u.customer === "object" && u.customer !== null ? u.customer : null) || {};
      const memberObj = (typeof u.member === "object" && u.member !== null ? u.member : null) || {};

      const userIdKey = String(u.userId || u.user_id || userObj.id || userObj._id || memberObj.id || u.id || "");
      const userEmailKey = String(u.email || userObj.email || memberObj.email || "").toLowerCase();
      const matchedUser = userMap.get(userIdKey) || userMap.get(userEmailKey) || {};

      const firstName =
        u.firstName ||
        u.first_name ||
        userObj.firstName ||
        userObj.first_name ||
        memberObj.firstName ||
        matchedUser.firstName ||
        "";

      const lastName =
        u.lastName ||
        u.last_name ||
        userObj.lastName ||
        userObj.last_name ||
        memberObj.lastName ||
        matchedUser.lastName ||
        "";

      const fullName = `${firstName} ${lastName}`.trim();
      const memberName =
        fullName ||
        u.name ||
        u.fullName ||
        u.memberName ||
        userObj.name ||
        userObj.fullName ||
        memberObj.name ||
        matchedUser.name ||
        "Member";

      const email =
        u.email ||
        userObj.email ||
        memberObj.email ||
        matchedUser.email ||
        "—";

      const phone =
        u.phone ||
        u.phoneNumber ||
        u.phone_number ||
        userObj.phone ||
        memberObj.phone ||
        matchedUser.phone ||
        "—";

      const avatar =
        u.avatar ||
        u.avatarUrl ||
        u.imageUrl ||
        userObj.avatar ||
        userObj.avatarUrl ||
        userObj.imageUrl ||
        memberObj.avatar ||
        memberObj.avatarUrl ||
        matchedUser.imageUrl ||
        matchedUser.avatarUrl ||
        "";

      const rawBalance =
        u.balance ??
        u.totalBalance ??
        u.amount ??
        u.currentBalance ??
        u.principal ??
        0;

      const rawSavingType = String(
        u.savingType ||
        u.type ||
        u.planType ||
        "interest"
      ).toLowerCase();

      const savingType: SavingType = rawSavingType.includes("impact")
        ? "impact"
        : rawSavingType.includes("mixed")
          ? "mixed"
          : "interest";

      const hasInterest = savingType !== "impact";
      const interestRate = Number(u.interestRate ?? u.rate ?? u.annualPercentageYield ?? 0);
      const interestAmount = fromKobo(u.interestAccrued ?? u.interestAmount ?? u.interestEarned ?? u.accruedInterest ?? u.interest ?? 0);
      const wealthPactAmount = fromKobo(u.impactAccrued ?? u.wealthPactAmount ?? u.impactAmount ?? u.wealthpact ?? u.impactValue ?? 0);
      const goalTarget = fromKobo(u.goalTarget ?? u.targetAmount ?? u.target ?? 0);
      const balance = fromKobo(rawBalance);

      const goalDeadline =
        u.deadlineDate ||
        u.goalDeadline ||
        u.deadline ||
        u.targetDate ||
        u.maturityDate ||
        u.endDate ||
        u.matureAt ||
        u.durationDate ||
        u.expectedEndDate ||
        u.duration;

      const goalStartDate =
        u.startedDate ||
        u.goalStartDate ||
        u.fixStartDate ||
        u.startDate ||
        u.createdAt ||
        u.created_at ||
        u.openedAt;

      const planName = u.name || u.savingFor || u.goalName || u.targetName || u.title || u.goalTitle || "—";

      const rawStatus = String(u.status || u.planStatus || u.state || "").toUpperCase();
      let status: "ACTIVE" | "COMPLETED" | "MATURED" | "WITHDRAWN" | "CLOSED" | "TERMINATED" = "ACTIVE";

      if (
        rawStatus.includes("TERMINAT") ||
        rawStatus.includes("CANCEL") ||
        rawStatus.includes("LIQUIDAT") ||
        rawStatus.includes("DISBAND") ||
        rawStatus.includes("DELET") ||
        rawStatus.includes("INACTIVE") ||
        Boolean(u.isTerminated) ||
        Boolean(u.terminatedAt)
      ) {
        status = "TERMINATED";
      } else if (rawStatus.includes("MATUR")) {
        status = "MATURED";
      } else if (rawStatus.includes("WITHDRAW")) {
        status = "WITHDRAWN";
      } else if (rawStatus.includes("CLOSE")) {
        status = "CLOSED";
      } else if (rawStatus.includes("COMPLET") || rawStatus.includes("PAID") || Boolean(u.isCompleted)) {
        status = "COMPLETED";
      } else {
        status = "ACTIVE";
      }

      return {
        id: String(u.id || u._id || memberObj.id || userObj.id || userObj._id || Math.random()),
        name: memberName,
        email,
        phone,
        avatar,
        balance,
        savingType,
        hasInterest,
        interestRate,
        interestAmount,
        wealthPactAmount,
        maturityDate: goalDeadline,
        fixStartDate: goalStartDate,
        goalName: planName,
        goalTarget,
        goalDeadline,
        goalStartDate,
        planName,
        createdAt: goalStartDate,
        status,
      };
    });
  }, [portfoliosRes, isWealthGroup, userMap]);

  const groups = useMemo<WealthGroupData[]>(() => {
    if (!isWealthGroup || !tribesRes) return [];
    const items = Array.isArray(tribesRes)
      ? tribesRes
      : Array.isArray(tribesRes?.data)
        ? tribesRes.data
        : Array.isArray(tribesRes?.data?.items)
          ? tribesRes.data.items
          : Array.isArray(tribesRes?.data?.tribes)
            ? tribesRes.data.tribes
            : Array.isArray(tribesRes?.data?.groups)
              ? tribesRes.data.groups
              : Array.isArray(tribesRes?.items)
                ? tribesRes.items
                : Array.isArray(tribesRes?.tribes)
                  ? tribesRes.tribes
                  : [];

    return items.map((g: any) => {
      const rawStatus = String(g.status || g.state || "").toUpperCase();
      const membersCount = Number(g.membersCount ?? g.members?.length ?? 0);
      const totalSaved = fromKobo(g.totalSaved ?? g.totalSavings ?? g.totalBalance ?? 0);
      const groupTarget = fromKobo(g.groupTarget ?? g.targetAmount ?? g.target ?? 0);
      const endDate = g.endDate || g.deadline || new Date().toISOString();

      const isEnded = endDate ? new Date(endDate).getTime() < Date.now() : false;
      const isGoalMet = groupTarget > 0 && totalSaved >= groupTarget;

      const isTerminated = Boolean(
        g.isTerminated ||
        g.terminatedAt ||
        rawStatus.includes("TERMINAT") ||
        rawStatus.includes("CANCEL") ||
        rawStatus.includes("CLOSED") ||
        rawStatus.includes("DELET") ||
        (membersCount === 0 && totalSaved === 0)
      );

      const isCompleted = !isTerminated && (
        rawStatus.includes("COMPLET") ||
        isEnded ||
        isGoalMet
      );

      return {
        id: String(g.id || g._id || Math.random()),
        groupName: g.groupName || g.name || g.title || "Group",
        image: g.image || g.icon || g.avatar || null,
        groupTarget,
        totalSaved,
        interestEarned: fromKobo(g.interestEarned ?? g.totalInterest ?? g.interestAmount ?? 0),
        startDate: g.startDate || g.createdAt || new Date().toISOString(),
        endDate,
        status: isTerminated ? "TERMINATED" : isCompleted ? "COMPLETED" : "ACTIVE",
        isTerminated,
        isCompleted,
        members: (g.members || g.users || []).map((m: any) => {
          const u = (typeof m.user === "object" && m.user !== null ? m.user : null) || (typeof m.customer === "object" && m.customer !== null ? m.customer : null) || m;
          const firstName = u.firstName || u.first_name || m.firstName || "";
          const lastName = u.lastName || u.last_name || m.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          const memberName = fullName || u.name || u.fullName || u.username || m.name || "Member";
          const email = u.email || m.email || "—";
          const phone = u.phone || u.phoneNumber || m.phone || "—";
          const avatar = u.avatar || u.avatarUrl || u.imageUrl || m.avatar || "";

          const rawRole = String(m.role || u.role || "").toLowerCase();
          const isAdmin = Boolean(m.isAdmin || rawRole === "admin" || rawRole === "leader" || rawRole === "creator" || m.isLeader);

          const rawInterest = m.interestOrImpact ?? m.interestAmount ?? m.interestEarned ?? m.interest ?? 0;
          const rawType = String(m.savingType || m.type || "interest").toLowerCase();
          const savingType: SavingType = rawType.includes("impact")
            ? "impact"
            : rawType.includes("mixed")
              ? "mixed"
              : "interest";

          const interestAmount = savingType !== "impact" ? fromKobo(rawInterest) : 0;
          const wealthPactAmount = savingType === "impact" ? fromKobo(rawInterest) : 0;

          return {
            id: String(m.id || m._id || u.id || u._id || Math.random()),
            name: memberName,
            email,
            phone,
            avatar,
            contribution: fromKobo(m.contribution ?? m.amount ?? m.balance ?? u.balance ?? 0),
            savingType,
            interestRate: Number(m.interestRate ?? m.rate ?? 0),
            interestAmount,
            wealthPactAmount,
            isAdmin,
          };
        }),
      };
    });
  }, [tribesRes, isWealthGroup]);

  // Tab filtering logic
  const activeUsers = useMemo(() => users.filter((u) => u.status === "ACTIVE"), [users]);
  const completedUsers = useMemo(() => users.filter((u) => u.status === "COMPLETED" || u.status === "MATURED"), [users]);
  const terminatedUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.status === "TERMINATED" ||
          u.status === "WITHDRAWN" ||
          u.status === "CLOSED"
      ),
    [users]
  );
  const displayedUsers = useMemo(() => {
    if (planTab === "active") return activeUsers;
    if (planTab === "completed") return completedUsers;
    if (planTab === "terminated") return terminatedUsers;
    return users;
  }, [planTab, activeUsers, completedUsers, terminatedUsers, users]);

  const activeGroups = useMemo(() => groups.filter((g) => !g.isTerminated && !g.isCompleted), [groups]);
  const completedGroups = useMemo(() => groups.filter((g) => g.isCompleted), [groups]);
  const terminatedGroups = useMemo(() => groups.filter((g) => g.isTerminated), [groups]);
  const validGroups = useMemo(() => groups.filter((g) => !g.isTerminated), [groups]);
  const displayedGroups = useMemo(() => {
    if (planTab === "active") return activeGroups;
    if (planTab === "completed") return completedGroups;
    if (planTab === "terminated") return terminatedGroups;
    return validGroups;
  }, [planTab, activeGroups, completedGroups, terminatedGroups, validGroups]);

  const activeCount = isWealthGroup ? activeGroups.length : activeUsers.length;
  const completedCount = isWealthGroup ? completedGroups.length : completedUsers.length;
  const terminatedCount = isWealthGroup ? terminatedGroups.length : terminatedUsers.length;
  const allCount = isWealthGroup ? validGroups.length : users.length;

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate">
        <p className="text-lg font-bold">Plan not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  // Dashboard calculations based on API response fields or computed from mapper
  const resData = portfoliosRes?.data || portfoliosRes || {};
  const tribesData = tribesRes?.data || tribesRes || {};

  const totalMembers = isWealthGroup
    ? Number(tribesData?.totalMembers ?? validGroups.reduce((s, g) => s + g.members.length, 0))
    : Number(resData?.totalMembers ?? resData?.totalUsers ?? resData?.totalCount ?? resData?.total ?? users.length);

  const totalBalance = isWealthGroup
    ? (tribesData?.totalSavings != null ? fromKobo(tribesData.totalSavings) : (tribesData?.totalBalance != null ? fromKobo(tribesData.totalBalance) : validGroups.reduce((s, g) => s + g.members.reduce((sm, m) => sm + m.contribution, 0), 0)))
    : (resData?.totalBalance != null ? fromKobo(resData.totalBalance) : (resData?.totalAmount != null ? fromKobo(resData.totalAmount) : (resData?.totalSavings != null ? fromKobo(resData.totalSavings) : users.reduce((s, u) => s + u.balance, 0))));

  const totalInterest = isWealthGroup
    ? (tribesData?.totalInterest != null ? fromKobo(tribesData.totalInterest) : validGroups.reduce((s, g) => s + g.members.reduce((sm, m) => sm + (m.interestAmount || 0), 0), 0))
    : (resData?.totalInterest != null ? fromKobo(resData.totalInterest) : users.reduce((s, u) => s + (u.interestAmount || 0), 0));

  const totalWealthPact = isWealthGroup
    ? (tribesData?.totalWealthpact != null ? fromKobo(tribesData.totalWealthpact) : validGroups.reduce((s, g) => s + g.members.reduce((sm, m) => sm + (m.wealthPactAmount || 0), 0), 0))
    : (resData?.totalWealthpact != null ? fromKobo(resData.totalWealthpact) : users.reduce((s, u) => s + (u.wealthPactAmount || 0), 0));

  const avgBalance = portfoliosRes?.avgBalanceOrTarget || resData?.avgBalanceOrTarget
    ? fromKobo(portfoliosRes?.avgBalanceOrTarget || resData?.avgBalanceOrTarget)
    : (totalMembers > 0 ? totalBalance / totalMembers : 0);

  const interestUsers = isWealthGroup
    ? validGroups.reduce((s, g) => s + g.members.filter(m => m.savingType !== 'impact').length, 0)
    : users.filter(u => u.savingType !== 'impact').length;

  const impactUsers = isWealthGroup
    ? validGroups.reduce((s, g) => s + g.members.filter(m => m.savingType === 'impact').length, 0)
    : users.filter(u => u.savingType === 'impact').length;

  const totalGroupsCount = validGroups.length;
  const summaryCards = isWealthGroup ? [
    { title: "Total Groups", value: totalGroupsCount.toLocaleString(), subtext: "Active & completed groups", icon: Users, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#155D5F]" },
    { title: "Total Savings", value: formatCurrency(totalBalance), subtext: "Combined deposits", icon: Wallet, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#65D36A]" },
    { title: "Total Interest", value: formatCurrency(totalInterest), subtext: `Earned across groups (${interestUsers}/${totalMembers} savers)`, icon: Activity, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#65D36A]" },
    { title: "Total Wealthpact", value: formatCurrency(totalWealthPact), subtext: `Impact plan accrued (${impactUsers}/${totalMembers} savers)`, icon: Leaf, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#65D36A]" },
  ] : [
    { title: "Total Members", value: totalMembers.toLocaleString(), subtext: "Enrolled users", icon: Users, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#155D5F]" },
    { title: "Total Balance", value: formatCurrency(totalBalance), subtext: "Combined savings", icon: Wallet, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#65D36A]" },
    { title: isWealthFix ? "Avg Term" : isWealthGoal ? "Avg Goal Target" : "Avg Balance", value: isWealthFix ? "12 months" : formatCurrency(avgBalance), subtext: isWealthFix ? "lock-in period" : isWealthGoal ? "combined targets avg" : "per member", icon: Target, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#155D5F]" },
    { title: "Total Interest", value: formatCurrency(totalInterest), subtext: `Interest earned by ${interestUsers}/${totalMembers} savers`, icon: Activity, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#65D36A]" },
    { title: "Total Wealthpact", value: formatCurrency(totalWealthPact), subtext: `Accrued by ${impactUsers}/${totalMembers} savers`, icon: Leaf, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#65D36A]" },
  ];

  const visibleCards = isExpanded ? summaryCards : summaryCards.slice(0, 3);
  const Icon = meta.icon;

  const handleExportCSV = async () => {
    try {
      toast.info("Preparing CSV export...");
      let blob: Blob;
      if (isWealthGroup) {
        blob = await exportTribes().unwrap();
      } else {
        blob = await exportPortfolios({ type: meta.backendType || "" }).unwrap();
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.label.toLowerCase()}-export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Export downloaded successfully!");
    } catch {
      downloadCSV(planKey as string, users, groups, meta.label, isWealthFix, isWealthGoal, isWealthGroup);
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-surface border border-border/40 text-slate transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`p-2.5 rounded-2xl ${meta.accent} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${meta.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-black font-outfit text-dark tracking-tight">{meta.label}</h1>
              <p className="text-xs text-slate/60 font-semibold">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border/50 bg-white text-xs font-bold text-dark focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="all_time">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-surface hover:bg-surface/80 border border-border/50 text-[12px] font-bold text-slate transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />Export CSV
            </button>

            <button
              onClick={handleRefresh}
              disabled={isFetching}
              title="Refresh Plan Members"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-surface hover:bg-surface/80 border border-border/50 text-[12px] font-bold text-slate transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#155D5F] ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="relative pt-4 pb-4">
          {summaryCards.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-[60px] -right-5 w-[36px] h-[36px] rounded-[11px] bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-slate hover:bg-surface transition-colors z-10"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-[124px] rounded-[20px] bg-[#F2FFFF] border border-[#155D5F1F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.07)] p-5 flex flex-col justify-between gap-[10px] animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-7 w-28 bg-[#155D5F]/15 rounded-lg" />
                      <div className="h-4 w-20 bg-[#155D5F]/10 rounded-md" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#155D5F]/15 shrink-0" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="h-[1px] bg-[#155D5F]/15 w-full"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#155D5F]/25 shrink-0"></div>
                      <div className="h-3.5 w-32 bg-[#155D5F]/15 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              visibleCards.map((stat, i) => (
                <div
                  key={i}
                  className="w-full h-[124px] rounded-[20px] bg-[#F2FFFF] border border-[#155D5F1F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.07)] p-5 flex flex-col justify-between gap-[10px]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[28px] font-semibold text-[#155D5F] leading-none mb-1">
                        {stat.value}
                      </div>
                      <div className="text-[13px] font-semibold text-[#155D5F]">
                        {stat.title}
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${stat.color} shrink-0`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="h-[1px] bg-[#155D5F]/20 w-full"></div>
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#155D5F]">
                      {stat.dotColor && (
                        <div className={`w-2 h-2 rounded-full ${stat.dotColor}`}></div>
                      )}
                      <span className="leading-tight">{stat.subtext}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active vs Completed Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-3">
        <div className="flex items-center gap-2 p-1 bg-surface rounded-2xl border border-border/40 w-fit flex-wrap">
          <button
            onClick={() => setPlanTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              planTab === "active"
                ? "bg-white text-[#155D5F] shadow-sm"
                : "text-slate/60 hover:text-dark hover:bg-white/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {isWealthGroup ? "Active Groups" : "Active Plans"} ({activeCount})
          </button>
          <button
            onClick={() => setPlanTab("completed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              planTab === "completed"
                ? "bg-white text-[#155D5F] shadow-sm"
                : "text-slate/60 hover:text-dark hover:bg-white/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {isWealthGroup ? "Completed Groups" : "Completed Plans"} ({completedCount})
          </button>
          <button
            onClick={() => setPlanTab("terminated")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              planTab === "terminated"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate/60 hover:text-dark hover:bg-white/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {isWealthGroup ? "Terminated Groups" : "Terminated Plans"} ({terminatedCount})
          </button>
          <button
            onClick={() => setPlanTab("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              planTab === "all"
                ? "bg-white text-[#155D5F] shadow-sm"
                : "text-slate/60 hover:text-dark hover:bg-white/50"
            }`}
          >
            All ({allCount})
          </button>
        </div>

        <div className="text-xs font-semibold text-slate/50">
          Showing {isWealthGroup ? displayedGroups.length : displayedUsers.length}{" "}
          {planTab === "active" ? "active" : planTab === "completed" ? "completed" : planTab === "terminated" ? "terminated" : "total"}{" "}
          {isWealthGroup ? "group(s)" : "plan(s)"}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-bold text-slate/50">Loading data...</p>
        </div>
      ) : isWealthGroup ? (
        <div className="flex flex-col gap-4">
          {displayedGroups.map((group) => <GroupCard key={group.id} group={group} />)}
          {displayedGroups.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-slate/40">
              <Briefcase className="w-8 h-8" />
              <p className="text-sm font-bold">No {planTab === "active" ? "active" : planTab === "completed" ? "completed" : planTab === "terminated" ? "terminated" : ""} groups found for this period.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/30">
          <table className="w-full">
            <thead>
              <tr className="bg-surface/70 border-b border-border/20">
                <th className="text-left py-3.5 px-5 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Member</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Type</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Status</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Balance</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Interest / Impact</th>

                {isWealthFix && (
                  <>
                    <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Fixed For</th>
                    <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Maturity & Timeline</th>
                  </>
                )}

                {isWealthGoal && (
                  <>
                    <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Goal</th>
                    <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Target & Deadline</th>
                  </>
                )}

                {!isWealthFix && !isWealthGoal && (
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">
                    {planKey === "wealthfam" ? "Family Plan" : "Plan Details"}
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/15">
              {displayedUsers.map((user) => {
                const matDays = user.maturityDate ? getDaysRemaining(user.maturityDate) : null;

                return (
                  <tr key={user.id} className="hover:bg-surface/40 transition-colors duration-150 group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-border/5 shrink-0">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-dark whitespace-nowrap">{user.name}</span>
                          <span className="text-[11px] text-slate/60 font-medium truncate max-w-[200px]">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <SavingTypeBadge type={user.savingType} />
                    </td>

                    <td className="py-4 px-4">
                      <PlanStatusBadge status={user.status} />
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="text-[13px] font-black text-dark font-outfit">{formatCurrency(user.balance)}</span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <InterestEarnedCell savingType={user.savingType} interestAmount={user.interestAmount} wealthPactAmount={user.wealthPactAmount} />
                    </td>

                    {isWealthFix && (
                      <>
                        <td className="py-4 px-4">
                          <span className="text-[12px] font-bold text-dark whitespace-nowrap">{user.planName || user.goalName || "—"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-dark">
                              <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              <span>{user.maturityDate ? formatDate(user.maturityDate) : "—"}</span>
                              {matDays !== null && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  matDays < 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : matDays <= 30 ? "bg-orange-50 text-orange-600 border border-orange-200" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {matDays < 0 ? "Matured" : `${matDays}d left`}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate/50 font-medium">
                              Started: {user.fixStartDate ? formatDate(user.fixStartDate) : "—"}
                            </span>
                          </div>
                        </td>
                      </>
                    )}

                    {isWealthGoal && (
                      <>
                        <td className="py-4 px-4">
                          <span className="text-[12px] font-bold text-dark whitespace-nowrap">{user.goalName ?? "—"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-bold text-dark font-outfit">
                              {user.goalTarget != null ? formatCurrency(user.goalTarget) : "—"}
                            </span>
                            <span className="text-[10px] text-slate/50 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-pink-400 shrink-0" />
                              {user.goalStartDate ? formatDate(user.goalStartDate) : "—"} → {user.goalDeadline ? formatDate(user.goalDeadline) : "—"}
                            </span>
                          </div>
                        </td>
                      </>
                    )}

                    {!isWealthFix && !isWealthGoal && (
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-bold text-dark whitespace-nowrap">{user.planName ?? "—"}</span>
                          <span className="text-[10px] text-slate/50 font-medium">
                            {user.interestRate ? `${user.interestRate}% interest` : ""} {user.goalStartDate ? `· Started ${formatDate(user.goalStartDate)}` : ""}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayedUsers.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-slate/40">
              <Users className="w-8 h-8" />
              <p className="text-sm font-bold">No {planTab === "active" ? "active" : planTab === "completed" ? "completed" : planTab === "terminated" ? "terminated" : ""} plans found for this period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function downloadCSV(plan: string, users: PlanUser[], groups: WealthGroupData[], label: string, isWealthFix: boolean, isWealthGoal: boolean, isWealthGroup: boolean) {
  try {
    let rows: string[][] = [];
    if (isWealthGroup) {
      rows.push(["Group Name", "Member Name", "Member Email", "Phone", "Role", "Group Status", "Saving Type", "Contribution", "Interest Amount", "Impact Amount"]);
      groups.forEach((g) => {
        g.members.forEach((m) => {
          rows.push([
            g.groupName,
            m.name,
            m.email,
            m.phone,
            m.isAdmin ? "Admin" : "Member",
            g.status || "ACTIVE",
            m.savingType,
            String(m.contribution),
            String(m.interestAmount),
            String(m.wealthPactAmount),
          ]);
        });
      });
    } else if (isWealthGoal) {
      rows.push(["Member", "Email", "Phone", "Status", "Saving Type", "Balance", "Interest", "Impact", "Saving For", "Goal Target", "Started", "Deadline"]);
      users.forEach((u) => {
        rows.push([
          u.name,
          u.email,
          u.phone,
          u.status,
          u.savingType,
          String(u.balance),
          String(u.interestAmount),
          String(u.wealthPactAmount),
          u.goalName || "",
          String(u.goalTarget || 0),
          u.goalStartDate || "",
          u.goalDeadline || "",
        ]);
      });
    } else if (isWealthFix) {
      rows.push(["Member", "Email", "Phone", "Status", "Saving Type", "Balance", "Interest", "Impact", "Fix Start", "Maturity Date"]);
      users.forEach((u) => {
        rows.push([
          u.name,
          u.email,
          u.phone,
          u.status,
          u.savingType,
          String(u.balance),
          String(u.interestAmount),
          String(u.wealthPactAmount),
          u.fixStartDate || "",
          u.maturityDate || "",
        ]);
      });
    } else {
      rows.push(["Member", "Email", "Phone", "Status", "Saving Type", "Balance", "Interest", "Impact", "Plan Name", "Rate (%)", "Started"]);
      users.forEach((u) => {
        rows.push([
          u.name,
          u.email,
          u.phone,
          u.status,
          u.savingType,
          String(u.balance),
          String(u.interestAmount),
          String(u.wealthPactAmount),
          u.planName || "",
          String(u.interestRate || ""),
          u.goalStartDate || "",
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${label.toLowerCase().replace(/\s+/g, "-")}-export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    toast.error("Failed to export CSV");
  }
}


