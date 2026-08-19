"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { WifiOff, ShieldAlert } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return typeof navigator !== "undefined" ? !navigator.onLine : false;
}

function getServerSnapshot() {
  return false;
}

export default function OfflineGuard({ children }: { children: React.ReactNode }) {
  // Synchronous browser network state listener (handles refresh while offline instantly)
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <>
      {/* Hide underlying page content completely when offline to prevent error flashes or broken UI */}
      <div className={isOffline ? "hidden" : "contents"}>
        {children}
      </div>

      {isOffline && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 select-none">
          {/* Subtle Ambient Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#155D5F]/[0.03] rounded-full blur-[120px] pointer-events-none" />

          {/* Container Card */}
          <div className="relative max-w-[460px] w-full bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl border border-slate-100 flex flex-col items-center space-y-6">
            
            {/* Logo */}
            <div className="relative w-44 h-12">
              <Image
                src="/logo1.png"
                alt="Wealthconomy Logo"
                fill
                sizes="176px"
                className="object-contain"
                priority
              />
            </div>

            {/* Offline Icon with Pulse Effect */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping duration-1000" />
              <div className="relative h-20 w-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-inner">
                <WifiOff className="h-9 w-9" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>You are Offline</span>
              </div>
              <h2 className="text-2xl font-bold font-outfit text-slate-800 tracking-tight">
                No Internet Connection
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Please check your network connection. Wealthconomy Admin will automatically restore full functionality once you&apos;re back online.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
