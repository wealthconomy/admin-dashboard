"use client";

import { useState } from "react";
import { Search, Loader2, History, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart,
} from "recharts";
import {
  useGetSavingsReportQuery,
  useGetTransactionsReportQuery,
  useGetInterestReportQuery,
  useGetRevenueReportQuery,
  useGetRetentionReportQuery,
} from "@/lib/redux/features/dashboardApi";

const timeFilters = ["All dates", "12 months", "7 days", "Today"];

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState("7 days");

  const { data: savingsData, isLoading: savingsLoading } = useGetSavingsReportQuery();
  const { data: transactionData, isLoading: transLoading } = useGetTransactionsReportQuery();
  const { data: interestData, isLoading: interestLoading } = useGetInterestReportQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueReportQuery();
  const { data: retentionData, isLoading: retentionLoading } = useGetRetentionReportQuery();

  // Helper to map generic `{ label, value, secondValue }` to chart-ready format
  // Financial metrics sent in kobo are divided by 100 to convert to Naira
  const formatData = (apiResponse: any, valKey: string, lineKey?: string, isCurrency = true) => {
    const dataArray = Array.isArray(apiResponse) ? apiResponse : Array.isArray(apiResponse?.data) ? apiResponse.data : [];
    if (!dataArray || dataArray.length === 0) return [];
    
    return dataArray.map((item: any) => {
      const rawVal = Number(item.value?.value || item.value || 0);
      const val = isCurrency && rawVal >= 100 ? rawVal / 100 : rawVal;

      const rawLine = Number(item.secondValue?.value || item.secondValue || 0);
      const lineVal = isCurrency && rawLine >= 100 ? rawLine / 100 : rawLine;

      return {
        name: item.label,
        [valKey]: val,
        ...(lineKey && { [lineKey]: lineVal })
      };
    });
  };

  const formattedSavings = formatData(savingsData || [], "value");
  const formattedTransactions = formatData(transactionData || [], "value");
  const formattedInterest = formatData(interestData || [], "value");
  const formattedRevenue = formatData(revenueData || [], "value", "line");
  const formattedRetention = formatData(retentionData || [], "value", undefined, false);

  const getPeriodLabel = () => {
    const f = activeFilter.toLowerCase();
    if (f.includes("day") || f === "today") return "Days";
    if (f.includes("year") || f.includes("12")) return "Months";
    if (f === "all dates") return "Periods";
    return "Months";
  };

  const formatCompactNumber = (value: number, isCurrency = true) => {
    const prefix = isCurrency ? '₦' : '';
    if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${prefix}${value}`;
  };

  return (
    <div className="w-full max-w-[1140px] mx-auto bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm flex flex-col gap-8 mb-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark mb-1">
            Reports and analytics
          </h1>
        </div>

        <div className="relative w-full md:w-[350px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
          <Input
            type="text"
            placeholder="Search for Name, Email, Phone Number"
            className="w-full pl-10 pr-4 py-6 bg-surface border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-slate/40 placeholder:font-medium"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        {timeFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-colors ${
              activeFilter === filter
                ? "bg-[#A5EDB4] text-[#155D5F]"
                : "bg-transparent border border-border/50 text-slate hover:bg-surface"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Savings Growth Trend */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Savings Growth Trend</h3>
              <div className="flex justify-between items-center text-xs font-bold text-dark">
                <span>{savingsLoading ? "Loading..." : `${formattedSavings.length} ${getPeriodLabel()}`}</span>
                <span className="flex items-center gap-1">Total Savings <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {savingsLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <LineChart data={formattedSavings} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => formatCompactNumber(val)} />
                    <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line type="monotone" dataKey="value" stroke="#65D36A" strokeWidth={2} dot={{ r: 3, fill: '#65D36A' }} activeDot={{ r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Total savings</div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Trend */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Transaction Trend</h3>
              <div className="flex justify-between items-center text-xs font-bold text-dark">
                <span>{transLoading ? "Loading..." : `${formattedTransactions.length} ${getPeriodLabel()}`}</span>
                <span className="flex items-center gap-1">Total Transactions <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {transLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <BarChart data={formattedTransactions} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => formatCompactNumber(val, false)} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="#A5EDB4" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                )}
              </ResponsiveContainer>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Total Wealth Growth</div>
            </div>
          </CardContent>
        </Card>

        {/* Interest Growth Trends */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Interest Growth Trends</h3>
              <div className="flex justify-between items-center text-xs font-bold text-dark">
                 <span>{interestLoading ? "Loading..." : `${formattedInterest.length} ${getPeriodLabel()}`}</span>
                <span className="flex items-center gap-1">Total Interest <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {interestLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <AreaChart data={formattedInterest} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#86D7DA69" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#86D7DA69" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => formatCompactNumber(val)} />
                    <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="value" stroke="#81E0DB" strokeWidth={2} fillOpacity={1} fill="url(#colorInterest)" dot={{ r: 3, fill: '#155D5F', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Users(Millions)</div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Revenue Trends</h3>
              <div className="flex justify-between items-center text-xs font-bold text-dark">
                <span>{revenueLoading ? "Loading..." : `${formattedRevenue.length} ${getPeriodLabel()}`}</span>
                <span className="flex items-center gap-1">Total revenue <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {revenueLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <ComposedChart data={formattedRevenue} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => formatCompactNumber(val)} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={24} />
                    <Line type="monotone" dataKey="line" stroke="#155D5F" strokeWidth={2} dot={{ r: 3, fill: '#155D5F' }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Revenue Growth</div>
            </div>
          </CardContent>
        </Card>

        {/* Retention Rate Trend */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Retention Rate Trend</h3>
              <div className="flex justify-between items-center text-xs font-bold text-dark">
                <span>{retentionLoading ? "Loading..." : `${formattedRetention.length} ${getPeriodLabel()}`}</span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {retentionLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <LineChart data={formattedRetention} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line type="monotone" dataKey="value" stroke="#65D36A" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Percentage</div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
