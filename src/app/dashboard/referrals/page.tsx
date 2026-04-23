"use client";

import { useState } from "react";
import { Search, ChevronDown, MoreVertical } from "lucide-react";
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
  {
    id: "1",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    earnings: "N23,000.00",
    referralCount: 3,
    joinedDate: "April 12, 2023",
  },
  {
    id: "2",
    name: "Adewale Johnson",
    email: "adewale.j@gmail.com",
    earnings: "N45,500.00",
    referralCount: 5,
    joinedDate: "April 13, 2023",
  },
  {
    id: "3",
    name: "Chinelo Okoro",
    email: "c.okoro@outlook.com",
    earnings: "N12,000.00",
    referralCount: 2,
    joinedDate: "April 14, 2023",
  },
  {
    id: "4",
    name: "Babatunde Lawal",
    email: "blawal@wealthconomy.com",
    earnings: "N67,000.00",
    referralCount: 8,
    joinedDate: "April 15, 2023",
  },
  {
    id: "5",
    name: "Fatima Yusuf",
    email: "fatima.y@live.com",
    earnings: "N31,200.00",
    referralCount: 4,
    joinedDate: "April 16, 2023",
  },
  {
    id: "6",
    name: "Emeka Obi",
    email: "emeka.obi@gmail.com",
    earnings: "N8,500.00",
    referralCount: 1,
    joinedDate: "April 17, 2023",
  },
  {
    id: "7",
    name: "Sarah Williams",
    email: "sarah.w@wealthconomy.com",
    earnings: "N52,100.00",
    referralCount: 6,
    joinedDate: "April 18, 2023",
  },
  {
    id: "8",
    name: "Michael Chen",
    email: "m.chen@gmail.com",
    earnings: "N94,000.00",
    referralCount: 12,
    joinedDate: "April 19, 2023",
  },
  {
    id: "9",
    name: "Elena Rodriguez",
    email: "elena.r@outlook.com",
    earnings: "N15,750.00",
    referralCount: 2,
    joinedDate: "April 20, 2023",
  },
  {
    id: "10",
    name: "Kofi Mensah",
    email: "k.mensah@gmail.com",
    earnings: "N28,400.00",
    referralCount: 4,
    joinedDate: "April 21, 2023",
  },
  {
    id: "11",
    name: "Aisha Bello",
    email: "aisha.b@live.com",
    earnings: "N39,900.00",
    referralCount: 5,
    joinedDate: "April 22, 2023",
  },
  {
    id: "12",
    name: "David Smith",
    email: "d.smith@gmail.com",
    earnings: "N110,000.00",
    referralCount: 15,
    joinedDate: "April 23, 2023",
  },
];

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReferrals = referrals.filter(
    (ref) =>
      ref.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.email.toLowerCase().includes(searchQuery.toLowerCase()),
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

          <button className="flex items-center gap-2 px-6 py-2 border border-border rounded-2xl text-sm font-medium text-slate hover:bg-surface transition-all">
            Filter
            <ChevronDown className="h-4 w-4" />
          </button>
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
                  {ref.joinedDate}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
