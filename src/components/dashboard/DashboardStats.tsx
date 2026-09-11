"use client";

import { useState } from "react";
import { useGetDashboardStatsQuery } from "@/lib/redux/features/dashboardApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, ClipboardList, Users, UserPlus, Briefcase, CreditCard, Wallet, Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStatsProps {
  timeFilter: string;
  setTimeFilter: (filter: string) => void;
}

const mapFilterToPeriod = (filter: string) => {
  switch (filter) {
    case "Today": return "today";
    case "Last Week": return "last_week";
    case "Last Month": return "month";
    case "6 Months": return "last_6_months";
    case "A Year": return "year";
    case "All Time": return "all_time";
    default: return "today";
  }
};

const filters = ["Today", "Last Week", "Last Month", "6 Months", "A Year", "All Time"];

export function DashboardStats({ timeFilter, setTimeFilter }: DashboardStatsProps) {
  const { data: rawData, isLoading, isError } = useGetDashboardStatsQuery(mapFilterToPeriod(timeFilter));
  const data = rawData?.data; // Extract nested data
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to format currency/value
  const formatValue = (apiField: any, fallback: string, forceCurrency?: boolean) => {
    if (isLoading) return "—";
    if (isError) return "Error";
    if (!apiField) return fallback;
    const raw = apiField.value?.value || apiField.value || 0;
    
    // Convert NGN to ₦, or use ₦ if forceCurrency is true
    const currencyStr = apiField.currency === "NGN" ? "₦" : (apiField.currency || (forceCurrency ? "₦" : ""));
    
    // Monetary values from the API are returned in kobo (smallest NGN unit).
    // Divide by 100 to convert to naira before displaying.
    const val = currencyStr ? Number(raw) / 100 : Number(raw);
    
    return currencyStr 
      ? `${currencyStr}${val.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
      : val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatSubtext = (apiField: any, fallback: string) => {
    if (isLoading) return "Loading...";
    if (isError) return "Failed to load";
    if (!apiField) return fallback;
    return apiField.subtext || apiField.todayValue || fallback;
  };

  const stats = [
    {
      title: "Total registered users",
      value: formatValue(data?.totalRegisteredUsers, "0"),
      subtext: formatSubtext(data?.totalRegisteredUsers, "all time"),
      trend: data?.totalRegisteredUsers?.trend,
      icon: ClipboardList,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#155D5F]"
    },
    {
      title: "Active users",
      value: formatValue(data?.activeUsers, "0"),
      subtext: formatSubtext(data?.activeUsers, "all time"),
      trend: data?.activeUsers?.trend,
      icon: Users,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#65D36A]"
    },
    {
      title: "New sign-ups today",
      value: formatValue(data?.newSignupsToday, "0"),
      subtext: formatSubtext(data?.newSignupsToday, "all time"),
      trend: data?.newSignupsToday?.trend,
      icon: UserPlus,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#65D36A]"
    },
    {
      title: "Total savings deposit",
      value: formatValue(data?.activeInvestmentVolume, "₦0.00"), // Mapped to active investment volume
      subtext: formatSubtext(data?.activeInvestmentVolume, "all time"),
      trend: data?.activeInvestmentVolume?.trend,
      icon: Briefcase,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
    {
      title: "Total Withdrawal",
      value: formatValue(data?.totalWithdrawal, "₦0.00"),
      subtext: formatSubtext(data?.totalWithdrawal, "all time"),
      trend: data?.totalWithdrawal?.trend,
      icon: CreditCard,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
    {
      title: "Total transaction volume",
      value: formatValue(data?.totalTransactionVolume, "₦0", true), // Mapped to total transaction volume
      subtext: formatSubtext(data?.totalTransactionVolume, "all time"),
      trend: data?.totalTransactionVolume?.trend,
      icon: Wallet,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
  ];
  
  const visibleStats = isExpanded ? stats : stats.slice(0, 3);

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center pr-12">
        <h2 className="text-lg font-bold font-outfit text-dark">Users Stats</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-dark">Filter</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
              <span className="text-sm text-slate">{timeFilter}</span>
              <ChevronDown className="h-4 w-4 text-slate" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white rounded-xl shadow-lg border-border/50">
              {filters.map((f) => (
                <DropdownMenuItem
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className="cursor-pointer font-medium text-sm hover:bg-surface"
                >
                  {f}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-[44px] -right-5 w-[36px] h-[36px] rounded-[11px] bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-slate hover:bg-surface transition-colors z-10"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-[124px] rounded-[20px] bg-[#F2FFFF] border border-[#155D5F1F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.07)] p-5 flex flex-col justify-between gap-[10px] animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-7 w-28 bg-[#155D5F]/15 rounded-lg" />
                    <div className="h-4 w-20 bg-[#155D5F]/10 rounded-md" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#155D5F]/15 shrink-0" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-[1px] bg-[#155D5F]/15 w-full"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#155D5F]/25 shrink-0"></div>
                    <div className="h-3.5 w-24 bg-[#155D5F]/15 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            visibleStats.map((stat, i) => (
              <div
                key={i}
                className="w-full h-[124px] rounded-[20px] bg-[#F2FFFF] border border-[#155D5F1F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.07)] p-5 flex flex-col justify-between gap-[10px]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[28px] font-semibold text-[#155D5F] leading-none mb-1">
                      {stat.value}
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
                  <div className="flex items-center gap-2">
                    {stat.trend && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                          stat.trend.startsWith("-")
                            ? "text-red-700 bg-red-100/80 border border-red-200"
                            : "text-emerald-700 bg-emerald-100/80 border border-emerald-200"
                        }`}
                      >
                        {stat.trend.startsWith("-") ? (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        )}
                        {stat.trend}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate/70 truncate">
                      {stat.subtext}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
