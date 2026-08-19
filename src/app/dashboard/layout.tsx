"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGetMeQuery } from "@/lib/redux/features/authApi";
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
  Send,
  Sliders,
  Loader2,
  Mail,
  HelpCircle,
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
import { SocketProvider } from "@/context/SocketContext";
import { UnreadCountProvider, useUnreadCounts } from "@/context/UnreadCountContext";
import { toast } from "sonner";
import { AdminChatWidget } from "@/components/AdminChatWidget";
import { selectIsAccessDenied, setAccessDenied } from "@/lib/redux/features/authSlice";

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
    name: "User Operations",
    icon: Users,
    href: "#",
    hasDropdown: true,
    subItems: [
      {
        name: "User Management",
        href: "/dashboard/users",
        icon: Users,
      },
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
  { name: "Financial Assessments", icon: HelpCircle, href: "/dashboard/assessments" },
  { name: "Support Centre", icon: LifeBuoy, href: "/dashboard/support" },
  { name: "Users Referrals", icon: UserPlus, href: "/dashboard/referrals" },
  { name: "Push Notifications", icon: Send, href: "/dashboard/push-notifications" },
  { name: "Reports & Analytics", icon: BarChart, href: "/dashboard/reports" },
  { name: "Newsletter Subscribers", icon: Mail, href: "/dashboard/newsletter" },
  { name: "Admin Management", icon: ShieldCheck, href: "/dashboard/admin" },
  { name: "System Audit Logs", icon: Terminal, href: "/dashboard/audit-logs" },
  { name: "System Configuration", icon: Sliders, href: "/dashboard/system-config" },
  { name: "Account Settings", icon: Settings, href: "/dashboard/settings" },
];

import { checkRoutePermission, getFirstAllowedRoute } from "@/lib/permissions";

function DashboardHeader({ 
  setIsSidebarOpen, 
  setShowLogoutModal,
}: { 
  setIsSidebarOpen: (val: boolean) => void;
  setShowLogoutModal: (val: boolean) => void;
  adminTeamRole?: string;
}) {
  const router = useRouter();
  const { unreadCount, notifications } = useNotifications();
  // Read the real logged-in user from Redux state first
  const { data: meData } = useGetMeQuery(undefined);
  const loggedInUser = useSelector((state: any) => state.auth.user);
  const user = meData?.data || loggedInUser;
  
  const adminName = user ? `${user.firstName} ${user.lastName}` : (typeof window !== "undefined" ? localStorage.getItem("adminName") || "Admin" : "Admin");
  const adminAvatar = user?.imageUrl || user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";

  return (
    <header className="h-[73px] bg-white border-b border-border/50 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu className="h-6 w-6 text-slate" />
        </button>
        <span className="font-bold font-outfit text-primary hidden sm:inline">
          Wealthconomy
        </span>
      </div>

      <div className="hidden lg:block">
        <h2 className="text-lg font-bold font-outfit text-dark whitespace-nowrap" suppressHydrationWarning>
          Hi {adminName}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
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
              src={adminAvatar}
              alt={adminName}
            />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {adminName.charAt(0)}
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

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { totalSupportUnread } = useUnreadCounts();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data: meData } = useGetMeQuery(undefined);
  const loggedInUser = useSelector((state: any) => state.auth.user);
  const userMe = meData?.data || loggedInUser || {};

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((i) => i !== itemName)
        : [...prev, itemName]
    );
  };

  const handeLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("token");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("deniedPaths");
    window.location.href = "/login";
  };

  const dispatch = useDispatch();
  const isAccessDenied = useSelector(selectIsAccessDenied);

  // Reset access denied on navigation
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      dispatch(setAccessDenied(false));
      prevPathname.current = pathname;
    }
  }, [pathname, dispatch]);

  // Pre-emptive route checking
  const isAllowed = checkRoutePermission(pathname, userMe);
  const isBlocked = isAccessDenied || !isAllowed;

  // If user opens /dashboard and does not have permission for Overview, auto-redirect to first allowed page
  useEffect(() => {
    if (pathname === "/dashboard" && userMe && Object.keys(userMe).length > 0) {
      if (!checkRoutePermission("/dashboard", userMe)) {
        const target = getFirstAllowedRoute(userMe);
        router.replace(target);
      }
    }
  }, [pathname, userMe, router]);

  return (
    <>
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
                unoptimized
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
                    <div className="flex items-center gap-2">
                      {item.name === "Support Centre" && totalSupportUnread > 0 && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isActive || isChildActive ? "bg-white text-primary" : "bg-red-500 text-white"
                        }`}>
                          {totalSupportUnread}
                        </span>
                      )}
                      {item.hasDropdown && (
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
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
                                ? "text-primary bg-primary/5 font-bold"
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
              onClick={() => setShowLogoutModal(true)}
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-6 font-medium text-sm transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-300">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-[280px] bg-white flex flex-col z-50 p-4 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between px-4 py-2 mb-2">
                <div className="relative w-36 h-10">
                  <Image
                    src="/logo1.png"
                    alt="Wealthconomy Logo"
                    fill
                    className="object-contain object-left"
                    unoptimized
                  />
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-surface text-slate"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
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
                        <div className="flex items-center gap-2">
                          {item.name === "Support Centre" && totalSupportUnread > 0 && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isActive || isChildActive ? "bg-white text-primary" : "bg-red-500 text-white"
                            }`}>
                              {totalSupportUnread}
                            </span>
                          )}
                          {item.hasDropdown && (
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
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
                                    ? "text-primary bg-primary/5 font-bold"
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
                  className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-6 font-medium text-sm transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader
            setIsSidebarOpen={setIsSidebarOpen}
            setShowLogoutModal={setShowLogoutModal}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface flex flex-col">
            {isBlocked ? (
              <div className="flex-1 flex items-center justify-center min-h-[500px] p-6 animate-in fade-in duration-300">
                <div className="relative bg-white rounded-[28px] p-8 sm:p-12 w-full max-w-[480px] shadow-2xl border border-border/50 text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="h-20 w-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                      <span>Permission Required</span>
                    </div>
                    <h3 className="text-2xl font-bold font-outfit text-dark tracking-tight">
                      Access Restricted
                    </h3>
                    <p className="text-sm font-medium text-slate/60 leading-relaxed">
                      You do not have permission to view or modify this section. Please select an authorized menu item from the sidebar or contact your Super Administrator.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              children
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
      <AdminChatWidget />
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      <UnreadCountProvider>
        <NotificationProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </NotificationProvider>
      </UnreadCountProvider>
    </SocketProvider>
  );
}
