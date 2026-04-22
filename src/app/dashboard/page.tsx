"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  UsersRound,
  Search,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stats = [
  {
    title: "New Users",
    value: "43",
    subtext: "2 new accounts recently created",
    icon: UserPlusIcon,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Active Portfolios",
    value: "422",
    subtext: "65 users have just activated their Portfolios",
    icon: PortfolioIcon,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Total Users",
    value: "2154",
    subtext: "",
    icon: UsersIcon,
    color: "bg-primary/10 text-primary",
  },
];

const mockUsers = [
  {
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Mixed Wealth",
    date: "05:45, April 12, 2023",
  },
  {
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Impact Wealth",
    date: "05:45, April 12, 2023",
  },
  {
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Impact Wealth",
    date: "05:45, April 12, 2023",
  },
  {
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Impact Wealth",
    date: "05:45, April 12, 2023",
  },
  {
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Impact Wealth",
    date: "05:45, April 12, 2023",
  },
  {
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Impact Wealth",
    date: "05:45, April 12, 2023",
  },
];

export default function OverviewPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-10 group">
      <div>
        <h1 className="text-2xl font-bold font-outfit text-dark">
          Dashboard Overview
        </h1>
        <p className="text-slate text-sm">Manage users account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="h-[175px] bg-[#F2FFFF] border-[px] border-[#155D5F4D] rounded-[20px] shadow-none overflow-hidden transition-all hover:bg-[#E6F9F9]"
          >
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl font-bold font-outfit text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold text-dark">
                    {stat.title}
                  </div>
                </div>
                <div
                  className={`p-2.5 rounded-full ${stat.color} absolute top-5 right-5`}
                >
                  <stat.icon />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                <div className="h-[2px] bg-primary/10 w-full"></div>
                <div className="flex items-center gap-2 text-xs text-slate">
                  {stat.subtext && (
                    <>
                      <div className="p-1 bg-primary text-white rounded-full">
                        <PlusIcon className="h-2.5 w-2.5" />
                      </div>
                      <span className="opacity-80 font-medium">
                        {stat.subtext}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="h-[2px] bg-slate/10 w-full my-4"></div>

      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-bold font-outfit text-dark">
            Users Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate/40" />
              <Input
                placeholder="Search for Name, Email, Phone Number"
                className="pl-9 bg-surface border-none rounded-xl text-sm py-5"
              />
            </div>
            <Link
              href="#"
              className="text-primary text-sm font-semibold hover:underline hidden md:block"
            >
              Product management
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-transparent overflow-hidden">
          <Table>
            <TableHeader className="bg-surface">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-semibold text-slate/60 text-xs py-4">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-slate/60 text-xs text-center">
                  Last Login and Date
                </TableHead>
                <TableHead className="font-semibold text-slate/60 text-xs text-center">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-slate/60 text-xs text-center">
                  Phone
                </TableHead>
                <TableHead className="font-semibold text-slate/60 text-xs text-center">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-slate/60 text-xs text-center">
                  Preference
                </TableHead>
                <TableHead className="font-semibold text-slate/60 text-xs text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/50">
                      <TableCell>
                        <Skeleton className="h-10 w-40 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-32 mx-auto rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-40 mx-auto rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-28 mx-auto rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24 mx-auto rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                : mockUsers.map((user, i) => (
                    <TableRow
                      key={i}
                      className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-primary/10">
                            <AvatarImage
                              src={`https://i.pravatar.cc/150?u=${i}`}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-dark text-sm whitespace-nowrap">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate whitespace-pre-line leading-relaxed">
                        {user.date}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          href={`mailto:${user.email}`}
                          className="text-primary hover:underline text-xs"
                        >
                          {user.email}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate">
                        {user.phone}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 rounded-lg gap-1.5 font-medium text-[10px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate">
                        {user.preference}
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="p-2 hover:bg-surface rounded-lg transition-colors text-slate/40">
                          <div className="flex flex-col gap-0.5 items-center">
                            <div className="w-1 h-1 rounded-full bg-slate/40"></div>
                            <div className="w-1 h-1 rounded-full bg-gold"></div>
                            <div className="w-1 h-1 rounded-full bg-slate/40"></div>
                          </div>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Icons matching the screenshot
function UserPlusIcon() {
  return (
    <div className="relative w-6 h-6">
      <Users className="w-6 h-6" />
      <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-white">
        <PlusIcon className="w-2 h-2" />
      </div>
    </div>
  );
}

function PortfolioIcon() {
  return (
    <div className="w-6 h-6 flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-current rounded-sm relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-current opacity-30"></div>
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current opacity-30 translate-y-1/2"></div>
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-current opacity-30 -translate-x-1/2"></div>
      </div>
    </div>
  );
}

function UsersIcon() {
  return <UsersRound className="w-6 h-6" />;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
