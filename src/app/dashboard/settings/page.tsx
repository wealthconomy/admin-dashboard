"use client";

import { useState, useRef } from "react";
import {
  User,
  ShieldCheck,
  Camera,
  Trash2,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "personal" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
            Account Settings
          </h1>
          <p className="text-slate/60 text-sm mt-1 font-medium">
            Modify personal information, security settings, preferences, and
            transaction configurations.
          </p>
        </div>
        <Button className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-8 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95">
          Save changes
        </Button>
      </div>

      <div className="flex gap-10 flex-col lg:flex-row flex-1">
        {/* Settings Navigation */}
        <aside className="w-full lg:w-[240px] shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                activeTab === "personal"
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-slate hover:bg-surface hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <User
                  className={`h-5 w-5 ${activeTab === "personal" ? "text-white" : "group-hover:text-primary"}`}
                />
                <span className="font-bold text-[13px]">
                  Personal Information
                </span>
              </div>
              {activeTab === "personal" && (
                <div className="w-1.5 h-6 bg-white rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                activeTab === "security"
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-slate hover:bg-surface hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className={`h-5 w-5 ${activeTab === "security" ? "text-white" : "group-hover:text-primary"}`}
                />
                <span className="font-bold text-[13px]">Security Settings</span>
              </div>
              {activeTab === "security" && (
                <div className="w-1.5 h-6 bg-white rounded-full" />
              )}
            </button>
          </nav>

          <div className="mt-auto pt-10">
            <button className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all group w-full">
              <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <Trash2 className="h-4 w-4" />
              </div>
              <span className="font-bold text-[13px]">Delete Account</span>
            </button>
          </div>
        </aside>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "personal" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Profile Picture Card */}
              <div className="bg-white border border-border/50 rounded-[24px] p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-primary/10" />

                <div
                  className="relative cursor-pointer group/avatar"
                  onClick={handleImageClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("File selected:", file.name);
                        // Future: handle preview/upload
                      }
                    }}
                  />
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-1 ring-border/30 transition-all group-hover/avatar:opacity-90">
                    <AvatarImage src="https://i.pravatar.cc/150?u=odunayo" />
                    <AvatarFallback className="text-3xl font-bold bg-primary/5">
                      SS
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h2 className="text-xl font-bold text-dark font-outfit">
                      Simon Smith
                    </h2>
                    <p className="text-slate/60 text-[13px] font-medium mt-1">
                      useremail@gmail.com
                    </p>
                    <p className="text-slate/60 text-[13px] font-medium">
                      +47238476348929
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl px-6 h-10 font-bold text-xs text-slate border-border/50 hover:bg-surface transition-all"
                  >
                    Remove Picture
                  </Button>
                </div>

                <div className="absolute top-8 right-8 text-right hidden xl:block">
                  <span className="text-[10px] uppercase tracking-widest text-slate/40 font-bold block mb-1">
                    Profile ID
                  </span>
                  <span className="text-sm font-bold text-dark font-outfit">
                    ID5372527
                  </span>
                </div>
              </div>

              {/* Form Section */}
              <div className="bg-white border border-border/50 rounded-[24px] p-8 shadow-sm space-y-8">
                <h3 className="text-lg font-bold text-dark font-outfit border-b border-border/50 pb-4">
                  Profile Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Full name:
                    </Label>
                    <Input
                      defaultValue="Simon Smith"
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Email address:
                    </Label>
                    <Input
                      defaultValue="useremail@gmail.com"
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Phone number:
                    </Label>
                    <Input
                      defaultValue="+47238476348929"
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Username:
                    </Label>
                    <Input
                      defaultValue="odunayo234"
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Date of birth:
                    </Label>
                    <Input
                      defaultValue="12/12/2000"
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Address Information:
                    </Label>
                    <Input
                      defaultValue="no 36, Jane Ogunlade street, Lagos, Nigeria"
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Change Password Card */}
              <div className="bg-white border border-border/50 rounded-[24px] p-8 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-dark font-outfit">
                    Change password
                  </h3>
                  <div className="h-1 w-12 bg-primary rounded-full mt-2" />
                </div>

                <div className="max-w-md space-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Your password:
                    </Label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="**********"
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      New Password:
                    </Label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="**********"
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Confirm new Password:
                    </Label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="**********"
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication Section */}
              <div className="bg-white border border-border/50 rounded-[24px] p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-dark font-outfit">
                    Authentication
                  </h3>
                </div>

                <div className="bg-surface/50 rounded-2xl p-6 border border-border/30 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-dark">
                      Account Lock or Deactivation
                    </h4>
                    <p className="text-slate/60 text-xs font-medium mt-1">
                      Temporarily lock your account or request permanent
                      deactivation if you suspect unauthorized access.
                    </p>
                  </div>
                  <Button className="bg-white hover:bg-surface text-dark border-border/50 border shadow-sm rounded-xl px-6 h-11 font-bold text-[13px] transition-all active:scale-95">
                    Lock Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
