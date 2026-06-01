"use client";

import { useState } from "react";
import { Search, ChevronDown, Calendar } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const referrals = [
  { id: "1", name: "Simon Olabiran Odunayo", email: "simon.olabiran@gmail.com", earnings: "N23,000.00", referralCount: 3, joinedDate: new Date().toISOString() }, // Today
  { id: "2", name: "Adewale Johnson", email: "adewale.j@gmail.com", earnings: "N45,500.00", referralCount: 5, joinedDate: new Date(Date.now() - 86400000).toISOString() }, // Yesterday
  { id: "3", name: "Chinelo Okoro", email: "c.okoro@outlook.com", earnings: "N12,000.00", referralCount: 2, joinedDate: new Date(Date.now() - 15 * 86400000).toISOString() }, // Last month
  { id: "4", name: "Babatunde Lawal", email: "blawal@wealthconomy.com", earnings: "N67,000.00", referralCount: 8, joinedDate: new Date(Date.now() - 25 * 86400000).toISOString() }, // Last month
  { id: "5", name: "Fatima Yusuf", email: "fatima.y@live.com", earnings: "N31,200.00", referralCount: 4, joinedDate: new Date(Date.now() - 120 * 86400000).toISOString() }, // 6 months
  { id: "6", name: "Emeka Obi", email: "emeka.obi@gmail.com", earnings: "N8,500.00", referralCount: 1, joinedDate: new Date(Date.now() - 250 * 86400000).toISOString() }, // 1 year
  { id: "7", name: "Sarah Williams", email: "sarah.w@wealthconomy.com", earnings: "N52,100.00", referralCount: 6, joinedDate: "2023-04-18T10:00:00Z" },
  { id: "8", name: "Michael Chen", email: "m.chen@gmail.com", earnings: "N94,000.00", referralCount: 12, joinedDate: "2023-04-19T10:00:00Z" },
  { id: "9", name: "Elena Rodriguez", email: "elena.r@outlook.com", earnings: "N15,750.00", referralCount: 2, joinedDate: "2023-04-20T10:00:00Z" },
  { id: "10", name: "Kofi Mensah", email: "k.mensah@gmail.com", earnings: "N28,400.00", referralCount: 4, joinedDate: "2023-04-21T10:00:00Z" },
  { id: "11", name: "Aisha Bello", email: "aisha.b@live.com", earnings: "N39,900.00", referralCount: 5, joinedDate: "2023-04-22T10:00:00Z" },
  { id: "12", name: "David Smith", email: "d.smith@gmail.com", earnings: "N110,000.00", referralCount: 15, joinedDate: "2023-04-23T10:00:00Z" },
];

function isWithinDateRange(dateStr: string, filter: string) {
  if (filter === "All time") return true;
  
  const date = new Date(dateStr);
  const now = new Date();
  
  // Reset times to start of day for accurate day comparisons
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowDay.getTime() - dateDay.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (filter === "Today") return diffDays === 0;
  if (filter === "Yesterday") return diffDays === 1;
  if (filter === "Last month") return diffDays <= 30;
  if (filter === "6 months") return diffDays <= 180;
  if (filter === "1 year") return diffDays <= 365;
  
  return true;
}

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("All time");

  const filteredReferrals = referrals.filter(
    (ref) => {
      const matchesSearch = ref.name.toLowerCase().includes(searchQuery.toLowerCase()) || ref.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = isWithinDateRange(ref.joinedDate, timeFilter);
      return matchesSearch && matchesDate;
    }
  );

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-outfit text-dark whitespace-nowrap">
            Users Referrals
          </h1>
          <p className="text-sm text-slate/50">
            Monitor top referrals and their earnings
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate/30" />
            <input
              type="text"
              placeholder="Search for Name or Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-surface border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none h-10 pl-10 pr-10 rounded-2xl bg-white border border-border text-slate text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-surface"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last month">Last month</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="All time">All time</option>
            </select>
            <Calendar className="w-4 h-4 text-slate/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Name
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Email
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Total earnings
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Number of referrals
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Joined Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReferrals.map((ref, i) => (
              <TableRow
                key={i}
                className="border-border/50 hover:bg-surface/30 transition-all font-outfit"
              >
                <TableCell className="py-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-primary/5">
                      <AvatarImage
                        src={`https://i.pravatar.cc/150?u=${ref.id + 100}`}
                      />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs">
                        {ref.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-dark text-[13px]">
                      {ref.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 whitespace-nowrap">
                  <Link
                    href={`mailto:${ref.email}`}
                    className="text-primary hover:underline text-[12px] font-medium"
                  >
                    {ref.email}
                  </Link>
                </TableCell>
                <TableCell className="py-6 text-[12px] text-dark font-medium">
                  {ref.earnings}
                </TableCell>
                <TableCell className="py-6 text-[12px] text-dark font-medium">
                  {ref.referralCount}
                </TableCell>
                <TableCell className="py-6 text-[12px] text-dark font-medium">
                  {new Date(ref.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
