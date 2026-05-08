"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  MoreVertical,
  Activity,
  Eye,
  Filter,
  Lock,
  XCircle,
  Clock,
  CheckCircle2,
  X,
  User,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const INITIAL_ACTIVITIES = [
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Account Suspend",
    status: "Locked",
    details: "Multiple password attempts",
    category: "Security",
    ip: "192.168.1.10",
    loggedVia: "Web Browser",
    performedBy: "System",
    accountGrade: "KYC Level 3",
    logId: "#LOG56789",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Logged in",
    status: "Failed",
    details: "Incorrect Password\nIP: 192.168.1.1",
    category: "Security",
    ip: "192.168.1.10",
    loggedVia: "Face ID",
    performedBy: "User",
    accountGrade: "KYC Level 3",
    logId: "#LOG56789",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Email verification",
    status: "Pending",
    details: "IP: 192.168.1.1",
    category: "Account",
    ip: "192.168.1.10",
    loggedVia: "Email Link",
    performedBy: "User",
    accountGrade: "KYC Level 2",
    logId: "#LOG56790",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Password reset",
    status: "Successful",
    details: "-",
    category: "Security",
    ip: "192.168.1.10",
    loggedVia: "OTP Code",
    performedBy: "User",
    accountGrade: "KYC Level 3",
    logId: "#LOG56791",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Email verification pending",
    status: "Successful",
    details: "IP: 192.168.1.1",
    category: "Account",
    ip: "192.168.1.10",
    loggedVia: "Email Link",
    performedBy: "User",
    accountGrade: "KYC Level 2",
    logId: "#LOG56792",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Logged in",
    status: "Successful",
    details: "Incorrect Password\nIP: 192.168.1.1",
    category: "Security",
    ip: "192.168.1.10",
    loggedVia: "Face ID",
    performedBy: "User",
    accountGrade: "KYC Level 3",
    logId: "#LOG56793",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "2 - Factor Authentication",
    status: "Successful",
    details: "Via Email Code",
    category: "Security",
    ip: "192.168.1.10",
    loggedVia: "Authenticator App",
    performedBy: "User",
    accountGrade: "KYC Level 3",
    logId: "#LOG56794",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Logged in (OTP)",
    status: "Successful",
    details: "IP: 192.168.1.1",
    category: "Security",
    ip: "192.168.1.10",
    loggedVia: "OTP Code",
    performedBy: "User",
    accountGrade: "KYC Level 3",
    logId: "#LOG56795",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
  {
    id: "ID5372527",
    timestamp: "05:45, April 12, 2023",
    name: "Simon Olabiran Odunayo",
    email: "simon.olabiran@gmail.com",
    action: "Wealth TopUp",
    status: "Successful",
    details: "IP: 192.168.1.1",
    category: "Transaction",
    ip: "192.168.1.10",
    loggedVia: "Mobile App",
    performedBy: "User",
    accountGrade: "KYC Level 3",
    logId: "#LOG56796",
    logRecorded: "05:45, April 12, 2023",
    emailConfirmation: "Approved at 2024-03-04 09:58 UTC",
  },
];

const CATEGORIES = ["All Categories", "Security", "Transaction", "Account"];

export default function ActivitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLog, setSelectedLog] = useState<(typeof INITIAL_ACTIVITIES)[0] | null>(null);

  const filteredActivities = INITIAL_ACTIVITIES.filter((act) => {
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" || act.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Locked":
        return (
          <Badge className="bg-[#F3F4F6] hover:bg-[#F3F4F6] text-[#4B5563] border border-slate-200 px-3 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <Lock className="h-2.5 w-2.5" />
            Locked
          </Badge>
        );
      case "Failed":
        return (
          <Badge className="bg-[#FEF2F2] hover:bg-[#FEF2F2] text-[#EF4444] border border-red-100 px-3 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <XCircle className="h-2.5 w-2.5" />
            Failed
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-[#FFF7ED] hover:bg-[#FFF7ED] text-[#F97316] border border-orange-100 px-3 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <Clock className="h-2.5 w-2.5" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#ECFDF5] hover:bg-[#ECFDF5] text-[#10B981] border border-emerald-100 px-3 py-1 rounded-full gap-1.5 font-bold text-[10px] shadow-none flex items-center justify-center whitespace-nowrap">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Successful
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
          Activities Management
        </h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search Name, Email, Phone Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 px-5 rounded-xl border-border/50 font-bold text-sm text-slate hover:bg-surface gap-2 shrink-0">
                Filter
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 rounded-2xl border-border/50 p-2 shadow-xl bg-white">
              {CATEGORIES.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer"
                >
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table — overflow-x-auto on wrapper prevents page-level sideways scroll */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-full table-fixed">
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[130px]">Timestamp</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[180px]">Name</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[200px]">Email</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[180px]">Action Types</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[120px]">Status</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[160px]">Details</TableHead>
                <TableHead className="py-4 px-4 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act, i) => (
                  <TableRow key={i} className="group border-border/50 hover:bg-surface/30 transition-all duration-200">
                    <TableCell className="py-5 px-4">
                      <span className="text-[11px] font-semibold text-slate/60 block leading-snug">
                        {act.timestamp}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 border border-primary/5 shadow-sm shrink-0">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${act.id}`} />
                          <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                            {act.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-[12px] text-dark truncate">{act.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      <a href={`mailto:${act.email}`} className="text-[#1D84D9] text-[12px] font-semibold hover:underline truncate block max-w-[185px]">
                        {act.email}
                      </a>
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      <span className="text-[12px] font-semibold text-dark">{act.action}</span>
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      {renderStatusBadge(act.status)}
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      <span className="text-[11px] text-slate/50 font-medium whitespace-pre-line leading-snug">{act.details}</span>
                    </TableCell>
                    <TableCell className="py-5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full">
                            <MoreVertical className="h-4 w-4 text-slate/40" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/users/${act.id}`)}
                            className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                          >
                            <User className="h-3.5 w-3.5 text-primary" />
                            View Account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedLog(act)}
                            className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate/50" />
                            Log Overview
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8 text-slate/20" />
                      <p className="text-sm font-medium text-slate/40">No activity logs match your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Activity Details Modal — matches screenshot exactly */}
      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-[20px] w-full max-w-[640px] max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">

            {/* Close & ellipsis top-right */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
              <button
                onClick={() => setSelectedLog(null)}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-slate/40 hover:text-slate/60 transition-colors p-0.5">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                  <DropdownMenuItem
                    onClick={() => { setSelectedLog(null); router.push(`/dashboard/users/${selectedLog.id}`); }}
                    className="py-2.5 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                  >
                    <User className="h-4 w-4 text-slate/50" />
                    View Account
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="py-2.5 px-4 text-sm font-medium focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                  >
                    <FileText className="h-4 w-4 text-slate/50" />
                    Log Overview
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto p-7 pb-2">
              <h2 className="text-[24px] font-bold text-dark font-outfit mb-5">Activity Details</h2>

              {/* Two-column grid */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-0">

                {/* LEFT: Basic Information */}
                <div>
                  <h3 className="text-[15px] font-bold text-dark mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] font-bold text-dark">User&apos;s Name</p>
                      <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.name}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">User&apos;s ID</p>
                      <p className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 cursor-pointer hover:underline"
                        onClick={() => { setSelectedLog(null); router.push(`/dashboard/users/${selectedLog.id}`); }}>
                        {selectedLog.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Email</p>
                      <a href={`mailto:${selectedLog.email}`} className="text-[13px] text-[#1D84D9] font-semibold mt-0.5 hover:underline block">
                        {selectedLog.email}
                      </a>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Action</p>
                      <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.action}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Status</p>
                      <p className={`text-[13px] font-semibold mt-0.5 ${
                        selectedLog.status === "Successful" ? "text-emerald-500" :
                        selectedLog.status === "Failed" ? "text-red-500" :
                        selectedLog.status === "Pending" ? "text-orange-500" :
                        "text-slate/60"
                      }`}>{selectedLog.status}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Logged via</p>
                      <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.loggedVia}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Timestamp</p>
                      <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Performed By</p>
                      <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.performedBy}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-dark">Details</p>
                      <p className="text-[13px] text-slate/60 font-medium mt-0.5 whitespace-pre-line">{selectedLog.details}</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Security Verification + System Logs */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[15px] font-bold text-dark mb-4">Security Verification</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[12px] font-bold text-dark">Email Confirmation</p>
                        <p className="text-[13px] mt-0.5">
                          <span className="text-emerald-500 font-semibold">Approved</span>
                          <span className="text-slate/60 font-medium"> at {selectedLog.emailConfirmation.replace("Approved at ", "")}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-dark">Account Grade</p>
                        <p className="text-[13px] text-emerald-500 font-semibold mt-0.5">{selectedLog.accountGrade}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-dark">IP Address</p>
                        <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.ip}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-dark mb-4">System Logs</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[12px] font-bold text-dark">Log Entry ID</p>
                        <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.logId}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-dark">Log Recorded</p>
                        <p className="text-[13px] text-slate/60 font-medium mt-0.5">{selectedLog.logRecorded}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-dark">Notified Users</p>
                        <p className="text-[13px] text-slate/60 font-medium mt-0.5">Admin received confirmation email</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer: pinned View Profile button */}
            <div className="shrink-0 px-7 py-4 border-t border-border/20 flex justify-end">
              <Button
                onClick={() => { setSelectedLog(null); router.push(`/dashboard/users/${selectedLog.id}`); }}
                variant="outline"
                className="rounded-full px-8 h-10 border-border font-semibold text-sm text-dark hover:bg-surface cursor-pointer"
              >
                View Profile
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
