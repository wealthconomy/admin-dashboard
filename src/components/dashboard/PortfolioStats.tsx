"use client";

import Link from "next/link";
import { useGetPortfolioStatsQuery } from "@/lib/redux/features/dashboardApi";
import { Wallet, Target, Crosshair, Users, Activity, Briefcase } from "lucide-react";

interface PortfolioStatsProps {
  timeFilter: string;
}

export function PortfolioStats({ timeFilter }: PortfolioStatsProps) {
  const { data, isLoading } = useGetPortfolioStatsQuery();

  const getPortfolios = () => {
    const baseCards = [
      { name: "WealthFlex", icon: Wallet, color: "text-red-500 bg-red-100" },
      { name: "WealthGoal", icon: Target, color: "text-pink-500 bg-pink-100" },
      { name: "WealthFix", icon: Crosshair, color: "text-orange-500 bg-orange-100" },
      { name: "WealthFam", icon: Users, color: "text-purple-500 bg-purple-100" },
      { name: "WealthFlow", icon: Activity, color: "text-blue-500 bg-blue-100" },
      { name: "WealthGroup", icon: Briefcase, color: "text-gray-500 bg-gray-100" },
    ];

    return baseCards.map((card) => {
      // Safely handle if backend wraps response in { success: true, data: [...] }
      const dataArray = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      
      const normalize = (str: string) => str.replace(/_/g, "").toLowerCase();
      const apiData = dataArray.find(
        (d: any) => normalize(d.category || "") === normalize(card.name)
      );

      return {
        ...card,
        value: isLoading ? "—" : apiData?.amount ? `₦${Number(apiData.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}` : "₦0",
        active: isLoading ? "—" : (apiData?.active ?? 0).toLocaleString(),
        completed: isLoading ? "—" : (apiData?.completed ?? 0).toLocaleString(),
      };
    });
  };

  const portfolios = getPortfolios();

  return (
    <div className="w-full max-w-[1106px] min-h-[132px] py-[10px] space-y-6">
      <div className="h-[1px] bg-[#155D5F]/10 w-full mb-4 mt-2"></div>
      <h2 className="text-lg font-bold font-outfit text-dark">Portfolio Stats</h2>

      <div className="flex flex-wrap items-center justify-between gap-[20px]">
        {portfolios.map((portfolio, i) => (
          <Link
            key={i}
            href={`/dashboard/portfolio/${portfolio.name.toLowerCase()}`}
            className="flex items-start gap-3 rounded-xl p-2 -m-2 hover:bg-surface/70 hover:shadow-sm transition-all duration-200 group cursor-pointer"
          >
            <div className={`p-2.5 rounded-full ${portfolio.color} shrink-0 group-hover:scale-105 transition-transform`}>
              <portfolio.icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[13px] font-bold text-dark group-hover:text-primary transition-colors">{portfolio.name}</h3>
              <div className="text-[14px] font-bold text-dark">{portfolio.value}</div>
              <div className="text-[10px] flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate">Active: <span className="text-slate">{portfolio.active}</span></span>
                <span className="text-[#65D36A]">↑</span>
              </div>
              <div className="text-[10px] whitespace-nowrap">
                <span className="text-[#65D36A]">Completed: {portfolio.completed}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
