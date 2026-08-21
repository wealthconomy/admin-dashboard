"use client";

import { useState, useEffect } from "react";
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
  FolderLock,
  CheckCircle2,
  Trash2,
  Info,
  ShieldAlert,
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
import {
  useGetTeamQuery,
  useGetRolesQuery,
  useProvisionTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation
} from "@/lib/redux/features/adminApi";

import {
  DASHBOARD_PAGES,
  deriveSemanticPermissions,
  getPagePathsFromPermissions,
} from "@/lib/permissions";

// Helper to extract the safe array from backend response wrapper
const getSafeArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data?.items)) return data.data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};



export default function AdminManagementPage() {
  const [activeTab, setActiveTab] = useState<"admins" | "roles">("admins");
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useGetTeamQuery(undefined);
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useGetRolesQuery(undefined);
  const admins = getSafeArray(teamData).map((admin: any) => {
    const userObj = admin.user || admin;
    return {
      ...admin,
      id: admin.id || admin._id,
      name: `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.name || userObj.email,
      status: admin.isActive === false ? "Offline" : "Online",
      timestamp: admin.lastLogin || "Currently Active",
      image: userObj.imageUrl || admin.imageUrl || "",
      role: admin.role === "CUSTOM" && admin.customRole ? admin.customRole.name : admin.role,
      allowedPages: admin.allowedPages || [],
      email: userObj.email || admin.email,
    };
  });
  const roles = [
    ...getSafeArray(rolesData).map((role: any) => {
      const rawPermissions: string[] = role.permissions || role.allowedPages || [];
      // Normalise to UI page paths for display & checkbox state.
      // Custom roles store semantic strings; built-in roles may store UI paths.
      const uiPages = getPagePathsFromPermissions(rawPermissions);
      return {
        ...role,
        id: role.id || role._id,
        name: role.name,
        description: role.description,
        allowedPages: uiPages,          // UI paths — used for display & checkboxes
        rawPermissions,                 // original semantic strings — used when saving
        isSystem: role.isBuiltIn || role.isSystem || false,
      };
    })
  ];

  const [searchQuery, setSearchQuery] = useState("");

  const [provisionTeamMember] = useProvisionTeamMemberMutation();
  const [updateTeamMember] = useUpdateTeamMemberMutation();
  const [deleteTeamMember] = useDeleteTeamMemberMutation();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRoleMutation] = useDeleteRoleMutation();

  // Modals state for admin accounts
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<any | null>(null);
  const [editAdmin, setEditAdmin] = useState<any | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<any | null>(null);

  // Modals state for roles
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [editRole, setEditRole] = useState<any | null>(null);
  const [deleteRole, setDeleteRole] = useState<any | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Admin Account creation/editing
  const [adminFormData, setAdminFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin",
    allowedPages: [] as string[],
  });

  // Role form state
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    allowedPages: ["/dashboard/settings"] as string[],
  });

  // Pre-fill pages checkboxes when selected role changes in admin forms
  useEffect(() => {
    // Use the already-normalised `roles` array (UI paths) instead of raw rolesData
    const selectedRoleObj = roles.find((r: any) => r.name === adminFormData.role);
    if (selectedRoleObj) {
      const expandedPages = selectedRoleObj.allowedPages.includes("*")
        ? DASHBOARD_PAGES.map(p => p.path)
        : [...selectedRoleObj.allowedPages];

      setAdminFormData((prev) => ({
        ...prev,
        allowedPages: expandedPages,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminFormData.role, rolesData]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.name || !adminFormData.email || !adminFormData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const [firstName, ...lastNameParts] = adminFormData.name.split(" ");
      const lastName = lastNameParts.join(" ");
      
      const builtinRolesList = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
      let rolePayload = adminFormData.role;
      let customRoleId = undefined;

      if (!builtinRolesList.includes(rolePayload)) {
        const selectedRoleObj = roles.find((r: any) => r.name === rolePayload);
        rolePayload = "CUSTOM";
        if (selectedRoleObj) {
           customRoleId = selectedRoleObj.id;
        }
      }

      await provisionTeamMember({
        email: adminFormData.email,
        firstName,
        lastName,
        password: adminFormData.password,
        role: rolePayload,
        customRoleId,
        allowedPages: adminFormData.allowedPages,
      }).unwrap();

      toast.success("Admin account created successfully!");
      setIsCreateModalOpen(false);
      setAdminFormData({ name: "", email: "", password: "", role: "Admin", allowedPages: [] });
      refetchTeam();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;

    setIsSubmitting(true);
    try {
      const builtinRolesList = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
      let rolePayload = editAdmin.role;
      let customRoleId = undefined;

      if (!builtinRolesList.includes(rolePayload)) {
        const selectedRoleObj = roles.find((r: any) => r.name === rolePayload);
        rolePayload = "CUSTOM";
        if (selectedRoleObj) {
           customRoleId = selectedRoleObj.id;
        }
      }

      await updateTeamMember({
        id: editAdmin.id,
        role: rolePayload,
        customRoleId,
        allowedPages: editAdmin.allowedPages,
      }).unwrap();

      updateSimulatedProfiles(editAdmin);
      toast.success("Administrator privileges updated successfully!");
      setEditAdmin(null);
      refetchTeam();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdmin) return;
    setIsSubmitting(true);
    try {
      await deleteTeamMember(deleteAdmin.id).unwrap();
      toast.success("Administrator profile removed.");
      setDeleteAdmin(null);
      refetchTeam();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Roles CRUD logic
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name || !roleFormData.description) {
      toast.error("Please enter a role name and description");
      return;
    }

    setIsSubmitting(true);
    try {
      // Derive semantic backend permissions from the selected UI page paths
      const semanticPermissions = deriveSemanticPermissions(roleFormData.allowedPages);

      await createRole({
        name: roleFormData.name,
        description: roleFormData.description,
        permissions: semanticPermissions,
      }).unwrap();

      toast.success(`Role '${roleFormData.name}' added!`);
      setIsCreateRoleOpen(false);
      setRoleFormData({ name: "", description: "", allowedPages: [] });
      if (typeof window !== "undefined") localStorage.removeItem("deniedPaths");
      refetchRoles();
      refetchTeam();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole) return;

    setIsSubmitting(true);
    try {
      // Derive semantic backend permissions from the selected UI page paths
      const semanticPermissions = deriveSemanticPermissions(editRole.allowedPages);

      await updateRole({
        id: editRole.id,
        name: editRole.name,
        description: editRole.description,
        permissions: semanticPermissions,
      }).unwrap();

      toast.success("Role permissions updated successfully!");
      setEditRole(null);
      if (typeof window !== "undefined") localStorage.removeItem("deniedPaths");
      refetchRoles();
      refetchTeam();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRole) return;
    try {
      await deleteRoleMutation(deleteRole.id).unwrap();
      toast.success("Role deleted.");
      setDeleteRole(null);
      refetchRoles();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete role");
    }
  };

  // Sync state with active developer simulator in layout storage
  const updateSimulatedProfiles = (admin: any) => {
    const activeProfileStr = localStorage.getItem("activeAdminProfile");
    if (activeProfileStr) {
      const active = JSON.parse(activeProfileStr);
      if (active.email === admin.email) {
        // Swapped admin is currently logged in! Update layout profile permissions
        const updated = {
          name: admin.name,
          role: admin.role,
          email: admin.email,
          avatar: admin.image,
          allowedPages: admin.allowedPages,
        };
        localStorage.setItem("activeAdminProfile", JSON.stringify(updated));
        localStorage.setItem("adminRole", admin.role);
        localStorage.setItem("adminName", admin.name.split(" ")[0]);
        // Trigger storage update event for navigation layout
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  // Toggle pages selection
  const togglePageSelection = (path: string, isEdit: boolean, editAdminObj?: any) => {
    if (isEdit && editAdminObj) {
      const current = editAdminObj.allowedPages || [];
      const updated = current.includes(path)
        ? current.filter((p: string) => p !== path)
        : [...current, path];
      setEditAdmin({ ...editAdminObj, allowedPages: updated });
    } else {
      const current = adminFormData.allowedPages;
      const updated = current.includes(path)
        ? current.filter((p: string) => p !== path)
        : [...current, path];
      setAdminFormData((prev) => ({ ...prev, allowedPages: updated }));
    }
  };

  // Filter accounts
  const filteredAdmins = admins.filter(
    (admin: any) =>
      (admin?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin?.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[20px] p-4 sm:p-6 md:p-8 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[900px] mx-auto flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header Info */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            Admin Management
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Super Admin Only
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Create administrative accounts, set custom security roles, and map module permissions.
          </p>
        </div>

        {/* Top bar controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Tabs switch */}
          <div className="flex bg-surface p-1 rounded-xl border border-border/20 shrink-0">
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "admins" ? "bg-white text-[#155D5F] shadow-sm" : "text-slate/60 hover:text-dark"
              }`}
            >
              Admin Accounts
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "roles" ? "bg-white text-[#155D5F] shadow-sm" : "text-slate/60 hover:text-dark"
              }`}
            >
              Roles & Permissions Matrix
            </button>
          </div>

          <div className="relative w-full sm:flex-1 md:w-[220px] md:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
            <Input
              placeholder="Search admin, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
            />
          </div>

          {activeTab === "admins" ? (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#155D5F] hover:bg-[#0F4A4C] text-white rounded-xl h-10 px-4 gap-2 font-bold shadow-lg shadow-[#155D5F]/10 transition-all active:scale-95 text-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Admin
            </Button>
          ) : (
            <Button
              onClick={() => setIsCreateRoleOpen(true)}
              className="bg-[#155D5F] hover:bg-[#0F4A4C] text-white rounded-xl h-10 px-4 gap-2 font-bold shadow-lg shadow-[#155D5F]/10 transition-all active:scale-95 text-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Custom Role
            </Button>
          )}
        </div>
      </div>

      {/* Tab content 1: ADMINS ACCOUNTS GRID */}
      {activeTab === "admins" && (
        <div className="flex flex-col gap-4">
          <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-surface/50">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[220px]">Administrator</TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[220px]">Email Address</TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest w-[200px]">Session Status</TableHead>
                    <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Allowed Privileges</TableHead>
                    <TableHead className="py-4 px-4 w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto" />
                          <p className="text-sm font-medium text-slate/40">Loading administrators...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin: any) => (
                      <TableRow key={admin.id} className="group border-border/50 hover:bg-surface/30 transition-all duration-200">
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => setViewAdmin(admin)}>
                            <Avatar className="h-9 w-9 border border-primary/5 shadow-sm shrink-0">
                              <AvatarImage src={admin.image} />
                              <AvatarFallback className="bg-primary/5 text-primary text-[11px] font-bold">
                                {(admin?.name || "U").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[13.5px] text-dark leading-snug truncate">{admin.name}</span>
                                <Badge className="bg-slate-50 text-slate/50 border border-border/25 text-[9px] font-extrabold px-1.5 py-0 rounded">{admin.role}</Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="text-[13px] font-bold text-slate/60 block truncate">{admin.email}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-start gap-1">
                            {admin.status === "Online" ? (
                              <div className="flex flex-col gap-0.5">
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-2.5 py-1 rounded-lg gap-1.5 font-bold text-[10px] items-center border shadow-none w-max">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Online
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-slate-50 text-slate-400 border-slate-100 px-2.5 py-1 rounded-lg gap-1.5 font-bold text-[10px] items-center border shadow-none w-max">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  Offline
                                </Badge>
                                <span className="text-[10px] font-bold text-slate/40 pl-0.5">Logged out {admin.timestamp}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {admin.allowedPages.includes("*") || admin.allowedPages.length === DASHBOARD_PAGES.length ? (
                              <span className="px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold rounded">Full Dynamic Access</span>
                            ) : (
                              admin.allowedPages.slice(0, 3).map((p: any) => {
                                const matched = DASHBOARD_PAGES.find((dp) => dp.path === p);
                                return matched ? (
                                  <span key={p} className="px-2 py-1 bg-[#E8F3F3] border border-[#155D5F]/10 text-[#155D5F] text-[10px] font-bold rounded">{matched.label}</span>
                                ) : null;
                              })
                            )}
                            {admin.allowedPages.length > 3 && !admin.allowedPages.includes("*") && admin.allowedPages.length !== DASHBOARD_PAGES.length && (
                              <span className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate/40 text-[10px] font-bold rounded">+{admin.allowedPages.length - 3} more</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-surface rounded-full">
                                <MoreVertical className="h-4 w-4 text-slate/40" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-2xl border-border/50 shadow-xl p-1 bg-white">
                              <DropdownMenuItem onClick={() => setViewAdmin(admin)} className="py-2 px-3 text-xs font-bold text-dark cursor-pointer rounded-xl">View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditAdmin(admin)} className="py-2 px-3 text-xs font-bold text-dark cursor-pointer rounded-xl">Edit Admin Details</DropdownMenuItem>
                              <div className="h-px bg-border/20 my-1 mx-1" />
                              <DropdownMenuItem onClick={() => setDeleteAdmin(admin)} className="py-2 px-3 text-xs font-bold text-red-500 cursor-pointer rounded-xl hover:bg-red-50">Remove Admin</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-slate/20" />
                          <p className="text-sm font-medium text-slate/40">No administrator accounts match your criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {rolesLoading ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto" />
              <p className="text-sm font-medium text-slate/40">Loading roles and permissions...</p>
            </div>
          ) : roles.map((role: any) => (
            <div key={role.id} className="bg-surface/30 border border-border/40 hover:border-[#155D5F]/30 hover:bg-white rounded-[20px] p-6 flex flex-col justify-between gap-6 transition-all duration-300 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.01)] hover:shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge className="bg-[#155D5F]/5 text-[#155D5F] border-[#155D5F]/10 border font-extrabold px-3.5 py-1.5 text-[11px] tracking-wider rounded-lg uppercase">
                    {role.name}
                  </Badge>
                  {role.isSystem && (
                    <Badge className="bg-slate-100 text-slate-400 border-none text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">System Default</Badge>
                  )}
                </div>
                
                <h4 className="text-[13.5px] font-bold text-slate/60 leading-relaxed">{role.description}</h4>
              </div>

              <div className="space-y-4">
                <div className="border-t border-border/20 pt-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate/40 uppercase tracking-widest block">Dashboard Modules Permission Matrix</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[105px] overflow-y-auto custom-scrollbar pr-1">
                    {role.allowedPages.includes("*") ? (
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10.5px] font-bold rounded-lg shadow-sm">Full Dynamic Access</span>
                    ) : (
                      role.allowedPages.map((p: any) => {
                        const matched = DASHBOARD_PAGES.find((dp) => dp.path === p);
                        return matched ? (
                          <span key={p} className="px-2.5 py-1 bg-white border border-border/30 text-dark/75 text-[10.5px] font-bold rounded-lg shadow-sm">{matched.label}</span>
                        ) : null;
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-4">
                  <Button
                    onClick={() => {
                      const perms = role.allowedPages.includes("*") 
                        ? DASHBOARD_PAGES.map(p => p.path) 
                        : [...role.allowedPages];
                      setEditRole({ ...role, allowedPages: perms });
                    }}
                    className="h-9 rounded-lg px-4 bg-[#E8F3F3] text-[#155D5F] hover:bg-[#155D5F]/15 text-[11.5px] font-bold border border-transparent shadow-none cursor-pointer"
                  >
                    Edit Role
                  </Button>
                  {!role.isSystem && (
                    <Button
                      onClick={() => setDeleteRole(role)}
                      className="h-9 rounded-lg px-3 text-red-500 hover:bg-red-50 hover:border-red-100 text-[11.5px] font-bold border border-transparent shadow-none cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ADMIN MODAL WITH CHECKBOXES MODULE PRIVILEGES */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isSubmitting && setIsCreateModalOpen(false)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[500px] shadow-2xl border border-border/40 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-3 border-b border-border/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit text-dark tracking-tight">Add New Admin Account</h3>
                <p className="text-[11px] font-medium text-slate/40 mt-0.5">Map custom role and configure directory page privileges.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80">
                <X className="h-4.5 w-4.5 text-slate/50" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                    <Input
                      placeholder="Adeleye Ayodeji"
                      className="h-10 pl-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                      value={adminFormData.name}
                      onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                      <Input
                        type="email"
                        placeholder="a.ayodeji@wealthconomy.com"
                        className="h-10 pl-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                        value={adminFormData.email}
                        onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-10 pl-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Dropdown containing dynamic roles list */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Primary Administrative Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r: any) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setAdminFormData({ ...adminFormData, role: r.name })}
                        className={`h-9 px-3 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between ${
                          adminFormData.role === r.name ? "bg-[#E8F3F3] border-[#155D5F] text-[#155D5F]" : "bg-white border-border/30 text-slate hover:border-slate/30"
                        }`}
                      >
                        <span className="truncate">{r.name}</span>
                        {adminFormData.role === r.name && <CheckCircle2 className="h-3 w-3 shrink-0 text-[#155D5F]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkbox grid to toggle individual permitted pages */}
                <div className="space-y-2 border-t border-border/10 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Custom Module Permissions Overrides</label>
                    <span className="text-[9px] font-bold text-slate/40 bg-surface px-2 py-0.5 rounded-full">{adminFormData.allowedPages.includes("*") ? "All" : adminFormData.allowedPages.length} permitted</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-surface/30 border border-border/20 p-3 rounded-xl max-h-[170px] overflow-y-auto custom-scrollbar">
                    {DASHBOARD_PAGES.map((page) => {
                      const isChecked = adminFormData.allowedPages.includes("*") || adminFormData.allowedPages.includes(page.path);
                      return (
                        <label key={page.path} className={`flex items-center gap-2.5 p-2 bg-white rounded-lg border ${isChecked ? "border-[#155D5F]/20" : "border-border/15"} hover:border-[#155D5F]/20 cursor-pointer select-none`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePageSelection(page.path, false)}
                            className="h-3.5 w-3.5 rounded-md border-slate-300 text-[#155D5F] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#155D5F]"
                          />
                          <span className={`text-[10px] font-bold ${isChecked ? "text-[#155D5F]" : "text-dark/70"} truncate`}>{page.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate/40 italic pl-1 leading-normal">
                    Tip: Changing the primary role automatically loads its default page matrix, but you can check/uncheck individual boxes to customize their active directory access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="flex-1 h-11 rounded-xl border border-border/50 text-[11px] font-bold text-slate" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-[11px] font-bold shadow-lg shadow-primary/5">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Deploy Admin Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN PRIVILEGES MODAL */}
      {editAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isSubmitting && setEditAdmin(null)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[500px] shadow-2xl border border-border/40 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-3 border-b border-border/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit text-dark tracking-tight">Edit Administrator Privileges</h3>
                <p className="text-[11px] font-medium text-slate/40 mt-0.5">Modify system-wide role or manually alter allowed directory modules.</p>
              </div>
              <button onClick={() => setEditAdmin(null)} className="h-8 w-8 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80">
                <X className="h-4.5 w-4.5 text-slate/50" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 bg-surface/30 border border-border/20 p-3.5 rounded-xl">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                    <AvatarImage src={editAdmin.image} />
                    <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">{(editAdmin?.name || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xs font-bold text-dark">{editAdmin.name}</h4>
                    <p className="text-[10px] text-slate/40 font-medium mt-0.5">{editAdmin.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Update Active Administrative Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r: any) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          const perms = r.allowedPages.includes("*") 
                            ? DASHBOARD_PAGES.map(p => p.path) 
                            : [...r.allowedPages];
                          setEditAdmin({ ...editAdmin, role: r.name, allowedPages: perms });
                        }}
                        className={`h-9 px-3 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between ${
                          editAdmin.role === r.name ? "bg-[#E8F3F3] border-[#155D5F] text-[#155D5F]" : "bg-white border-border/30 text-slate hover:border-slate/30"
                        }`}
                      >
                        <span className="truncate">{r.name}</span>
                        {editAdmin.role === r.name && <CheckCircle2 className="h-3 w-3 shrink-0 text-[#155D5F]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkbox grid for allowed pages */}
                <div className="space-y-2 border-t border-border/10 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Configure Custom Page Mapping</label>
                    <span className="text-[9px] font-bold text-slate/40 bg-surface px-2 py-0.5 rounded-full">{(editAdmin.allowedPages || []).includes("*") ? "All" : (editAdmin.allowedPages || []).length} permitted</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-surface/30 border border-border/20 p-3 rounded-xl max-h-[170px] overflow-y-auto custom-scrollbar">
                    {DASHBOARD_PAGES.map((page) => {
                      const isChecked = (editAdmin.allowedPages || []).includes("*") || (editAdmin.allowedPages || []).includes(page.path);
                      return (
                        <label key={page.path} className={`flex items-center gap-2.5 p-2 bg-white rounded-lg border ${isChecked ? "border-[#155D5F]/20" : "border-border/15"} hover:border-[#155D5F]/20 cursor-pointer select-none`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePageSelection(page.path, true, editAdmin)}
                            className="h-3.5 w-3.5 rounded-md border-slate-300 text-[#155D5F] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#155D5F]"
                          />
                          <span className={`text-[10px] font-bold ${isChecked ? "text-[#155D5F]" : "text-dark/70"} truncate`}>{page.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setEditAdmin(null)} className="flex-1 h-11 rounded-xl border border-border/50 text-[11px] font-bold text-slate" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-[11px] font-bold shadow-lg shadow-primary/5">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Apply New Permissions"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CUSTOM ROLE MODAL WITH PAGE MATRIX */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isSubmitting && setIsCreateRoleOpen(false)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl border border-border/40 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-3 border-b border-border/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit text-dark tracking-tight">Create Custom Role</h3>
                <p className="text-[11px] font-medium text-slate/40 mt-0.5">Establish a new security group and set its system default permissions.</p>
              </div>
              <button onClick={() => setIsCreateRoleOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80">
                <X className="h-4.5 w-4.5 text-slate/50" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Role Name</label>
                  <Input
                    placeholder="e.g. Content Writer, Auditor..."
                    className="h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Security Description</label>
                  <Input
                    placeholder="e.g. Manages blog posts, articles, and public library materials."
                    className="h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  />
                </div>

                {/* Page Permitted matrix */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Default Modules Access Mapping</label>
                  <div className="grid grid-cols-2 gap-2 bg-surface/30 border border-border/20 p-3 rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar">
                    {DASHBOARD_PAGES.map((page) => {
                      const isChecked = roleFormData.allowedPages.includes(page.path);
                      return (
                        <label key={page.path} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-border/15 hover:border-[#155D5F]/20 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? roleFormData.allowedPages.filter((p) => p !== page.path)
                                : [...roleFormData.allowedPages, page.path];
                              setRoleFormData({ ...roleFormData, allowedPages: updated });
                            }}
                            className="h-3.5 w-3.5 rounded-md border-slate-300 text-[#155D5F] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#155D5F]"
                          />
                          <span className="text-[10px] font-bold text-dark/70 truncate">{page.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateRoleOpen(false)} className="flex-1 h-11 rounded-xl border border-border/50 text-[11px] font-bold text-slate" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-[11px] font-bold shadow-lg shadow-primary/5">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Deploy Dynamic Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isSubmitting && setEditRole(null)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl border border-border/40 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-3 border-b border-border/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit text-dark tracking-tight">Edit Role Permissions</h3>
                <p className="text-[11px] font-medium text-slate/40 mt-0.5">Edit default permissions for '{editRole.name}' role.</p>
              </div>
              <button onClick={() => setEditRole(null)} className="h-8 w-8 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80">
                <X className="h-4.5 w-4.5 text-slate/50" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Role Name</label>
                  <Input
                    className="h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                    value={editRole.name}
                    onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                    disabled={editRole.isSystem} // Prevent renaming system roles
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Role Description</label>
                  <Input
                    className="h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none border"
                    value={editRole.description}
                    onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                  />
                </div>

                {/* Page checklist */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-dark/70 ml-0.5">Mapped Pages Matrix</label>
                  <div className="grid grid-cols-2 gap-2 bg-surface/30 border border-border/20 p-3 rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar">
                    {DASHBOARD_PAGES.map((page) => {
                      const isChecked = editRole.allowedPages.includes(page.path);
                      return (
                        <label key={page.path} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-border/15 hover:border-[#155D5F]/20 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? editRole.allowedPages.filter((p: string) => p !== page.path)
                                : [...editRole.allowedPages, page.path];
                              setEditRole({ ...editRole, allowedPages: updated });
                            }}
                            className="h-3.5 w-3.5 rounded-md border-slate-300 text-[#155D5F] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#155D5F]"
                          />
                          <span className="text-[10px] font-bold text-dark/70 truncate">{page.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setEditRole(null)} className="flex-1 h-11 rounded-xl border border-border/50 text-[11px] font-bold text-slate" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-[11px] font-bold shadow-lg shadow-primary/5">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION ADMIN ACCOUNT */}
      {deleteAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => !isSubmitting && setDeleteAdmin(null)} />
          <div className="relative bg-white rounded-[24px] p-6 w-full max-w-[380px] shadow-2xl border border-border/40 space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-dark font-outfit">Remove Team Administrator?</h3>
                <p className="text-[11px] font-medium text-slate/40 leading-relaxed">
                  Are you sure you want to remove <span className="font-extrabold text-dark">{deleteAdmin.name}</span>? Their active page access tokens will be invalidated immediately.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setDeleteAdmin(null)} className="h-10 text-[11px] rounded-xl border border-border" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleDeleteAdmin} className="h-10 text-[11px] rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Deactivate Profile"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION CUSTOM ROLE */}
      {deleteRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setDeleteRole(null)} />
          <div className="relative bg-white rounded-[24px] p-6 w-full max-w-[380px] shadow-2xl border border-border/40 space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                <FolderLock className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-dark font-outfit">Delete Security Role?</h3>
                <p className="text-[11px] font-medium text-slate/40 leading-relaxed">
                  Are you sure you want to delete the <span className="font-extrabold text-dark">{deleteRole.name}</span> role? Existing administrators mapped to this role will fallback to standard default access page sets.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setDeleteRole(null)} className="h-10 text-[11px] rounded-xl border border-border">
                Cancel
              </Button>
              <Button onClick={handleDeleteRole} className="h-10 text-[11px] rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold">
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ADMIN PROFILE SIDE SHEET */}
      {viewAdmin && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/35 backdrop-blur-[1px] animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setViewAdmin(null)} />
          <div className="relative bg-white w-full max-w-[420px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-border/20 flex items-center justify-between">
              <h3 className="text-lg font-bold font-outfit text-dark tracking-tight">Administrator Account Profile</h3>
              <button onClick={() => setViewAdmin(null)} className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80">
                <X className="h-4.5 w-4.5 text-slate/50" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-1 ring-border/10">
                    <AvatarImage src={viewAdmin.image} />
                    <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold font-outfit">
                      {viewAdmin.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 h-6 w-6 border-3 border-white rounded-full shadow-md ${
                    viewAdmin.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`} />
                </div>
                <h4 className="text-xl font-bold font-outfit text-dark mt-4">{viewAdmin.name}</h4>
                <Badge className="bg-[#155D5F]/5 text-[#155D5F] border-none font-bold px-4 py-1 mt-1.5 rounded-full text-[9px] uppercase tracking-wider">{viewAdmin.role}</Badge>
              </div>

              <div className="space-y-5 bg-surface/30 rounded-[20px] border border-border/20 p-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate/40 uppercase tracking-widest block">Email Address</span>
                  <span className="text-xs font-bold text-dark">{viewAdmin.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate/40 uppercase tracking-widest block">Connection Security Status</span>
                  <span className={`text-xs font-bold ${viewAdmin.status === "Online" ? "text-emerald-600" : "text-slate-400"}`}>{viewAdmin.status} - {viewAdmin.timestamp}</span>
                </div>
              </div>

              <div className="space-y-3 pl-1">
                <span className="text-[10px] font-bold text-slate/40 uppercase tracking-widest block">Directory Modules Allowed (RBAC)</span>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                  {viewAdmin.allowedPages.map((p: string) => {
                    const matched = DASHBOARD_PAGES.find((dp) => dp.path === p);
                    return matched ? (
                      <span key={p} className="px-2.5 py-1.5 bg-white border border-border/30 text-dark/70 text-[9px] font-extrabold rounded-lg shadow-sm">{matched.label}</span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/20 grid grid-cols-2 gap-3 bg-surface/10">
              <Button
                onClick={() => {
                  const a = viewAdmin;
                  setViewAdmin(null);
                  setEditAdmin(a);
                }}
                className="h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold shadow-lg"
              >
                Modify Page Access
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const a = viewAdmin;
                  setViewAdmin(null);
                  setDeleteAdmin(a);
                }}
                className="h-11 rounded-xl border-border/40 text-red-500 hover:bg-red-50 text-xs font-bold"
              >
                Deactivate Admin
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
