"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCcw, CheckCircle2, Clock, XCircle, Activity, TrendingUp, BarChart2 } from "lucide-react";
import {
  useGetDonutAnalyticsQuery,
  useGetUserGrowthQuery,
  useGetWealthGrowthQuery,
} from "@/lib/redux/features/dashboardApi";

const filters = ["Today", "Last Week", "Month", "Year", "All Time"];

function ChartHeader({ title, filter, setFilter }: { title: string; filter: string; setFilter: (f: string) => void }) {
  return (
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-[18px] font-bold text-dark font-outfit">{title}</h3>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none bg-surface px-3 py-1.5 rounded-lg border border-border/50 hover:bg-surface/80 transition-colors">
          <span className="text-[11px] font-semibold text-slate">{filter}</span>
          <ChevronDown className="h-3 w-3 text-slate" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white rounded-xl shadow-lg border-border/50">
          {filters.map((f) => (
            <DropdownMenuItem key={f} onClick={() => setFilter(f)} className="cursor-pointer font-medium text-xs hover:bg-surface">
              {f}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DashboardAnalytics() {
  const [mounted, setMounted] = useState(false);
  const [userFilter, setUserFilter] = useState("Today");
  const [wealthFilter, setWealthFilter] = useState("Today");
  const [transactionFilter, setTransactionFilter] = useState("Today");

  useEffect(() => { setMounted(true); }, []);

  const { data: donutData, isLoading: donutLoading } = useGetDonutAnalyticsQuery();
  const { data: userGrowthData, isLoading: userLoading } = useGetUserGrowthQuery();
  const { data: wealthGrowthData, isLoading: wealthLoading } = useGetWealthGrowthQuery();

  if (!mounted) return null;

  // Build chart data from API response
  const userChartData = userGrowthData?.data?.labels?.map((label: string, i: number) => ({
    name: label,
    users: userGrowthData?.data?.datasets?.[0]?.data?.[i] ?? 0,
  })) ?? [];

  const wealthChartData = wealthGrowthData?.data?.labels?.map((label: string, i: number) => {
    const rawVal = Number(wealthGrowthData?.data?.datasets?.[0]?.data?.[i] ?? 0);
    const datasetLabel = wealthGrowthData?.data?.datasets?.[0]?.label ?? "";
    const isMillions = datasetLabel.toLowerCase().includes("millions");

    // Convert Millions NGN to Naira (e.g. 0.0005 Million NGN = 500 NGN) or kobo to Naira
    let nairaVal = rawVal;
    if (isMillions) {
      nairaVal = rawVal * 1_000_000;
    } else if (rawVal >= 100) {
      nairaVal = rawVal / 100;
    }

    return {
      name: label,
      wealth: nairaVal,
    };
  }) ?? [];

  const getPeriodLabel = (filter: string) => {
    const f = filter.toLowerCase();
    if (f.includes("week") || f.includes("day") || f === "today") return "Days";
    if (f.includes("year") || f === "all time") return "Years";
    return "Months";
  };

  const pieData = donutData?.data?.distribution ?? [];
  const pieTotal = donutData?.data?.totalTransactionsProcessed ?? 0;

  const legends = [
    { icon: RefreshCcw,   color: "text-teal-600 bg-teal-100",     value: donutData?.data?.totalTransactionsProcessed ?? 0, label: "Total number of transactions processed" },
    { icon: Clock,        color: "text-orange-500 bg-orange-100",  value: donutData?.data?.pendingWithdrawals ?? 0,         label: "Pending withdrawals" },
    { icon: CheckCircle2, color: "text-purple-600 bg-purple-100",  value: donutData?.data?.totalInterestDisbursed ?? 0,     label: "Total interest disbursed" },
    { icon: BarChart2,    color: "text-blue-600 bg-blue-100",      value: donutData?.data?.activePortfolios ?? 0,           label: "Active portfolios" },
    { icon: TrendingUp,   color: "text-yellow-600 bg-yellow-100",  value: donutData?.data?.platformAdministrators ?? 0,     label: "Platform administrators" },
    { icon: Activity,     color: "text-green-600 bg-green-100",    value: pieData.length,                             label: "Distribution segments" },
  ];

  return (
    <div className="space-y-6">
      <div className="h-[1px] bg-[#155D5F]/10 w-full mb-4 mt-2"></div>
      <h2 className="text-lg font-bold font-outfit text-dark">Analytics</h2>

      <div className="flex flex-col lg:flex-row gap-[24px]">
        {/* Left Column */}
        <div className="flex flex-col gap-[20px]">
          {/* User Growth Chart */}
          <div className="w-full lg:w-[512px] h-[337px] rounded-[12px] p-[20px] bg-white border border-[#CCCCCC80] shadow-[0px_4px_5px_0px_rgba(0,0,0,0.07)] flex flex-col justify-between">
            <div>
              <ChartHeader title="User Growth Chart" filter={userFilter} setFilter={setUserFilter} />
              <div className="flex justify-between items-center text-xs font-bold text-dark mb-4">
                <span>{userLoading ? "Loading..." : `${userChartData.length} ${getPeriodLabel(userFilter)}`}</span>
                <span className="flex items-center gap-1">
                  Dataset: {userGrowthData?.data?.datasets?.[0]?.label ?? "Users"} <span className="text-[#65D36A]">↑</span>
                </span>
              </div>
            </div>
            <div className="flex-1 w-full relative pl-6 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={userChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#86D7DA69" stopOpacity={1} />
                      <stop offset="95%" stopColor="#86D7DA69" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="users" stroke="#81E0DB" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" dot={{ r: 4, fill: '#155D5F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#155D5F' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute left-0 bottom-[-10px] w-full text-center text-[10px] font-medium text-slate">{getPeriodLabel(userFilter)}</div>
              <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Users</div>
            </div>
          </div>

          {/* Wealth Growth Chart */}
          <div className="w-full lg:w-[512px] h-[331px] rounded-[12px] p-[20px] bg-white border border-[#CCCCCC80] shadow-[0px_4px_5px_0px_rgba(0,0,0,0.07)] flex flex-col justify-between">
            <div>
              <ChartHeader title="Wealth Growth Trend" filter={wealthFilter} setFilter={setWealthFilter} />
              <div className="flex justify-between items-center text-xs font-bold text-dark mb-4">
                <span>{wealthLoading ? "Loading..." : `${wealthChartData.length} ${getPeriodLabel(wealthFilter)}`}</span>
                <span className="flex items-center gap-1">
                  Dataset: Total AUM (NGN) <span className="text-[#65D36A]">↑</span>
                </span>
              </div>
            </div>
            <div className="flex-1 w-full relative pl-12 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={wealthChartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    tickFormatter={(v) => v >= 1000000 ? `₦${(v/1000000).toFixed(1)}M` : v >= 1000 ? `₦${(v/1000).toFixed(0)}k` : `₦${v}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`₦${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "AUM (Naira)"]}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                  />
                  <Bar dataKey="wealth" radius={[4, 4, 0, 0]} barSize={20}>
                    {wealthChartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#73D1D4" : "#A5EDB4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Total Wealth Growth (NGN)</div>
            </div>
          </div>
        </div>

        {/* Right Column - Donut Chart */}
        <div className="w-full lg:w-[570px] min-h-[688px] rounded-[14px] bg-white border border-[#CCCCCC8A] pt-[20px] pb-[32px] px-[24px] lg:px-[36px] flex flex-col justify-between gap-[24px]">
          <ChartHeader title="Transactions" filter={transactionFilter} setFilter={setTransactionFilter} />

          <div className="flex-1 flex flex-col items-center justify-between">
            <div className="h-[250px] w-full relative">
              {donutLoading ? (
                <div className="flex items-center justify-center h-full text-slate text-sm">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={75} outerRadius={115} dataKey="value" stroke="none">
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[32px] font-bold text-[#155D5F]">{pieTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5 w-full mt-4 pb-2">
              {legends.map((legend, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${legend.color} shrink-0`}>
                    <legend.icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-dark text-[16px] leading-none">
                      {typeof legend.value === "number" ? legend.value.toLocaleString() : legend.value}
                    </div>
                    <div className="text-[11px] text-dark/70 font-medium leading-tight max-w-[140px]">
                      {legend.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
