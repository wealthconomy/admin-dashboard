"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  BookOpen,
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { name: "Blog", icon: BookOpen, href: "/dashboard/blog" },
  { name: "Admin Management", icon: ShieldCheck, href: "/dashboard/admin" },
  { name: "Users Referrals", icon: UserPlus, href: "/dashboard/referrals" },
  { name: "Account Settings", icon: Settings, href: "/dashboard/settings" },
  { name: "Support Centre", icon: LifeBuoy, href: "/dashboard/support" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-[269px] h-[719px] flex-col bg-white rounded-[20px] my-[21px] ml-[21px] mr-2 border border-border/50 shadow-sm shrink-0">
        <div className="px-8 pt-8 pb-2 flex items-center justify-center">
          <div className="relative w-full h-15">
            <Image
              src="/logo1.png"
              alt="Wealthconomy Logo"
              fill
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
            onClick={() => setIsSidebarOpen(false)}
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
                Hi Simon
              </h2>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative">
                <button className="flex items-center justify-center hover:opacity-80 transition-opacity">
                  <svg
                    width="35"
                    height="34"
                    viewBox="0 0 48 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="20" cy="23.5469" r="19.5" stroke="#155D5F" />
                    <path
                      d="M18.3025 29.5714C18.7191 29.4833 21.2576 29.4833 21.6742 29.5714C22.0303 29.6537 22.4154 29.8459 22.4154 30.2655C22.3947 30.665 22.1603 31.0192 21.8365 31.2442C21.4166 31.5715 20.9238 31.7788 20.4086 31.8535C20.1237 31.8904 19.8438 31.8913 19.5688 31.8535C19.0529 31.7788 18.5601 31.5715 18.141 31.2433C17.8163 31.0192 17.5819 30.665 17.5612 30.2655C17.5612 29.8459 17.9464 29.6537 18.3025 29.5714ZM20.0375 15.2148C21.771 15.2148 23.5417 16.0374 24.5935 17.4021C25.276 18.2808 25.5891 19.1587 25.5891 20.5234V20.8785C25.5891 21.9251 25.8657 22.5419 26.4744 23.2528C26.9357 23.7766 27.0832 24.4488 27.0832 25.1782C27.0832 25.9067 26.8438 26.5983 26.3643 27.1598C25.7365 27.8329 24.8511 28.2626 23.9475 28.3373C22.6381 28.449 21.3279 28.543 20.0003 28.543C18.6718 28.543 17.3624 28.4867 16.053 28.3373C15.1486 28.2626 14.2632 27.8329 13.6362 27.1598C13.1567 26.5983 12.9165 25.9067 12.9165 25.1782C12.9165 24.4488 13.0648 23.7766 13.5252 23.2528C14.153 22.5419 14.4114 21.9251 14.4114 20.8785V20.5234C14.4114 19.1218 14.7609 18.2053 15.4807 17.3081C16.5507 15.9996 18.266 15.2148 19.963 15.2148H20.0375Z"
                      fill="#155D5F"
                    />
                    <g filter="url(#filter0_d_794_2672)">
                      <rect
                        x="31"
                        y="6.54688"
                        width="8"
                        height="8"
                        rx="4"
                        fill="#F44336"
                      />
                    </g>
                    <defs>
                      <filter
                        id="filter0_d_794_2672"
                        x="22.2727"
                        y="0.00142026"
                        width="25.4545"
                        height="25.4545"
                        filterUnits="userSpaceOnUse"
                        color-interpolation-filters="sRGB"
                      >
                        <feFlood
                          flood-opacity="0"
                          result="BackgroundImageFix"
                        />
                        <feColorMatrix
                          in="SourceAlpha"
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                          result="hardAlpha"
                        />
                        <feOffset dy="2.18182" />
                        <feGaussianBlur stdDeviation="4.36364" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                          type="matrix"
                          values="0 0 0 0 1 0 0 0 0 0.0916667 0 0 0 0 0.26714 0 0 0 0.24 0"
                        />
                        <feBlend
                          mode="normal"
                          in2="BackgroundImageFix"
                          result="effect1_dropShadow_794_2672"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="effect1_dropShadow_794_2672"
                          result="shape"
                        />
                      </filter>
                    </defs>
                  </svg>
                </button>
              </div>

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
              <button className="hover:opacity-80 transition-opacity">
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
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pl-4 pr-8 pb-5 lg:pl-6 lg:pr-12 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
