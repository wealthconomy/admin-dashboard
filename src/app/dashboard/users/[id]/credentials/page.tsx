"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ZoomIn,
  X,
  FileText,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Building,
  Check,
  Loader2,
  Maximize2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetUserDetailsQuery,
  useApproveKycDocMutation,
  useRejectKycDocMutation,
  useResetKycDocMutation
} from "@/lib/redux/features/usersApi";

interface DocumentDetail {
  id: string;
  type: string;
  title: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  extractedFields: { label: string; value: string; icon: any }[];
}

export default function CredentialsVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resolvedId = resolvedParams.id;

  const { data: userDataResponse } = useGetUserDetailsQuery(resolvedId);
  const user = userDataResponse?.data?.data || userDataResponse?.data || userDataResponse;

  const [approveKycDoc] = useApproveKycDocMutation();
  const [rejectKycDoc] = useRejectKycDocMutation();
  const [resetKycDoc] = useResetKycDocMutation();

  // Document states — seeded from API data on load
  const [ninStatus, setNinStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [ninReason, setNinReason] = useState<string>("");
  const [utilityStatus, setUtilityStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [utilityReason, setUtilityReason] = useState<string>("");

  // Sync status from kycProfile once user data loads
  // This ensures page refreshes show the real persisted state from the backend
  useEffect(() => {
    const kycProfile = user?.kycProfile;
    if (!kycProfile) return;

    const toStatus = (s: string | null | undefined): "Pending" | "Approved" | "Rejected" => {
      if (s === "Approved") return "Approved";
      if (s === "Rejected") return "Rejected";
      return "Pending";
    };

    setNinStatus(toStatus(kycProfile.ninStatus));
    setUtilityStatus(toStatus(kycProfile.utilityStatus));

    // Seed rejection reasons (only if actually rejected, ignore "Document verified successfully")
    if (kycProfile.ninStatus === "Rejected" && kycProfile.ninRejectionReason) {
      setNinReason(kycProfile.ninRejectionReason);
    }
    if (kycProfile.utilityStatus === "Rejected" && kycProfile.utilityRejectionReason) {
      setUtilityReason(kycProfile.utilityRejectionReason);
    }
  }, [user?.kycProfile]);

  // Modal controls
  const [activeLightbox, setActiveLightbox] = useState<"nin" | "utility" | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<"nin" | "utility" | null>(null);
  const [rejectionInput, setRejectionInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // tracks loading doc type

  // Dynamically populated Extracted Fields from user data
  const ninFields = [
    { label: "Full Name", value: `${user?.firstName || ""} ${user?.lastName || ""}`.trim().toUpperCase() || "NOT PROVIDED", icon: User },
    { label: "NIN Number", value: user?.nin || user?.kycData?.nin || "NOT PROVIDED", icon: CreditCard },
    { label: "Date of Birth", value: user?.dob ? new Date(user.dob).toLocaleDateString() : "NOT PROVIDED", icon: Calendar },
    { label: "Expiry Date", value: user?.ninExpiry || user?.kycData?.ninExpiry || "NOT PROVIDED", icon: Calendar }
  ];

  const utilityFields = [
    { label: "Account Name", value: `${user?.firstName || ""} ${user?.lastName || ""}`.trim().toUpperCase() || "NOT PROVIDED", icon: User },
    { label: "Service Address", value: user?.address || user?.kycData?.address || "NOT PROVIDED", icon: MapPin },
    { label: "Provider", value: user?.utilityProvider || user?.kycData?.utilityProvider || "NOT PROVIDED", icon: Building },
    { label: "Issue Date", value: user?.utilityIssueDate || user?.kycData?.utilityIssueDate || "NOT PROVIDED", icon: Calendar }
  ];

  const presetReasons = [
    "Document is blurry / illegible",
    "Name on document does not match account name",
    "Document has expired",
    "Address on bill does not match registered address",
    "Incorrect document type uploaded"
  ];

  const handleApprove = async (doc: "nin" | "utility") => {
    setIsSubmitting(doc);
    try {
      await approveKycDoc({
        id: resolvedId,
        documentType: doc.toUpperCase(),
        reason: "Document verified successfully",
      }).unwrap();

      if (doc === "nin") {
        setNinStatus("Approved");
        setNinReason("");
      } else {
        setUtilityStatus("Approved");
        setUtilityReason("");
      }
      
      toast.success(`${doc === "nin" ? "National ID Card" : "Utility Bill"} successfully approved!`);

      // Celebration toast if both approved
      const otherStatus = doc === "nin" ? utilityStatus : ninStatus;
      if (otherStatus === "Approved") {
        setTimeout(() => {
          toast("🎉 User fully verified!", {
            description: "All uploaded credentials have been successfully approved.",
            className: "bg-emerald-50 border-emerald-200 text-emerald-800"
          });
        }, 800);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to approve ${doc}`);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionInput.trim()) {
      toast.error("Please provide or select a rejection reason");
      return;
    }

    const doc = rejectingDoc;
    if (!doc) return;

    setIsSubmitting(doc);
    try {
      await rejectKycDoc({
        id: resolvedId,
        documentType: doc.toUpperCase(),
        reason: rejectionInput,
      }).unwrap();

      if (doc === "nin") {
        setNinStatus("Rejected");
        setNinReason(rejectionInput);
      } else {
        setUtilityStatus("Rejected");
        setUtilityReason(rejectionInput);
      }
      
      setRejectingDoc(null);
      setRejectionInput("");
      toast.warning(`${doc === "nin" ? "National ID Card" : "Utility Bill"} has been rejected.`);
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to reject ${doc}`);
    } finally {
      setIsSubmitting(null);
    }
  };

  const isKycNotStarted = user?.kycStatus === "NOT_STARTED" || !user?.kycData;

  // Compute Overall Status
  const getOverallStatus = () => {
    if (isKycNotStarted) return "Not Started";
    if (ninStatus === "Approved" && utilityStatus === "Approved") return "Verified";
    if (ninStatus === "Rejected" || utilityStatus === "Rejected") return "Action Required";
    return "Pending Review";
  };

  const handleReset = async (doc: "nin" | "utility") => {
    try {
      await resetKycDoc({
        id: resolvedId,
        documentType: doc.toUpperCase(),
        reason: "Resetting verification status",
      }).unwrap();
      
      if (doc === "nin") {
        setNinStatus("Pending");
      } else {
        setUtilityStatus("Pending");
      }
      toast.success("Document verification status reset to Pending");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset status");
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[1000px] mx-auto flex flex-col space-y-10 animate-in fade-in duration-500">
      
      {/* Navigation & Header */}
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => router.push(`/dashboard/users/${resolvedId}`)}
          className="flex items-center gap-2 text-slate/60 hover:text-primary transition-all font-medium text-sm group self-start"
        >
          <div className="p-1.5 rounded-lg group-hover:bg-primary/5 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </div>
          Back to User Details
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between w-full bg-surface/30 border border-border/30 rounded-[20px] p-6 gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
              <AvatarImage src={user?.imageUrl || ""} />
              <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold uppercase">
                {user?.firstName?.[0] || user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold font-outfit text-dark leading-none">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User"}</h1>
                <Badge className={`${
                  getOverallStatus() === "Verified" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : getOverallStatus() === "Action Required"
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-blue-50 text-blue-600 border-blue-100"
                } border shadow-none px-3 py-1 rounded-full text-[10px] font-bold`}>
                  {getOverallStatus()}
                </Badge>
              </div>
              <p className="text-slate/60 text-xs font-semibold">User ID: <span className="text-dark font-bold">{resolvedId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-border/20">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wider">Submitted</p>
              <p className="text-lg font-extrabold text-dark mt-1">{isKycNotStarted ? "0 Documents" : "2 Documents"}</p>
            </div>
            <div className="h-8 w-px bg-border/40" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wider">KYC Progress</p>
              <p className={`text-lg font-extrabold mt-1 ${
                getOverallStatus() === "Verified" ? "text-emerald-500" : "text-primary"
              }`}>
                {isKycNotStarted ? "0%" : (ninStatus === "Approved" && utilityStatus === "Approved" ? "100%" : 
                 (ninStatus === "Approved" || utilityStatus === "Approved" ? "50%" : "0%"))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Documents side-by-side */}
      {isKycNotStarted ? (
        <div className="flex flex-col items-center justify-center p-16 mt-4 bg-surface/30 border border-border/30 rounded-3xl text-center space-y-5 shadow-sm">
          <div className="h-20 w-20 bg-white border border-border/50 rounded-full flex items-center justify-center shadow-sm">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-dark font-outfit">No Documents Uploaded</h3>
            <p className="text-slate/60 text-sm max-w-[400px]">This user has not yet submitted any KYC documents for verification from the mobile application.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Document 1: NIN National ID */}
          <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
          {/* Doc Header */}
          <div className="p-6 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-dark font-outfit">National ID (NIN) Card</h3>
              <p className="text-[11px] font-medium text-slate/40">Proof of Identification</p>
            </div>
            <Badge className={`${
              ninStatus === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              ninStatus === "Rejected" ? "bg-red-50 text-red-500 border-red-100" :
              "bg-amber-50 text-amber-600 border-amber-100"
            } border shadow-none px-3.5 py-1.5 rounded-xl text-[10px] font-bold gap-1.5 items-center`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                ninStatus === "Approved" ? "bg-emerald-500" :
                ninStatus === "Rejected" ? "bg-red-500" :
                "bg-amber-500"
              }`} />
              {ninStatus}
            </Badge>
          </div>

          {/* Extracted Details & Live Preview */}
          <div className="p-6 flex-1 space-y-6">
            
            {/* Extracted Data Fields */}
            <div className="grid grid-cols-2 gap-4">
              {ninFields.map((field, idx) => (
                <div key={idx} className="p-3.5 bg-surface/40 border border-border/10 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-slate/50">
                    <field.icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{field.label}</span>
                  </div>
                  <p className="text-xs font-extrabold text-dark">{field.value}</p>
                </div>
              ))}
            </div>

            {/* Premium Interactive Document Preview (NIN Card SVG) */}
            <div className="relative group rounded-xl border border-border/30 overflow-hidden cursor-pointer" onClick={() => setActiveLightbox("nin")}>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                  <ZoomIn className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Styled NIN Card Document */}
              <div className="w-full h-[220px] bg-gradient-to-br from-teal-800 to-emerald-950 p-6 flex flex-col justify-between text-white shadow-inner relative font-sans">
                {/* Holographic Watermark lines */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40 pointer-events-none" />
                <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 bg-[linear-gradient(45deg,_transparent_25%,_rgba(255,255,255,.2)_50%,_transparent_75%)] bg-[length:20px_20px]" />

                <div className="flex items-start justify-between z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-extrabold tracking-widest text-emerald-300">FEDERAL REPUBLIC OF NIGERIA</p>
                    <h4 className="text-xs font-bold font-outfit uppercase tracking-wider text-white">National Identity Card</h4>
                  </div>
                  <div className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                    <div className="h-4 w-4 rounded-full bg-emerald-400 opacity-80" />
                  </div>
                </div>

                <div className="flex items-end gap-5 z-10">
                  {/* Photo area */}
                  <div className="h-20 w-16 bg-slate-900/60 rounded-md border border-white/20 overflow-hidden shrink-0 relative flex items-center justify-center">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={user?.imageUrl || ""} className="grayscale" />
                      <AvatarFallback>S</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 bg-emerald-500 h-2 w-2 rounded-full animate-pulse" />
                  </div>

                  {/* Text details */}
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="text-[7px] text-emerald-300/80 font-bold uppercase tracking-wider">Surname / Given Names</p>
                      <p className="text-[11px] font-extrabold tracking-tight">SMITH SIMON</p>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-[7px] text-emerald-300/80 font-bold uppercase tracking-wider">National Identification No</p>
                        <p className="text-xs font-extrabold tracking-widest text-emerald-200">3847 2947 1048</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Notification Banner */}
            {ninStatus === "Rejected" && ninReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700 animate-in slide-in-from-top-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Rejection Reason Specified:</p>
                  <p className="text-xs font-medium italic opacity-90">"{ninReason}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Doc Actions */}
          <div className="p-6 border-t border-border/30 bg-surface/10 flex items-center gap-3">
            {ninStatus === "Pending" ? (
              <>
                <Button 
                  onClick={() => setRejectingDoc("nin")} 
                  disabled={isSubmitting !== null}
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs gap-2 transition-all cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Document
                </Button>
                <Button 
                  onClick={() => handleApprove("nin")} 
                  disabled={isSubmitting !== null}
                  className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer"
                >
                  {isSubmitting === "nin" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Document
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => handleReset("nin")} 
                variant="outline" 
                className="w-full h-11 rounded-xl text-xs font-bold text-slate/50 hover:text-dark hover:bg-surface border-border/50 transition-all cursor-pointer"
              >
                Reset Verification Status
              </Button>
            )}
          </div>
        </div>

        {/* Document 2: Utility Bill */}
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
          {/* Doc Header */}
          <div className="p-6 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-dark font-outfit">Utility Bill</h3>
              <p className="text-[11px] font-medium text-slate/40">Proof of Residential Address</p>
            </div>
            <Badge className={`${
              utilityStatus === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              utilityStatus === "Rejected" ? "bg-red-50 text-red-500 border-red-100" :
              "bg-amber-50 text-amber-600 border-amber-100"
            } border shadow-none px-3.5 py-1.5 rounded-xl text-[10px] font-bold gap-1.5 items-center`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                utilityStatus === "Approved" ? "bg-emerald-500" :
                utilityStatus === "Rejected" ? "bg-red-500" :
                "bg-amber-500"
              }`} />
              {utilityStatus}
            </Badge>
          </div>

          {/* Extracted Details & Live Preview */}
          <div className="p-6 flex-1 space-y-6">
            
            {/* Extracted Data Fields */}
            <div className="grid grid-cols-2 gap-4">
              {utilityFields.map((field, idx) => (
                <div key={idx} className="p-3.5 bg-surface/40 border border-border/10 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-slate/50">
                    <field.icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{field.label}</span>
                  </div>
                  <p className="text-xs font-extrabold text-dark line-clamp-2 leading-tight">{field.value}</p>
                </div>
              ))}
            </div>

            {/* Premium Interactive Document Preview (Utility Bill SVG) */}
            <div className="relative group rounded-xl border border-border/30 overflow-hidden cursor-pointer" onClick={() => setActiveLightbox("utility")}>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                  <ZoomIn className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Styled Utility Bill */}
              <div className="w-full h-[220px] bg-slate-50 p-6 flex flex-col justify-between text-slate-800 shadow-inner relative font-sans border-t-[8px] border-t-blue-600">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black tracking-tight text-blue-900">EKO ELECTRICITY DISTRIBUTION PLC</h4>
                    <p className="text-[7px] font-bold text-slate/40">CUSTOMER COPIED STATEMENT</p>
                  </div>
                  <div className="text-right text-[8px] font-bold text-slate/50">
                    <p>BILL ID: #EK-394719</p>
                    <p className="text-blue-600 font-extrabold">DUE DATE: 25 Apr 2026</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-y border-slate-200/60 py-3 my-1">
                  <div className="space-y-1 border-r border-slate-100 pr-2">
                    <p className="text-[7px] text-slate/40 font-bold uppercase tracking-wider">Service Address / Customer</p>
                    <p className="text-[9px] font-extrabold text-dark leading-snug">SIMON SMITH</p>
                    <p className="text-[8px] font-semibold text-slate/60 leading-tight">Plot 12, Admiralty Way, Lekki Phase 1, Lagos</p>
                  </div>
                  <div className="pl-1 space-y-1.5 flex flex-col justify-center">
                    <div className="flex justify-between text-[8px] font-bold">
                      <span className="text-slate/40">PREVIOUS READING</span>
                      <span className="text-dark">3,201 kWh</span>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold border-t border-slate-100 pt-1">
                      <span className="text-slate/40">CURRENT READING</span>
                      <span className="text-dark">3,541 kWh</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Tiny Barcode bar indicator */}
                    <div className="flex gap-[1px]">
                      {[1,3,1,2,4,1,3,1,2,3,1,2,1].map((w, idx) => (
                        <div key={idx} className="bg-slate-800 h-6" style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    <span className="text-[7px] font-bold text-slate/40">EK928371049</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] text-slate/40 font-bold uppercase tracking-wider">TOTAL AMOUNT DUE</p>
                    <p className="text-xs font-black text-blue-900">₦24,850.12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Notification Banner */}
            {utilityStatus === "Rejected" && utilityReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700 animate-in slide-in-from-top-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Rejection Reason Specified:</p>
                  <p className="text-xs font-medium italic opacity-90">"{utilityReason}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Doc Actions */}
          <div className="p-6 border-t border-border/30 bg-surface/10 flex items-center gap-3">
            {utilityStatus === "Pending" ? (
              <>
                <Button 
                  onClick={() => setRejectingDoc("utility")} 
                  disabled={isSubmitting !== null}
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs gap-2 transition-all cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Document
                </Button>
                <Button 
                  onClick={() => handleApprove("utility")} 
                  disabled={isSubmitting !== null}
                  className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer"
                >
                  {isSubmitting === "utility" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Document
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => handleReset("utility")} 
                variant="outline" 
                className="w-full h-11 rounded-xl text-xs font-bold text-slate/50 hover:text-dark hover:bg-surface border-border/50 transition-all cursor-pointer"
              >
                Reset Verification Status
              </Button>
            )}
          </div>
        </div>

        </div>
      )}

      {/* Lightbox Zoom Modals */}
      {activeLightbox && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setActiveLightbox(null)} />
          <div className="relative w-full max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-400">
            <button 
              onClick={() => setActiveLightbox(null)} 
              className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full flex items-center justify-center transition-all z-20 active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Render selected document high-resolution preview */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto">
              {activeLightbox === "nin" ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-outfit text-dark flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    National ID (NIN) Card - Full Resolution
                  </h3>
                  
                  {/* High Res representation */}
                  <div className="w-full h-[320px] bg-gradient-to-br from-teal-800 to-emerald-950 p-8 flex flex-col justify-between text-white rounded-2xl relative font-sans shadow-inner border border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent opacity-40 pointer-events-none" />
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold tracking-widest text-emerald-300">FEDERAL REPUBLIC OF NIGERIA</p>
                        <h4 className="text-sm font-bold font-outfit uppercase tracking-wider text-white">National Identity Card</h4>
                      </div>
                      <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                        <div className="h-5 w-5 rounded-full bg-emerald-400 opacity-80" />
                      </div>
                    </div>

                    <div className="flex items-end gap-6">
                      <div className="h-24 w-20 bg-slate-900/60 rounded-md border border-white/20 overflow-hidden shrink-0 relative flex items-center justify-center">
                        <Avatar className="h-full w-full rounded-none">
                          <AvatarImage src={user?.imageUrl || ""} className="grayscale scale-105" />
                          <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] text-emerald-300/80 font-bold uppercase tracking-wider">Surname</p>
                            <p className="text-xs font-extrabold tracking-tight text-white">SMITH</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-emerald-300/80 font-bold uppercase tracking-wider">Given Names</p>
                            <p className="text-xs font-extrabold tracking-tight text-white">SIMON</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-emerald-300/80 font-bold uppercase tracking-wider">National Identity No</p>
                            <p className="text-sm font-black tracking-widest text-emerald-200">3847 2947 1048</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-emerald-300/80 font-bold uppercase tracking-wider">Date of Birth</p>
                            <p className="text-xs font-extrabold tracking-tight text-white">12 / 10 / 1993</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-outfit text-dark flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Utility Bill - Full Resolution Statement
                  </h3>
                  
                  {/* High Res utility statement */}
                  <div className="w-full h-[400px] bg-slate-50 p-8 flex flex-col justify-between text-slate-800 rounded-2xl relative font-sans border-t-[10px] border-t-blue-600 shadow-inner">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black tracking-tight text-blue-900">EKO ELECTRICITY DISTRIBUTION PLC</h4>
                        <p className="text-[8px] font-bold text-slate/40">Lekki Business District Office, Block 4, Lagos</p>
                      </div>
                      <div className="text-right text-[9px] font-bold text-slate/50">
                        <p>STATEMENT DATE: 14 Mar 2026</p>
                        <p>BILL ID: #EK-394719</p>
                        <p className="text-blue-600 font-extrabold">DUE DATE: 25 Apr 2026</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-y border-slate-200 py-4 my-2">
                      <div className="space-y-2 pr-4 border-r border-slate-100">
                        <p className="text-[8px] text-slate/40 font-bold uppercase tracking-wider">Customer Details / Billing Address</p>
                        <p className="text-xs font-extrabold text-dark">SIMON SMITH</p>
                        <p className="text-[10px] font-semibold text-slate/60 leading-relaxed">Plot 12, Admiralty Way, Lekki Phase 1, Eti-Osa LGA, Lagos State, Nigeria</p>
                      </div>
                      <div className="pl-2 space-y-2 flex flex-col justify-center">
                        <div className="flex justify-between text-[10px] font-bold text-slate/60">
                          <span>PREVIOUS READING:</span>
                          <span className="text-dark">3,201 kWh</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate/60">
                          <span>CURRENT READING:</span>
                          <span className="text-dark">3,541 kWh</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate/60 border-t border-slate-100 pt-2">
                          <span>TOTAL USAGE:</span>
                          <span className="text-blue-600 font-extrabold">340 kWh</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-[1px]">
                          {[2,4,1,2,5,1,3,2,2,4,1,3,1].map((w, idx) => (
                            <div key={idx} className="bg-slate-800 h-8" style={{ width: `${w}px` }} />
                          ))}
                        </div>
                        <span className="text-[8px] font-extrabold text-slate/40">EK928371049</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-slate/40 font-bold uppercase tracking-wider">TOTAL PAYABLE AMOUNT</p>
                        <p className="text-base font-black text-blue-900">₦24,850.12</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Input Popover Modals */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setRejectingDoc(null)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[450px] p-8 shadow-2xl border border-border/50 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <button onClick={() => setRejectingDoc(null)} className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-colors">
                <X className="h-4.5 w-4.5 text-slate/60" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-outfit text-dark">Specify Rejection Reason</h3>
              <p className="text-xs font-semibold text-slate/50">Select a preset explanation or enter your own.</p>
            </div>

            <div className="space-y-4">
              {/* Preset Reason Chips */}
              <div className="flex flex-col gap-2">
                {presetReasons.map((reason, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setRejectionInput(reason)}
                    className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      rejectionInput === reason 
                        ? 'bg-red-50/40 border-red-200 text-red-700 shadow-sm' 
                        : 'bg-surface/30 border-border/30 text-slate hover:border-slate/40'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-dark/70 ml-1">Custom Reason Details</label>
                <textarea 
                  className="w-full min-h-[90px] p-4 bg-surface/50 border border-border/30 rounded-xl font-semibold text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none"
                  placeholder="Provide additional context here..."
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleRejectSubmit}
              disabled={isSubmitting !== null}
              className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/10 transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
