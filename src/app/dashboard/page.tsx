"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PortfolioStats } from "@/components/dashboard/PortfolioStats";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";

export default function OverviewPage() {
  const [timeFilter, setTimeFilter] = useState("Today");

  return (
    <div className="w-full max-w-[1237px] mx-auto min-h-[1370px] bg-white rounded-[20px] py-10 px-6 flex flex-col gap-8 shadow-sm">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark mb-1">
            Dashboard Overview
          </h1>
          <p className="text-slate text-sm font-medium">Manage users account</p>
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

      <div className="flex-1 space-y-6">
        <DashboardStats timeFilter={timeFilter} setTimeFilter={setTimeFilter} />
        <PortfolioStats timeFilter={timeFilter} />
        <DashboardAnalytics />
      </div>
    </div>
  );
}
