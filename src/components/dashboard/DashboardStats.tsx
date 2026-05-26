"use client";

import { useState } from "react";
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

const filters = ["Today", "Last Week", "Last Month", "6 Months", "A Year", "All Time"];

// Mock generator based on filter
const getStats = (filter: string) => {
  const multiplier = filter === "Today" ? 1 : filter === "Last Week" ? 7 : filter === "Last Month" ? 30 : filter === "6 Months" ? 180 : filter === "A Year" ? 365 : 1000;
  
  return [
    {
      title: "Total registered users",
      value: (7363 * (multiplier > 30 ? multiplier / 30 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      subtext: "2 new accounts recently created",
      icon: ClipboardList,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#155D5F]"
    },
    {
      title: "Active users",
      value: (7233 * (multiplier > 30 ? multiplier / 30 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      subtext: "3723 online users",
      icon: Users,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#65D36A]"
    },
    {
      title: "New sign-ups today",
      value: (223 * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      subtext: "54 Recently",
      icon: UserPlus,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      dotColor: "bg-[#65D36A]"
    },
    {
      title: "Total savings deposit",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: "Today's deposit is ₦30,381.93 ↑",
      icon: Briefcase,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
    {
      title: "Total Withdrawal",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: "Today's withdraw is ₦30,381.93 ↑",
      icon: CreditCard,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
    {
      title: "Overall revenue across all wallets and savers",
      value: `₦${(34200735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: "Today's revenue is ₦30,381.93 ↑",
      icon: Wallet,
      color: "bg-[#E6F9F9] text-[#155D5F]",
      subtextStyle: "text-[#65D36A]"
    },
  ];
};

export function DashboardStats({ timeFilter, setTimeFilter }: DashboardStatsProps) {
  const stats = getStats(timeFilter);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
