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
  { name: "Reports & Analytics", icon: BarChart, href: "/dashboard/reports" },
  { name: "Admin Management", icon: ShieldCheck, href: "/dashboard/admin" },
  { name: "Users Referrals", icon: UserPlus, href: "/dashboard/referrals" },
  { name: "Account Settings", icon: Settings, href: "/dashboard/settings" },
  { name: "Support Centre", icon: LifeBuoy, href: "/dashboard/support" },
];

function DashboardHeader({ setIsSidebarOpen, setShowLogoutModal }: { 
  setIsSidebarOpen: (val: boolean) => void;
  setShowLogoutModal: (val: boolean) => void;
}) {
  const router = useRouter();
  const { unreadCount, notifications } = useNotifications();
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    // Attempt to retrieve username from localStorage or another auth source
    const storedName = localStorage.getItem("adminName") || "Simon"; 
    setAdminName(storedName);
  }, []);

  return (
    <header className="h-[65px] w-full max-w-[1138.5px] mx-auto bg-white rounded-[20px] py-[10px] px-[29px] flex items-center justify-between shadow-sm border border-border/50">
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu className="h-6 w-6 text-slate" />
        </button>
        <span className="font-bold font-outfit text-primary">
          Wealthconomy
        </span>
      </div>

      <div className="hidden lg:block">
        <h2 className="text-lg font-bold font-outfit text-dark whitespace-nowrap">
          Hi {adminName}
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative flex items-center justify-center h-10 w-10 rounded-full bg-surface hover:bg-surface/80 transition-all border border-border/30 active:scale-90 group">
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
              src="https://i.pravatar.cc/150?u=simon"
              alt="Simon Smith"
            />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              SS
            </AvatarFallback>
          </Avatar>
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="hover:opacity-80 transition-opacity cursor-pointer"
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

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  const handeLogout = () => {
    setShowLogoutModal(false);
    router.push("/");
  };

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
            />
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pl-4 pr-8 pb-5 lg:pl-6 lg:pr-12 lg:pb-10">
            {children}
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
                  className="h-12 rounded-xl border border-border/50 font-bold text-slate hover:bg-surface transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handeLogout}
                  className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
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
