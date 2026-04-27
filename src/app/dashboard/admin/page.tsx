"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  X,
  User,
  Mail,
  Lock,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
import { toast } from "sonner";

// Mock Data
const INITIAL_ADMINS = [
  {
    id: "1",
    name: "Simon Olabiran",
    email: "simon.olabiran@wealthconomy.com",
    status: "Online",
    timestamp: "Currently Active",
    image: "https://i.pravatar.cc/150?u=1",
    role: "Super Admin",
  },
  {
    id: "2",
    name: "Fatima Yusuf",
    email: "fatima.y@wealthconomy.com",
    status: "Online",
    timestamp: "Currently Active",
    image: "https://i.pravatar.cc/150?u=2",
    role: "Admin",
  },
  {
    id: "3",
    name: "Jessica Smith",
    email: "j.smith@wealthconomy.com",
    status: "Online",
    timestamp: "Currently Active",
    image: "https://i.pravatar.cc/150?u=3",
    role: "Editor",
  },
  {
    id: "4",
    name: "John Doe",
    email: "john.doe@wealthconomy.com",
    status: "Online",
    timestamp: "Currently Active",
    image: "https://i.pravatar.cc/150?u=4",
    role: "Admin",
  },
  {
    id: "5",
    name: "Ali Ahmed",
    email: "ali.ahmed@wealthconomy.com",
    status: "Offline",
    timestamp: "05:45, April 12, 2023",
    image: "https://i.pravatar.cc/150?u=5",
    role: "Viewer",
  },
];

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal/Side-Sheet states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<any | null>(null);
  const [editAdmin, setEditAdmin] = useState<any | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<any | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Creation
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin",
  });

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newAdmin = {
        id: (admins.length + 1).toString(),
        name: formData.name,
        email: formData.email,
        status: "Offline",
        timestamp: "Just now",
        image: `https://i.pravatar.cc/150?u=${admins.length + 1}`,
        role: formData.role,
      };

      setAdmins([newAdmin, ...admins]);
      setIsSubmitting(false);
      setIsCreateModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "Admin" });
      toast.success("Administrator created successfully!");
    }, 1000);
  };

  const handleUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setAdmins(
        admins.map((a) => (a.id === editAdmin.id ? { ...a, ...editAdmin } : a)),
      );
      setIsSubmitting(false);
      setEditAdmin(null);
      toast.success("Administrator updated successfully!");
    }, 1000);
  };

  const handleDeleteAdmin = () => {
    if (!deleteAdmin) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setAdmins(admins.filter((a) => a.id !== deleteAdmin.id));
      setIsSubmitting(false);
      setDeleteAdmin(null);
      toast.success("Administrator removed successfully");
    }, 1000);
  };

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
          Admin Management
        </h1>

        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              placeholder="Search for admin or email"
              className="pl-11 bg-surface/50 border-border/30 rounded-xl h-11 text-sm font-medium focus-visible:ring-primary/20 shadow-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#155D5F] hover:bg-[#0F4A4C] text-white rounded-xl h-11 px-6 gap-2 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add an admin
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <Table>
          <TableHeader className="bg-surface/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Name
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Email
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-center">
                Status
              </TableHead>
              <TableHead className="py-5 px-6 text-slate/50 font-bold text-[11px] uppercase tracking-widest">
                Timestamp
              </TableHead>
              <TableHead className="py-5 px-6 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow
                key={admin.id}
                className="group border-border/50 hover:bg-surface/30 transition-all duration-200"
              >
                <TableCell className="py-5 px-6">
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setViewAdmin(admin)}
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-border/5 group-hover:scale-105 transition-transform">
                      <AvatarImage src={admin.image} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                        {admin.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] text-dark group-hover:text-primary transition-colors">
                        {admin.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate/40 uppercase tracking-tighter">
                        {admin.role}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <a
                    href={`mailto:${admin.email}`}
                    className="text-primary hover:underline text-[13px] font-bold"
                  >
                    {admin.email}
                  </a>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <div className="flex justify-center">
                    <Badge
                      className={`${admin.status === "Online" ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-slate-50 text-slate-400 border-slate-100/50"} px-4 py-1.5 rounded-xl gap-2 font-bold text-[10px] items-center border shadow-none transition-all`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${admin.status === "Online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-400"}`}
                      />
                      {admin.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <span className="text-slate/70 text-[12px] font-semibold whitespace-pre-line leading-relaxed">
                    {admin.timestamp}
                  </span>
                </TableCell>
                <TableCell className="py-5 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 p-0 hover:bg-surface rounded-full transition-all active:scale-90"
                      >
                        <MoreVertical className="h-4.5 w-4.5 text-slate/40" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-[16px] border-border/50 shadow-xl p-1 animate-in slide-in-from-top-1 duration-200"
                    >
                      <DropdownMenuItem
                        onClick={() => setViewAdmin(admin)}
                        className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditAdmin(admin)}
                        className="py-2.5 px-4 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2"
                      >
                        Edit Admin
                      </DropdownMenuItem>
                      <div className="h-px bg-border/30 my-1 mx-1" />
                      <DropdownMenuItem
                        onClick={() => setDeleteAdmin(admin)}
                        className="py-2.5 px-4 text-xs font-bold focus:bg-red-50 text-red-500 cursor-pointer rounded-xl gap-2"
                      >
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

      {/* Empty State */}
      {filteredAdmins.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Search className="h-10 w-10 text-slate/20" />
          </div>
          <h3 className="text-xl font-bold text-dark font-outfit tracking-tight">
            No admins found
          </h3>
          <p className="text-slate/40 text-sm font-medium max-w-[280px] mt-2 leading-relaxed">
            Try adjusting your search criteria or add a new administrator.
          </p>
        </div>
      )}

      {/* Create Admin Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl border border-border/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                  Add New Admin
                </h3>
                <p className="text-[13px] font-medium text-slate/50 mt-0.5">
                  Invite a new administrator.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-all"
              >
                <X className="h-4.5 w-4.5 text-slate/60" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-8 pt-2 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
                    <Input
                      placeholder="e.g. Adeleye Ayodeji"
                      className="h-11 pl-11 bg-surface border-border/30 rounded-xl font-medium focus-visible:ring-primary/20 shadow-none border"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
                    <Input
                      type="email"
                      placeholder="admin@wealthconomy.com"
                      className="h-11 pl-11 bg-surface border-border/30 rounded-xl font-medium focus-visible:ring-primary/20 shadow-none border"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Set Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-11 pl-11 bg-surface border-border/30 rounded-xl font-medium focus-visible:ring-primary/20 shadow-none border"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Assign Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Admin", "Super Admin", "Editor", "Viewer"].map(
                      (role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData({ ...formData, role })}
                          className={`h-10 px-4 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-2 ${formData.role === role ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-surface/50 border-border/30 text-slate hover:border-slate/30"}`}
                        >
                          <Shield
                            className={`h-3 w-3 ${formData.role === role ? "text-primary" : "text-slate/40"}`}
                          />
                          {role}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-slate hover:bg-surface border border-border/50 text-[13px]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold shadow-lg shadow-primary/5 transition-all text-[13px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                  ) : (
                    "Create Admin"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setEditAdmin(null)}
          />
          <div className="relative bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl border border-border/40 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                  Edit Admin
                </h3>
                <p className="text-[13px] font-medium text-slate/50 mt-0.5">
                  Update details and permissions.
                </p>
              </div>
              <button
                onClick={() => setEditAdmin(null)}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-all"
              >
                <X className="h-4.5 w-4.5 text-slate/60" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin} className="p-8 pt-2 space-y-6">
              <div className="space-y-5">
                <div className="text-center flex flex-col items-center mb-2">
                  <Avatar className="h-20 w-20 border-3 border-white shadow-md ring-1 ring-border/10">
                    <AvatarImage src={editAdmin.image} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                      {editAdmin.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button className="text-[10px] font-bold text-primary mt-2 uppercase tracking-wide hover:opacity-80 transition-all">
                    Change Photo
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
                    <Input
                      className="h-11 pl-11 bg-surface border-border/30 rounded-xl font-medium focus-visible:ring-primary/20 shadow-none border"
                      value={editAdmin.name}
                      onChange={(e) =>
                        setEditAdmin({ ...editAdmin, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
                    <Input
                      className="h-11 pl-11 bg-surface border-border/30 rounded-xl font-medium focus-visible:ring-primary/20 shadow-none border"
                      value={editAdmin.email}
                      onChange={(e) =>
                        setEditAdmin({ ...editAdmin, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark/80 ml-1">
                    Update Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Admin", "Super Admin", "Editor", "Viewer"].map(
                      (role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setEditAdmin({ ...editAdmin, role })}
                          className={`h-10 px-4 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-2 ${editAdmin.role === role ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-surface/50 border-border/30 text-slate hover:border-slate/30"}`}
                        >
                          <Shield
                            className={`h-3 w-3 ${editAdmin.role === role ? "text-primary" : "text-slate/40"}`}
                          />
                          {role}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditAdmin(null)}
                  className="flex-1 h-12 rounded-xl font-bold text-slate hover:bg-surface border border-border/50 text-[13px]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold shadow-lg shadow-primary/5 transition-all text-[13px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setDeleteAdmin(null)}
          />
          <div className="relative bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl border border-border/40 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center rotate-3 shadow-inner">
                <AlertCircle className="h-8 w-8 text-[#D93F3F]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                  Remove Admin?
                </h3>
                <p className="text-[13px] font-medium text-slate/50 leading-relaxed">
                  You are about to remove{" "}
                  <span className="text-dark font-bold">
                    {deleteAdmin.name}
                  </span>
                  .
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteAdmin(null)}
                className="h-11 rounded-lg border border-border/50 font-bold text-slate hover:bg-surface transition-all text-[12px]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAdmin}
                disabled={isSubmitting}
                className="h-11 rounded-lg bg-[#D93F3F] hover:bg-[#C23535] text-white font-bold shadow-lg shadow-red-900/5 transition-all active:scale-95 text-[12px]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-white/80" />
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Admin Side-Sheet */}
      {viewAdmin && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setViewAdmin(null)}
          />
          <div className="relative bg-white w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 pb-5 border-b border-border/20 flex items-center justify-between">
              <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                Admin Profile
              </h3>
              <button
                onClick={() => setViewAdmin(null)}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-all active:scale-90"
              >
                <X className="h-4 w-4 text-slate/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-3 border-white shadow-xl ring-1 ring-border/10 relative z-10">
                    <AvatarImage src={viewAdmin.image} />
                    <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold font-outfit">
                      {viewAdmin.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-emerald-500 border-3 border-white rounded-full z-20 shadow-md" />
                </div>
                <h4 className="text-2xl font-bold font-outfit text-dark mt-6 mb-1.5 leading-tight">
                  {viewAdmin.name}
                </h4>
                <Badge className="bg-[#155D5F]/5 text-[#155D5F] border-none font-bold px-5 py-1.5 rounded-full text-[9px] uppercase tracking-wider shadow-sm">
                  {viewAdmin.role}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-5 bg-surface/30 rounded-[20px] border border-border/20 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate/30 uppercase tracking-widest">
                      Email address
                    </p>
                    <p className="text-sm font-bold text-dark">
                      {viewAdmin.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate/30 uppercase tracking-widest">
                      Account Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-sm font-bold text-emerald-600 truncate">
                        Active - {viewAdmin.status}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate/30 uppercase tracking-widest">
                      Last Activity
                    </p>
                    <p className="text-xs font-bold text-dark italic">
                      {viewAdmin.timestamp}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <p className="text-[10px] font-bold text-slate/30 uppercase tracking-widest">
                    Access Permissions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Dashboard",
                      "Blog Engine",
                      "User Records",
                      "Financials",
                    ].map((p) => (
                      <span
                        key={p}
                        className="px-3.5 py-1.5 bg-white rounded-lg border border-border/40 text-[10px] font-bold text-dark/70 shadow-sm"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-white border-t border-border/20 grid grid-cols-1 gap-3">
              <Button
                onClick={() => {
                  const a = viewAdmin;
                  setViewAdmin(null);
                  setEditAdmin(a);
                }}
                className="h-12 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold shadow-lg shadow-primary/5 transition-all text-[13px]"
              >
                Modify Permissions
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const a = viewAdmin;
                  setViewAdmin(null);
                  setDeleteAdmin(a);
                }}
                className="h-12 rounded-xl border-border/40 text-red-500 hover:bg-red-50 font-bold transition-all text-[13px]"
              >
                Remove from Team
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
