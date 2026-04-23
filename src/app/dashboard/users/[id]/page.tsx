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
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-10">
      {/* Back Navigation & User Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between w-full max-w-[1090px] h-[137px] bg-[#F8EEFE33] border-[0.5px] border-[#C5C5C5] rounded-[20px] pl-[20px] pr-[30px] gap-[10px] mx-auto transition-all">
          <div className="flex items-center gap-[10px]">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${params.id}`} />
              <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                S
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
                Simon Smith
              </h1>
              <p className="text-slate text-sm font-medium opacity-70">
                {params.id || "ID5372527"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-[#E7F0FF] text-blue-500 hover:bg-[#E7F0FF] border-none px-4 py-4 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-wider shadow-sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.1663 10L17.133 7.675L17.4163 4.6L14.408 3.91667L12.833 1.25L9.99968 2.46667L7.16634 1.25L5.59134 3.90833L2.58301 4.58333L2.86634 7.66667L0.833008 10L2.86634 12.325L2.58301 15.4083L5.59134 16.0917L7.16634 18.75L9.99968 17.525L12.833 18.7417L14.408 16.0833L17.4163 15.4L17.133 12.325L19.1663 10ZM8.40801 13.9333L5.24134 10.7583L6.47468 9.525L8.40801 11.4667L13.283 6.575L14.5163 7.80833L8.40801 13.9333Z"
                  fill="#1D84D9"
                />
              </svg>
              Verified
            </Badge>
            <button className="p-2.5 hover:bg-white rounded-xl transition-all border border-[#C5C5C5] shadow-sm bg-white/50">
              <FileText className="h-5 w-5 text-slate" />
            </button>
            <button className="p-2.5 hover:bg-white rounded-xl transition-all border border-[#C5C5C5] shadow-sm bg-white/50">
              <MoreVertical className="h-5 w-5 text-slate" />
            </button>
          </div>
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
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-[11px] text-dark">
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
      <h2 className="text-lg font-bold font-outfit text-dark mt-6">
        Profile information
      </h2>
      <div className="border-t border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-border">
          {/* Basic Info */}
          <div className="p-6 space-y-6">
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
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold font-outfit text-dark">
              Activities
            </h3>
            <div className="space-y-6">
              <InfoItem label="Status" value="Active" isStatus />
              <InfoItem label="Date Created" value="2024-02-15 14:30 UTC" />
              <InfoItem label="Last Login" value="2024-03-02 10:15 UTC" />
              <InfoItem label="Email Verification" value="Enabled" />
              <InfoItem label="Biometric" value="Enabled" />
              <InfoItem label="KYC Level" value="Level 3 🥉" />
            </div>
          </div>

          {/* Transactions */}
          <div className="p-6 space-y-6">
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
