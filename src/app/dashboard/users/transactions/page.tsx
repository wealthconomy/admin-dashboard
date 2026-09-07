"use client";

import { useState } from "react";
import {
  Search, ChevronDown, MoreVertical, Eye, Filter,
  ArrowRightLeft, X, User, FileText, Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetTransactionsQuery, useGetUsersQuery } from "@/lib/redux/features/usersApi";
import { toast } from "sonner";
import { format } from "date-fns";

const getSafeArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  // Handle: { data: { items: [...] } }  ← actual API shape
  if (data.data && !Array.isArray(data.data)) {
    const inner = data.data;
    if (inner.items && Array.isArray(inner.items)) return inner.items;
    if (Array.isArray(inner)) return inner;
  }
  // Handle: { data: [...] }
  if (data.data && Array.isArray(data.data)) return data.data;
  // Handle: { items: [...] }
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
};

// Descriptions from the backend embed raw kobo amounts as integers (e.g. "Referral reward: 50000").
// This helper finds standalone integers ≥ 100 in the text and converts them to ₦ naira.
const formatDescription = (desc: string | null | undefined): string => {
  if (!desc) return "-";
  return desc.replace(/\b(\d{3,})\b/g, (match) => {
    const n = Number(match);
    // Only treat as kobo if it's a round number that makes sense as a monetary value
    return `₦${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  });
};


interface TransactionActionInfo {
  category: "WALLET_DEPOSIT" | "PORTFOLIO_FUND" | "PORTFOLIO_TOPUP" | "PORTFOLIO_WITHDRAW" | "GROUP_CONTRIBUTION" | "REFERRAL" | "BANK_PAYOUT" | "OTHER";
  label: string;
  badgeClass: string;
  subtext: string;
  isCredit: boolean;
}

const getTransactionActionInfo = (tx: any): TransactionActionInfo => {
  const ref = String(tx?.reference || tx?.id || "").toUpperCase();
  const desc = String(tx?.description || "").toLowerCase();
  const rawAction = String(tx?.actionType || tx?.type || "").toUpperCase();
  const isCredit = rawAction === "CREDIT" || rawAction === "DEPOSIT" || Number(tx?.amount || 0) > 0;

  // 1. Portfolio Creation / Initial Funding
  if (ref.startsWith("PORTFOLIO_CREATION") || desc.includes("funded ") || desc.includes("portfolio creation")) {
    return {
      category: "PORTFOLIO_FUND",
      label: "Fund Portfolio",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      subtext: tx?.description || "Deposit into Portfolio",
      isCredit: false,
    };
  }

  // 2. Portfolio Top-up
  if (ref.startsWith("PORTFOLIO_TOPUP") || desc.includes("top up for portfolio") || desc.includes("top-up for portfolio")) {
    return {
      category: "PORTFOLIO_TOPUP",
      label: "Portfolio Top-up",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      subtext: tx?.description || "Top up to Portfolio",
      isCredit: false,
    };
  }

  // 3. Withdrawal from Portfolio back into Main Wallet
  if (ref.startsWith("PORTFOLIO_WITHDRAW") || desc.includes("withdrawal from portfolio")) {
    return {
      category: "PORTFOLIO_WITHDRAW",
      label: "Portfolio to Wallet",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      subtext: tx?.description || "Withdrawn to Main Wallet",
      isCredit: true,
    };
  }

  // 4. WealthGroup Contribution
  if (ref.startsWith("WGC_") || desc.includes("wealthgroup") || desc.includes("contribution to")) {
    return {
      category: "GROUP_CONTRIBUTION",
      label: "Group Contribution",
      badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
      subtext: tx?.description || "WealthGroup Contribution",
      isCredit: false,
    };
  }

  // 5. Referral Reward
  if (ref.startsWith("REFERRAL") || rawAction === "REFERRAL" || desc.includes("referral reward") || desc.includes("referral")) {
    return {
      category: "REFERRAL",
      label: "Referral Bonus",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
      subtext: "Bonus credited to wallet",
      isCredit: true,
    };
  }

  // 6. Deposit (via PAGA, Bank transfer, Card, Top-up, or raw DEPOSIT)
  if (
    desc.includes("wallet top-up") ||
    desc.includes("top-up") ||
    desc.includes("topup") ||
    desc.includes("paga") ||
    desc.includes("paystack") ||
    desc.includes("monnify") ||
    desc.includes("bank transfer") ||
    desc.includes("deposit") ||
    rawAction.includes("DEPOSIT") ||
    rawAction.includes("TOPUP") ||
    ref.startsWith("DEP")
  ) {
    return {
      category: "WALLET_DEPOSIT",
      label: "Deposit",
      badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
      subtext: tx?.description || "Deposit to Main Wallet",
      isCredit: true,
    };
  }

  // 7. External Bank Withdrawal / Cash-out
  if (rawAction === "WITHDRAWAL" && !desc.includes("portfolio") && !desc.includes("wealthgroup")) {
    return {
      category: "BANK_PAYOUT",
      label: "Bank Payout",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      subtext: tx?.description || "Payout to Bank Account",
      isCredit: false,
    };
  }

  // 8. Fallback
  const fallbackLabel = tx?.actionType || tx?.type || "Transaction";
  const isDepositFallback = String(fallbackLabel).toLowerCase().includes("deposit") || desc.includes("deposit");
  return {
    category: isDepositFallback ? "WALLET_DEPOSIT" : "OTHER",
    label: isDepositFallback ? "Deposit" : fallbackLabel,
    badgeClass: isDepositFallback ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "bg-slate-50 text-slate-700 border-slate-200",
    subtext: tx?.description || "-",
    isCredit,
  };
};

const STATUSES = ["Successful", "Pending", "Failed"];
const ACTION_FILTERS = [
  { label: "All Actions", value: "All" },
  { label: "Deposit", value: "WALLET_DEPOSIT" },
  { label: "Fund Portfolio", value: "PORTFOLIO_FUND" },
  { label: "Portfolio Top-up", value: "PORTFOLIO_TOPUP" },
  { label: "Portfolio to Wallet", value: "PORTFOLIO_WITHDRAW" },
  { label: "Group Contribution", value: "GROUP_CONTRIBUTION" },
  { label: "Referral Bonus", value: "REFERRAL" },
  { label: "Bank Payout", value: "BANK_PAYOUT" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [actionFilter, setActionFilter] = useState("All");
  const [logModal, setLogModal] = useState<any | null>(null);
  const [receiptModal, setReceiptModal] = useState<any | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const limit = 20;

  const { data: transactionsData, isLoading, isFetching, isError } = useGetTransactionsQuery({
    search: searchQuery || undefined,
    q: searchQuery || undefined,
    status: statusFilter !== "All Status" ? statusFilter : undefined,
    after: currentCursor || undefined,
    limit,
  });
  const transactionList = getSafeArray(transactionsData);

  const rawData = transactionsData?.data || transactionsData;
  const nextCursor = rawData?.nextCursor;
  const hasNext = Boolean(rawData?.hasNext ?? (nextCursor != null));

  // Fetch users to build an email → userId map.
  const { data: usersData } = useGetUsersQuery({ limit: 200 });
  const emailToUserId = (() => {
    const map = new Map<string, string>();
    const list = usersData?.data?.items || usersData?.data || [];
    if (Array.isArray(list)) {
      list.forEach((u: any) => { if (u.email && u.id) map.set(u.email, u.id); });
    }
    return map;
  })();

  const navigateToUser = (tx: any) => {
    const userId = tx.userId || emailToUserId.get(tx.email);
    if (userId) {
      router.push(`/dashboard/users/${userId}`);
    } else {
      toast.error("Could not find user profile — no user ID linked to this transaction.");
    }
  };

  const filtered = transactionList.filter((tx: any) => {
    const matchStatus = statusFilter === "All Status" || tx.status === statusFilter;
    const actionInfo = getTransactionActionInfo(tx);
    const matchAction = actionFilter === "All" || actionInfo.category === actionFilter || tx.actionType === actionFilter;
    return matchStatus && matchAction;
  });

  const displayedTransactions = filtered;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Successful: "bg-emerald-50 text-emerald-600 border-emerald-100",
      Pending: "bg-orange-50 text-orange-500 border-orange-100",
      Failed: "bg-red-50 text-red-500 border-red-100",
    };
    const dot: Record<string, string> = {
      Successful: "bg-emerald-500",
      Pending: "bg-orange-400",
      Failed: "bg-red-500",
    };
    return (
      <Badge className={`${map[s] ?? "bg-slate-50 text-slate-500 border-slate-100"} border px-3 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center whitespace-nowrap`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot[s] ?? "bg-slate-400"}`} />
        {s}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">Transaction Activities</h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">Audit log of all platform financial movements and payment records.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search user, ref, id..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCursorStack([]);
                setCurrentCursor(undefined);
              }}
              className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0">
                  {statusFilter === "All Status" ? "Status" : statusFilter} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
                <DropdownMenuItem onClick={() => { setStatusFilter("All Status"); setCursorStack([]); setCurrentCursor(undefined); }} className="rounded-xl py-2 px-4 text-xs font-medium cursor-pointer">All Status</DropdownMenuItem>
                {STATUSES.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => { setStatusFilter(s); setCursorStack([]); setCurrentCursor(undefined); }} className="rounded-xl py-2 px-4 text-xs font-medium cursor-pointer">{s}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-xs text-slate hover:bg-surface gap-2 shrink-0">
                  {ACTION_FILTERS.find(f => f.value === actionFilter)?.label || "Action"} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
                {ACTION_FILTERS.map((f) => (
                  <DropdownMenuItem key={f.value} onClick={() => { setActionFilter(f.value); setCursorStack([]); setCurrentCursor(undefined); }} className="rounded-xl py-2 px-4 text-xs font-medium cursor-pointer">{f.label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                {["Timestamp", "User", "Amount", "Action & Description", "Transaction ID", "Status", ""].map((h, i) => (
                  <TableHead key={i} className="py-4 px-4 text-black font-extrabold text-[11px] uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-slate/40">Loading transactions...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-red-500 font-medium">
                    Failed to load transactions.
                  </TableCell>
                </TableRow>
              ) : displayedTransactions.length > 0 ? displayedTransactions.map((tx: any, i: number) => {
                const formattedDate = tx.timestamp ? format(new Date(tx.timestamp), "HH:mm, MMM dd, yyyy") : "-";
                const actionInfo = getTransactionActionInfo(tx);
                const rawAmount = Number(tx.amount || 0);
                const nairaVal = Math.abs(rawAmount) / 100;
                const isPositive = actionInfo.isCredit;

                return (
                  <TableRow key={tx.id || i} className="border-border/50 hover:bg-surface/30 transition-colors">
                    {/* Timestamp */}
                    <TableCell className="py-4 px-4 text-[11px] font-semibold text-slate/60 whitespace-nowrap">
                      {formattedDate}
                    </TableCell>

                    {/* User */}
                    <TableCell className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[12px] text-dark block leading-snug">{tx.userName || tx.email || "-"}</span>
                        {tx.userName && tx.email && (
                          <span className="text-[10px] text-slate/50 block truncate max-w-[150px]">{tx.email}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="py-4 px-4 whitespace-nowrap">
                      <span className={`text-[13px] font-extrabold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                        {isPositive ? "+" : "-"}₦{nairaVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>

                    {/* Action & Narrative Description */}
                    <TableCell className="py-4 px-4">
                      <div className="space-y-1">
                        <Badge className={`${actionInfo.badgeClass} border px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-none whitespace-nowrap inline-flex`}>
                          {actionInfo.label}
                        </Badge>
                        <p className="text-[11px] text-slate/70 font-medium line-clamp-1 max-w-[240px]" title={formatDescription(actionInfo.subtext)}>
                          {formatDescription(actionInfo.subtext)}
                        </p>
                      </div>
                    </TableCell>

                    {/* Transaction ID */}
                    <TableCell className="py-4 px-4">
                      <span
                        className="text-[11px] font-bold text-slate/70 font-mono block truncate max-w-[140px]"
                        title={tx.reference || tx.id || "-"}
                      >
                        #{tx.reference || tx.id || "-"}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 px-4">{statusBadge(tx.status || "Pending")}</TableCell>

                    {/* Actions Menu */}
                    <TableCell className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full">
                            <MoreVertical className="h-4 w-4 text-slate/40" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                          <DropdownMenuItem onClick={() => navigateToUser(tx)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                            <User className="h-3.5 w-3.5 text-primary" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLogModal(tx)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                            <FileText className="h-3.5 w-3.5 text-slate/50" /> Log Overview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReceiptModal(tx)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                            <Receipt className="h-3.5 w-3.5 text-slate/50" /> View Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowRightLeft className="h-8 w-8 text-slate/20" />
                      <p className="text-sm font-medium text-slate/40">No transactions match your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold text-slate/50 pt-6 px-1">
        <span>
          Showing {displayedTransactions.length} record{displayedTransactions.length === 1 ? "" : "s"} &bull; Page {cursorStack.length + 1}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (cursorStack.length === 0) return;
              const prev = cursorStack[cursorStack.length - 1];
              setCursorStack(s => s.slice(0, -1));
              setCurrentCursor(prev || undefined);
              window.scrollTo({ top: 0, behavior: "smooth" });
              const main = document.getElementById('main-scroll-container');
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={cursorStack.length === 0 || isFetching}
            className={`h-8 px-3 text-[11px] font-bold rounded-lg ${
              cursorStack.length === 0
                ? 'text-slate/40 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-dark border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
            }`}
          >
            Prev
          </Button>

          <span className="px-2 text-xs font-bold text-dark">
            Page {cursorStack.length + 1}
          </span>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (!hasNext || !nextCursor) return;
              setCursorStack(s => [...s, currentCursor || ""]);
              setCurrentCursor(nextCursor);
              window.scrollTo({ top: 0, behavior: "smooth" });
              const main = document.getElementById('main-scroll-container');
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={!hasNext || isFetching}
            className={`h-8 px-3 text-[11px] font-bold rounded-lg ${
              !hasNext
                ? 'text-slate/40 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-dark border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
            }`}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Transaction Info / Log Overview Modal */}
      {logModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setLogModal(null)} />
          <div className="relative bg-white rounded-[20px] w-full max-w-[680px] max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden my-auto">

            {/* Top-right controls */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
              <button onClick={() => setLogModal(null)} className="text-red-500 hover:text-red-600">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-slate/40 hover:text-slate/60 p-0.5">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                  <DropdownMenuItem onClick={() => { setLogModal(null); navigateToUser(logModal); }} className="py-2.5 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                    <User className="h-4 w-4 text-slate/50" /> View Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setReceiptModal(logModal); setLogModal(null); }} className="py-2.5 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                    <Receipt className="h-4 w-4 text-slate/50" /> View Receipt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto p-7 pb-2">
              <p className="text-[13px] text-slate/40 font-medium mb-1">{formatDescription(logModal.description) || "Transaction Detail"}</p>
              <h2 className="text-[24px] font-bold text-dark font-outfit mb-5">{getTransactionActionInfo(logModal).label}</h2>

              <div className="grid grid-cols-2 gap-x-10">
                {/* LEFT */}
                <div>
                  <h3 className="text-[15px] font-bold text-dark mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div><p className="text-[12px] font-bold text-dark">User&apos;s Name</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.userName || logModal.email || "-"}</p></div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">User&apos;s ID</p>
                       <p className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 cursor-pointer hover:underline" onClick={() => { setLogModal(null); navigateToUser(logModal); }}>{logModal.id}</p>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">Email</p><a href={`mailto:${logModal.email}`} className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 hover:underline block">{logModal.email || "-"}</a></div>
                    <div><p className="text-[12px] font-bold text-dark">Action</p><p className="text-[13px] text-[#155D5F] font-bold mt-0.5">{getTransactionActionInfo(logModal).label}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Status</p><p className={`text-[13px] font-semibold mt-0.5 ${logModal.status === "Successful" ? "text-emerald-500" : logModal.status === "Failed" ? "text-red-500" : "text-orange-500"}`}>{logModal.status || "-"}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Timestamp</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.timestamp ? format(new Date(logModal.timestamp), "HH:mm, MMMM dd, yyyy") : "-"}</p></div>
                  </div>

                  <h3 className="text-[15px] font-bold text-dark mt-6 mb-4">Security Verification</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] font-bold text-dark">Email Confirmation</p>
                      <p className="text-[13px] mt-0.5"><span className="text-emerald-500 font-semibold">Approved</span></p>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">IP Address</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.ip || "N/A"}</p></div>
                  </div>
                </div>

                {/* RIGHT */}
                <div>
                  <h3 className="text-[15px] font-bold text-dark mb-4">Transaction Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] font-bold text-dark">Description</p>
                      <div className="mt-1 flex gap-4"><span className="text-[12px] text-slate/70 font-medium">{formatDescription(logModal.description)}</span></div>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">Transaction Ref</p><p className="text-[13px] text-slate/60 mt-0.5 font-mono">{logModal.reference || logModal.id || "-"}</p></div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Transaction Amount</p>
                      <p className={`text-[15px] font-bold mt-0.5 ${getTransactionActionInfo(logModal).isCredit ? "text-emerald-600" : "text-red-500"}`}>
                        {getTransactionActionInfo(logModal).isCredit ? "+" : "-"}₦{(Math.abs(Number(logModal.amount || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-[15px] font-bold text-dark mt-6 mb-4">System Logs</h3>
                  <div className="space-y-4">
                    <div><p className="text-[12px] font-bold text-dark">Log Entry ID</p><p className="text-[13px] text-slate/60 mt-0.5 font-mono">{logModal.id}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Log Recorded</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.timestamp ? format(new Date(logModal.timestamp), "HH:mm, MMMM dd, yyyy") : "-"}</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-7 py-4 border-t border-border/20 flex justify-center">
              <Button onClick={() => setLogModal(null)} variant="outline" className="rounded-full px-10 h-10 border-border font-semibold text-sm text-dark hover:bg-surface cursor-pointer">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setReceiptModal(null)} />
          <div className="relative bg-[#F5F5F5] rounded-[20px] w-full max-w-[360px] max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto p-6">
            <button onClick={() => setReceiptModal(null)} className="absolute top-4 right-4 text-red-500 hover:text-red-600"><X className="h-5 w-5" strokeWidth={2.5} /></button>

            {/* Receipt header */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-[11px] text-emerald-600 font-bold">{getTransactionActionInfo(receiptModal).label}</p>
                  <p className={`text-[22px] font-black leading-tight ${getTransactionActionInfo(receiptModal).isCredit ? "text-emerald-600" : "text-red-500"}`}>
                    {getTransactionActionInfo(receiptModal).isCredit ? "+" : "-"}₦{(Math.abs(Number(receiptModal.amount || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate/50 font-medium mt-1">{receiptModal.timestamp ? format(new Date(receiptModal.timestamp), "HH:mm, MMM dd, yyyy") : "-"}</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-border/50 rounded-lg px-3 py-1.5 shadow-sm mt-1">
                  <Receipt className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-dark">Receipt</span>
                </div>
              </div>
            </div>

            {/* Receipt details */}
            <div className="bg-white rounded-xl p-4 space-y-3">
              <p className="text-[12px] font-bold text-dark border-b border-border/30 pb-2">Details</p>
              <p className="text-[10px] text-slate/40 font-medium break-all">{receiptModal.reference || receiptModal.id || "-"}</p>
              <div className="space-y-2.5 pt-1">
                {[
                  ["Status", <span key="status" className="text-emerald-500 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {receiptModal.status || "Success"}</span>],
                  ["User", receiptModal.userName || receiptModal.email || "-"],
                  ["Transaction type", getTransactionActionInfo(receiptModal).label],
                  ["SessionID", receiptModal.id],
                  ["Narrative", formatDescription(receiptModal.description)],
                ].map(([label, value], idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <span className="text-[11px] text-slate/40 font-medium shrink-0">{label as string}</span>
                    <span className="text-[11px] text-dark font-semibold text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
