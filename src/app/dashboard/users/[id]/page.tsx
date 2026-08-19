"use client";

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MoreVertical,
  FileText,
  Wallet,
  Target,
  Zap,
  Users,
  RefreshCcw,
  UsersRound,
  ShieldAlert,
  X,
  Calendar,
  AlertCircle,
  Loader2,
  Ban,
  Lock,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  useGetUserDetailsQuery,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation
} from "@/lib/redux/features/usersApi";
import {
  useResetUserPasswordMutation,
  useResetUserMfaMutation
} from "@/lib/redux/features/adminApi";

const normalizePlan = (str: string) => (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

const formatCurrencyNaira = (val: any) => {
  if (val === null || val === undefined || isNaN(Number(val))) return "₦0.00";
  const num = Number(val);
  const naira = num >= 100 ? num / 100 : num;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const BASE_PORTFOLIO_PLANS = [
  {
    name: "WealthFlex",
    key: "wealthflex",
    backendType: "WEALTH_FLEX",
    icon: Wallet,
    color: "text-red-500",
    bgColor: "bg-red-50",
    defaultSub: "Active WealthFlex",
  },
  {
    name: "WealthGoal",
    key: "wealthgoal",
    backendType: "WEALTH_GOAL",
    icon: Target,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    defaultSub: "Active WealthGoals",
  },
  {
    name: "WealthFix",
    key: "wealthfix",
    backendType: "WEALTH_FIX",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    defaultSub: "Active WealthFix",
  },
  {
    name: "WealthFam",
    key: "wealthfam",
    backendType: "WEALTH_FAM",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    defaultSub: "Active WealthFam",
  },
  {
    name: "WealthFlow",
    key: "wealthflow",
    backendType: "WEALTH_FLOW",
    icon: RefreshCcw,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    defaultSub: "Active WealthFlow",
  },
  {
    name: "WealthGroup",
    key: "wealthgroup",
    backendType: "WEALTH_GROUP",
    icon: UsersRound,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    defaultSub: "Active WealthGroup",
  },
];

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  const resolvedParams = use(params);
  const resolvedId = resolvedParams.id;

  const { data: userDataResponse, isLoading, isError, refetch } = useGetUserDetailsQuery(resolvedId);
  // Safely extract the user object whether it's wrapped in { data: ... } or { data: { data: ... } }
  const user = userDataResponse?.data?.data || userDataResponse?.data || userDataResponse;

  const portfolioItems = useMemo(() => {
    const portfoliosArray: any[] = Array.isArray(user?.portfolios)
      ? user.portfolios
      : Array.isArray(user?.portfolioStats)
      ? user.portfolioStats
      : [];

    const portfoliosObj: Record<string, any> =
      typeof user?.portfolios === "object" && !Array.isArray(user?.portfolios)
        ? user.portfolios
        : {};

    return BASE_PORTFOLIO_PLANS.map((plan) => {
      // 1. Look in array by type or name
      const foundInArray = portfoliosArray.find((p: any) => {
        const typeStr = normalizePlan(p.type || p.category || p.name || p.planType || "");
        return typeStr === plan.key || typeStr === normalizePlan(plan.backendType);
      });

      // 2. Look in object or directly on user object
      const foundInObj =
        portfoliosObj[plan.key] ||
        portfoliosObj[plan.backendType] ||
        user?.[plan.key] ||
        user?.[plan.backendType];

      const match = foundInArray || foundInObj || {};

      const balance = match.balance ?? match.amount ?? match.totalSavings ?? match.totalBalance ?? 0;
      const interest = match.interest ?? match.interestAmount ?? match.totalInterest ?? match.accruedInterest ?? 0;
      const activeCount = match.activeCount ?? match.active ?? match.count ?? 0;
      const completedCount = match.completedCount ?? match.completed ?? 0;

      const numBalance = Number(balance) || 0;
      const displayBalance = numBalance >= 100 ? numBalance / 100 : numBalance;

      const numInterest = Number(interest) || 0;
      const displayInterest = numInterest >= 100 ? numInterest / 100 : numInterest;

      return {
        name: plan.name,
        amount: `₦${displayBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        interest: `${displayInterest.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: plan.icon,
        color: plan.color,
        bgColor: plan.bgColor,
        sub: `${activeCount} ${plan.defaultSub}`,
        completed: `${completedCount} Completed`,
      };
    });
  }, [user]);

  const [suspendUserMutation] = useSuspendUserMutation();
  const [unsuspendUserMutation] = useUnsuspendUserMutation();
  const [blockUserMutation] = useBlockUserMutation();
  const [unblockUserMutation] = useUnblockUserMutation();
  const [deleteUserMutation] = useDeleteUserMutation();
  const [resetPasswordMutation] = useResetUserPasswordMutation();
  const [resetMfaMutation] = useResetUserMfaMutation();

  const [suspendStep, setSuspendStep] = useState(1);
  const [suspendUser, setSuspendUser] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<"suspend" | "block" | "delete">("suspend");
  const [suspendData, setSuspendData] = useState({
    reason: "",
    duration: "30 Days",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userStatus = user?.blockedAt || user?.disciplineStatus === "BLOCKED" ? "Blocked" : (user?.suspendedUntil || user?.disciplineStatus === "SUSPENDED" ? "Suspended" : "Active");

  const handleSuspendToggle = async () => {
    setIsSubmitting(true);
    try {
      if (modalMode === "delete") {
        await deleteUserMutation(resolvedId).unwrap();
        toast.success("User successfully deleted!");
        router.push("/dashboard/users");
        return;
      }

      if (userStatus === "Active") {
        if (modalMode === "block") {
          await blockUserMutation({ id: resolvedId, reason: suspendData.reason }).unwrap();
          toast.success("User successfully blocked!");
        } else {
          await suspendUserMutation({ 
            id: resolvedId, 
            reason: suspendData.reason,
            durationDays: parseInt(suspendData.duration) || 30
          }).unwrap();
          toast.success("User successfully suspended!");
        }
      } else {
        if (userStatus === "Blocked") {
          await unblockUserMutation(resolvedId).unwrap();
        } else {
          await unsuspendUserMutation(resolvedId).unwrap();
        }
        toast.success("User successfully reactivated!");
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

  const handleResetPassword = async () => {
    try {
      await resetPasswordMutation(resolvedId).unwrap();
      toast.success("User password has been reset.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset password");
    }
  };

  const handleResetMfa = async () => {
    try {
      await resetMfaMutation(resolvedId).unwrap();
      toast.success("User MFA settings have been reset.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset MFA");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-slate/50">Loading user profile...</p>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg font-bold text-dark">Failed to load user</p>
        <p className="text-sm text-slate/60 text-center max-w-md">The user could not be found or an internal server error occurred (500). Please check with the backend team or try again later.</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-10">
      {/* Back Navigation & User Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between w-full max-w-[1090px] h-[137px] bg-[#F8EEFE33] border-[0.5px] border-[#C5C5C5] rounded-[20px] pl-[20px] pr-[30px] gap-[10px] mx-auto transition-all">
          <div className="flex items-center gap-[10px]">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
              <AvatarImage src={user?.imageUrl || ""} />
              <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold uppercase">
                {user?.firstName?.[0] || user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
                {isLoading ? "Loading..." : (`${user?.firstName || ""} ${user?.lastName || ""} ${user?.name || ""}`.trim() || user?.email || user?.phone || "Unknown User")}
              </h1>
              <p className="text-slate text-sm font-medium opacity-70">
                {resolvedId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(() => {
              // isVerified only reflects email verification.
              // Use kycStatus / kycVerified for actual document/KYC verification.
              // NOTE: kycLevel is NOT used here — it defaults to 1 for all users
              // and would cause false positives. Only trust explicit status flags.
              const isKycVerified =
                user?.kycStatus === "VERIFIED" ||
                user?.kycStatus === "verified" ||
                user?.kycVerified === true;

              return (
                <Badge
                  className={`border-none px-4 py-4 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-wider shadow-sm ${
                    isKycVerified
                      ? "bg-[#E7F0FF] text-blue-500 hover:bg-[#E7F0FF]"
                      : "bg-amber-50 text-amber-500 hover:bg-amber-50"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.1663 10L17.133 7.675L17.4163 4.6L14.408 3.91667L12.833 1.25L9.99968 2.46667L7.16634 1.25L5.59134 3.90833L2.58301 4.58333L2.86634 7.66667L0.833008 10L2.86634 12.325L2.58301 15.4083L5.59134 16.0917L7.16634 18.75L9.99968 17.525L12.833 18.7417L14.408 16.0833L17.4163 15.4L17.133 12.325L19.1663 10ZM8.40801 13.9333L5.24134 10.7583L6.47468 9.525L8.40801 11.4667L13.283 6.575L14.5163 7.80833L8.40801 13.9333Z"
                      fill={isKycVerified ? "#1D84D9" : "#F59E0B"}
                    />
                  </svg>
                  {isKycVerified ? "KYC Verified" : "Unverified"}
                </Badge>
              );
            })()}
            <button 
              onClick={() => router.push(`/dashboard/users/${resolvedId}/credentials`)}
              className="p-2.5 hover:bg-white rounded-xl transition-all border border-[#C5C5C5] shadow-sm bg-white/50 active:scale-95"
              title="User Credentials"
            >
              <FileText className="h-5 w-5 text-slate" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2.5 hover:bg-white rounded-xl transition-all border border-[#C5C5C5] shadow-sm bg-white/50 active:scale-95">
                  <MoreVertical className="h-5 w-5 text-slate" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-[16px] border-border/50 shadow-xl p-1 animate-in slide-in-from-top-1 duration-200 bg-white">
                {userStatus === "Active" ? (
                  <>
                    <DropdownMenuItem 
                      onClick={() => { setSuspendUser({ id: resolvedId, name: "Simon Smith", status: userStatus }); setModalMode("suspend"); }} 
                      className="py-2.5 px-4 text-xs font-bold text-red-500 focus:bg-red-50 cursor-pointer rounded-xl gap-2"
                    >
                       <Ban className="h-3.5 w-3.5" />
                       Suspend User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => { setSuspendUser({ id: resolvedId, name: "Simon Smith", status: userStatus }); setModalMode("block"); }} 
                      className="py-2.5 px-4 text-xs font-bold text-red-700 focus:bg-red-100 cursor-pointer rounded-xl gap-2"
                    >
                       <Lock className="h-3.5 w-3.5" />
                       Block User
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => { setSuspendUser({ id: resolvedId, name: "Simon Smith", status: userStatus }); setModalMode(userStatus === "Blocked" ? "block" : "suspend"); }} 
                    className="py-2.5 px-4 text-xs font-bold text-emerald-600 focus:bg-emerald-50 cursor-pointer rounded-xl gap-2"
                  >
                     <ShieldAlert className="h-3.5 w-3.5" />
                     Activate User
                  </DropdownMenuItem>
                )}
                <div className="h-px bg-border/20 my-1 mx-1" />
                <DropdownMenuItem 
                  onClick={handleResetPassword}
                  className="py-2.5 px-4 text-xs font-bold text-dark focus:bg-surface cursor-pointer rounded-xl gap-2"
                >
                   <Lock className="h-3.5 w-3.5" />
                   Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleResetMfa}
                  className="py-2.5 px-4 text-xs font-bold text-dark focus:bg-surface cursor-pointer rounded-xl gap-2"
                >
                   <ShieldAlert className="h-3.5 w-3.5" />
                   Reset MFA
                </DropdownMenuItem>
                <div className="h-px bg-border/20 my-1 mx-1" />
                <DropdownMenuItem 
                  onClick={() => { setSuspendUser({ id: resolvedId, name: user?.name, status: userStatus }); setModalMode("delete"); setSuspendData(prev => ({...prev, reason: "Administrative deletion"})); setSuspendStep(2); }} 
                  className="py-2.5 px-4 text-xs font-bold text-red-600 focus:bg-red-50 cursor-pointer rounded-xl gap-2"
                >
                   <Trash2 className="h-3.5 w-3.5" />
                   Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/dashboard/users")}
        className="flex items-center gap-2 text-slate/60 hover:text-primary transition-all font-medium text-sm group"
      >
        <div className="p-1.5 rounded-lg group-hover:bg-primary/5 transition-all">
          <ChevronLeft className="h-5 w-5" />
        </div>
        Back
      </button>

      {/* Portfolio Overview */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold font-outfit text-dark">
          Portfolio Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {portfolioItems.map((item, i) => (
            <Card
              key={i}
              className="rounded-2xl border-border shadow-none overflow-hidden h-full"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-[11px] text-dark">
                    {item.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-dark">
                    {item.amount}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 mt-1">
                    +{item.interest} Interest
                  </div>
                  {item.sub && (
                    <div className="text-[10px] text-slate/60 mt-2">
                      {item.sub}
                    </div>
                  )}
                  {item.completed && (
                    <div className="text-[10px] text-green-500 font-medium">
                      {item.completed}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Profile Information */}
      <h2 className="text-lg font-bold font-outfit text-dark mt-6">
        Profile information
      </h2>
      <div className="border-t border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-border">
          {/* Basic Info */}
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold font-outfit text-dark">Basic</h3>
            <div className="space-y-6">
              <InfoItem label="First name:" value={user?.firstName || user?.name?.split(' ')[0] || "N/A"} />
              <InfoItem label="Last name:" value={user?.lastName || user?.name?.split(' ')[1] || "N/A"} />
              <InfoItem
                label="Email address:"
                value={user?.email || "N/A"}
                isLink
              />
              <InfoItem label="Profile ID:" value={resolvedId} />
              <InfoItem label="Phone number:" value={user?.phone || "N/A"} />
            </div>
          </div>

          {/* Activities */}
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold font-outfit text-dark">
              Activities
            </h3>
            <div className="space-y-6">
              <InfoItem label="Status" value={userStatus} isStatus />
              <InfoItem label="Date Created" value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"} />
              <InfoItem label="Last Login" value={user?.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : "N/A"} />
              <InfoItem label="Email Verification" value={user?.isVerified ? "Verified" : "Unverified"} />
              <InfoItem label="Biometric" value={user?.biometricsEnabled ? "Enabled" : "Disabled"} />
              <InfoItem label="KYC Level" value={`Level ${user?.kycLevel || "N/A"}`} />
            </div>
          </div>

          {/* Transactions */}
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold font-outfit text-dark">
              Transaction
            </h3>
            <div className="space-y-6">
              <InfoItem label="Wallet Balance" value={formatCurrencyNaira(user?.walletBalance ?? 0)} />
              <InfoItem label="Total Savings" value={formatCurrencyNaira(user?.totalSavings ?? 0)} />
              <InfoItem label="Total Interest" value={formatCurrencyNaira(user?.totalInterest ?? 0)} />
              <InfoItem label="Pending Transactions" value={`${user?.pendingTransactionsCount ?? user?.pendingTransactions ?? 0} Transactions`} />
              <InfoItem label="Failed Transactions" value={`${user?.failedTransactionsCount ?? user?.failedTransactions ?? 0} Transactions`} />
            </div>
          </div>
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
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${userStatus === 'Active' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      <ShieldAlert className={`h-5 w-5 ${userStatus === 'Active' ? 'text-red-500' : 'text-emerald-600'}`} />
                   </div>
                   <button onClick={closeSuspendModal} className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-colors">
                      <X className="h-4.5 w-4.5 text-slate/60" />
                   </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    {userStatus === 'Active' 
                      ? (modalMode === "block" ? 'Block User' : 'Suspend User') 
                      : 'Reactivate User'}
                  </h3>
                  <p className="text-sm font-medium text-slate/50 leading-relaxed">
                    Account management for <span className="text-dark font-bold">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User"}</span>.
                  </p>
                </div>

                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[12px] font-bold text-dark/80 ml-1">Reason for {userStatus === 'Active' ? (modalMode === 'block' ? 'Blocking' : 'Suspension') : 'Activation'}</label>
                      <textarea 
                        className="w-full min-h-[90px] p-4 bg-surface/50 border border-border/30 rounded-xl font-medium text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner"
                        placeholder="Type the reason here..."
                        value={suspendData.reason}
                        onChange={(e) => setSuspendData({...suspendData, reason: e.target.value})}
                      />
                   </div>

                   {userStatus === 'Active' && modalMode === "suspend" && (
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
                  className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${userStatus === 'Active' ? (modalMode === 'block' ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-red-900/10' : 'bg-[#D93F3F] hover:bg-[#C23535] text-white shadow-red-900/10') : 'bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-primary/10'}`}
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
                          <AvatarImage src={user?.imageUrl || ""} />
                          <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs uppercase">
                            {user?.firstName?.[0] || user?.name?.[0] || "U"}
                          </AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">User</p>
                          <p className="text-sm font-bold text-dark leading-none mt-1">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User"}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">Action</p>
                          <p className={`text-xs font-bold ${modalMode === 'delete' ? 'text-red-700' : (userStatus === 'Active' ? 'text-red-500' : 'text-emerald-600')}`}>
                             {modalMode === 'delete' ? 'Delete (Permanent)' : (userStatus === 'Active' 
                               ? (modalMode === "block" ? "Block (Permanent)" : `Suspend (${suspendData.duration})`) 
                               : 'Reactivate')}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">Reason</p>
                          <p className="text-xs font-medium text-dark leading-relaxed line-clamp-3">"{suspendData.reason || "User deletion requested"}"</p>
                       </div>
                    </div>
                 </div>

                 <Button 
                    onClick={handleSuspendToggle}
                    disabled={isSubmitting}
                    className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                      modalMode === 'delete' ? 'bg-[#7F1D1D] hover:bg-[#450a0a] text-white' : 
                      userStatus === 'Active' ? (modalMode === 'block' ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-red-900/10' : 'bg-[#D93F3F] hover:bg-[#C23535] text-white shadow-red-900/10') : 'bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-primary/10'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-white/80" />
                    ) : (
                     `Confirm ${
                       modalMode === 'delete' ? 'Deletion' :
                       userStatus === 'Active' ? (modalMode === 'block' ? 'Blocking' : 'Suspension') : 'Activation'
                     }`
                    )}
                  </Button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border rounded-lg ${className}`}>{children}</div>
  );
}

function InfoItem({
  label,
  value,
  isLink,
  isStatus,
}: {
  label: string;
  value: string;
  isLink?: boolean;
  isStatus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate/60 font-medium">{label}</span>
      {isStatus ? (
        <span className={`font-bold uppercase tracking-wider ${
          value === "Active" 
            ? "text-emerald-500" 
            : value === "Blocked"
            ? "text-slate-500"
            : "text-red-500"
        }`}>
          {value}
        </span>
      ) : isLink ? (
        <a
          href={`mailto:${value}`}
          className="text-primary hover:underline font-bold"
        >
          {value}
        </a>
      ) : (
        <span className="text-dark font-bold text-right">{value}</span>
      )}
    </div>
  );
}
