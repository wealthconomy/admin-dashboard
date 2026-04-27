"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  MoreVertical,
  History,
  User as UserIcon,
  Activity,
  Eye,
  ArrowRight,
  Filter,
  Calendar,
  ShieldCheck,
  CreditCard,
  Settings,
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

const INITIAL_ACTIVITIES = [
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Smith",
    email: "simon.smith@wealthconomy.com",
    action: "Login",
    description: "User logged in from Lagos, NG (IP: 192.168.1.1)",
    category: "Security",
  },
  {
    id: "ID5372528",
    timestamp: "10:20, April 13, 2023",
    name: "Adewale Johnson",
    email: "adewale.j@gmail.com",
    action: "Deposit",
    description: "Successful deposit of N15,000.00 into WealthFlex",
    category: "Transaction",
  },
  {
    id: "ID5372529",
    timestamp: "14:15, April 14, 2023",
    name: "Chinelo Okoro",
    email: "c.okoro@outlook.com",
    action: "Profile Update",
    description: "Updated recovery email address",
    category: "Account",
  },
  {
    id: "ID5372530",
    timestamp: "09:30, April 15, 2023",
    name: "Babatunde Lawal",
    email: "blawal@wealthconomy.com",
    action: "Withdrawal",
    description: "Initiated withdrawal of N120,500.00 from WealthFix",
    category: "Transaction",
  },
  {
    id: "ID5372531",
    timestamp: "11:00, April 16, 2023",
    name: "Fatima Yusuf",
    email: "fatima.y@live.com",
    action: "Settings Change",
    description: "Enabled Two-Factor Authentication",
    category: "Security",
  },
  {
    id: "ID5372532",
    timestamp: "16:45, April 17, 2023",
    name: "Emeka Obi",
    email: "emeka.obi@gmail.com",
    action: "Investment",
    description: "Allocated N50,000 to WealthGoal (Personal Home)",
    category: "Transaction",
  },
];

const CATEGORIES = ["All Categories", "Security", "Transaction", "Account"];

export default function ActivitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredActivities = INITIAL_ACTIVITIES.filter((act) => {
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" ||
      act.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
          Activities Management
        </h1>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search Name, Email, or Action..."
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
                {selectedCategory}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border-border/50 p-2 shadow-xl">
              {CATEGORIES.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer"
                >
                  {c}
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
                Action
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Description
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                Category
              </TableHead>
              <TableHead className="py-5 px-6 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length > 0 ? (
              filteredActivities.map((act, i) => (
                <TableRow
                  key={i}
                  className="group border-border/50 hover:bg-surface/30 transition-all duration-200"
                >
                  <TableCell className="py-6 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-dark italic">
                        {act.timestamp}
                      </span>
                      <span className="text-[10px] text-slate/40 uppercase tracking-tighter font-bold">
                        {act.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-primary/5 shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?u=${act.id}`}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                          {act.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-dark group-hover:text-primary transition-colors">
                          {act.name}
                        </span>
                        <span className="text-[10px] text-slate/40 truncate max-w-[120px]">
                          {act.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-6 text-[12px] font-bold text-dark tracking-tight">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          act.category === "Security"
                            ? "bg-orange-500"
                            : act.category === "Transaction"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                        }`}
                      />
                      {act.action}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-6 text-[12px] font-medium text-slate/60 leading-relaxed max-w-[280px]">
                    {act.description}
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    <div className="flex justify-center">
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-lg gap-2 font-bold text-[10px] border-border/40 text-slate/60 shadow-none transition-all"
                      >
                        {act.category === "Security" ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : act.category === "Transaction" ? (
                          <CreditCard className="h-3 w-3" />
                        ) : (
                          <Settings className="h-3 w-3" />
                        )}
                        {act.category}
                      </Badge>
                    </div>
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
                            router.push(`/dashboard/users/${act.id}`)
                          }
                          className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                          <History className="h-3.5 w-3.5 text-primary/60" />
                          Full History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="h-8 w-8 text-slate/20" />
                    <p className="text-sm font-medium text-slate/40">
                      No activity logs match your search.
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
