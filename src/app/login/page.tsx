"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation } from "@/lib/redux/features/authApi";
import { setCredentials } from "@/lib/redux/features/authSlice";
import { getFirstAllowedRoute, syncUserPermissionsCache } from "@/lib/permissions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login({ email: username, password }).unwrap();
      const rawUser = result.data?.user || result.user || result.data || {};
      const loggedUser = { ...rawUser };
      
      const accessToken = result.data?.accessToken || result.accessToken;
      const refreshToken = result.data?.refreshToken || result.refreshToken;

      // Extract allowedPages and customRole from top level of response if present
      if (result.data?.allowedPages && !loggedUser.allowedPages) {
        loggedUser.allowedPages = result.data.allowedPages;
      }
      if (result.data?.customRole && !loggedUser.customRole) {
        loggedUser.customRole = result.data.customRole;
      }
      if (result.data?.permissions && !loggedUser.permissions) {
        loggedUser.permissions = result.data.permissions;
      }

      // Store user and tokens
      dispatch(
        setCredentials({
          user: loggedUser,
          accessToken,
          refreshToken,
        })
      );

      // Instantly sync user permissions cache for synchronous guards (including JWT decoding)
      syncUserPermissionsCache(loggedUser, accessToken);

      toast.success(result.message || "Login successful!");
      
      const targetRoute = getFirstAllowedRoute(loggedUser);
      router.push(targetRoute);
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Login failed";
      toast.error(errorMsg);
    }
  };

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left Side - Teal Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center text-white px-12 relative">
        <div className="z-10 flex flex-col items-center w-[302px] text-center">
          {/* Logo representation */}
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

        {/* Subtle background circles for depth */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      </div>

      {/* Right Side - Login Form */}
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
            <h3 className="text-3xl font-bold font-outfit text-dark mb-2">
              Log In
            </h3>
            <p className="text-slate text-center text-sm leading-relaxed">
              To sign in to your account in the application, enter your email
              and your password
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
               Username or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type="text"
                  placeholder="Email or Mobile"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 py-6 bg-surface border-none rounded-xl focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-6 bg-surface border-none rounded-xl focus-visible:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate/40 hover:text-slate"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end pr-1">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-primary hover:underline transition-all"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>


            <Button
              type="submit"
              className="w-full py-7 bg-primary hover:bg-primary/90 text-white rounded-xl text-lg font-outfit transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
