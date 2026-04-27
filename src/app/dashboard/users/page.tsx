"use client";

import { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  MoreVertical, 
  X, 
  Phone, 
  Mail, 
  ShieldAlert, 
  User as UserIcon,
  Clock,
  Layout,
  Loader2,
  Calendar,
  AlertCircle,
  Eye,
  Filter
} from "lucide-react";
import Link from "next/link";
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
import { toast } from "sonner";

const INITIAL_USERS = [
  {
    id: "ID5372527",
    name: "Simon Smith",
    email: "simon.smith@wealthconomy.com",
    phone: "+234567889274",
    status: "Active",
    preference: "Mixed Wealth",
    lastLogin: "05:45, April 12, 2023",
  },
  {
    id: "ID5372528",
    name: "Adewale Johnson",
    email: "adewale.j@gmail.com",
    phone: "+2348012345678",
    status: "Active",
    preference: "WealthFlow",
    lastLogin: "10:20, April 13, 2023",
  },
  {
    id: "ID5372529",
    name: "Chinelo Okoro",
    email: "c.okoro@outlook.com",
    phone: "+2347098765432",
    status: "Active",
    preference: "WealthFlex",
    lastLogin: "14:15, April 14, 2023",
  },
  {
    id: "ID5372530",
    name: "Babatunde Lawal",
    email: "blawal@wealthconomy.com",
    phone: "+234567889274",
    status: "Active",
    preference: "WealthFix",
    lastLogin: "09:30, April 15, 2023",
  },
  {
    id: "ID5372531",
    name: "Fatima Yusuf",
    email: "fatima.y@live.com",
    phone: "+2348123456789",
    status: "Suspended",
    preference: "WealthGoal",
    lastLogin: "11:00, April 16, 2023",
  },
  {
    id: "ID5372532",
    name: "Emeka Obi",
    email: "emeka.obi@gmail.com",
    phone: "+2349012345678",
    status: "Active",
    preference: "WealthFam",
    lastLogin: "16:45, April 17, 2023",
  },
];

const WEALTH_PLANS = ["WealthFix", "WealthFlex", "WealthFlow", "WealthFam", "WealthGoal", "Mixed Wealth"];

export default function UsersPage() {
  const router = useRouter();
  const [userList, setUserList] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("All Plans");
  
  // Suspension Multi-step State
  const [suspendStep, setSuspendStep] = useState(1); 
  const [suspendUser, setSuspendUser] = useState<any | null>(null);
  const [suspendData, setSuspendData] = useState({
    reason: "",
    duration: "30 Days"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = userList.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = selectedPlan === "All Plans" || user.preference === selectedPlan;
    
    return matchesSearch && matchesPlan;
  });

  const handleSuspendToggle = () => {
    if (!suspendUser) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const isSuspending = suspendUser.status === "Active";
      setUserList(userList.map(u => 
        u.id === suspendUser.id 
        ? { ...u, status: isSuspending ? "Suspended" : "Active" } 
        : u
      ));
      setIsSubmitting(false);
      setSuspendUser(null);
      setSuspendStep(1);
      setSuspendData({ reason: "", duration: "30 Days" });
      toast.success(`User successfully ${isSuspending ? 'suspended' : 'activated'}!`);
    }, 1500);
  };

  const closeSuspendModal = () => {
    if (!isSubmitting) {
      setSuspendUser(null);
      setSuspendStep(1);
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
          Users Management
        </h1>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              type="text"
              placeholder="Search for Name, Email, or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-12 bg-surface border-border/30 rounded-xl text-sm font-medium focus-visible:ring-primary/20 shadow-none transition-all"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-xl border-border/50 font-bold text-slate hover:bg-surface transition-all gap-2">
                <Filter className="h-4 w-4" />
                {selectedPlan}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border-border/50 p-2 shadow-xl">
               <DropdownMenuItem onClick={() => setSelectedPlan("All Plans")} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">All Plans</DropdownMenuItem>
               {WEALTH_PLANS.map(plan => (
                 <DropdownMenuItem key={plan} onClick={() => setSelectedPlan(plan)} className="rounded-xl py-2 px-4 text-sm font-medium cursor-pointer">{plan}</DropdownMenuItem>
               ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Content */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <Table>
          <TableHeader className="bg-surface/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-left">Name</TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Last Login</TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Email</TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">Plan Type</TableHead>
              <TableHead className="py-5 px-6 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                className="group border-border/50 hover:bg-surface/30 transition-all duration-200"
              >
                <TableCell className="py-5 px-6">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/dashboard/users/${user.id}`)}>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-border/5 group-hover:scale-105 transition-transform">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] text-dark group-hover:text-primary transition-colors">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate/40 uppercase tracking-tighter">{user.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <span className="text-slate/70 text-[11px] font-semibold whitespace-pre-line leading-relaxed italic">
                    {user.lastLogin}
                  </span>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <a href={`mailto:${user.email}`} className="text-primary hover:underline text-[13px] font-bold">
                    {user.email}
                  </a>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <div className="flex justify-center">
                    <Badge className={`${user.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-red-50 text-red-500 border-red-100/50"} px-4 py-1.5 rounded-xl gap-2 font-bold text-[10px] items-center border shadow-none transition-all`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {user.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6 text-center">
                   <span className="text-[11px] font-bold text-slate/70 px-4 py-2 bg-surface/50 rounded-lg">{user.preference}</span>
                </TableCell>
                <TableCell className="py-5 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-surface rounded-full transition-all active:scale-90">
                        <MoreVertical className="h-4.5 w-4.5 text-slate/40" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-[16px] border-border/50 shadow-xl p-1 animate-in slide-in-from-top-1 duration-200">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}`)} className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                         <Eye className="h-3.5 w-3.5 text-primary" />
                         View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSuspendUser(user)} className={`py-2.5 px-4 text-xs font-bold ${user.status === 'Active' ? 'text-red-500 focus:bg-red-50' : 'text-emerald-600 focus:bg-emerald-50'} cursor-pointer rounded-xl gap-2`}>
                         {user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-slate/20" />
                    <p className="text-sm font-medium text-slate/40">No users found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Multi-step Suspend Modal */}
      {suspendUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeSuspendModal} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-500">
            
            {suspendStep === 1 ? (
              /* Step 1: Input Reason and Duration */
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${suspendUser.status === 'Active' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      <ShieldAlert className={`h-5 w-5 ${suspendUser.status === 'Active' ? 'text-red-500' : 'text-emerald-600'}`} />
                   </div>
                   <button onClick={closeSuspendModal} className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-colors">
                      <X className="h-4.5 w-4.5 text-slate/60" />
                   </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    {suspendUser.status === 'Active' ? 'Suspend User' : 'Reactivate User'}
                  </h3>
                  <p className="text-sm font-medium text-slate/50 leading-relaxed">
                    Account management for <span className="text-dark font-bold">{suspendUser.name}</span>.
                  </p>
                </div>

                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[12px] font-bold text-dark/80 ml-1">Reason for {suspendUser.status === 'Active' ? 'Suspension' : 'Activation'}</label>
                      <textarea 
                        className="w-full min-h-[90px] p-4 bg-surface/50 border border-border/30 rounded-xl font-medium text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner"
                        placeholder="Type the reason here..."
                        value={suspendData.reason}
                        onChange={(e) => setSuspendData({...suspendData, reason: e.target.value})}
                      />
                   </div>

                   {suspendUser.status === 'Active' && (
                     <div className="space-y-2">
                        <label className="text-[12px] font-bold text-dark/80 ml-1">Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                           {["24 Hours", "7 Days", "30 Days", "Permanent"].map(d => (
                              <button 
                                key={d}
                                type="button"
                                onClick={() => setSuspendData({...suspendData, duration: d})}
                                className={`h-11 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${suspendData.duration === d ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-surface/50 border-border/30 text-slate hover:border-slate/30'}`}
                              >
                                 <Calendar className="h-3 w-3" />
                                 {d}
                              </button>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <Button 
                  onClick={() => { if(suspendData.reason) setSuspendStep(2); else toast.error("Please provide a reason") }}
                  className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${suspendUser.status === 'Active' ? 'bg-[#D93F3F] hover:bg-[#C23535] text-white shadow-red-900/10' : 'bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-primary/10'}`}
                >
                  Proceed to Review
                </Button>
              </div>
            ) : (
              /* Step 2: Confirmation Summary */
              <div className="p-8 space-y-6 animate-in slide-in-from-right-5 duration-300">
                 <div className="flex items-center justify-between">
                    <button onClick={() => setSuspendStep(1)} className="text-[12px] font-bold text-primary hover:underline transition-all">← Edit Details</button>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center bg-surface">
                       <AlertCircle className="h-4.5 w-4.5 text-slate/40" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">Confirm Action</h3>
                    <p className="text-sm font-medium text-slate/50">Final check before processing.</p>
                 </div>

                 <div className="bg-surface/30 border border-border/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/20">
                       <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-border/5">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${suspendUser.id}`} />
                          <AvatarFallback>{suspendUser.name[0]}</AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">User</p>
                          <p className="text-sm font-bold text-dark leading-none mt-1">{suspendUser.name}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">Action</p>
                          <p className={`text-xs font-bold ${suspendUser.status === 'Active' ? 'text-red-500' : 'text-emerald-600'}`}>
                             {suspendUser.status === 'Active' ? `Suspend (${suspendData.duration})` : 'Reactivate'}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate/30 uppercase tracking-tighter">Reason</p>
                          <p className="text-xs font-medium text-dark leading-relaxed line-clamp-3">"{suspendData.reason}"</p>
                       </div>
                    </div>
                 </div>

                 <Button 
                   onClick={handleSuspendToggle}
                   disabled={isSubmitting}
                   className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${suspendUser.status === 'Active' ? 'bg-[#D93F3F] hover:bg-[#C23535] text-white shadow-red-900/10' : 'bg-[#155D5F] hover:bg-[#0F4A4C] text-white shadow-primary/10'}`}
                 >
                   {isSubmitting ? (
                     <Loader2 className="h-4 w-4 animate-spin mx-auto text-white/80" />
                   ) : (
                    `Confirm ${suspendUser.status === 'Active' ? 'Suspension' : 'Activation'}`
                   )}
                 </Button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
