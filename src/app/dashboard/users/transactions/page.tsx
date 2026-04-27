"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  MoreVertical,
  Eye,
  Filter,
  ArrowRightLeft,
  Calendar,
  User as UserIcon,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const INITIAL_TRANSACTIONS = [
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Smith",
    amount: "N34,334.22",
    txId: "876543456",
    actionType: "Funds Released",
    status: "Pending",
    portfolio: "WealthFix",
  },
  {
    id: "ID5372528",
    timestamp: "10:20, April 13, 2023",
    name: "Adewale Johnson",
    amount: "N15,000.00",
    txId: "876543457",
    actionType: "Wealth TopUp",
    status: "Failed",
    portfolio: "WealthFlex",
  },
  {
    id: "ID5372529",
    timestamp: "14:15, April 14, 2023",
    name: "Chinelo Okoro",
    amount: "N50,000.00",
    txId: "876543458",
    actionType: "Wealth TopUp",
    status: "Pending",
    portfolio: "WealthFlow",
  },
  {
    id: "ID5372530",
    timestamp: "09:30, April 15, 2023",
    name: "Babatunde Lawal",
    amount: "N120,500.00",
    txId: "876543459",
    actionType: "Wealth TopUp",
    status: "Successful",
    portfolio: "WealthFam",
  },
  {
    id: "ID5372531",
    timestamp: "11:00, April 16, 2023",
    name: "Fatima Yusuf",
    amount: "N25,000.00",
    txId: "876543460",
    actionType: "Wealth Released",
    status: "Successful",
    portfolio: "WealthGoal",
  },
  {
    id: "ID5372532",
    timestamp: "16:45, April 17, 2023",
    name: "Emeka Obi",
    amount: "N10,200.00",
    txId: "876543461",
    actionType: "Card Deposit",
    status: "Successful",
    portfolio: "WealthFlex",
  },
];

const PORTFOLIOS = [
  "WealthFix",
  "WealthFlex",
  "WealthFlow",
  "WealthFam",
  "WealthGoal",
];

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState("All Portfolios");

  const filteredTransactions = INITIAL_TRANSACTIONS.filter((tx) => {
    const matchesSearch =
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.actionType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPortfolio =
      selectedPortfolio === "All Portfolios" ||
      tx.portfolio === selectedPortfolio;

    return matchesSearch && matchesPortfolio;
  });

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
          Transactions Management
        </h1>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search Name, TxID, UserID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-12 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none transition-all"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-border/50 font-bold text-slate hover:bg-surface transition-all gap-2"
              >
                <Filter className="h-4 w-4" />
                {selectedPortfolio}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border-border/50 p-2 shadow-xl">
              <DropdownMenuItem
                onClick={() => setSelectedPortfolio("All Portfolios")}
                className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer"
              >
                All Portfolios
              </DropdownMenuItem>
              {PORTFOLIOS.map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => setSelectedPortfolio(p)}
                  className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer"
                >
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Content */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <Table>
          <TableHeader className="bg-surface/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Timestamp
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                User
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Amount
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Tx ID
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Action
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                Status
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Portfolio
              </TableHead>
              <TableHead className="py-5 px-6 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, i) => (
                <TableRow
                  key={i}
                  className="group border-border/50 hover:bg-surface/30 transition-all duration-200"
                >
                  <TableCell className="py-6 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-dark italic">
                        {tx.timestamp}
                      </span>
                      <span className="text-[10px] text-slate/40 uppercase tracking-tighter font-bold">
                        {tx.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-primary/5 shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?u=${tx.id}`}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                          {tx.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-[13px] text-dark group-hover:text-primary transition-colors">
                        {tx.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-6 text-[13px] font-bold text-dark">
                    {tx.amount}
                  </TableCell>
                  <TableCell className="py-6 px-6 text-[11px] font-bold text-slate/60 tracking-wider">
                    #{tx.txId}
                  </TableCell>
                  <TableCell className="py-6 px-6 text-[12px] font-medium text-dark/70">
                    {tx.actionType}
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    <div className="flex justify-center">
                      <Badge
                        className={`${
                          tx.status === "Successful"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                            : tx.status === "Pending"
                              ? "bg-orange-50 text-orange-600 border-orange-100/50"
                              : "bg-red-50 text-red-500 border-red-100/50"
                        } px-4 py-1.5 rounded-xl gap-2 font-bold text-[10px] border shadow-none transition-all`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.status === "Successful"
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : tx.status === "Pending"
                                ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                                : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          }`}
                        />
                        {tx.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    <span className="text-[11px] font-bold text-slate/70 px-4 py-2 bg-surface rounded-lg border border-border/20">
                      {tx.portfolio}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 hover:bg-surface rounded-full transition-all active:scale-90"
                        >
                          <MoreVertical className="h-4.5 w-4.5 text-slate/40" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-[16px] border-border/50 shadow-xl p-1 animate-in slide-in-from-top-1 duration-200"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/users/${tx.id}`)
                          }
                          className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          View User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-primary/60" />
                          Trace TX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-slate/20" />
                    <p className="text-sm font-medium text-slate/40">
                      No transactions match your search.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
