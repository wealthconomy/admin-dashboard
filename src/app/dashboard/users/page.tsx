"use client";

import { useState, useEffect } from "react";
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
  Layers,
  RotateCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  useGetUsersQuery, 
  useSuspendUserMutation, 
  useUnsuspendUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useLazyDownloadUsersReportQuery
} from "@/lib/redux/features/usersApi";

// Helper to extract the safe array from backend response wrapper
const getSafeArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data?.items)) return data.data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

/**
 * PAGE SIZE: Exactly 20 users per page by default.
 * In development, you can test pagination with smaller batches by setting
 * NEXT_PUBLIC_DEBUG_PAGE_SIZE in .env.local or window.__USERS_PAGE_SIZE__ (e.g. to 5).
 */
const getPageSize = () => {
  if (process.env.NODE_ENV !== "production") {
    if (typeof window !== "undefined" && (window as any).__USERS_PAGE_SIZE__) {
      return Number((window as any).__USERS_PAGE_SIZE__);
    }
    if (process.env.NEXT_PUBLIC_DEBUG_PAGE_SIZE) {
      return Number(process.env.NEXT_PUBLIC_DEBUG_PAGE_SIZE);
    }
  }
  return 20;
};

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedTransactionType, setSelectedTransactionType] = useState("All Types");
  const [sortSavings, setSortSavings] = useState("Default");
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = getPageSize();

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

  // Reset to page 1 whenever search or filter parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedTransactionType, sortSavings]);

  // RTK Query hooks with explicit server-side sort (createdAt desc)
  const { data: usersResponse, isLoading, isFetching, isError, refetch } = useGetUsersQuery({
    q: searchQuery.trim() || undefined,
    status: selectedStatus !== "All Status" ? selectedStatus : undefined,
    transactionType: selectedTransactionType !== "All Types" ? selectedTransactionType : undefined,
    sortBy: "createdAt",
    sortDir: "desc",
    limit: 200,
  }, {
    refetchOnMountOrArgChange: true,
  });

  const [suspendUserMutation] = useSuspendUserMutation();
  const [unsuspendUserMutation] = useUnsuspendUserMutation();
  const [blockUserMutation] = useBlockUserMutation();
  const [unblockUserMutation] = useUnblockUserMutation();
  const [triggerDownload] = useLazyDownloadUsersReportQuery();

  const rawData = usersResponse?.data || usersResponse;
  const rawItems = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];

  const userList = rawItems
    .filter((u: any) => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN")
    .map((u: any) => {
      // Determine effective status
      let status = "Active";
      if (u.blockedAt || u.disciplineStatus === "BLOCKED") status = "Blocked";
      else if (u.suspendedUntil || u.disciplineStatus === "SUSPENDED") status = "Suspended";

      // Determine transaction type visually from wealthPreference or transactionType
      let tType = "Mixed";
      const pref = String(u.wealthPreference || u.transactionType || "").toUpperCase();
      if (pref.includes("IMPACT")) {
        tType = "Impact Wealth";
      } else if (pref.includes("INTEREST")) {
        tType = "Interest";
      } else if (pref.includes("MIXED")) {
        tType = "Mixed";
      } else if (u.transactionType) {
        tType = u.transactionType;
      }

      return {
        ...u,
        id: u.id || u._id || u.userId,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email,
        status,
        transactionType: tType,
      };
    });

  // Client filtering
  const processedUsers = userList.filter((u: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.name || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchId = (u.id || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }
    if (selectedStatus !== "All Status" && u.status !== selectedStatus) return false;
    if (selectedTransactionType !== "All Types" && u.transactionType !== selectedTransactionType) return false;
    return true;
  });

  // Sort by savings if requested, otherwise keep server createdAt desc order
  const sortedUsers = [...processedUsers].sort((a: any, b: any) => {
    if (sortSavings === "Highest to Lowest") {
      return Number(b.totalSavings || 0) - Number(a.totalSavings || 0);
    }
    if (sortSavings === "Lowest to Highest") {
      return Number(a.totalSavings || 0) - Number(b.totalSavings || 0);
    }
    return 0;
  });

  // Pagination calculations
  const totalCount = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const displayedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  const displayFrom = totalCount === 0 ? 0 : startIndex + 1;
  const displayTo = totalCount === 0 ? 0 : startIndex + displayedUsers.length;

  const handleSuspendToggle = async () => {
    if (!suspendUser) return;
    setIsSubmitting(true);

    const parseDurationDays = (d: string): number => {
      if (d === "Permanent") return 999;
      if (d === "24 Hours") return 1;
      const match = d.match(/(\d+)/);
      return match ? parseInt(match[1]) : 30;
    };

    try {
      if (suspendUser.status === "Active") {
        if (modalMode === "block") {
          await blockUserMutation({ id: suspendUser.id, reason: suspendData.reason }).unwrap();
          toast.success(`${suspendUser.name} has been blocked.`);
        } else {
          await suspendUserMutation({
            id: suspendUser.id,
            reason: suspendData.reason,
            durationDays: parseDurationDays(suspendData.duration),
          }).unwrap();
          toast.success(`${suspendUser.name} has been suspended for ${suspendData.duration}.`);
        }
      } else if (suspendUser.status === "Blocked") {
        await unblockUserMutation(suspendUser.id).unwrap();
        toast.success(`${suspendUser.name} has been unblocked.`);
      } else {
        await unsuspendUserMutation(suspendUser.id).unwrap();
        toast.success(`${suspendUser.name}'s suspension has been lifted.`);
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update user status");
    } finally {
      setIsSubmitting(false);
      setSuspendUser(null);
      setSuspendStep(1);
      setSuspendData({ reason: "", duration: "30 Days" });
    }
  };

  const closeSuspendModal = () => {
    if (!isSubmitting) {
      setSuspendUser(null);
      setSuspendStep(1);
    }
  };

  const handleDownload = async () => {
    toast.info("Downloading user report...");
    try {
      const blob = await triggerDownload(undefined).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download complete");
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  const totalUserCount = userList.length;
  const activeUserCount = userList.filter((u: any) => u.status === "Active").length;
  const suspendedUserCount = userList.filter((u: any) => u.status !== "Active").length;
  const interestUserCount = userList.filter((u: any) => u.transactionType === "Interest").length;
  const impactUserCount = userList.filter((u: any) => u.transactionType === "Impact Wealth").length;
  const mixedUserCount = userList.filter((u: any) => u.transactionType === "Mixed").length;

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1600px] h-auto shrink-0 mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight shrink-0">
            User Management
          </h1>
          <p className="text-slate/50 text-xs font-semibold mt-1">
            Sorted by newest registered &bull; Manage accounts, disciplinary actions and KYC credentials
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search Name, Email or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none transition-all"
            />
          </div>

          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="h-11 px-4 rounded-xl border-border/50 font-bold text-slate hover:bg-surface transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Users"
            className="h-11 px-3 rounded-xl border-border/50 font-bold text-slate hover:bg-surface transition-all gap-1.5 cursor-pointer"
          >
            <RotateCw className={`h-4 w-4 text-[#155D5F] ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

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
                  {["All Status", "Active", "Suspended", "Blocked"].map(status => (
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
                {isLoading || isFetching ? (
                  <div className="h-7 flex items-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold font-outfit text-primary leading-none">
                    {totalUserCount}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-primary/80 mt-2">
                  Total Users
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {totalUserCount} registered accounts
            </div>
          </div>

          {/* Active Users */}
          <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                {isLoading || isFetching ? (
                  <div className="h-7 flex items-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold font-outfit text-primary leading-none">
                    {activeUserCount}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-primary/80 mt-2">
                  Active
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {totalUserCount > 0 ? ((activeUserCount / totalUserCount) * 100).toFixed(0) : 0}% of total registered
            </div>
          </div>

          {/* Suspended / Blocked */}
          <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                {isLoading || isFetching ? (
                  <div className="h-7 flex items-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold font-outfit text-primary leading-none">
                    {suspendedUserCount}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-primary/80 mt-2">
                  Suspended / Blocked
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {suspendedUserCount} accounts restricted
            </div>
          </div>

          {/* Secondary Row (Animated expand) */}
          {isStatsExpanded && (
            <>
              {/* Interest Type */}
              <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    {isLoading || isFetching ? (
                      <div className="h-7 flex items-center">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold font-outfit text-primary leading-none">
                        {interestUserCount}
                      </p>
                    )}
                    <p className="text-[11px] font-semibold text-primary/80 mt-2">
                      Interest Type
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0369A1]" />
                  {totalUserCount > 0 ? ((interestUserCount / totalUserCount) * 100).toFixed(0) : 0}% of platform savers
                </div>
              </div>

              {/* Impact Wealth */}
              <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    {isLoading || isFetching ? (
                      <div className="h-7 flex items-center">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold font-outfit text-primary leading-none">
                        {impactUserCount}
                      </p>
                    )}
                    <p className="text-[11px] font-semibold text-primary/80 mt-2">
                      Impact Wealth
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                  {totalUserCount > 0 ? ((impactUserCount / totalUserCount) * 100).toFixed(0) : 0}% of platform savers
                </div>
              </div>

              {/* Mixed Plan */}
              <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    {isLoading || isFetching ? (
                      <div className="h-7 flex items-center">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold font-outfit text-primary leading-none">
                        {mixedUserCount}
                      </p>
                    )}
                    <p className="text-[11px] font-semibold text-primary/80 mt-2">
                      Mixed Plan
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9333EA]" />
                  {totalUserCount > 0 ? ((mixedUserCount / totalUserCount) * 100).toFixed(0) : 0}% of platform savers
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Table View (Desktop >= 1100px) */}
      <div className="border border-border/50 rounded-2xl shadow-sm bg-white overflow-hidden hidden min-[1100px]:block">
        <table className="w-full table-fixed caption-bottom text-sm border-collapse">
          <thead className="bg-surface/50 border-b border-border/50 sticky top-0 bg-white z-10">
            <tr className="hover:bg-transparent">
              <th className="w-[28%] py-3.5 px-4 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-left">
                User
              </th>
              <th className="w-[11%] py-3.5 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-left">
                Last Login
              </th>
              <th className="w-[9%] py-3.5 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center">
                Status
              </th>
              <th className="w-[9%] py-3.5 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center">
                KYC
              </th>
              <th className="w-[13%] py-3.5 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-center">
                Transaction Type
              </th>
              <th className="w-[14%] py-3.5 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-right">
                Total Savings
              </th>
              <th className="w-[13%] py-3.5 px-3 text-slate/50 font-bold text-[10px] uppercase tracking-widest text-right">
                Total Interest
              </th>
              <th className="w-[3%] py-3.5 pr-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-200" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                        <div className="h-2.5 w-36 bg-slate-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3 text-center"><div className="h-5 w-14 bg-slate-200 rounded mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><div className="h-5 w-14 bg-slate-200 rounded mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><div className="h-5 w-20 bg-slate-200 rounded mx-auto" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-5 w-20 bg-slate-200 rounded ml-auto" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-5 w-20 bg-slate-200 rounded ml-auto" /></td>
                  <td className="py-3 pr-4 text-right"><div className="h-4 w-4 bg-slate-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="text-sm font-bold text-dark">Failed to load users.</p>
                    <p className="text-xs text-slate/60">An error occurred while fetching user accounts.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 text-xs font-bold text-primary">
                      Retry
                    </Button>
                  </div>
                </td>
              </tr>
            ) : displayedUsers.length > 0 ? (
              displayedUsers.map((user: any) => (
                <tr
                  key={user.id}
                  className="group hover:bg-surface/40 transition-colors"
                >
                  {/* User Column (Avatar + Name + Email) */}
                  <td className="py-3 px-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer min-w-0" 
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    >
                      <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-border/10 shrink-0 group-hover:scale-105 transition-transform">
                        <AvatarImage src={user.imageUrl || ""} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs uppercase">
                          {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 truncate">
                        <span 
                          className="font-bold text-[13px] text-dark group-hover:text-primary transition-colors truncate" 
                          title={user.name}
                        >
                          {user.name}
                        </span>
                        <span 
                          className="text-[11px] font-medium text-slate/60 hover:text-primary hover:underline transition-colors truncate" 
                          title={user.email}
                        >
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Last Login */}
                  <td className="py-3 px-3">
                    <span className="text-slate/70 text-[12px] font-medium whitespace-nowrap">
                      {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : user.lastLogin || "Never"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
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
                  </td>

                  {/* KYC */}
                  <td className="py-3 px-3 text-center">
                    <span
                      onClick={() => router.push(`/dashboard/users/${user.id}/credentials`)}
                      className="cursor-pointer inline-block"
                      title="Click to view KYC Credentials"
                    >
                      {user.kycStatus === "VERIFIED" || user.kycStatus === "verified" || user.kycVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          Level {user.kycLevel || 2}
                        </Badge>
                      ) : user.kycStatus === "REJECTED" ? (
                        <Badge className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          Rejected
                        </Badge>
                      ) : user.kycStatus === "PENDING" || (user.kycLevel && user.kycLevel > 1) ? (
                        <Badge className="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          Pending
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          Level 1
                        </Badge>
                      )}
                    </span>
                  </td>

                  {/* Transaction Type */}
                  <td className="py-3 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-block ${
                      user.transactionType === 'Interest' 
                        ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]' 
                        : user.transactionType === 'Impact Wealth' 
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]' 
                        : 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'
                    }`}>
                      {user.transactionType || "Mixed"}
                    </span>
                  </td>

                  {/* Total Savings */}
                  <td className="py-3 px-3 text-right">
                    <span className="text-[12px] font-bold text-dark px-2.5 py-1 bg-surface/50 rounded-lg tabular-nums inline-block whitespace-nowrap">
                      ₦{(Number(user.totalSavings || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Total Interest */}
                  <td className="py-3 px-3 text-right">
                    <span className="text-[12px] font-bold text-emerald-600 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg tabular-nums inline-block whitespace-nowrap">
                      +₦{(Number(user.totalInterest || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Row Actions Menu */}
                  <td className="py-3 pr-4 text-right">
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
                          KYC Credentials
                        </DropdownMenuItem>
                        {user.status === "Active" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("suspend"); }} className="py-2.5 px-4 text-xs font-bold text-orange-500 focus:bg-orange-50 cursor-pointer rounded-xl gap-2">
                              <Ban className="h-3.5 w-3.5" />
                              <span className="truncate">Suspend User</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("block"); }} className="py-2.5 px-4 text-xs font-bold text-red-700 focus:bg-red-100 cursor-pointer rounded-xl gap-2">
                              <Lock className="h-3.5 w-3.5" />
                              Block User
                            </DropdownMenuItem>
                          </>
                        ) : user.status === "Suspended" ? (
                          <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("suspend"); }} className="py-2.5 px-4 text-xs font-bold text-emerald-600 focus:bg-emerald-50 cursor-pointer rounded-xl gap-2">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Unsuspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("block"); }} className="py-2.5 px-4 text-xs font-bold text-emerald-600 focus:bg-emerald-50 cursor-pointer rounded-xl gap-2">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Unblock User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-slate/20" />
                    <p className="text-sm font-semibold text-slate/50">No users match your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Narrow Screen (< 1100px) Responsive Cards View */}
      <div className="block min-[1100px]:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-white border border-border/50 rounded-2xl shadow-sm animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-2.5 w-44 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="p-8 text-center bg-white border border-border/50 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-dark">Failed to load users.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs font-bold text-primary">
              Retry
            </Button>
          </div>
        ) : displayedUsers.length > 0 ? (
          displayedUsers.map((user: any) => (
            <div 
              key={user.id} 
              className="p-4 bg-white border border-border/50 rounded-2xl shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div 
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1" 
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-border/10 shrink-0">
                    <AvatarImage src={user.imageUrl || ""} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs uppercase">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 truncate">
                    <span className="font-bold text-sm text-dark truncate" title={user.name}>{user.name}</span>
                    <span className="text-xs text-slate/60 truncate" title={user.email}>{user.email}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full shrink-0">
                      <MoreVertical className="h-4 w-4 text-slate/40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-[16px] border-border/50 shadow-xl p-1">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}`)} className="py-2 px-3 text-xs font-bold">
                      <Eye className="h-3.5 w-3.5 text-primary mr-2" /> View Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}/credentials`)} className="py-2 px-3 text-xs font-bold">
                      <FileText className="h-3.5 w-3.5 text-blue-500 mr-2" /> KYC Credentials
                    </DropdownMenuItem>
                    {user.status === "Active" ? (
                      <>
                        <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("suspend"); }} className="py-2 px-3 text-xs font-bold text-orange-500">
                          <Ban className="h-3.5 w-3.5 mr-2" /> Suspend User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("block"); }} className="py-2 px-3 text-xs font-bold text-red-700">
                          <Lock className="h-3.5 w-3.5 mr-2" /> Block User
                        </DropdownMenuItem>
                      </>
                    ) : user.status === "Suspended" ? (
                      <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("suspend"); }} className="py-2 px-3 text-xs font-bold text-emerald-600">
                        <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Unsuspend User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => { setSuspendUser(user); setModalMode("block"); }} className="py-2 px-3 text-xs font-bold text-emerald-600">
                        <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Unblock User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-border/30 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate/50 block">Last Login</span>
                  <span className="text-slate/70 font-medium text-xs">
                    {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : user.lastLogin || "Never"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate/50 block">Status</span>
                  <Badge className={`${
                    user.status === "Active" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                      : user.status === "Blocked"
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-red-50 text-red-500 border-red-100/50"
                  } px-2 py-0.5 rounded-lg gap-1 font-bold text-[9px] items-center border shadow-none mt-0.5`}>
                    <div className={`w-1 h-1 rounded-full ${
                      user.status === "Active" ? "bg-emerald-500" : user.status === "Blocked" ? "bg-slate-500" : "bg-red-500"
                    }`} />
                    {user.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate/50 block">KYC</span>
                  <span onClick={() => router.push(`/dashboard/users/${user.id}/credentials`)} className="cursor-pointer">
                    {user.kycStatus === "VERIFIED" || user.kycStatus === "verified" || user.kycVerified ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-bold mt-0.5">
                        Level {user.kycLevel || 2}
                      </Badge>
                    ) : user.kycStatus === "REJECTED" ? (
                      <Badge className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-lg text-[9px] font-bold mt-0.5">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-lg text-[9px] font-bold mt-0.5">
                        Pending
                      </Badge>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate/50 block">Type</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${
                    user.transactionType === 'Interest' 
                      ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]' 
                      : user.transactionType === 'Impact Wealth' 
                      ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]' 
                      : 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'
                  }`}>
                    {user.transactionType || "Mixed"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate/50 block">Total Savings</span>
                  <span className="font-bold text-dark tabular-nums text-xs">
                    ₦{(Number(user.totalSavings || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate/50 block">Total Interest</span>
                  <span className="font-bold text-emerald-600 tabular-nums text-xs">
                    +₦{(Number(user.totalInterest || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white border border-border/50 rounded-2xl">
            <Search className="h-8 w-8 text-slate/20 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate/50">No users match your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold text-slate/50 pt-6 px-1 border-t border-border/30 mt-4">
        <span>
          Showing {displayFrom}-{displayTo} of {totalCount} &bull; Page {validCurrentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (validCurrentPage <= 1) return;
              setCurrentPage(p => Math.max(1, p - 1));
              const main = document.getElementById('main-scroll-container');
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={validCurrentPage <= 1 || isFetching}
            className={`h-8 px-3 text-[11px] font-bold rounded-lg ${
              validCurrentPage <= 1
                ? 'text-slate/40 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-dark border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
            }`}
          >
            Prev
          </Button>

          <span className="px-2 text-xs font-bold text-dark">
            Page {validCurrentPage} of {totalPages}
          </span>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (validCurrentPage >= totalPages) return;
              setCurrentPage(p => Math.min(totalPages, p + 1));
              const main = document.getElementById('main-scroll-container');
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={validCurrentPage >= totalPages || isFetching}
            className={`h-8 px-3 text-[11px] font-bold rounded-lg ${
              validCurrentPage >= totalPages
                ? 'text-slate/40 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-dark border-slate-200 hover:bg-[#E8F3F3] hover:text-[#155D5F]'
            }`}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Multi-step Suspend Modal */}
      {suspendUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeSuspendModal} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-500">
            
            {suspendStep === 1 ? (
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-2xl ${modalMode === 'block' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-500'} flex items-center justify-center`}>
                    {modalMode === 'block' ? <Lock className="h-6 w-6" /> : <Ban className="h-6 w-6" />}
                  </div>
                  <button 
                    onClick={closeSuspendModal}
                    className="h-8 w-8 rounded-full hover:bg-surface flex items-center justify-center text-slate/40 hover:text-dark transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    {modalMode === 'block' ? 'Block' : 'Suspend'} {suspendUser.name}?
                  </h3>
                  <p className="text-xs font-medium text-slate/60 leading-relaxed">
                    {modalMode === 'block' 
                      ? 'Blocking will immediately restrict user access permanently until manually unblocked.'
                      : 'Temporary suspension will prevent the user from executing transactions or managing plans.'}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {modalMode === 'suspend' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark/70">Suspension Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["24 Hours", "7 Days", "30 Days"].map((dur) => (
                          <button
                            key={dur}
                            onClick={() => setSuspendData({ ...suspendData, duration: dur })}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                              suspendData.duration === dur 
                                ? 'bg-primary text-white border-primary shadow-sm' 
                                : 'bg-surface/50 border-border/40 text-slate hover:bg-surface'
                            }`}
                          >
                            {dur}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark/70">Reason for {modalMode === 'block' ? 'Block' : 'Suspension'}</label>
                    <textarea 
                      placeholder="Specify disciplinary reason (visible to user)..."
                      value={suspendData.reason}
                      onChange={(e) => setSuspendData({ ...suspendData, reason: e.target.value })}
                      className="w-full min-h-[90px] p-4 bg-surface/50 border border-border/30 rounded-xl font-medium text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={closeSuspendModal}
                    className="flex-1 h-12 rounded-xl font-bold text-slate border-border/50 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setSuspendStep(2)}
                    disabled={!suspendData.reason.trim()}
                    className={`flex-1 h-12 rounded-xl font-bold text-white text-xs ${
                      modalMode === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-6 text-center">
                <div className={`h-16 w-16 rounded-full ${modalMode === 'block' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-500'} flex items-center justify-center mx-auto ring-8 ${modalMode === 'block' ? 'ring-red-50' : 'ring-orange-50'}`}>
                  <ShieldAlert className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    Confirm Action
                  </h3>
                  <p className="text-xs font-medium text-slate/60 leading-relaxed max-w-[320px] mx-auto">
                    Are you sure you want to enforce this restriction on <span className="font-bold text-dark">{suspendUser.name}</span>?
                  </p>
                </div>

                <div className="p-4 bg-surface rounded-2xl border border-border/40 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate/50 font-medium">Target User:</span>
                    <span className="font-bold text-dark">{suspendUser.email}</span>
                  </div>
                  {modalMode === 'suspend' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate/50 font-medium">Duration:</span>
                      <span className="font-bold text-primary">{suspendData.duration}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-slate/50 font-medium">Reason:</span>
                    <span className="font-bold text-dark truncate max-w-[200px]">{suspendData.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSuspendStep(1)}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl font-bold text-slate border-border/50 text-xs"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSuspendToggle}
                    disabled={isSubmitting}
                    className={`flex-1 h-12 rounded-xl font-bold text-white text-xs ${
                      modalMode === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      `Confirm ${modalMode === 'block' ? 'Block' : 'Suspend'}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
