"use client";

import { useState } from "react";

import { Search, ChevronDown, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit3 } from "lucide-react";

const users = [
  {
    id: "ID5372527",
    name: "Simon Smith",
    email: "simon.smith@wealthconomy.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Mixed Wealth",
    lastLogin: "05:45,\nApril 12, 2023",
  },
  {
    id: "ID5372528",
    name: "Adewale Johnson",
    email: "adewale.j@gmail.com",
    phone: "+2348012345678",
    status: "Active",
    preference: "Impact Wealth",
    lastLogin: "10:20,\nApril 13, 2023",
  },
  {
    id: "ID5372529",
    name: "Chinelo Okoro",
    email: "c.okoro@outlook.com",
    phone: "+2347098765432",
    status: "Active",
    preference: "Impact Wealth",
    lastLogin: "14:15,\nApril 14, 2023",
  },
  {
    id: "ID5372530",
    name: "Babatunde Lawal",
    email: "blawal@wealthconomy.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Impact Wealth",
    lastLogin: "09:30,\nApril 15, 2023",
  },
  {
    id: "ID5372531",
    name: "Fatima Yusuf",
    email: "fatima.y@live.com",
    phone: "+2348123456789",
    status: "Active",
    preference: "Impact Wealth",
    lastLogin: "11:00,\nApril 16, 2023",
  },
  {
    id: "ID5372532",
    name: "Emeka Obi",
    email: "emeka.obi@gmail.com",
    phone: "+2349012345678",
    status: "Active",
    preference: "Impact Wealth",
    lastLogin: "16:45,\nApril 17, 2023",
  },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <div className="space-y-8 bg-white p-10 rounded-[30px] border border-border shadow-sm min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-xl font-bold font-outfit text-dark whitespace-nowrap">
          Users Management
        </h1>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate/30" />
            <input
              type="text"
              placeholder="Search for Name, Email, Phone Number"
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
                Last Login and Date
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Email
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6">
                Phone
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6 text-center">
                Status
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6 text-center">
                Preference
              </TableHead>
              <TableHead className="text-slate/40 font-medium text-xs pb-6 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, i) => (
              <TableRow
                key={i}
                className="border-border/50 hover:bg-surface/30 transition-all"
              >
                <TableCell className="py-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-primary/5">
                      <AvatarImage
                        src={`https://i.pravatar.cc/150?u=${user.id}`}
                      />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-dark text-[13px]">
                      {user.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 text-[11px] text-slate/70 whitespace-pre-line leading-relaxed">
                  {user.lastLogin}
                </TableCell>
                <TableCell className="py-6">
                  <Link
                    href={`mailto:${user.email}`}
                    className="text-primary hover:underline text-[11px] underline-offset-4"
                  >
                    {user.email}
                  </Link>
                </TableCell>
                <TableCell className="py-6 text-[11px] text-slate/70">
                  {user.phone}
                </TableCell>
                <TableCell className="py-6 text-center">
                  <Badge className="bg-green-100/60 text-green-600 hover:bg-green-100/60 border-none px-4 py-2 rounded-xl gap-2 font-semibold text-[11px]">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-6 text-center text-[11px] text-slate/70 font-medium">
                  {user.preference}
                </TableCell>
                <TableCell className="py-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-surface rounded-xl transition-all group relative">
                        <div className="flex flex-col gap-[2px] items-center">
                          <div className="w-1 h-1 rounded-full bg-slate/30 group-hover:bg-slate/60"></div>
                          <div className="w-1 h-1 rounded-full bg-gold"></div>
                          <div className="w-1 h-1 rounded-full bg-slate/30 group-hover:bg-slate/60"></div>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-2xl p-2 border-border shadow-lg"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-surface text-sm font-medium text-slate"
                        >
                          <Eye className="h-4 w-4 text-primary/70" />
                          View User ID
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-surface text-sm font-medium text-slate">
                        <Edit3 className="h-4 w-4 text-primary/70" />
                        Edit User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
