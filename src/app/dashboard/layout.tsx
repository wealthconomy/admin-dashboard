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
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SubItem {
  name: string;
  href: string;
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
      { name: "Activities Management", href: "/dashboard/users/activities" },
      { name: "Transaction Management", href: "/dashboard/users/transactions" },
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
    <div className="flex h-screen bg-surface">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-border h-full">
        <div className="p-8 flex items-center justify-center">
          <div className="relative w-full h-12">
            <Image
              src="/logo.png"
              alt="Wealthconomy Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
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
                          className={`flex items-center px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isSubActive
                              ? "text-primary bg-primary/5"
                              : "text-slate hover:text-primary hover:bg-surface"
                          }`}
                        >
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
        <div className="p-6 flex items-center justify-between">
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
        {/* ... mobile nav (simplified) */}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-border flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-slate" />
            </button>
            <span className="font-bold font-outfit text-primary">
              Wealthconomy
            </span>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-bold font-outfit text-dark">
              Hi Simon
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface text-slate hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>

            <div className="flex items-center gap-3 border-l border-border pl-6">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                <User className="h-5 w-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                <LogOut className="h-5 w-5 rotate-180" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
