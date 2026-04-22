"use client";

import { useState } from "react";
import { Search, ChevronDown, MoreVertical, Eye } from "lucide-react";
import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const transactions = [
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
    portfolio: "WealthGoal",
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

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.actionType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-xl font-bold font-outfit text-dark whitespace-nowrap">
          Transactions Management
        </h1>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate/30" />
            <input
              type="text"
              placeholder="Search for Name, ID, or Action"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-surface border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <button className="flex items-center gap-2 px-6 py-2 border border-border rounded-2xl text-sm font-medium text-slate hover:bg-surface transition-all">
            Filter
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                Timestamp
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                Name
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                Amount
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                ID
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                Action Type
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                Status
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6">
                Portfolio
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-[11px] pb-6 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx, i) => (
              <TableRow
                key={i}
                className="border-border/50 hover:bg-surface/30 transition-all"
              >
                <TableCell className="py-6 text-[11px] text-slate/70 whitespace-pre-line leading-relaxed">
                  {tx.timestamp}
                </TableCell>
                <TableCell className="py-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-primary/5">
                      <AvatarImage
                        src={`https://i.pravatar.cc/150?u=${tx.id}`}
                      />
                      <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                        {tx.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-dark text-[12px]">
                      {tx.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 text-[11px] font-bold text-dark">
                  {tx.amount}
                </TableCell>
                <TableCell className="py-6 text-[11px] text-slate font-medium">
                  {tx.txId}
                </TableCell>
                <TableCell className="py-6 text-[11px] text-slate/70">
                  {tx.actionType}
                </TableCell>
                <TableCell className="py-6">
                  {tx.status === "Successful" ? (
                    <Badge className="bg-green-100/60 text-green-600 hover:bg-green-100/60 border-none px-3 py-1.5 rounded-xl gap-2 font-semibold text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                      Successful
                    </Badge>
                  ) : tx.status === "Pending" ? (
                    <Badge className="bg-orange-100/60 text-orange-600 hover:bg-orange-100/60 border-none px-3 py-1.5 rounded-xl gap-2 font-semibold text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                      Pending
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100/60 text-red-600 hover:bg-red-100/60 border-none px-3 py-1.5 rounded-xl gap-2 font-semibold text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                      Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-6 text-[11px] text-slate/70 font-medium">
                  {tx.portfolio}
                </TableCell>
                <TableCell className="py-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-surface rounded-xl transition-all group relative">
                        <div className="flex flex-col gap-[2px] items-center">
                          <div className="w-1 h-1 rounded-full bg-slate/30 group-hover:bg-slate/60"></div>
                          <div className="w-1 h-1 rounded-full bg-gold"></div>
                          <div className="w-1 h-1 rounded-full bg-slate/30 group-hover:bg-slate/60"></div>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-2xl p-2 border-border shadow-lg"
                    >
                      <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-surface text-sm font-medium text-slate">
                        <Eye className="h-4 w-4 text-primary/70" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
