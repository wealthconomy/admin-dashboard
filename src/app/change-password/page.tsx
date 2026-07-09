"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useChangePasswordMutation } from "@/lib/redux/features/authApi";

export default function ChangePasswordPage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const router = useRouter();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const result = await changePassword({
        oldPassword,
        newPassword,
      }).unwrap();
      toast.success(result.message || "Password changed successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Failed to change password";
      toast.error(errorMsg);
    }
  };

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left Side - Teal Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center text-white px-12 relative">
        <div className="z-10 flex flex-col items-center w-[302px] text-center">
          <div className="w-full">
            <div className="relative w-full h-[180px] flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Wealthconomy Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 502px, 502px"
                priority
              />
            </div>
          </div>
          <p className="text-sm opacity-90 font-light leading-relaxed -mt-8">
            One wealth decision at a time towards sustainable wealth.
          </p>
        </div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      </div>

      {/* Right Side - Change Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md lg:max-w-[324px] flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative w-40 h-16">
              <Image
                src="/logo.png"
                alt="Wealthconomy Logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 160px, 160px"
                priority
              />
            </div>
          </div>

          <div className="w-full flex flex-col items-center mb-6">
            <h3 className="text-3xl font-bold font-outfit text-dark mb-2 text-center">
              Change Password
            </h3>
            <p className="text-slate text-center text-sm leading-relaxed">
              Choose a strong password to secure your administrative account
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="w-full space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pl-10 py-6 bg-surface border-none rounded-xl focus-visible:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-3.5 text-slate/40 hover:text-slate"
                >
                  {showOldPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 py-6 bg-surface border-none rounded-xl focus-visible:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5 text-slate/40 hover:text-slate"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 py-6 bg-surface border-none rounded-xl focus-visible:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-slate/40 hover:text-slate"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-7 bg-primary hover:bg-primary/90 text-white rounded-xl text-lg font-outfit transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Change Password"}
            </Button>

            <div className="flex justify-center mt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
