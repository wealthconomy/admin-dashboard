"use client";

import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MoreVertical,
  FileText,
  Wallet,
  Target,
  Zap,
  Users,
  RefreshCcw,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const portfolioItems = [
  {
    name: "WealthFlex",
    amount: "₦300,735.42",
    icon: Wallet,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    name: "WealthGoal",
    amount: "₦300,735.42",
    icon: Target,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    sub: "3 Active WealthGoals",
    completed: "2 Completed",
  },
  {
    name: "WealthFix",
    amount: "₦300,735.42",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    sub: "3 Active WealthFix",
    completed: "2 Completed",
  },
  {
    name: "WealthFam",
    amount: "₦300,735.42",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    sub: "0 Active WealthFam",
    completed: "0 Completed",
  },
  {
    name: "WealthFlow",
    amount: "₦300,735.42",
    icon: RefreshCcw,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    sub: "2 Active WealthAuto",
    completed: "1 Complete",
  },
  {
    name: "WealthGroup",
    amount: "₦300,735.42",
    icon: UsersRound,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    sub: "2 Active WealthGroup",
    completed: "2 Completed",
  },
];

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* User Header Card */}
      <div className="bg-white rounded-[30px] p-8 border border-border flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-primary/5">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${params.id}`} />
            <AvatarFallback className="bg-primary/5 text-primary text-2xl">
              S
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-outfit text-dark">
              Simon Smith
            </h1>
            <p className="text-slate text-sm font-medium">
              {params.id || "ID5372527"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-50 text-blue-500 hover:bg-blue-50 border-none px-4 py-2 rounded-xl gap-2 font-semibold">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            Verified
          </Badge>
          <button className="p-2.5 hover:bg-surface rounded-xl transition-all border border-border">
            <FileText className="h-5 w-5 text-slate" />
          </button>
          <button className="p-2.5 hover:bg-surface rounded-xl transition-all border border-border">
            <MoreVertical className="h-5 w-5 text-slate" />
          </button>
        </div>
      </div>

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate/60 hover:text-primary transition-all font-medium text-sm group"
      >
        <div className="p-1.5 rounded-lg group-hover:bg-primary/5 transition-all">
          <ChevronLeft className="h-5 w-5" />
        </div>
        Back
      </button>

      {/* Portfolio Overview */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold font-outfit text-dark">
          Portfolio Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {portfolioItems.map((item, i) => (
            <Card
              key={i}
              className="rounded-2xl border-border shadow-none overflow-hidden h-full"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-[13px] text-dark">
                    {item.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-dark">
                    {item.amount}
                  </div>
                  {item.sub && (
                    <div className="text-[10px] text-slate/60 mt-1">
                      {item.sub}
                    </div>
                  )}
                  {item.completed && (
                    <div className="text-[10px] text-green-500 font-medium">
                      {item.completed}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-[30px] border border-border shadow-sm overflow-hidden mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Basic Info */}
          <div className="p-8 space-y-8">
            <h3 className="text-sm font-bold font-outfit text-dark">Basic</h3>
            <div className="space-y-6">
              <InfoItem label="First name:" value="Simon" />
              <InfoItem label="Last name:" value="Smith" />
              <InfoItem
                label="Email address:"
                value="simon.olabiran@gmail.com"
                isLink
              />
              <InfoItem label="Profile ID:" value={params.id || "ID5372527"} />
              <InfoItem label="Phone number:" value="+234567889274" />
            </div>
          </div>

          {/* Activities */}
          <div className="p-8 space-y-8">
            <h3 className="text-sm font-bold font-outfit text-dark">
              Activities
            </h3>
            <div className="space-y-6">
              <InfoItem label="Status" value="Active" isStatus />
              <InfoItem label="Date Created" value="2024-02-15 14:30 UTC" />
              <InfoItem label="Last Login" value="2024-03-02 10:15 UTC" />
              <InfoItem label="Email Verification" value="Enabled" />
              <InfoItem label="Biometric" value="Enabled" />
              <InfoItem label="KYC Level" value="Level 3 🔥" />
            </div>
          </div>

          {/* Transactions */}
          <div className="p-8 space-y-8">
            <h3 className="text-sm font-bold font-outfit text-dark">
              Transaction
            </h3>
            <div className="space-y-6">
              <InfoItem
                label="Withdrawal History"
                value="5 Withdrawals (N52,126.02)"
              />
              <InfoItem label="Pending Transactions" value="12 Transactions" />
              <InfoItem label="Total Payments Made" value="12 Transactions" />
              <InfoItem label="Failed Transactions" value="0 Transaction" />
              <InfoItem label="Total Amount Processed" value="N32,524.91" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border rounded-lg ${className}`}>{children}</div>
  );
}

function InfoItem({
  label,
  value,
  isLink,
  isStatus,
}: {
  label: string;
  value: string;
  isLink?: boolean;
  isStatus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate/60 font-medium">{label}</span>
      {isStatus ? (
        <span className="text-green-500 font-bold uppercase tracking-wider">
          {value}
        </span>
      ) : isLink ? (
        <a
          href={`mailto:${value}`}
          className="text-primary hover:underline font-bold"
        >
          {value}
        </a>
      ) : (
        <span className="text-dark font-bold text-right">{value}</span>
      )}
    </div>
  );
}
