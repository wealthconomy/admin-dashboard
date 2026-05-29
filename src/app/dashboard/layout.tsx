"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  ShieldCheck,
  UserPlus,
  Settings,
  LifeBuoy,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Activity,
  ArrowRightLeft,
  Bell,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  BarChart,
  Terminal,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationProvider, useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";

interface SubItem {
  name: string;
  href: string;
  icon: any;
}

interface SidebarItem {
  name: string;
  icon: any;
  href: string;
  hasDropdown?: boolean;
  subItems?: SubItem[];
}

const sidebarItems: SidebarItem[] = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  {
    name: "Users Management",
    icon: Users,
    href: "/dashboard/users",
    hasDropdown: true,
    subItems: [
      {
        name: "Activities Management",
        href: "/dashboard/users/activities",
        icon: Activity,
      },
      {
        name: "Transaction Management",
        href: "/dashboard/users/transactions",
        icon: ArrowRightLeft,
      },
    ],
  },
  { name: "Blog Management", icon: BookOpen, href: "/dashboard/blog" },
  { name: "Library Management", icon: Library, href: "/dashboard/library" },
  { name: "Support Centre", icon: LifeBuoy, href: "/dashboard/support" },
  { name: "Users Referrals", icon: UserPlus, href: "/dashboard/referrals" },
  { name: "Reports & Analytics", icon: BarChart, href: "/dashboard/reports" },
  { name: "Admin Management", icon: ShieldCheck, href: "/dashboard/admin" },
  { name: "System Audit Logs", icon: Terminal, href: "/dashboard/audit-logs" },
  { name: "Account Settings", icon: Settings, href: "/dashboard/settings" },
];

// Mock Admin Profiles for Testing RBAC page-level locks
const MOCK_PROFILES = [
  {
    name: "Simon Olabiran",
    role: "Super Admin",
    email: "simon.olabiran@wealthconomy.com",
    avatar: "https://i.pravatar.cc/150?u=1",
    allowedPages: [
      "*",
      "/dashboard",
      "/dashboard/users",
      "/dashboard/users/activities",
      "/dashboard/users/transactions",
      "/dashboard/blog",
      "/dashboard/library",
      "/dashboard/reports",
      "/dashboard/admin",
      "/dashboard/audit-logs",
      "/dashboard/referrals",
      "/dashboard/settings",
      "/dashboard/support",
    ],
  },
  {
    name: "Fatima Yusuf",
    role: "Admin",
    email: "fatima.y@wealthconomy.com",
    avatar: "https://i.pravatar.cc/150?u=2",
    // Admin has access to standard tools but NOT Admin Management or System Audit Logs
    allowedPages: [
      "/dashboard",
      "/dashboard/users",
      "/dashboard/users/activities",
      "/dashboard/users/transactions",
      "/dashboard/blog",
      "/dashboard/library",
      "/dashboard/reports",
      "/dashboard/referrals",
      "/dashboard/settings",
      "/dashboard/support",
    ],
  },
  {
    name: "Adeleye Ayodeji",
    role: "Content Writer",
    email: "ayodeji.a@wealthconomy.com",
    avatar: "https://i.pravatar.cc/150?u=6",
    // Content writer can only view dashboard, blog engine, library material, and support
    allowedPages: [
      "/dashboard",
      "/dashboard/blog",
      "/dashboard/library",
      "/dashboard/settings",
    ],
  },
];

function DashboardHeader({ 
  setIsSidebarOpen, 
  setShowLogoutModal,
  activeProfile,
  handleProfileSwitch,
}: { 
  setIsSidebarOpen: (val: boolean) => void;
  setShowLogoutModal: (val: boolean) => void;
  activeProfile: any;
  handleProfileSwitch: (profile: any) => void;
}) {
  const router = useRouter();
  const { unreadCount, notifications } = useNotifications();
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    if (activeProfile) {
      setAdminName(activeProfile.name.split(" ")[0]);
    } else {
      const storedName = localStorage.getItem("adminName") || "Simon"; 
      setAdminName(storedName);
    }
  }, [activeProfile]);

  return (
    <header className="h-[65px] w-full max-w-[1138.5px] mx-auto bg-white rounded-[20px] py-[10px] px-[15px] sm:px-[29px] flex items-center justify-between shadow-sm border border-border/50">
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu className="h-6 w-6 text-slate" />
        </button>
        <span className="font-bold font-outfit text-primary hidden sm:inline">
          Wealthconomy
        </span>
      </div>

      <div className="hidden lg:block">
        <h2 className="text-lg font-bold font-outfit text-dark whitespace-nowrap">
          Hi {adminName}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Sleek Simulated Session Switcher Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 h-10 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded-xl transition-all font-bold text-xs shrink-0 active:scale-95 cursor-pointer">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="hidden md:inline">Role: {activeProfile?.role || "Super Admin"}</span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[280px] p-2 bg-white border border-border/30 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-3 pb-2 border-b border-border/20">
              <h4 className="text-xs font-bold text-dark uppercase tracking-wide">Developer Simulation</h4>
              <p className="text-[10px] text-slate/50 font-medium mt-0.5">Toggle active admin profile to test Access Denied views across different pages.</p>
            </div>
            <div className="py-1 space-y-1">
              {MOCK_PROFILES.map((p) => {
                const isSelected = activeProfile?.name === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => handleProfileSwitch(p)}
                    className={`w-full p-2 rounded-xl text-left transition-colors flex items-center gap-3 cursor-pointer border ${
                      isSelected ? "bg-amber-500/5 text-amber-600 border-amber-500/20" : "hover:bg-surface text-slate border-transparent"
                    }`}
                  >
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                        {p.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold leading-tight">{p.name}</span>
                      <span className="text-[9px] font-bold text-slate/40 tracking-tight leading-none mt-1">{p.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative flex items-center justify-center h-10 w-10 rounded-full bg-surface hover:bg-surface/80 transition-all border border-border/30 active:scale-90 group cursor-pointer">
              <Bell className="h-4.5 w-4.5 text-primary group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white animate-in zoom-in-50 duration-300">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[380px] p-0 bg-white border-border/40 shadow-2xl rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 pb-3 border-b border-border/20 flex items-center justify-between bg-surface/30">
              <h3 className="text-sm font-bold font-outfit text-dark tracking-tight">
                Recent Notifications
              </h3>
              {unreadCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-none text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  {unreadCount} New
                </Badge>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto overflow-x-hidden">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex gap-3 hover:bg-surface/50 border-b border-border/10 cursor-pointer transition-colors group ${n.status === 'unread' ? 'bg-primary/[0.02]' : ''}`}
                  onClick={() => router.push("/dashboard/notifications")}
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.color === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 
                      n.color === 'blue' ? 'text-blue-600 bg-blue-50' :
                      n.color === 'orange' ? 'text-orange-600 bg-orange-50' :
                      'text-slate-600 bg-slate-50'
                    }`}
                  >
                    <n.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-[12px] font-bold group-hover:text-primary transition-colors ${n.status === 'unread' ? 'text-dark' : 'text-dark/60'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] font-medium text-slate/40">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate/50 leading-relaxed line-clamp-2">
                      {n.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-surface/50 text-center border-t border-border/20">
              <Link
                href="/dashboard/notifications"
                className="text-xs font-bold text-primary hover:underline transition-all"
              >
                See all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <Link
          href="/dashboard/settings"
          className="hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage
              src={activeProfile ? activeProfile.avatar : "https://i.pravatar.cc/150?u=simon"}
              alt={activeProfile ? activeProfile.name : "Simon Smith"}
            />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {activeProfile ? activeProfile.name.charAt(0) : "SS"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="hover:opacity-80 transition-opacity cursor-pointer shrink-0"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.3235 2.66797C18.6336 2.66797 21.3332 5.3213 21.3332 8.58797V14.9746H13.1936C12.6103 14.9746 12.1491 15.428 12.1491 16.0013C12.1491 16.5613 12.6103 17.028 13.1936 17.028H21.3332V23.4013C21.3332 26.668 18.6336 29.3346 15.2963 29.3346H8.68976C5.36612 29.3346 2.6665 26.6813 2.6665 23.4146V8.6013C2.6665 5.3213 5.37968 2.66797 8.70333 2.66797H15.3235ZM24.7201 11.4016C25.1201 10.9882 25.7734 10.9882 26.1734 11.3882L30.0668 15.2682C30.2668 15.4682 30.3734 15.7216 30.3734 16.0016C30.3734 16.2682 30.2668 16.5349 30.0668 16.7216L26.1734 20.6016C25.9734 20.8016 25.7068 20.9082 25.4534 20.9082C25.1868 20.9082 24.9201 20.8016 24.7201 20.6016C24.3201 20.2016 24.3201 19.5482 24.7201 19.1482L26.8534 17.0282L21.3332 17.028V14.9746L26.8534 14.9749L24.7201 12.8549C24.3201 12.4549 24.3201 11.8016 24.7201 11.4016Z"
              fill="#DE2020"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  useEffect(() => {
    // Load initial profile from localStorage, fallback to Super Admin
    const storedProfile = localStorage.getItem("activeAdminProfile");
    if (storedProfile) {
      try {
        setActiveProfile(JSON.parse(storedProfile));
      } catch (e) {
        const defaultProfile = MOCK_PROFILES[0];
        localStorage.setItem("activeAdminProfile", JSON.stringify(defaultProfile));
        localStorage.setItem("adminRole", defaultProfile.role);
        localStorage.setItem("adminName", defaultProfile.name.split(" ")[0]);
        setActiveProfile(defaultProfile);
      }
    } else {
      const defaultProfile = MOCK_PROFILES[0];
      localStorage.setItem("activeAdminProfile", JSON.stringify(defaultProfile));
      localStorage.setItem("adminRole", defaultProfile.role);
      localStorage.setItem("adminName", defaultProfile.name.split(" ")[0]);
      setActiveProfile(defaultProfile);
    }

    // Proactively listen to internal role updates (e.g. from developer actions)
    const handleStorageChange = () => {
      const p = localStorage.getItem("activeAdminProfile");
      if (p) setActiveProfile(JSON.parse(p));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleProfileSwitch = (profile: any) => {
    localStorage.setItem("activeAdminProfile", JSON.stringify(profile));
    localStorage.setItem("adminRole", profile.role);
    localStorage.setItem("adminName", profile.name.split(" ")[0]);
    setActiveProfile(profile);
    toast.success(`Switched session: ${profile.name} (${profile.role})`);
    
    // Dispatch manual storage change event so other same-page hooks/contexts (like Notifications) sync instantly
    window.dispatchEvent(new Event("storage"));

    // Check if the current page remains allowed after role switcher
    const isAllowed = profile.allowedPages.includes("*") || profile.allowedPages.includes(pathname);
    if (!isAllowed) {
      // Find first allowed dashboard path to prevent instant locking
      const firstAllowed = profile.allowedPages.find((p: string) => p.startsWith("/dashboard"));
      if (firstAllowed) {
        router.push(firstAllowed);
      } else {
        router.push("/dashboard");
      }
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  const handeLogout = () => {
    setShowLogoutModal(false);
    router.push("/");
  };

  // RBAC Dynamic Route Check
  const isPageAllowed = !activeProfile || 
                        pathname === "/dashboard/notifications" || // Notification center is universally accessible for all profiles to read their messages
                        pathname === "/dashboard/support" || // Support Centre is universally accessible so admins can message each other
                        activeProfile.allowedPages.includes("*") || 
                        activeProfile.allowedPages.includes(pathname);

  return (
    <NotificationProvider>
      <div className="flex h-dvh bg-surface overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex w-[269px] h-[calc(100dvh-42px)] flex-col bg-white rounded-[20px] my-[21px] ml-[21px] mr-2 border border-border/50 shadow-sm shrink-0">
          <div className="px-8 pt-8 pb-2 flex items-center justify-center">
            <div className="relative w-full h-15">
              <Image
                src="/logo1.png"
                alt="Wealthconomy Logo"
                fill
                sizes="(max-width: 768px) 100vw, 269px"
                className="object-contain object-left"
                priority
              />
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const isChildActive = item.subItems?.some(
                (sub) => pathname === sub.href,
              );
              const isExpanded =
                expandedItems.includes(item.name) || isChildActive;

              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (item.hasDropdown) {
                        e.preventDefault();
                        toggleExpand(item.name);
                      }
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive || isChildActive
                        ? "bg-primary text-white shadow-md shadow-primary/10"
                        : "text-slate hover:bg-surface hover:text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {item.hasDropdown && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>

                  {item.hasDropdown && isExpanded && (
                    <div className="ml-9 space-y-1">
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isSubActive
                                ? "text-primary bg-primary/5"
                                : "text-slate hover:text-primary hover:bg-surface"
                            }`}
                          >
                            <sub.icon className="h-4 w-4" />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setShowLogoutModal(true)}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-32 h-10">
                <Image
                  src="/logo.png"
                  alt="Wealthconomy Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)}>
              <X className="h-6 w-6 text-slate" />
            </button>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const isChildActive = item.subItems?.some(
                (sub) => pathname === sub.href,
              );
              const isExpanded =
                expandedItems.includes(item.name) || isChildActive;

              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (item.hasDropdown) {
                        e.preventDefault();
                        toggleExpand(item.name);
                      } else {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive || isChildActive
                        ? "bg-primary text-white shadow-md shadow-primary/10"
                        : "text-slate hover:bg-surface hover:text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {item.hasDropdown && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>

                  {item.hasDropdown && isExpanded && (
                    <div className="ml-9 space-y-1">
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isSubActive
                                ? "text-primary bg-primary/5"
                                : "text-slate hover:text-primary hover:bg-surface"
                            }`}
                          >
                            <sub.icon className="h-4 w-4" />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSidebarOpen(false);
                setShowLogoutModal(true);
              }}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header with Persistent Gap Area */}
          <div className="z-30 pl-4 pr-8 pt-[21px] pb-5 bg-surface">
            <DashboardHeader 
              setIsSidebarOpen={setIsSidebarOpen} 
              setShowLogoutModal={setShowLogoutModal} 
              activeProfile={activeProfile}
              handleProfileSwitch={handleProfileSwitch}
            />
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pl-4 pr-8 pb-5 lg:pl-6 lg:pr-12 lg:pb-10">
            {isPageAllowed ? (
              children
            ) : (
              <div className="w-full max-w-[1140px] min-h-[650px] mx-auto bg-white rounded-[24px] border border-slate-100 p-8 sm:p-12 flex flex-col items-center justify-center shadow-lg relative overflow-hidden animate-in fade-in duration-500">
                {/* Soft Colorful Glow Background Spheres */}
                <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-red-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[350px] h-[350px] bg-[#155D5F]/[0.03] rounded-full blur-[100px] pointer-events-none" />

                <div className="flex flex-col items-center text-center max-w-[480px] space-y-8 z-10">
                  {/* Glowing Central AI Hologram Shield Card */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-[40px] bg-[#155D5F]/15 blur-2xl animate-pulse" />
                    <div className="relative flex items-center justify-center h-40 w-40 rounded-[36px] overflow-hidden bg-white border border-slate-200/60 shadow-2xl hover:scale-105 transition-transform duration-500 p-1 group cursor-pointer">
                      <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-slate-50">
                        <Image
                          src="/access-denied-shield.png"
                          alt="Security Shield"
                          fill
                          sizes="160px"
                          className="object-cover scale-110"
                          priority
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Badge className="bg-red-50 text-red-500 hover:bg-red-50 border border-red-100 px-3.5 py-1 text-[11px] font-extrabold uppercase rounded-full">
                      Restricted Area
                    </Badge>
                    <h1 className="text-3xl font-black font-outfit text-slate-800 tracking-tight">
                      You don't have access to this page
                    </h1>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      Your administrator account doesn't have the permissions needed to view this folder. If you think this is a mistake, please contact your Super Admin to update your account role.
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  <div className="flex justify-center w-full pt-2">
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="h-12 px-8 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-[#155D5F]/10 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Go back to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />
            <div className="relative bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl border border-border/50 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                  <LogOut className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
                    Log out of dashboard?
                  </h3>
                  <p className="text-sm font-medium text-slate/50">
                    Are you sure you want to log out? You will need to enter your
                    credentials to access the admin panel again.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowLogoutModal(false)}
                  className="h-12 rounded-xl border border-border/50 font-bold text-slate hover:bg-surface transition-all text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handeLogout}
                  className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 text-xs"
                >
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}
