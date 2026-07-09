"use client";

import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useVerifyOtpMutation } from "@/lib/redux/features/authApi";

function VerifyCodeForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length < 4) {
      toast.error("Please enter a valid verification code");
      return;
    }

    try {
      const result = await verifyOtp({ destination: email, code: otp }).unwrap();
      toast.success(result.message || "Code verified successfully!");
      // Redirect to the reset password page, passing email and resetToken in query params
      const resetToken = result.data?.resetToken || "";
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&resetToken=${encodeURIComponent(resetToken)}`
      );
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Verification failed";
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

      {/* Right Side - Verify Code Form */}
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
              Verify Code
            </h3>
            <p className="text-slate text-center text-sm leading-relaxed">
              {email ? `Enter the verification code sent to ${email}` : "Enter the verification code sent to your email"}
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="w-full space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
                Verification Code (OTP)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
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
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="flex justify-center mt-4">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Forgot Password
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <VerifyCodeForm />
    </Suspense>
  );
}
