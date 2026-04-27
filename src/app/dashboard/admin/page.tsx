"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";

const admins = [
  {
    id: "1",
    name: "Simon Olabiran",
    email: "simon.olabiran@wealthconomy.com",
    status: "Online",
    timestamp: "-",
    image: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: "2",
    name: "Fatima Yusuf",
    email: "fatima.y@wealthconomy.com",
    status: "Online",
    timestamp: "-",
    image: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: "3",
    name: "Jessica Smith",
    email: "j.smith@wealthconomy.com",
    status: "Online",
    timestamp: "-",
    image: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: "4",
    name: "John Doe",
    email: "john.doe@wealthconomy.com",
    status: "Online",
    timestamp: "-",
    image: "https://i.pravatar.cc/150?u=4",
  },
  {
    id: "5",
    name: "Ali Ahmed",
    email: "ali.ahmed@wealthconomy.com",
    status: "Offline",
    timestamp: "05:45,\nApril 12, 2023",
    image: "https://i.pravatar.cc/150?u=5",
  },
];

export default function AdminManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h1 className="text-2xl font-bold font-outfit text-dark">
          Admin Management
        </h1>

        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
            <Input
              placeholder="Search for user or ID"
              className="pl-11 bg-surface border-none rounded-xl h-12 text-sm focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-12 px-6 gap-2 font-semibold">
            <Plus className="h-5 w-5" />
            Add an admin
          </Button>
        </div>
      </div>

      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-white">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="py-6 px-6 text-slate/50 font-medium text-xs uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="py-6 px-6 text-slate/50 font-medium text-xs uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="py-6 px-6 text-slate/50 font-medium text-xs uppercase tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="py-6 px-6 text-slate/50 font-medium text-xs uppercase tracking-wider">
                Timestamp
              </TableHead>
              <TableHead className="py-6 px-6 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow
                key={admin.id}
                className="group border-border/50 hover:bg-surface/50 transition-all duration-200"
              >
                <TableCell className="py-6 px-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={admin.image} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {admin.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-[13px] text-dark group-hover:text-primary transition-colors">
                      {admin.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <a
                    href={`mailto:${admin.email}`}
                    className="text-primary hover:underline text-[13px] font-medium"
                  >
                    {admin.email}
                  </a>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <div className="flex justify-center">
                    <Badge
                      className={`
                      ${
                        admin.status === "Online"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-gray-50 text-gray-400 border-gray-100"
                      } 
                      px-4 py-1.5 rounded-xl gap-2 font-bold text-[10px] items-center border shadow-sm transition-all
                    `}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          admin.status === "Online"
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                            : "bg-gray-400"
                        }`}
                      />
                      {admin.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <span className="text-slate/70 text-[13px] font-medium whitespace-pre-line leading-relaxed">
                    {admin.timestamp}
                  </span>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-surface rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-slate/50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl border-border/50 shadow-xl"
                    >
                      <DropdownMenuItem className="py-3 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-lg">
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="py-3 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-lg">
                        Edit Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem className="py-3 px-4 text-sm font-medium focus:bg-red-50 text-red-500 cursor-pointer rounded-lg">
                        Remove Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAdmins.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-slate/30" />
          </div>
          <h3 className="text-lg font-bold text-dark font-outfit">
            No admins found
          </h3>
          <p className="text-slate/60 text-sm max-w-[250px] mt-1">
            Try adjusting your search criteria or add a new administrator.
          </p>
        </div>
      )}
    </div>
  );
}
