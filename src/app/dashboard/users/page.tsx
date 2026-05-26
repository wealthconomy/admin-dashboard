"use client";

import { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  MoreVertical, 
  X, 
  ShieldAlert, 
  Calendar,
  AlertCircle,
  Eye,
  Filter,
  FileText,
  Lock,
  Ban,
  Download,
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  Wallet,
  TrendingUp,
  Layers
} from "lucide-react";
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
import { toast } from "sonner";

const INITIAL_USERS = [
  {
    id: "ID5372527",
    name: "Simon Smith",
    email: "simon.smith@wealthconomy.com",
    phone: "+234567889274",
    status: "Active",
    totalSavings: 450000,
    totalInterest: 45000,
    transactionType: "Mixed",
    lastLogin: "Apr 12, 2023",
  },
  {
    id: "ID5372528",
    name: "Adewale Johnson",
    email: "adewale.j@gmail.com",
    phone: "+2348012345678",
    status: "Active",
    totalSavings: 120500,
    totalInterest: 12050,
    transactionType: "Impact Wealth",
    lastLogin: "Apr 13, 2023",
  },
  {
    id: "ID5372529",
    name: "Chinelo Okoro",
    email: "c.okoro@outlook.com",
    phone: "+2347098765432",
    status: "Active",
    totalSavings: 890000,
    totalInterest: 89000,
    transactionType: "Interest",
    lastLogin: "Apr 14, 2023",
  },
  {
    id: "ID5372530",
    name: "Babatunde Lawal",
    email: "blawal@wealthconomy.com",
    phone: "+234567889274",
    status: "Active",
    totalSavings: 50000,
    totalInterest: 5000,
    transactionType: "Impact Wealth",
    lastLogin: "Apr 15, 2023",
  },
  {
    id: "ID5372531",
    name: "Fatima Yusuf",
    email: "fatima.y@live.com",
    phone: "+2348123456789",
    status: "Suspended",
    totalSavings: 300000,
    totalInterest: 30000,
    transactionType: "Interest",
    lastLogin: "Apr 16, 2023",
  },
  {
    id: "ID5372532",
    name: "Emeka Obi",
    email: "emeka.obi@gmail.com",
    phone: "+2349012345678",
    status: "Active",
    totalSavings: 1500000,
    totalInterest: 150000,
    transactionType: "Impact Wealth",
    lastLogin: "Apr 17, 2023",
  },
];

const WEALTH_PLANS = ["WealthFix", "WealthFlex", "WealthFlow", "WealthFam", "WealthGoal", "Mixed Wealth"];

export default function UsersPage() {
  const router = useRouter();
  const [userList, setUserList] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedTransactionType, setSelectedTransactionType] = useState("All Types");
  const [sortSavings, setSortSavings] = useState("Default");
  
  // Suspension Multi-step State
  const [suspendStep, setSuspendStep] = useState(1); 
  const [suspendUser, setSuspendUser] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<"suspend" | "block">("suspend");
  const [suspendData, setSuspendData] = useState({
    reason: "",
    duration: "30 Days"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const processedUsers = userList.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "All Status" || user.status === selectedStatus;
    const matchesTransactionType = selectedTransactionType === "All Types" || user.transactionType === selectedTransactionType;
    
    return matchesSearch && matchesStatus && matchesTransactionType;
  }).sort((a, b) => {
    if (sortSavings === "Highest to Lowest") return b.totalSavings - a.totalSavings;
    if (sortSavings === "Lowest to Highest") return a.totalSavings - b.totalSavings;
    return 0;
  });

  const handleSuspendToggle = () => {
    if (!suspendUser) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const isActivating = suspendUser.status !== "Active";
      setUserList(userList.map(u => 
        u.id === suspendUser.id 
        ? { 
            ...u, 
            status: isActivating 
              ? "Active" 
              : (modalMode === "block" ? "Blocked" : "Suspended") 
          } 
        : u
      ));
      setIsSubmitting(false);
      setSuspendUser(null);
      setSuspendStep(1);
      setSuspendData({ reason: "", duration: "30 Days" });
      toast.success(
        `User successfully ${
          isActivating 
            ? "reactivated" 
            : (modalMode === "block" ? "blocked" : "suspended")
        }!`
      );
    }, 1500);
  };

  const closeSuspendModal = () => {
    if (!isSubmitting) {
      setSuspendUser(null);
      setSuspendStep(1);
    }
  };

  const handleDownload = () => {
    toast.success("Downloading user report...");
  };

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight shrink-0">
          Users Management
        </h1>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search Name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none transition-all"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 font-bold text-slate hover:bg-surface transition-all gap-2 relative">
                <Filter className="h-4 w-4" />
                Filters
                {(selectedStatus !== "All Status" || selectedTransactionType !== "All Types" || sortSavings !== "Default") && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[500px] p-4 rounded-2xl border-border/50 shadow-xl grid grid-cols-3 gap-6">
              {/* Status Section */}
              <div className="flex flex-col">
                <h4 className="text-[10px] font-bold text-slate/50 uppercase tracking-wider mb-2 px-2">User Status</h4>
                <div className="flex flex-col gap-1">
                  {["All Status", "Active", "Suspended"].map(status => (
                    <button 
                      key={status}
                      onClick={() => setSelectedStatus(status)} 
                      className={`text-xs font-bold px-3 py-2 rounded-xl text-left transition-all ${selectedStatus === status ? 'bg-[#E8F3F3] text-[#155D5F]' : 'text-slate hover:bg-surface'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Type Section */}
              <div className="flex flex-col border-l border-border/50 pl-6">
                <h4 className="text-[10px] font-bold text-slate/50 uppercase tracking-wider mb-2 px-2">Transaction Type</h4>
                <div className="flex flex-col gap-1">
                  {["All Types", "Interest", "Impact Wealth", "Mixed"].map(type => (
                    <button 
                      key={type}
                      onClick={() => setSelectedTransactionType(type)} 
                      className={`text-xs font-bold px-3 py-2 rounded-xl text-left transition-all ${selectedTransactionType === type ? 'bg-[#E8F3F3] text-[#155D5F]' : 'text-slate hover:bg-surface'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Section */}
              <div className="flex flex-col border-l border-border/50 pl-6">
                <h4 className="text-[10px] font-bold text-slate/50 uppercase tracking-wider mb-2 px-2">Sort By Savings</h4>
                <div className="flex flex-col gap-1">
                  {["Default", "Highest to Lowest", "Lowest to Highest"].map(sort => (
                    <button 
                      key={sort}
                      onClick={() => setSortSavings(sort)} 
                      className={`text-xs font-bold px-3 py-2 rounded-xl text-left transition-all ${sortSavings === sort ? 'bg-[#E8F3F3] text-[#155D5F]' : 'text-slate hover:bg-surface'}`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="h-11 px-5 rounded-xl border-border/50 font-bold text-[#155D5F] hover:bg-[#E8F3F3] transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="relative mb-8">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          className="absolute top-[42px] -right-4 w-9 h-9 rounded-xl bg-white border border-slate/20 shadow-sm flex items-center justify-center text-slate hover:bg-surface transition-all duration-300 z-10 cursor-pointer"
        >
          {isStatsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-8">
          {/* Total Users */}
          <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold font-outfit text-primary leading-none">
                  {userList.length}
                </p>
                <p className="text-[11px] font-semibold text-primary/80 mt-2">
                  Total Users
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2 accounts recently created
            </div>
          </div>

          {/* Active Users */}
          <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold font-outfit text-primary leading-none">
                  {userList.filter((u) => u.status === "Active").length}
                </p>
                <p className="text-[11px] font-semibold text-primary/80 mt-2">
                  Active
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              94.6% of users active online
            </div>
          </div>

          {/* Suspended Users */}
          <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold font-outfit text-primary leading-none">
                  {userList.filter((u) => u.status !== "Active").length}
                </p>
                <p className="text-[11px] font-semibold text-primary/80 mt-2">
                  Suspended
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-red-500 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Requires administrative review
            </div>
          </div>

          {/* Expanded stats */}
          {isStatsExpanded && (
            <>
              {/* Interest Type Users */}
              <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold font-outfit text-primary leading-none">
                      {userList.filter((u) => u.transactionType === "Interest").length}
                    </p>
                    <p className="text-[11px] font-semibold text-primary/80 mt-2">
                      Interest Type
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  ₦{ (89000).toLocaleString() } average interest yield
                </div>
              </div>

              {/* Impact Wealth Users */}
              <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold font-outfit text-primary leading-none">
                      {
                        userList.filter((u) => u.transactionType === "Impact Wealth")
                          .length
                      }
                    </p>
                    <p className="text-[11px] font-semibold text-primary/80 mt-2">
                      Impact Wealth
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  Trending: 12.4% rise in sign-ups
                </div>
              </div>

              {/* Mixed Users */}
              <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold font-outfit text-primary leading-none">
                      {userList.filter((u) => u.transactionType === "Mixed").length}
                    </p>
                    <p className="text-[11px] font-semibold text-primary/80 mt-2">
                      Mixed Plan
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  Diversified portfolio builders
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-left whitespace-nowrap">Name</TableHead>
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Last Login</TableHead>
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Email</TableHead>
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center whitespace-nowrap">Status</TableHead>
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center whitespace-nowrap">Transaction Type</TableHead>
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center whitespace-nowrap">Total Savings</TableHead>
                <TableHead className="py-3 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center whitespace-nowrap">Total Interest</TableHead>
                <TableHead className="py-3 px-3 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedUsers.length > 0 ? processedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="group border-border/50 hover:bg-surface/30 transition-all duration-200"
                >
                  <TableCell className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/dashboard/users/${user.id}`)}>
                      <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-border/5 group-hover:scale-105 transition-transform">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-[12px] text-dark group-hover:text-primary transition-colors">
                          {user.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3 whitespace-nowrap">
                    <span className="text-slate/70 text-[11px] font-medium leading-relaxed">
                      {user.lastLogin}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 whitespace-nowrap">
                    <a href={`mailto:${user.email}`} className="text-primary hover:underline text-[11px] font-bold">
                      {user.email}
                    </a>
                  </TableCell>
                  <TableCell className="py-3 px-3 whitespace-nowrap">
                    <div className="flex justify-center">
                      <Badge className={`${
                        user.status === "Active" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                          : user.status === "Blocked"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-red-50 text-red-500 border-red-100/50"
                      } px-2 py-0.5 rounded-lg gap-1 font-bold text-[9px] items-center border shadow-none transition-all`}>
                        <div className={`w-1 h-1 rounded-full ${
                          user.status === "Active" 
                            ? "bg-emerald-500" 
                            : user.status === "Blocked"
                            ? "bg-slate-500"
                            : "bg-red-500"
                        }`} />
                        {user.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${user.transactionType === 'Interest' ? 'bg-[#86D7DA69] text-[#155D5F]' : user.transactionType === 'Mixed' ? 'bg-purple-100 text-purple-700' : 'bg-surface/50 text-slate/70'}`}>
                        {user.transactionType}
                     </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                     <span className="text-[11px] font-bold text-dark px-2 py-1 bg-surface/50 rounded-lg">₦{user.totalSavings.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                     <span className="text-[11px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">+₦{user.totalInterest.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full transition-all active:scale-90">
                          <MoreVertical className="h-4 w-4 text-slate/40" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-[16px] border-border/50 shadow-xl p-1 animate-in slide-in-from-top-1 duration-200">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}`)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                           <Eye className="h-3.5 w-3.5 text-primary" />
                           View Account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}/credentials`)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                           <FileText className="h-3.5 w-3.5 text-blue-500" />
                           User Credential
                        </DropdownMenuItem>
                        {user.status === "Active" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("suspend"); }} className="py-2.5 px-4 text-xs font-bold text-red-500 focus:bg-red-50 cursor-pointer rounded-xl gap-2">
                               <Ban className="h-3.5 w-3.5" />
                               Suspend User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("block"); }} className="py-2.5 px-4 text-xs font-bold text-red-700 focus:bg-red-100 cursor-pointer rounded-xl gap-2">
                               <Lock className="h-3.5 w-3.5" />
                               Block User
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode(user.status === "Blocked" ? "block" : "suspend"); }} className="py-2.5 px-4 text-xs font-bold text-emerald-600 focus:bg-emerald-50 cursor-pointer rounded-xl gap-2">
                             <ShieldAlert className="h-3.5 w-3.5" />
                             Activate User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-slate/20" />
                      <p className="text-sm font-medium text-slate/40">No users found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Multi-step Suspend Modal */}
      {suspendUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeSuspendModal} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-500">
            
            {suspendStep === 1 ? (
              /* Step 1: Input Reason and Duration */
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${suspendUser.status === 'Active' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      <ShieldAlert className={`h-5 w-5 ${suspendUser.status === 'Active' ? 'text-red-500' : 'text-emerald-600'}`} />
                   </div>
                   <button onClick={closeSuspendModal} className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-colors">
                      <X className="h-4.5 w-4.5 text-slate/60" />
                   </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    {suspendUser.status === 'Active' 
                      ? (modalMode === "block" ? 'Block User' : 'Suspend User') 
                      : 'Reactivate User'}
                  </h3>
                  <p className="text-sm font-medium text-slate/50 leading-relaxed">
                    Account management for <span className="text-dark font-bold">{suspendUser.name}</span>.
                  </p>
                </div>

                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[12px] font-bold text-dark/80 ml-1">Reason for {suspendUser.status === 'Active' ? (modalMode === 'block' ? 'Blocking' : 'Suspension') : 'Activation'}</label>
                      <textarea 
                        className="w-full min-h-[90px] p-4 bg-surface/50 border border-border/30 rounded-xl font-medium text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner"
                        placeholder="Type the reason here..."
                        value={suspendData.reason}
                        onChange={(e) => setSuspendData({...suspendData, reason: e.target.value})}
                      />
                   </div>

                   {suspendUser.status === 'Active' && modalMode === "suspend" && (
                     <div className="space-y-2">
                        <label className="text-[12px] font-bold text-dark/80 ml-1">Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                           {["24 Hours", "7 Days", "30 Days", "Permanent"].map(d => (
                              <button 
                                key={d}
                                type="button"
                                onClick={() => setSuspendData({...suspendData, duration: d})}
                                className={`h-11 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${suspendData.duration === d ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-surface/50 border-border/30 text-slate hover:border-slate/30'}`}
                              >
                                 <Calendar className="h-3 w-3" />
                                 {d}
                              </button>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <Button 
                  onClick={() => { if(suspendData.reason) setSuspendStep(2); else toast.error("Please provide a reason") }}
                  className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${suspendUser.status === 'Active' ? (modalMode === 'block' ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-red-900/10' : 'bg-[#D93F3F] hover:bg-[#C23535] text-white shadow-red-900/10') : 'bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-primary/10'}`}
                >
                  Proceed to Review
                </Button>
              </div>
            ) : (
              /* Step 2: Confirmation Summary */
              <div className="p-8 space-y-6 animate-in slide-in-from-right-5 duration-300">
                 <div className="flex items-center justify-between">
                    <button onClick={() => setSuspendStep(1)} className="text-[12px] font-bold text-primary hover:underline transition-all">← Edit Details</button>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center bg-surface">
                       <AlertCircle className="h-4.5 w-4.5 text-slate/40" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">Confirm Action</h3>
                    <p className="text-sm font-medium text-slate/50">Final check before processing.</p>
                 </div>

                 <div className="bg-surface/30 border border-border/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/20">
                       <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-border/5">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${suspendUser.id}`} />
                          <AvatarFallback>{suspendUser.name[0]}</AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">User</p>
                          <p className="text-sm font-bold text-dark leading-none mt-1">{suspendUser.name}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">Action</p>
                          <p className={`text-xs font-bold ${suspendUser.status === 'Active' ? 'text-red-500' : 'text-emerald-600'}`}>
                             {suspendUser.status === 'Active' 
                               ? (modalMode === "block" ? "Block (Permanent)" : `Suspend (${suspendData.duration})`) 
                               : 'Reactivate'}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">Reason</p>
                          <p className="text-xs font-medium text-dark leading-relaxed line-clamp-3">"{suspendData.reason}"</p>
                       </div>
                    </div>
                 </div>

                 <Button 
                   onClick={handleSuspendToggle}
                   disabled={isSubmitting}
                   className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${suspendUser.status === 'Active' ? (modalMode === 'block' ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-red-900/10' : 'bg-[#D93F3F] hover:bg-[#C23535] text-white shadow-red-900/10') : 'bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-primary/10'}`}
                 >
                   {isSubmitting ? (
                     <Loader2 className="h-4 w-4 animate-spin mx-auto text-white/80" />
                   ) : (
                    `Confirm ${suspendUser.status === 'Active' ? (modalMode === 'block' ? 'Blocking' : 'Suspension') : 'Activation'}`
                   )}
                 </Button>
              </div>
            )}

          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
