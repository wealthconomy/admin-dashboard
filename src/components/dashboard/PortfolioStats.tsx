import Link from "next/link";
import { useGetPortfolioStatsQuery } from "@/lib/redux/features/dashboardApi";
import { useGetTribesQuery } from "@/lib/redux/features/portfolioApi";
import { Wallet, Target, Crosshair, Users, Activity, Briefcase, Loader2 } from "lucide-react";

interface PortfolioStatsProps {
  timeFilter: string;
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

export function PortfolioStats({ timeFilter }: PortfolioStatsProps) {
  const period = mapFilterToPeriod(timeFilter);
  const { data, isLoading: isLoadingStats } = useGetPortfolioStatsQuery(period);
  const { data: tribesRes, isLoading: isLoadingTribes } = useGetTribesQuery({ period });

  const isLoading = isLoadingStats || isLoadingTribes;

  const getPortfolios = () => {
    const baseCards = [
      { name: "WealthFlex", icon: Wallet, color: "text-red-500 bg-red-100" },
      { name: "WealthGoal", icon: Target, color: "text-pink-500 bg-pink-100" },
      { name: "WealthFix", icon: Crosshair, color: "text-orange-500 bg-orange-100" },
      { name: "WealthFam", icon: Users, color: "text-purple-500 bg-purple-100" },
      { name: "WealthFlow", icon: Activity, color: "text-blue-500 bg-blue-100" },
      { name: "WealthGroup", icon: Briefcase, color: "text-gray-500 bg-gray-100" },
    ];

    const tribesData = tribesRes?.data || tribesRes || {};

    return baseCards.map((card) => {
      // Safely handle if backend wraps response in { success: true, data: [...] } or { data: { items: [...] } }
      const dataArray = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.data?.items)
            ? (data as any).data.items
            : Array.isArray((data as any)?.data?.portfolios)
              ? (data as any).data.portfolios
              : Array.isArray((data as any)?.items)
                ? (data as any).items
                : [];

      const normalize = (str: string) => (str || "").replace(/_/g, "").toLowerCase();
      const cardNorm = normalize(card.name);

      const apiData = dataArray.find((d: any) => {
        const cat = normalize(d.category || d.plan || d.type || d.planType || d.name || "");
        return (
          cat === cardNorm ||
          cat.includes(cardNorm) ||
          cardNorm.includes(cat) ||
          (cardNorm === "wealthgroup" && (cat.includes("tribe") || cat.includes("group") || cat.includes("coop")))
        );
      });

      const isGroupCard = cardNorm === "wealthgroup";

      const rawAmt = Number(
        apiData?.amount ??
        apiData?.totalBalance ??
        apiData?.balance ??
        apiData?.totalAmount ??
        apiData?.totalSavings ??
        (isGroupCard ? (tribesData?.totalSavings ?? tribesData?.totalBalance ?? 0) : 0)
      );
      const nairaAmt = rawAmt / 100;

      const activeCount = Number(
        apiData?.active ??
        apiData?.activeMembers ??
        apiData?.activeCount ??
        apiData?.totalMembers ??
        apiData?.membersCount ??
        apiData?.count ??
        apiData?.members ??
        (isGroupCard ? (tribesData?.totalMembers ?? tribesData?.totalGroups ?? tribesData?.totalCount ?? 0) : 0)
      );

      const completedCount = Number(
        apiData?.completed ??
        apiData?.completedCount ??
        apiData?.completedPortfolios ??
        apiData?.completedMembers ??
        0
      );

      return {
        ...card,
        value: isLoading
          ? "—"
          : `₦${nairaAmt.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        active: isLoading ? "—" : activeCount.toLocaleString(),
        completed: isLoading ? "—" : completedCount.toLocaleString(),
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
              <div className="text-[14px] font-bold text-dark">
                {isLoading ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : portfolio.value}
              </div>
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
