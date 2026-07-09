"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Wallet, Target, Crosshair, Users, Activity,
  Briefcase, TrendingUp, Minus, Calendar, FileText, FileSpreadsheet,
  ShieldCheck, ChevronDown, ChevronUp, Leaf, BarChart2, Blend, Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import { 
  useGetPortfoliosByTypeQuery, 
  useGetTribesQuery,
  useLazyExportTribesQuery,
  useLazyExportPortfoliosByTypeQuery
} from "@/lib/redux/features/portfolioApi";
import { toast } from "sonner";

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
  members: GroupMember[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const baseH = ["Name", "Email", "Phone", "Saving Type", "Balance (₦)", "Interest Rate (%)", "Interest Earned (₦)"];
  const fixH = ["Fix Start Date", "Maturity Date", "Days to Maturity"];
  const goalH = ["Saving For", "Goal Target (₦)", "Amount Saved (₦)", "Started", "Deadline"];
  const headers = [...baseH, ...(isWealthFix ? fixH : []), ...(isWealthGoal ? goalH : [])];

  const rows = users.map((u) => {
    const base = [
      u.name, u.email, u.phone,
      u.savingType.charAt(0).toUpperCase() + u.savingType.slice(1),
      (Number(u.balance) || 0).toFixed(2),
      u.hasInterest ? (Number(u.interestRate) || 0).toFixed(1) : "0",
      u.hasInterest ? (Number(u.interestAmount) || 0).toFixed(2) : "0",
    ];
    const fix = isWealthFix ? [u.fixStartDate ? formatDate(u.fixStartDate) : "", u.maturityDate ? formatDate(u.maturityDate) : "", u.maturityDate ? String(getDaysRemaining(u.maturityDate)) : ""] : [];
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
  const total = group.members.reduce((s, m) => s + (Number(m.contribution) || 0), 0);
  const totalInterest = group.members.reduce((s, m) => s + (Number(m.interestAmount) || 0), 0);
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
            <p className="text-[14px] font-black text-dark font-outfit">{group.groupName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-[11px] text-slate/50 font-medium">
                {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                {admin && <> · Admin: <span className="text-dark font-semibold">{admin.name}</span></>}
              </span>
              <span className="text-[10px] text-slate/40 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(group.startDate)} → {formatDate(group.endDate)}
                <span className={`ml-1 font-bold ${getDaysRemaining(group.endDate) < 0 ? "text-emerald-500" :
                  getDaysRemaining(group.endDate) <= 30 ? "text-orange-500" : "text-slate/40"
                  }`}>
                  · {getDaysRemaining(group.endDate) < 0 ? "Ended" : `${getDaysRemaining(group.endDate)}d left`}
                </span>
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
                        <div className="relative h-8 w-8 shrink-0">
                          <img src={member.avatar} alt={member.name}
                            className={`w-full h-full rounded-full object-cover border-2 ${member.isAdmin ? "border-gray-400" : "border-border/30"}`}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
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


  const planKey = plan?.toLowerCase();
  const meta = PLAN_META[planKey as string];

  const isWealthFix = planKey === "wealthfix";
  const isWealthGoal = planKey === "wealthgoal";
  const isWealthGroup = planKey === "wealthgroup";

  // Data Fetching
  const { data: portfoliosRes, isLoading: isLoadingPortfolios } = useGetPortfoliosByTypeQuery(
    { type: meta?.backendType || "", period: dateFilter },
    { skip: !meta?.backendType || isWealthGroup }
  );

  const { data: tribesRes, isLoading: isLoadingTribes } = useGetTribesQuery(
    { period: dateFilter },
    { skip: !isWealthGroup }
  );

  const [exportTribes] = useLazyExportTribesQuery();
  const [exportPortfolios] = useLazyExportPortfoliosByTypeQuery();

  // Mappers
  const users = useMemo<PlanUser[]>(() => {
    if (isWealthGroup || !portfoliosRes?.items) return [];
    return portfoliosRes.items.map((u: any) => ({
      id: u.id || u._id || Math.random().toString(),
      name: u.name || u.user?.name || u.customer?.name || "Unknown User",
      email: u.email || u.user?.email || u.customer?.email || "No email",
      phone: u.phone || u.user?.phone || u.customer?.phone || "No phone",
      avatar: u.avatar || u.user?.avatar || u.customer?.avatar || "",
      balance: Number(u.balance || u.amount || 0),
      savingType: (u.savingType || u.type || "interest").toLowerCase() as SavingType,
      hasInterest: (u.savingType || "interest").toLowerCase() !== "impact",
      interestRate: Number(u.interestRate || u.rate || 0),
      interestAmount: Number(u.interestAmount || u.interestEarned || u.accruedInterest || 0),
      wealthPactAmount: Number(u.wealthPactAmount || u.impactAmount || u.wealthpact || 0),
      maturityDate: u.maturityDate || u.endDate,
      fixStartDate: u.fixStartDate || u.startDate,
      goalName: u.goalName || u.targetName,
      goalTarget: Number(u.goalTarget || u.targetAmount || 0),
      goalDeadline: u.goalDeadline || u.endDate,
      goalStartDate: u.goalStartDate || u.startDate,
    }));
  }, [portfoliosRes, isWealthGroup]);

  const groups = useMemo<WealthGroupData[]>(() => {
    if (!isWealthGroup || !tribesRes?.items) return [];
    return tribesRes.items.map((g: any) => ({
      id: g.id || g._id || Math.random().toString(),
      groupName: g.groupName || g.name || "Unknown Group",
      image: g.image || g.icon || g.avatar || null,
      groupTarget: Number(g.groupTarget || g.targetAmount || g.target || 0),
      startDate: g.startDate || g.createdAt || new Date().toISOString(),
      endDate: g.endDate || g.deadline || new Date().toISOString(),
      members: (g.members || []).map((m: any) => ({
        id: m.id || m._id || Math.random().toString(),
        name: m.name || m.user?.name || "Unknown",
        email: m.email || m.user?.email || "No email",
        phone: m.phone || m.user?.phone || "No phone",
        avatar: m.avatar || m.user?.avatar || "",
        contribution: Number(m.contribution || m.amount || m.balance || 0),
        savingType: (m.savingType || m.type || "interest").toLowerCase() as SavingType,
        interestRate: Number(m.interestRate || m.rate || 0),
        interestAmount: Number(m.interestAmount || m.interestEarned || 0),
        wealthPactAmount: Number(m.wealthPactAmount || m.impactAmount || 0),
        isAdmin: Boolean(m.isAdmin || m.role === "admin" || m.role === "leader"),
      }))
    }));
  }, [tribesRes, isWealthGroup]);


  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate">
        <p className="text-lg font-bold">Plan not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  // Dashboard calculations based on API response fields or computed from mapper
  const totalBalance = isWealthGroup ? Number(tribesRes?.totalSavings || 0) : Number(portfoliosRes?.totalBalance || 0);
  const totalInterest = isWealthGroup ? Number(tribesRes?.totalInterest || 0) : Number(portfoliosRes?.totalInterest || 0);
  const totalWealthPact = isWealthGroup ? Number(tribesRes?.totalWealthpact || 0) : Number(portfoliosRes?.totalWealthpact || 0);
  const totalMembers = isWealthGroup ? groups.reduce((s, g) => s + g.members.length, 0) : Number(portfoliosRes?.totalMembers || 0);

  const avgBalance = portfoliosRes?.avgBalanceOrTarget ? Number(portfoliosRes.avgBalanceOrTarget) : (totalMembers > 0 ? totalBalance / totalMembers : 0);

  const interestUsers = isWealthGroup
    ? groups.reduce((s, g) => s + g.members.filter(m => m.savingType !== 'impact').length, 0)
    : users.filter(u => u.savingType !== 'impact').length;

  const impactUsers = isWealthGroup
    ? groups.reduce((s, g) => s + g.members.filter(m => m.savingType === 'impact').length, 0)
    : users.filter(u => u.savingType === 'impact').length;

  const summaryCards = isWealthGroup ? [
    { title: "Total Groups", value: Number(tribesRes?.totalGroups || 0).toLocaleString(), subtext: "All active groups", icon: Users, color: "bg-[#E6F9F9] text-[#155D5F]", dotColor: "bg-[#155D5F]" },
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.label.toLowerCase()}-export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Export downloaded successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to download backend CSV export. Using fallback data export instead.");
      downloadCSV(planKey as string, users, groups, meta.label, isWealthFix, isWealthGoal, isWealthGroup);
    }
  };

  const isLoading = isLoadingPortfolios || isLoadingTribes;

  return (
    <div className="w-full max-w-[1237px] mx-auto min-h-[800px] bg-white rounded-[20px] py-10 px-6 flex flex-col gap-8 shadow-sm">

      {/* ── Header ── */}
      <div className="flex flex-col gap-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate text-sm font-medium hover:text-primary transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Overview
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${meta.accent} border`}>
              <Icon className={`w-7 h-7 ${meta.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-black font-outfit text-dark">{meta.label}</h1>
              <p className="text-sm text-slate/60 font-medium">{meta.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none h-10 pl-10 pr-8 rounded-xl bg-surface/50 hover:bg-surface border border-border/30 text-dark text-[12px] font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_week">Last week</option>
                <option value="month">Month</option>
                <option value="last_6_months">6 months ago</option>
                <option value="year">1 year ago</option>
                <option value="all_time">All time</option>
              </select>
              <Calendar className="w-4 h-4 text-slate/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />Export Excel
            </button>
            <button
              onClick={() => downloadPDF(planKey as string, users, groups, meta.label, isWealthFix, isWealthGoal, isWealthGroup)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />Export PDF
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

          <div className="flex flex-wrap gap-[10px] justify-between lg:justify-start lg:gap-[24px]">
            {visibleCards.map((stat, i) => (
              <div
                key={i}
                className="w-[350px] h-[124px] rounded-[20px] bg-[#F2FFFF] border border-[#155D5F1F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.07)] p-5 flex flex-col justify-between gap-[10px]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[28px] font-semibold text-[#155D5F] leading-none mb-1">
                      {isLoading ? "—" : stat.value}
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
            ))}
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-border/30" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-bold text-slate/50">Loading data...</p>
        </div>
      ) : isWealthGroup ? (
        <div className="flex flex-col gap-4">
          {groups.map((group) => <GroupCard key={group.id} group={group} />)}
          {groups.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-slate/40">
              <Briefcase className="w-8 h-8" />
              <p className="text-sm font-bold">No groups found for this period.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/30">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-surface/70 border-b border-border/20">
                <th className="text-left py-3.5 px-5 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Member</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Contact</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Saving Type</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Balance</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Interest / Impact</th>

                {isWealthFix && <>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Fix Start</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Maturity Date</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Days to Maturity</th>
                </>}

                {isWealthGoal && <>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Saving For</th>
                  <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Goal Target</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Started</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Deadline</th>
                </>}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/15">
              {users.map((user) => {
                const matDays = user.maturityDate ? getDaysRemaining(user.maturityDate) : null;

                return (
                  <tr key={user.id} className="hover:bg-surface/40 transition-colors duration-150 group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0">
                          <img src={user.avatar} alt={user.name}
                            className="w-full h-full rounded-full object-cover border-2 border-border/30 group-hover:border-primary/20 transition-colors"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <span className="text-[13px] font-bold text-dark whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-semibold text-dark">{user.email}</span>
                        <span className="text-[11px] text-slate/50 font-medium">{user.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <SavingTypeBadge type={user.savingType} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-[13px] font-black text-dark font-outfit">{formatCurrency(user.balance)}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <InterestEarnedCell savingType={user.savingType} interestAmount={user.interestAmount} wealthPactAmount={user.wealthPactAmount} />
                    </td>

                    {isWealthFix && <>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark">{user.fixStartDate ? formatDate(user.fixStartDate) : "—"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          {user.maturityDate ? formatDate(user.maturityDate) : "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {matDays !== null ? (
                          <span className={`text-[12px] font-bold ${matDays < 0 ? "text-emerald-600" : matDays <= 30 ? "text-orange-500" : "text-slate/60"}`}>
                            {matDays < 0 ? "Matured" : daysLabel(matDays)}
                          </span>
                        ) : <span className="text-slate/30 text-xs">—</span>}
                      </td>
                    </>}

                    {isWealthGoal && <>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-bold text-dark whitespace-nowrap">{user.goalName ?? "—"}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[12px] font-bold text-dark font-outfit">
                          {user.goalTarget != null ? formatCurrency(user.goalTarget) : "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark">{user.goalStartDate ? formatDate(user.goalStartDate) : "—"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          {user.goalDeadline ? formatDate(user.goalDeadline) : "—"}
                        </span>
                      </td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-slate/40">
              <Users className="w-8 h-8" />
              <p className="text-sm font-bold">No members found for this period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function downloadCSV(arg0: string, users: PlanUser[], groups: WealthGroupData[], label: string, isWealthFix: boolean, isWealthGoal: boolean, isWealthGroup: boolean) {
  throw new Error("Function not implemented.");
}

