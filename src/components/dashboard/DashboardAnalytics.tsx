"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCcw, CheckCircle2, Clock, XCircle, Activity, TrendingUp } from "lucide-react";

const filters = ["Today", "Last Week", "Month", "Year", "All Time"];

const getMultiplier = (filter: string) => {
  return filter === "Today" ? 1 : filter === "Last Week" ? 2 : filter === "Month" ? 4 : filter === "Year" ? 12 : 20;
};

const getLineData = (filter: string) => {
  const m = getMultiplier(filter);
  return [
    { name: "Jan", users: 1.5 * m },
    { name: "Feb", users: 1.8 * m },
    { name: "Mar", users: 2.1 * m },
    { name: "Apr", users: 2.8 * m },
    { name: "May", users: 3.3 * m },
    { name: "Jun", users: 3.5 * m },
    { name: "Jul", users: 3.8 * m },
    { name: "Aug", users: 4.1 * m },
    { name: "Sep", users: 4.5 * m },
    { name: "Oct", users: 4.8 * m },
    { name: "Nov", users: 5.1 * m },
    { name: "Dec", users: 5.3 * m },
  ];
};

const getBarData = (filter: string) => {
  const m = getMultiplier(filter);
  return [
    { name: "Jan", wealth: 1.2 * m, quarter: "Q1" },
    { name: "Feb", wealth: 2.5 * m, quarter: "" },
    { name: "Mar", wealth: 3.3 * m, quarter: "" },
    { name: "Apr", wealth: 4.3 * m, quarter: "Q2" },
    { name: "May", wealth: 4.3 * m, quarter: "" },
    { name: "Jun", wealth: 4.7 * m, quarter: "" },
    { name: "Jul", wealth: 5.1 * m, quarter: "Q3" },
    { name: "Aug", wealth: 5.4 * m, quarter: "" },
    { name: "Sep", wealth: 5.7 * m, quarter: "" },
    { name: "Oct", wealth: 5.7 * m, quarter: "Q4" },
    { name: "Nov", wealth: 0, quarter: "" },
    { name: "Dec", wealth: 0, quarter: "" },
  ];
};

const getPieData = (filter: string) => {
  const m = getMultiplier(filter);
  return {
    total: Math.floor(734 * m),
    data: [
      { name: "Processed", value: Math.floor(233 * m), color: "#22A699" },
      { name: "Interest", value: Math.floor(214 * m), color: "#6A0DAD" },
      { name: "WealthPact", value: Math.floor(167 * m), color: "#FFD700" },
      { name: "Pending", value: Math.floor(54 * m), color: "#FF8C00" },
      { name: "Failed", value: Math.floor(34 * m), color: "#FF4500" },
      { name: "Uptime", value: Math.floor(32 * m), color: "#4169E1" },
    ]
  };
};

const getLegends = (pieData: any[]) => [
  { icon: RefreshCcw, color: "text-teal-600 bg-teal-100", value: pieData[0].value, label: "Total number of transactions processed" },
  { icon: Clock, color: "text-orange-500 bg-orange-100", value: pieData[3].value, label: "Pending approvals" },
  { icon: CheckCircle2, color: "text-purple-600 bg-purple-100", value: pieData[1].value, label: "Total interest accrued" },
  { icon: XCircle, color: "text-red-500 bg-red-100", value: pieData[4].value, label: "Failed transactions" },
  { icon: TrendingUp, color: "text-yellow-600 bg-yellow-100", value: pieData[2].value, label: "Total WealthPact" },
  { icon: Activity, color: "text-blue-600 bg-blue-100", value: pieData[5].value, label: "Platform uptime/status" },
];

function ChartHeader({ title, filter, setFilter }: { title: string, filter: string, setFilter: (f: string) => void }) {
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
  if (!mounted) return null;

  const lineData = getLineData(userFilter);
  const barData = getBarData(wealthFilter);
  const { total: pieTotal, data: pieData } = getPieData(transactionFilter);
  const legends = getLegends(pieData);

  return (
    <div className="space-y-6">
      <div className="h-[1px] bg-[#155D5F]/10 w-full mb-4 mt-2"></div>
      <h2 className="text-lg font-bold font-outfit text-dark">Analytics</h2>

      <div className="flex flex-col lg:flex-row gap-[24px]">
        {/* Left Column for Line and Bar Charts */}
        <div className="flex flex-col gap-[20px]">
          {/* User Growth Chart */}
          <div className="w-full lg:w-[512px] h-[337px] rounded-[12px] p-[20px] bg-white border border-[#CCCCCC80] shadow-[0px_4px_5px_0px_rgba(0,0,0,0.07)] flex flex-col justify-between">
            <div>
              <ChartHeader title="User Growth Chart" filter={userFilter} setFilter={setUserFilter} />
              <div className="flex justify-between items-center text-xs font-bold text-dark mb-4">
                <span>Initial: 1,300,735</span>
                <span className="flex items-center gap-1">Total users: {Math.floor(5300735 * getMultiplier(userFilter)).toLocaleString()} <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="flex-1 w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#86D7DA69" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#86D7DA69" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `${value}M`} />
                  <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="users" stroke="#81E0DB" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" dot={{ r: 4, fill: '#155D5F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#155D5F' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute left-0 bottom-[-10px] w-full text-center text-[10px] font-medium text-slate">Months</div>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Users(Millions)</div>
            </div>
          </div>

          {/* Wealthpact Growth Trend */}
          <div className="w-full lg:w-[512px] h-[331px] rounded-[12px] p-[20px] bg-white border border-[#CCCCCC80] shadow-[0px_4px_5px_0px_rgba(0,0,0,0.07)] flex flex-col justify-between">
            <div>
              <ChartHeader title="Wealthpact growth trend" filter={wealthFilter} setFilter={setWealthFilter} />
              <div className="flex justify-between items-center text-xs font-bold text-dark mb-4">
                <span>Initial: ₦1,332,732.73</span>
                <span className="flex items-center gap-1">Total users: ₦{Math.floor(5300735 * getMultiplier(wealthFilter)).toLocaleString()} <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="flex-1 w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `₦${value}M`} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="wealth" radius={[4, 4, 0, 0]} barSize={20}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#73D1D4" : "#A5EDB4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-10 text-[10px] font-bold text-slate absolute left-8 right-0 bottom-[-10px]">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
              </div>
              <div className="absolute left-[-25px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Total Wealth Growth</div>
            </div>
          </div>
        </div>

        {/* Right Column for Pie Chart */}
        <div className="w-full lg:w-[570px] h-[688px] rounded-[14px] bg-white border border-[#CCCCCC8A] pt-[16px] pb-[38px] pl-[30px] pr-[30px] lg:pl-[51px] lg:pr-[51px] flex flex-col gap-[41px]">
          <ChartHeader title="Transactions" filter={transactionFilter} setFilter={setTransactionFilter} />
          
          <div className="flex-1 flex flex-col items-center justify-start">
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={90} outerRadius={140} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[34px] font-bold text-[#155D5F]">{pieTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-10 w-full mt-10">
              {legends.map((legend, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-full ${legend.color} shrink-0`}>
                    <legend.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-dark text-[18px] leading-none">{legend.value.toLocaleString()}</div>
                    <div className="text-[12px] text-dark/70 font-medium leading-tight max-w-[120px]">
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
