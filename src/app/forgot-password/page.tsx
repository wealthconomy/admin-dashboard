"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useForgotPasswordMutation } from "@/lib/redux/features/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await forgotPassword({ destination: email }).unwrap();
      toast.success(result.message || "Verification code sent to your email!");
      router.push(`/verify-code?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Failed to send verification code";
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

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md lg:max-w-[324px] flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
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
              Forgot Password
            </h3>
            <p className="text-slate text-center text-sm leading-relaxed">
              Enter the email address associated with your account and we will send you a verification code
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="w-full space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-6 bg-surface border-none rounded-xl focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-7 bg-primary hover:bg-primary/90 text-white rounded-xl text-lg font-outfit transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>

            <div className="flex justify-center mt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Log In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
