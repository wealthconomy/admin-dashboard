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

const INITIAL_TRANSACTIONS = [
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    amount: "N43,485.00",
    txId: "876543456",
    actionType: "Deposit",
    status: "Successful",
    portfolio: "WealthFam",
    type: "Deposit",
    subtitle: "Funds Received",
    sentFromName: "Simon Peter",
    sentFromBank: "Opay",
    sentFromAccount: "72216281923",
    sentToPortfolio: "WealthFam",
    logId: "#LOG56789",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
    ip: "192.168.1.10",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    amount: "N43,485.00",
    txId: "876543456",
    actionType: "Wealth TopUp",
    status: "Successful",
    portfolio: "WealthFam",
    type: "Wealth TopUp",
    subtitle: "Portfolio Transfer",
    sentFromName: null,
    sentFromBank: null,
    sentFromAccount: null,
    sentFromPortfolio: "WealthFlex",
    sentToPortfolio: "WealthFam",
    logId: "#LOG56789",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
    ip: "192.168.1.10",
  },
  {
    id: "ID5372528",
    timestamp: "10:20, April 13, 2023",
    name: "Adewale Johnson",
    email: "adewale.j@gmail.com",
    amount: "N15,000.00",
    txId: "876543457",
    actionType: "Deposit",
    status: "Failed",
    portfolio: "WealthFlex",
    type: "Deposit",
    subtitle: "Deposit",
    sentFromName: "Adewale Johnson",
    sentFromBank: "GTBank",
    sentFromAccount: "0123456789",
    sentToPortfolio: "WealthFlex",
    logId: "#LOG56790",
    logRecorded: "10:20, April 13, 2023",
    emailConfirmation: "Approved at 2024-03-05 10:00 UTC",
    ip: "192.168.1.11",
  },
  {
    id: "ID5372529",
    timestamp: "14:15, April 14, 2023",
    name: "Chinelo Okoro",
    email: "c.okoro@outlook.com",
    amount: "N50,000.00",
    txId: "876543458",
    actionType: "Deposit",
    status: "Pending",
    portfolio: "WealthFlow",
    type: "Deposit",
    subtitle: "Deposit",
    sentFromName: "Chinelo Okoro",
    sentFromBank: "Access Bank",
    sentFromAccount: "0987654321",
    sentToPortfolio: "WealthFlow",
    logId: "#LOG56791",
    logRecorded: "14:15, April 14, 2023",
    emailConfirmation: "Pending at 2024-03-06 14:15 UTC",
    ip: "192.168.1.12",
  },
  {
    id: "ID5372530",
    timestamp: "09:30, April 15, 2023",
    name: "Babatunde Lawal",
    email: "blawal@wealthconomy.com",
    amount: "N120,500.00",
    txId: "876543459",
    actionType: "Deposit",
    status: "Successful",
    portfolio: "WealthFam",
    type: "Deposit",
    subtitle: "Deposit",
    sentFromName: "Babatunde Lawal",
    sentFromBank: "Zenith Bank",
    sentFromAccount: "2345678901",
    sentToPortfolio: "WealthFam",
    logId: "#LOG56792",
    logRecorded: "09:30, April 15, 2023",
    emailConfirmation: "Approved at 2024-03-07 09:30 UTC",
    ip: "192.168.1.13",
  },
];

type Tx = (typeof INITIAL_TRANSACTIONS)[0];

const PORTFOLIOS = ["WealthFix", "WealthFlex", "WealthFlow", "WealthFam", "WealthGoal"];

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState("All Portfolios");
  const [logModal, setLogModal] = useState<Tx | null>(null);
  const [receiptModal, setReceiptModal] = useState<Tx | null>(null);

  const filtered = INITIAL_TRANSACTIONS.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = tx.name.toLowerCase().includes(q) || tx.txId.includes(q) || tx.id.toLowerCase().includes(q) || tx.actionType.toLowerCase().includes(q);
    const matchPortfolio = selectedPortfolio === "All Portfolios" || tx.portfolio === selectedPortfolio;
    return matchSearch && matchPortfolio;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-5 rounded-xl border-border/50 font-bold text-sm text-slate hover:bg-surface gap-2 shrink-0">
                Filter <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              <DropdownMenuItem onClick={() => setSelectedPortfolio("All Portfolios")} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">All Portfolios</DropdownMenuItem>
              {PORTFOLIOS.map((p) => (
                <DropdownMenuItem key={p} onClick={() => setSelectedPortfolio(p)} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">{p}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
              {filtered.length > 0 ? filtered.map((tx, i) => (
                <TableRow key={i} className="group border-border/50 hover:bg-surface/30 transition-all duration-200">
                  <TableCell className="py-5 px-4">
                    <span className="text-[11px] font-semibold text-slate/60 block">{tx.timestamp}</span>
                    <span className="text-[10px] text-slate/40 font-bold uppercase">{tx.id}</span>
                  </TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-primary/5 shadow-sm shrink-0">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${tx.id}`} />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{tx.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-[12px] text-dark truncate max-w-[130px]">{tx.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-4 text-[13px] font-bold text-dark">{tx.amount}</TableCell>
                  <TableCell className="py-5 px-4 text-[11px] font-bold text-slate/60">#{tx.txId}</TableCell>
                  <TableCell className="py-5 px-4 text-[12px] font-medium text-dark/70">{tx.actionType}</TableCell>
                  <TableCell className="py-5 px-4">{statusBadge(tx.status)}</TableCell>
                  <TableCell className="py-5 px-4">
                    <span className="text-[11px] font-bold text-slate/70 px-3 py-1.5 bg-surface rounded-lg border border-border/20">{tx.portfolio}</span>
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
              )) : (
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
              <p className="text-[13px] text-slate/40 font-medium mb-1">{logModal.subtitle}</p>
              <h2 className="text-[24px] font-bold text-dark font-outfit mb-5">{logModal.type}</h2>

              <div className="grid grid-cols-2 gap-x-10">
                {/* LEFT */}
                <div>
                  <h3 className="text-[15px] font-bold text-dark mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div><p className="text-[12px] font-bold text-dark">User&apos;s Name</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.name}</p></div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">User&apos;s ID</p>
                      <p className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 cursor-pointer hover:underline" onClick={() => { setLogModal(null); router.push(`/dashboard/users/${logModal.id}`); }}>{logModal.id}</p>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">Email</p><a href={`mailto:${logModal.email}`} className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 hover:underline block">{logModal.email}</a></div>
                    <div><p className="text-[12px] font-bold text-dark">Action</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.actionType}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Status</p><p className={`text-[13px] font-semibold mt-0.5 ${logModal.status === "Successful" ? "text-emerald-500" : logModal.status === "Failed" ? "text-red-500" : "text-orange-500"}`}>{logModal.status}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Timestamp</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.timestamp}</p></div>
                  </div>

                  <h3 className="text-[15px] font-bold text-dark mt-6 mb-4">Security Verification</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] font-bold text-dark">Email Confirmation</p>
                      <p className="text-[13px] mt-0.5"><span className="text-emerald-500 font-semibold">Approved</span><span className="text-slate/60"> at {logModal.emailConfirmation.replace("Approved at ", "")}</span></p>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">IP Address</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.ip}</p></div>
                  </div>
                </div>

                {/* RIGHT */}
                <div>
                  <h3 className="text-[15px] font-bold text-dark mb-4">Transaction Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] font-bold text-dark">Sent from</p>
                      {logModal.sentFromName ? (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex gap-4"><span className="text-[12px] text-slate/50 w-24">Name:</span><span className="text-[12px] text-slate/70 font-medium">{logModal.sentFromName}</span></div>
                          <div className="flex gap-4"><span className="text-[12px] text-slate/50 w-24">Bank:</span><span className="text-[12px] text-slate/70 font-medium">{logModal.sentFromBank}</span></div>
                          <div className="flex gap-4"><span className="text-[12px] text-slate/50 w-24">Account Number:</span><span className="text-[12px] text-slate/70 font-medium">{logModal.sentFromAccount}</span></div>
                        </div>
                      ) : (
                        <div className="mt-1 flex gap-4"><span className="text-[12px] text-slate/50 w-24">Portfolio:</span><span className="text-[12px] text-slate/70 font-medium">{(logModal as any).sentFromPortfolio}</span></div>
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Sent to</p>
                      <div className="mt-1 flex gap-4"><span className="text-[12px] text-slate/50 w-24">Portfolio:</span><span className="text-[12px] text-slate/70 font-medium">{logModal.sentToPortfolio}</span></div>
                    </div>
                    <div><p className="text-[12px] font-bold text-dark">Transaction ID</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.txId}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Transaction Amount</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.amount}</p></div>
                  </div>

                  <h3 className="text-[15px] font-bold text-dark mt-6 mb-4">System Logs</h3>
                  <div className="space-y-4">
                    <div><p className="text-[12px] font-bold text-dark">Log Entry ID</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.logId}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Log Recorded</p><p className="text-[13px] text-slate/60 mt-0.5">{logModal.logRecorded}</p></div>
                    <div><p className="text-[12px] font-bold text-dark">Notified Users</p><p className="text-[13px] text-slate/60 mt-0.5">Admin received confirmation email</p></div>
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
                  <p className="text-[11px] text-emerald-600 font-bold">Withdrawal</p>
                  <p className="text-[22px] font-black text-dark leading-tight">-{receiptModal.amount}</p>
                  <p className="text-[11px] text-slate/50 font-medium mt-1">{receiptModal.timestamp} • 03:05pm</p>
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
              <p className="text-[10px] text-slate/40 font-medium break-all">9823764890548978904359728902143579{receiptModal.name.replace(/\s/g, "").toLowerCase()}</p>
              <div className="space-y-2.5 pt-1">
                {[
                  ["Status", <span className="text-emerald-500 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Success</span>],
                  ["Account credited", "763482239292"],
                  ["Sender", "Simon72357189"],
                  ["Originating bank", "Win up Wallet"],
                  ["Transaction type", "Credit transaction"],
                  ["SessionID", "982376489054897890435972890214357"],
                  ["Narrative", "-"],
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
