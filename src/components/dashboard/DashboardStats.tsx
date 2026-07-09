"use client";

import { useState } from "react";
import { useGetDashboardStatsQuery } from "@/lib/redux/features/dashboardApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, ClipboardList, Users, UserPlus, Briefcase, CreditCard, Wallet } from "lucide-react";

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
    const val = apiField.value?.value || apiField.value || 0;
    
    // Convert NGN to ₦, or use ₦ if forceCurrency is true
    const currencyStr = apiField.currency === "NGN" ? "₦" : (apiField.currency || (forceCurrency ? "₦" : ""));
    
    return currencyStr 
      ? `${currencyStr}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 })}`
      : Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatSubtext = (apiField: any, fallback: string) => {
    if (isLoading) return "Loading...";
    if (isError) return "Failed to load";
    if (!apiField) return fallback;
    return apiField.subtext || apiField.todayValue || apiField.trend || fallback;
  };

  const stats = [
    {
      title: "Total registered users",
      value: formatValue(data?.totalRegisteredUsers, "0"),
      subtext: formatSubtext(data?.totalRegisteredUsers, "Pending API"),
      icon: ClipboardList,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#155D5F]"
    },
    {
      title: "Active users",
      value: formatValue(data?.activeUsers, "Pending API"),
      subtext: formatSubtext(data?.activeUsers, "Pending API"),
      icon: Users,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#65D36A]"
    },
    {
      title: "New sign-ups today",
      value: formatValue(data?.newSignupsToday, "Pending API"),
      subtext: formatSubtext(data?.newSignupsToday, "Pending API"),
      icon: UserPlus,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#65D36A]"
    },
    {
      title: "Total savings deposit",
      value: formatValue(data?.activeInvestmentVolume, "₦0.00"), // Mapped to active investment volume
      subtext: formatSubtext(data?.activeInvestmentVolume, "Pending API"),
      icon: Briefcase,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
    {
      title: "Total Withdrawal",
      value: formatValue(data?.totalWithdrawal, "Pending API"),
      subtext: formatSubtext(data?.totalWithdrawal, "Pending API"),
      icon: CreditCard,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
    {
      title: "Overall revenue across all wallets and savers",
      value: formatValue(data?.totalTransactionVolume, "₦0", true), // Mapped to total transaction volume
      subtext: formatSubtext(data?.totalTransactionVolume, "Pending API"),
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

        <div className="flex flex-wrap gap-[10px] justify-between">
          {visibleStats.map((stat, i) => (
            <div
              key={i}
              className="w-[350px] h-[124px] rounded-[20px] bg-[#F2FFFF] border border-[#155D5F1F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.07)] p-5 flex flex-col justify-between gap-[10px]"
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
                <div
                  className={`p-2 rounded-full ${stat.color} shrink-0`}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="h-[1px] bg-[#155D5F]/20 w-full"></div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${stat.subtextStyle || 'text-slate'}`}>
                  {stat.dotColor && (
                    <div className={`w-1.5 h-1.5 rounded-full ${stat.dotColor}`}></div>
                  )}
                  <span className="leading-none">{stat.subtext}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
