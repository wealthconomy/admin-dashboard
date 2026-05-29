"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-[1000px] min-h-[650px] mx-auto bg-white rounded-[24px] border border-slate-100 p-8 sm:p-12 flex flex-col items-center justify-center shadow-lg relative overflow-hidden animate-in fade-in duration-500">
      {/* Soft Colorful Glow Background Spheres */}
      <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-red-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[350px] h-[350px] bg-[#155D5F]/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col items-center text-center max-w-[480px] space-y-8 z-10">
        
        {/* Glowing Central AI Hologram Shield Card */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[40px] bg-[#155D5F]/15 blur-2xl animate-pulse" />
          <div className="relative flex items-center justify-center h-44 w-44 rounded-[40px] overflow-hidden bg-white border border-slate-200/60 shadow-2xl hover:scale-105 transition-transform duration-500 p-1 group cursor-pointer">
            <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-slate-50">
              <Image
                src="/access-denied-shield.png"
                alt="Security Shield"
                fill
                sizes="192px"
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
  );
}
