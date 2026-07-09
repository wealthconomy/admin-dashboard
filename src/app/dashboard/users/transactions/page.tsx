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
import { useGetTransactionsQuery } from "@/lib/redux/features/usersApi";
import { format } from "date-fns";

const getSafeArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
};



const STATUSES = ["Successful", "Pending", "Failed"];
const TYPES = ["Deposit", "Withdrawal", "Wealth TopUp"];

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [logModal, setLogModal] = useState<any | null>(null);
  const [receiptModal, setReceiptModal] = useState<any | null>(null);

  const { data: transactionsData, isLoading, isError } = useGetTransactionsQuery({
    search: searchQuery || undefined,
    status: statusFilter !== "All Status" ? statusFilter : undefined,
    type: typeFilter !== "All Types" ? typeFilter : undefined,
    limit: 50
  });
  const transactionList = getSafeArray(transactionsData);

  const filtered = transactionList.filter((tx: any) => {
    const matchStatus = statusFilter === "All Status" || tx.status === statusFilter;
    const matchType = typeFilter === "All Types" || tx.actionType === typeFilter;
    return matchStatus && matchType;
  });

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
      <Badge className={`${map[s] ?? "bg-slate-50 text-slate-500 border-slate-100"} border px-3.5 py-1.5 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center whitespace-nowrap`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot[s] ?? "bg-slate-400"}`} />
        {s}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">Transactions Management</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search Name, TxID, UserID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-sm text-slate hover:bg-surface gap-2 shrink-0">
                  {statusFilter === "All Status" ? "Status" : statusFilter} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
                <DropdownMenuItem onClick={() => setStatusFilter("All Status")} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">All Status</DropdownMenuItem>
                {STATUSES.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">{s}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-sm text-slate hover:bg-surface gap-2 shrink-0">
                  {typeFilter === "All Types" ? "Type" : typeFilter} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
                <DropdownMenuItem onClick={() => setTypeFilter("All Types")} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">All Types</DropdownMenuItem>
                {TYPES.map((t) => (
                  <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">{t}</DropdownMenuItem>
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
                {["Timestamp", "User", "Amount", "Tx ID", "Action", "Status", "Portfolio", ""].map((h, i) => (
                  <TableHead key={i} className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-slate/40">Loading transactions...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-20 text-center text-red-500 font-medium">
                    Failed to load transactions.
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? filtered.map((tx: any, i: number) => {
                const formattedDate = tx.timestamp ? format(new Date(tx.timestamp), "HH:mm, MMMM dd, yyyy") : "-";
                return (
                <TableRow key={i} className="group border-border/50 hover:bg-surface/30 transition-all duration-200">
                  <TableCell className="py-5 px-4">
                    <span className="text-[11px] font-semibold text-slate/60 block">{formattedDate}</span>
                    <span className="text-[10px] text-slate/40 font-bold uppercase">{tx.id || "-"}</span>
                  </TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-primary/5 shadow-sm shrink-0">
                        <AvatarImage src={tx.user?.imageUrl || tx.imageUrl || ""} />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{(tx.userName || tx.email || "U").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-[12px] text-dark truncate max-w-[130px]">{tx.userName || tx.email || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-4 text-[13px] font-bold text-dark">{tx.amount || "0"}</TableCell>
                  <TableCell className="py-5 px-4 text-[11px] font-bold text-slate/60">#{tx.reference || tx.id || "-"}</TableCell>
                  <TableCell className="py-5 px-4 text-[12px] font-medium text-dark/70">{tx.actionType || tx.type || "-"}</TableCell>
                  <TableCell className="py-5 px-4">{statusBadge(tx.status || "Pending")}</TableCell>
                  <TableCell className="py-5 px-4">
                    <span className="text-[11px] font-bold text-slate/70 px-3 py-1.5 bg-surface rounded-lg border border-border/20">{tx.description || tx.type || "-"}</span>
                  </TableCell>
                  <TableCell className="py-5 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full">
                          <MoreVertical className="h-4 w-4 text-slate/40" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${tx.id}`)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
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
              );}) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-20 text-center">
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

      {/* Transaction Info / Log Overview Modal */}
      {logModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setLogModal(null)} />
          <div className="relative bg-white rounded-[20px] w-full max-w-[680px] max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">

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
                  <DropdownMenuItem onClick={() => { setLogModal(null); router.push(`/dashboard/users/${logModal.id}`); }} className="py-2.5 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                    <User className="h-4 w-4 text-slate/50" /> View Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setReceiptModal(logModal); setLogModal(null); }} className="py-2.5 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                    <Receipt className="h-4 w-4 text-slate/50" /> View Receipt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto p-7 pb-2">
              <p className="text-[13px] text-slate/40 font-medium mb-1">{logModal.description || "Transaction Detail"}</p>
              <h2 className="text-[24px] font-bold text-dark font-outfit mb-5">{logModal.type || logModal.actionType}</h2>

              <div className="grid grid-cols-2 gap-x-10">
                {/* LEFT */}
                <div>
                  <h3 className="text-[15px] font-bold text-dark mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div><p className="text-[12px] font-bold text-dark">User&apos;s Name</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.userName || logModal.email || "-"}</p></div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">User&apos;s ID</p>
                      <p className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 cursor-pointer hover:underline" onClick={() => { setLogModal(null); router.push(`/dashboard/users/${logModal.id}`); }}>{logModal.id}</p>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">Email</p><a href={`mailto:${logModal.email}`} className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 hover:underline block">{logModal.email || "-"}</a></div>
                    <div><p className="text-[12px] font-bold text-dark">Action</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.actionType || "-"}</p></div>
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
                      <div className="mt-1 flex gap-4"><span className="text-[12px] text-slate/70 font-medium">{logModal.description || "-"}</span></div>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">Transaction Ref</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.reference || logModal.id || "-"}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Transaction Amount</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.amount || "0"}</p></div>
                  </div>

                  <h3 className="text-[15px] font-bold text-dark mt-6 mb-4">System Logs</h3>
                  <div className="space-y-4">
                    <div><p className="text-[12px] font-bold text-dark">Log Entry ID</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.id}</p></div>
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
                  <p className="text-[11px] text-emerald-600 font-bold">{receiptModal.type || receiptModal.actionType || "Transaction"}</p>
                  <p className="text-[22px] font-black text-dark leading-tight">{receiptModal.amount || "0"}</p>
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
                  ["Account credited", "-"],
                  ["Sender", receiptModal.userName || receiptModal.email || "-"],
                  ["Transaction type", receiptModal.actionType || receiptModal.type || "-"],
                  ["SessionID", receiptModal.id],
                  ["Narrative", receiptModal.description || "-"],
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
