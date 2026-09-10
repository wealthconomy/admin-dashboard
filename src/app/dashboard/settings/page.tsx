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

import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";
import { 
  useGetSettingsQuery, 
  useUpdateSettingsMutation,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useUpdateProfilePhotoMutation,
  useUploadFileMutation,
  useGetSystemConfigsQuery,
  useUpdateSystemConfigMutation
} from "@/lib/redux/features/adminApi";
import { useGetMeQuery } from "@/lib/redux/features/authApi";
import { useEffect } from "react";

type Tab = "personal" | "security";

/**
 * Normalise backend error messages — the API can return message as a string
 * OR as an array of validation strings (e.g. class-validator errors).
 * Always returns a single human-readable string for the toast.
 */
function parseApiError(err: any, fallback = "Something went wrong"): string {
  const msg = err?.data?.message;
  if (!msg) return fallback;
  if (Array.isArray(msg)) return msg.join(" · ");
  if (typeof msg === "string") return msg;
  return fallback;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile Form state
  const [localAvatar, setLocalAvatar] = useState("");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    dob: "",
    address: "",
    imageUrl: ""
  });

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Hooks
  const [updateProfile] = useUpdateProfileMutation();
  const [updatePassword] = useUpdatePasswordMutation();
  const [updateProfilePhoto] = useUpdateProfilePhotoMutation();
  const [uploadFile] = useUploadFileMutation();
  
  const { data: systemSettingsData, refetch: refetchSettings } = useGetSettingsQuery(undefined);
  const [updateSettings] = useUpdateSettingsMutation();
  const { data: meData, isLoading: isLoadingMe } = useGetMeQuery(undefined);
  
  const userMe = meData?.data || meData; // Account for wrapping structures
  
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  useEffect(() => {
    if (userMe && !hasLoadedProfile) {
      setProfileForm({
        firstName: userMe.firstName || "",
        lastName: userMe.lastName || "",
        email: userMe.email || "",
        phone: userMe.phone || "",
        username: userMe.username || "",
        dob: userMe.dob || "",
        address: userMe.address || "",
        imageUrl: userMe.imageUrl || ""
      });
      setLocalAvatar(userMe.imageUrl || "");
      setHasLoadedProfile(true);
    }
  }, [userMe, hasLoadedProfile]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    // ── Required field validation ──────────────────────────────────────────────
    const requiredFields: { key: keyof typeof profileForm; label: string }[] = [
      { key: "firstName", label: "First name" },
      { key: "lastName",  label: "Last name" },
      { key: "email",     label: "Email address" },
      { key: "phone",     label: "Phone number" },
      { key: "username",  label: "Username" },
      { key: "address",   label: "Address" },
    ];

    for (const { key, label } of requiredFields) {
      if (!profileForm[key]?.trim()) {
        toast.error(`${label} is required.`);
        return;
      }
    }
    // ──────────────────────────────────────────────────────────────────────────
    setIsSaving(true);
    try {
      const payload = {
        ...profileForm,
        dob: profileForm.dob ? new Date(profileForm.dob).toISOString() : undefined,
      };
      await updateProfile(payload).unwrap();
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(parseApiError(err, "Failed to update profile"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setIsSaving(true);
    try {
      await updatePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }).unwrap();
      toast.success("Password updated successfully");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadFile(formData).unwrap();
      
      const imageUrl = res.data?.url;
      if (imageUrl) {
        setLocalAvatar(imageUrl);
        setProfileForm(prev => ({ ...prev, imageUrl }));
        
        try {
          await updateProfilePhoto({ imageUrl }).unwrap();
        } catch (e) {
          // Fallback if the dedicated photo endpoint doesn't exist
          await updateProfile({ ...profileForm, imageUrl }).unwrap();
        }
        
        toast.success("Profile photo updated");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const renderProfileCard = () => (
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
          onChange={handleImageUpload}
        />
        <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-1 ring-border/30 transition-all group-hover/avatar:opacity-90">
          <AvatarImage src={localAvatar || userMe?.imageUrl || ""} />
          <AvatarFallback className="text-3xl font-bold bg-primary/5">
            {(userMe?.firstName || profileForm.firstName || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <button
          className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95 z-10 disabled:opacity-50 disabled:hover:scale-100"
          onClick={(e) => {
            e.stopPropagation();
            handleImageClick();
          }}
          disabled={isUploading || (!isEditingProfile && activeTab === "personal")}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 space-y-4 text-center md:text-left">
        <div>
          <h2 className="text-xl font-bold text-dark font-outfit">
            {`${userMe?.firstName || profileForm.firstName || ""} ${userMe?.lastName || profileForm.lastName || ""}`.trim() || "Administrator"}
          </h2>
          <p className="text-slate/60 text-[13px] font-medium mt-1">
            {userMe?.email || profileForm.email}
          </p>
          <p className="text-slate/60 text-[13px] font-medium">
            {userMe?.phone || profileForm.phone}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!isEditingProfile && activeTab === "personal"}
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
  );

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
        <div className="flex items-center gap-3">
          {activeTab === "personal" && (
            <Button
              variant="outline"
              onClick={() => {
                if (isEditingProfile) {
                  // Reset form to original values if canceling
                  if (userMe) {
                    setProfileForm({
                      firstName: userMe.firstName || "",
                      lastName: userMe.lastName || "",
                      email: userMe.email || "",
                      phone: userMe.phone || "",
                      username: userMe.username || "",
                      dob: userMe.dob || "",
                      address: userMe.address || "",
                      imageUrl: userMe.imageUrl || ""
                    });
                  }
                }
                setIsEditingProfile(!isEditingProfile);
              }}
              className="rounded-xl h-11 px-6 font-bold text-sm border-border/50 hover:bg-surface transition-all"
            >
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </Button>
          )}
          <Button 
            onClick={activeTab === "personal" ? handleSaveProfile : activeTab === "security" ? handleSavePassword : () => toast.success("Settings saved")}
            disabled={isSaving || (activeTab === "personal" && !isEditingProfile)}
            className={`rounded-xl h-11 px-8 font-bold text-sm shadow-lg transition-all active:scale-95 ${
              (activeTab === "personal" && !isEditingProfile)
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-[#155D5F] hover:bg-[#155D5F]/90 text-white shadow-primary/10"
            }`}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </div>
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

        </aside>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "personal" ? (
            isLoadingMe ? (
              <div className="flex flex-col items-center justify-center py-32 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate/40">Loading personal information...</p>
              </div>
            ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Profile Picture Card */}
              {renderProfileCard()}

              {/* Form Section */}
              <div className="bg-white border border-border/50 rounded-[24px] p-8 shadow-sm space-y-8">
                <h3 className="text-lg font-bold text-dark font-outfit border-b border-border/50 pb-4">
                  Profile Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      First name:
                    </Label>
                    <Input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      readOnly={!isEditingProfile}
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Last name:
                    </Label>
                    <Input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      readOnly={!isEditingProfile}
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Email address:
                    </Label>
                    <Input
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      readOnly={!isEditingProfile}
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Phone number:
                    </Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      readOnly={!isEditingProfile}
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Username:
                    </Label>
                    <Input
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                      readOnly={!isEditingProfile}
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[13px] font-bold text-slate/70 ml-1">
                      Address Information:
                    </Label>
                    <Input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                      readOnly={!isEditingProfile}
                      className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            )
          ) : activeTab === "security" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {renderProfileCard()}
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
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
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
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
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
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/30" />
                    </div>
                  </div>
                </div>
              </div>


            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}