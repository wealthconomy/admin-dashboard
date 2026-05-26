"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

const timeFilters = ["All dates", "12 months", "7 days", "Today"];

// Mock data
const savingsData = [
  { name: "Jan", value: 200, quarter: "Q1" },
  { name: "Feb", value: 220, quarter: "" },
  { name: "Mar", value: 250, quarter: "" },
  { name: "Apr", value: 300, quarter: "Q2" },
  { name: "May", value: 400, quarter: "" },
  { name: "Jun", value: 450, quarter: "" },
  { name: "Jul", value: 480, quarter: "Q3" },
  { name: "Aug", value: 500, quarter: "" },
  { name: "Sep", value: 550, quarter: "" },
  { name: "Oct", value: 600, quarter: "Q4" },
  { name: "Nov", value: 650, quarter: "" },
  { name: "Dec", value: 750, quarter: "" },
];

const transactionData = [
  { name: "Jan", value: 250, quarter: "Q1" },
  { name: "Feb", value: 400, quarter: "" },
  { name: "Mar", value: 400, quarter: "" },
  { name: "Apr", value: 480, quarter: "Q2" },
  { name: "May", value: 550, quarter: "" },
  { name: "Jun", value: 650, quarter: "" },
  { name: "Jul", value: 700, quarter: "Q3" },
  { name: "Aug", value: 700, quarter: "" },
  { name: "Sep", value: 810, quarter: "" },
  { name: "Oct", value: 920, quarter: "Q4" },
  { name: "Nov", value: 0, quarter: "" },
  { name: "Dec", value: 0, quarter: "" },
];

const interestData = [
  { name: "Jan", value: 200 },
  { name: "Feb", value: 220 },
  { name: "Mar", value: 250 },
  { name: "Apr", value: 300 },
  { name: "May", value: 370 },
  { name: "Jun", value: 400 },
  { name: "Jul", value: 420 },
  { name: "Aug", value: 440 },
  { name: "Sep", value: 460 },
  { name: "Oct", value: 480 },
  { name: "Nov", value: 550 },
  { name: "Dec", value: 650 },
];

const revenueData = [
  { name: "Jan", value: 1.5, line: 1.5, quarter: "Q1" },
  { name: "Feb", value: 2.0, line: 2.2, quarter: "" },
  { name: "Mar", value: 3.3, line: 3.3, quarter: "" },
  { name: "Apr", value: 4.1, line: 4.1, quarter: "Q2" },
  { name: "May", value: 4.3, line: 4.3, quarter: "" },
  { name: "Jun", value: 4.7, line: 4.7, quarter: "" },
  { name: "Jul", value: 5.1, line: 5.1, quarter: "Q3" },
  { name: "Aug", value: 5.4, line: 5.4, quarter: "" },
  { name: "Sep", value: 5.7, line: 5.7, quarter: "" },
  { name: "Oct", value: 0, line: 6.0, quarter: "Q4" },
  { name: "Nov", value: 0, line: 6.2, quarter: "" },
  { name: "Dec", value: 0, line: 6.5, quarter: "" },
];

const retentionData = [
  { name: "", value: 96 },
  { name: "2025", value: 95 },
  { name: "", value: 97 },
  { name: "", value: 98 },
  { name: "", value: 95 },
  { name: "", value: 94 },
  { name: "", value: 93 },
  { name: "2026", value: 96 },
  { name: "", value: 97 },
];

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState("7 days");

  return (
    <div className="w-full max-w-[1137px] mx-auto min-h-[1370px] bg-white rounded-[20px] py-10 px-6 flex flex-col gap-8 shadow-sm">
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
                <span>Initial: 200,300,735</span>
                <span className="flex items-center gap-1">Total Saving: ₦852,300,735 <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `₦${value}M`} />
                  <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="value" stroke="#65D36A" strokeWidth={2} dot={{ r: 3, fill: '#65D36A' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-10 text-[10px] font-bold text-slate absolute left-8 right-0 bottom-[-10px]">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
              </div>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Total savings</div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Trend */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Transaction Trend</h3>
              <div className="flex justify-end items-center text-xs font-bold text-dark">
                <span className="flex items-center gap-1">Total users: ₦5,300,735 <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `₦${value}K`} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" fill="#A5EDB4" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-10 text-[10px] font-bold text-slate absolute left-8 right-0 bottom-[-10px]">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
              </div>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Total Wealth Growth</div>
            </div>
          </CardContent>
        </Card>

        {/* Interest Growth Trends */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Interest Growth Trends</h3>
              <div className="flex justify-end items-center text-xs font-bold text-dark">
                <span className="flex items-center gap-1">Total Interest: ₦645,300,735 <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={interestData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#86D7DA69" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#86D7DA69" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `₦${value}K`} />
                  <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke="#81E0DB" strokeWidth={2} fillOpacity={1} fill="url(#colorInterest)" dot={{ r: 3, fill: '#155D5F', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute left-0 bottom-[-10px] w-full text-center text-[10px] font-medium text-slate">Months</div>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Users(Millions)</div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Revenue Trends</h3>
              <div className="flex justify-end items-center text-xs font-bold text-dark">
                <span className="flex items-center gap-1">Total revenue: ₦5,700,000,735 <span className="text-[#65D36A]">↑</span></span>
              </div>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `₦${value}M`} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={24} />
                  <Line type="monotone" dataKey="line" stroke="#155D5F" strokeWidth={2} dot={{ r: 3, fill: '#155D5F' }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-10 text-[10px] font-bold text-slate absolute left-8 right-0 bottom-[-10px]">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
              </div>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Revenue Growth</div>
            </div>
          </CardContent>
        </Card>

        {/* Retention Rate Trend */}
        <Card className="rounded-[20px] shadow-sm border border-border/50 bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-bold text-dark font-outfit mb-2">Retention Rate Trend</h3>
            </div>
            <div className="h-[280px] w-full relative pl-8 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="value" stroke="#65D36A" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate whitespace-nowrap">Percentage</div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
