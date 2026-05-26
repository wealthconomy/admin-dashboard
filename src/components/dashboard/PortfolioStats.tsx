"use client";

import { Wallet, Target, Crosshair, Users, Activity, Briefcase } from "lucide-react";

interface PortfolioStatsProps {
  timeFilter: string;
}

const getPortfolios = (filter: string) => {
  const multiplier = filter === "Today" ? 1 : filter === "Last Week" ? 1.5 : filter === "Last Month" ? 2 : filter === "6 Months" ? 4 : filter === "A Year" ? 6 : 8;
  
  return [
    {
      name: "WealthFlex",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      active: Math.floor(8247 * multiplier),
      completed: Math.floor(4732 * multiplier),
      icon: Wallet,
      color: "text-red-500 bg-red-100",
    },
    {
      name: "WealthGoal",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      active: Math.floor(8247 * multiplier),
      completed: Math.floor(4732 * multiplier),
      icon: Target,
      color: "text-pink-500 bg-pink-100",
    },
    {
      name: "WealthFix",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      active: Math.floor(8247 * multiplier),
      completed: Math.floor(4732 * multiplier),
      icon: Crosshair,
      color: "text-orange-500 bg-orange-100",
    },
    {
      name: "WealthFam",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      active: Math.floor(8247 * multiplier),
      completed: Math.floor(4732 * multiplier),
      icon: Users,
      color: "text-purple-500 bg-purple-100",
    },
    {
      name: "WealthFlow",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      active: Math.floor(8247 * multiplier),
      completed: Math.floor(4732 * multiplier),
      icon: Activity,
      color: "text-blue-500 bg-blue-100",
    },
    {
      name: "WealthGroup",
      value: `₦${(300735.42 * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      active: Math.floor(8247 * multiplier),
      completed: Math.floor(4732 * multiplier),
      icon: Briefcase,
      color: "text-gray-500 bg-gray-100",
    },
  ];
};

export function PortfolioStats({ timeFilter }: PortfolioStatsProps) {
  const portfolios = getPortfolios(timeFilter);

  return (
    <div className="w-full max-w-[1106px] min-h-[132px] py-[10px] space-y-6">
      <div className="h-[1px] bg-[#155D5F]/10 w-full mb-4 mt-2"></div>
      <h2 className="text-lg font-bold font-outfit text-dark">Portfolio Stats</h2>

      <div className="flex flex-wrap items-center justify-between gap-[20px]">
        {portfolios.map((portfolio, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`p-2.5 rounded-full ${portfolio.color} shrink-0`}>
              <portfolio.icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[13px] font-bold text-dark">{portfolio.name}</h3>
              <div className="text-[14px] font-bold text-dark">{portfolio.value}</div>
              <div className="text-[10px] flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate">Active: <span className="text-slate">{portfolio.active.toLocaleString()}</span></span>
                <span className="text-[#65D36A]">↑</span>
              </div>
              <div className="text-[10px] whitespace-nowrap">
                <span className="text-[#65D36A]">Completed: {portfolio.completed.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
