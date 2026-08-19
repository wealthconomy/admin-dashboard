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
  CreditCard,
  Building,
  User,
  Calendar,
  MapPin,
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetUserDetailsQuery,
  useReviewKycDocumentsMutation,
  useUpdateOverallKycStatusMutation,
} from "@/lib/redux/features/usersApi";
import { format } from "date-fns";

export default function CredentialsVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resolvedId = resolvedParams.id;

  const { data: userDataResponse, isLoading, refetch } = useGetUserDetailsQuery(resolvedId);
  const user = userDataResponse?.data?.data || userDataResponse?.data || userDataResponse;
  const kycProfile = user?.kycProfile || {};
  const kycData = user?.kycData || {};

  const [reviewKycDocuments, { isLoading: isReviewing }] = useReviewKycDocumentsMutation();
  const [updateOverallKycStatus, { isLoading: isUpdatingOverall }] = useUpdateOverallKycStatusMutation();

  // Document states directly from backend kycProfile
  const [ninStatus, setNinStatus] = useState<string>("Pending");
  const [ninReason, setNinReason] = useState<string>("");

  const [utilityStatus, setUtilityStatus] = useState<string>("Pending");
  const [utilityReason, setUtilityReason] = useState<string>("");

  // Sync statuses from backend response
  useEffect(() => {
    if (kycProfile) {
      const hasNIN = Boolean(kycProfile.idImageUrl || kycData.idImageUrl || kycProfile.idNumber);
      setNinStatus(hasNIN ? (kycProfile.ninStatus || "Pending") : "Not Uploaded");
      setNinReason(kycProfile.ninRejectionReason || "");

      const hasAddress = Boolean(kycProfile.addressDocUrl || kycData.addressDocUrl);
      setUtilityStatus(hasAddress ? (kycProfile.utilityStatus || "Pending") : "Not Uploaded");
      setUtilityReason(kycProfile.utilityRejectionReason || "");
    }
  }, [kycProfile, kycData]);

  // Modal controls
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<"NIN" | "UTILITY" | null>(null);
  const [rejectionInput, setRejectionInput] = useState<string>("");

  const idImageUrl = kycProfile.idImageUrl || kycData.idImageUrl || null;
  const addressDocUrl = kycProfile.addressDocUrl || kycData.addressDocUrl || null;

  const isIdImageWeb = Boolean(idImageUrl && (idImageUrl.startsWith("http://") || idImageUrl.startsWith("https://")));
  const isAddressDocWeb = Boolean(addressDocUrl && (addressDocUrl.startsWith("http://") || addressDocUrl.startsWith("https://")));

  const presetReasons = [
    "Document is blurry or illegible",
    "Name on document does not match account name",
    "Document has expired",
    "Address on document does not match registered address",
    "Incorrect document type uploaded",
  ];

  // Review single document (POST /api/v1/admin/kyc/users/{id}/credentials/review)
  const handleReview = async (type: "NIN" | "UTILITY", status: "Approved" | "Rejected", reason?: string) => {
    try {
      await reviewKycDocuments({
        id: resolvedId,
        documents: [
          {
            type,
            status,
            reason: reason || (status === "Approved" ? "Document verified successfully" : "Document rejected"),
          },
        ],
      }).unwrap();

      if (type === "NIN") {
        setNinStatus(status);
        setNinReason(reason || "");
      } else {
        setUtilityStatus(status);
        setUtilityReason(reason || "");
      }

      toast.success(`${type === "NIN" ? "National ID" : "Utility Bill"} marked as ${status}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to review ${type}`);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionInput.trim()) {
      toast.error("Please provide or select a rejection reason");
      return;
    }
    if (!rejectingDoc) return;

    await handleReview(rejectingDoc, "Rejected", rejectionInput.trim());
    setRejectingDoc(null);
    setRejectionInput("");
  };

  // Update Overall User KYC (PUT /api/v1/admin/kyc/users/{id})
  const handleOverallKyc = async (status: "VERIFIED" | "REJECTED") => {
    try {
      await updateOverallKycStatus({
        id: resolvedId,
        status,
        reason: status === "VERIFIED" ? "User KYC approved" : "User KYC rejected",
      }).unwrap();

      toast.success(`Overall user KYC updated to ${status}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update overall KYC status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-slate/50">Loading user KYC credentials...</p>
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-xl text-[10px] font-bold gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-xl text-[10px] font-bold gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Rejected
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-xl text-[10px] font-bold gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Review
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-xl text-[10px] font-bold gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Not Uploaded
          </Badge>
        );
    }
  };

  const isOverallVerified = user?.kycStatus === "VERIFIED" || user?.kycStatus === "verified";

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[900px] mx-auto flex flex-col space-y-8 animate-in fade-in duration-500">
      {/* Navigation & User Header */}
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => router.push(`/dashboard/users/${resolvedId}`)}
          className="flex items-center gap-2 text-slate/60 hover:text-primary transition-all font-medium text-sm group self-start cursor-pointer"
        >
          <div className="p-1.5 rounded-lg group-hover:bg-primary/5 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </div>
          Back to User Profile
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
                <h1 className="text-xl font-bold font-outfit text-dark leading-none">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User"}
                </h1>
                <Badge
                  className={`${
                    isOverallVerified
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : user?.kycStatus === "REJECTED"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  } border shadow-none px-3 py-1 rounded-full text-[10px] font-bold`}
                >
                  KYC {user?.kycStatus || "PENDING"} (Level {user?.kycLevel ?? 1})
                </Badge>
              </div>
              <p className="text-slate/60 text-xs font-semibold">
                User ID: <span className="text-dark font-bold">{resolvedId}</span> • {user?.email || "No Email"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-border/20">
            <Button
              onClick={() => handleOverallKyc("REJECTED")}
              disabled={isUpdatingOverall}
              variant="outline"
              className="h-10 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <XCircle className="h-4 w-4 text-red-500" />
              Reject Overall KYC
            </Button>
            <Button
              onClick={() => handleOverallKyc("VERIFIED")}
              disabled={isUpdatingOverall}
              className="h-10 px-5 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve Overall KYC
            </Button>
          </div>
        </div>
      </div>

      {/* KYC Documents Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DOCUMENT 1: National ID (NIN) */}
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col h-full">
          <div className="p-5 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-dark font-outfit">
                {kycProfile.idType || "National ID (NIN) Card"}
              </h3>
              <p className="text-[11px] font-medium text-slate/40">Proof of Identification</p>
            </div>
            {renderStatusBadge(ninStatus)}
          </div>

          <div className="p-6 flex-1 space-y-5">
            {/* Extracted Fields */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Full Name</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Not Provided"}
                </p>
              </div>

              <div className="p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">NIN / ID Number</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.idNumber || kycData.nin || "Not Provided"}
                </p>
              </div>

              <div className="p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">BVN</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.bvn || "Not Provided"}
                </p>
              </div>

              <div className="p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Date of Birth</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.dateOfBirth
                    ? format(new Date(kycProfile.dateOfBirth), "MMM dd, yyyy")
                    : user?.dob
                    ? format(new Date(user.dob), "MMM dd, yyyy")
                    : "Not Provided"}
                </p>
              </div>
            </div>

            {/* Document Image */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate/50 uppercase tracking-wider">Submitted ID Card</span>
              {isIdImageWeb ? (
                <div
                  className="relative group h-[200px] rounded-xl border border-border/40 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer shadow-inner"
                  onClick={() => setActiveLightboxImage(idImageUrl)}
                >
                  <img src={idImageUrl!} alt="Uploaded ID" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-2.5 rounded-full shadow-md">
                      <ZoomIn className="h-5 w-5 text-dark" />
                    </div>
                  </div>
                </div>
              ) : idImageUrl ? (
                <div className="h-[140px] rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-4 text-center space-y-1">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  <p className="text-xs font-bold text-dark">Mobile File URI</p>
                  <p className="text-[11px] text-slate/60 max-w-[280px]">
                    Uploaded as local device path from mobile.
                  </p>
                  <span className="text-[9px] font-mono text-slate/40 truncate max-w-[300px]">{idImageUrl}</span>
                </div>
              ) : (
                <div className="h-[140px] rounded-xl border-2 border-dashed border-border/60 bg-surface/30 flex flex-col items-center justify-center p-4 text-center space-y-1">
                  <ImageIcon className="h-7 w-7 text-slate/30" />
                  <p className="text-xs font-bold text-slate/60">No ID card photo uploaded yet</p>
                </div>
              )}
            </div>

            {ninStatus === "Rejected" && ninReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold">Rejection Reason:</p>
                  <p className="italic">{ninReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-border/30 bg-surface/10 flex items-center gap-3">
            {ninStatus === "Not Uploaded" ? (
              <Button disabled variant="outline" className="w-full h-11 rounded-xl text-xs font-bold text-slate/40 border-border/40 cursor-not-allowed">
                Awaiting ID Card Upload
              </Button>
            ) : ninStatus === "Approved" ? (
              <div className="flex items-center justify-between w-full gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> ID Verified & Approved
                </span>
                <Button
                  onClick={() => setRejectingDoc("NIN")}
                  disabled={isReviewing}
                  variant="outline"
                  className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                >
                  Revoke / Reject
                </Button>
              </div>
            ) : ninStatus === "Rejected" ? (
              <div className="flex items-center justify-between w-full gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <XCircle className="h-4 w-4 text-red-500" /> ID Rejected
                </span>
                <Button
                  onClick={() => handleReview("NIN", "Approved")}
                  disabled={isReviewing}
                  className="h-10 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold cursor-pointer"
                >
                  Re-Approve ID
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setRejectingDoc("NIN")}
                  disabled={isReviewing}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Document
                </Button>
                <Button
                  onClick={() => handleReview("NIN", "Approved")}
                  disabled={isReviewing}
                  className="flex-1 h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Document
                </Button>
              </>
            )}
          </div>
        </div>

        {/* DOCUMENT 2: Utility Bill / Proof of Address */}
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col h-full">
          <div className="p-5 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-dark font-outfit">Utility Bill / Proof of Address</h3>
              <p className="text-[11px] font-medium text-slate/40">Residential Address Verification</p>
            </div>
            {renderStatusBadge(utilityStatus)}
          </div>

          <div className="p-6 flex-1 space-y-5">
            {/* Extracted Fields */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2 p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Service Address</span>
                </div>
                <p className="text-xs font-bold text-dark">
                  {user?.address || kycData.address || "Not Provided"}
                </p>
              </div>

              <div className="p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <Building className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Provider</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycData.utilityProvider || "Not Specified"}
                </p>
              </div>

              <div className="p-3 bg-surface/40 border border-border/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Account Name</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Not Provided"}
                </p>
              </div>
            </div>

            {/* Document Image */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate/50 uppercase tracking-wider">Submitted Address Document</span>
              {isAddressDocWeb ? (
                <div
                  className="relative group h-[200px] rounded-xl border border-border/40 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer shadow-inner"
                  onClick={() => setActiveLightboxImage(addressDocUrl)}
                >
                  <img src={addressDocUrl!} alt="Uploaded Address Doc" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-2.5 rounded-full shadow-md">
                      <ZoomIn className="h-5 w-5 text-dark" />
                    </div>
                  </div>
                </div>
              ) : addressDocUrl ? (
                <div className="h-[140px] rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-4 text-center space-y-1">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  <p className="text-xs font-bold text-dark">Mobile File URI</p>
                  <span className="text-[9px] font-mono text-slate/40 truncate max-w-[300px]">{addressDocUrl}</span>
                </div>
              ) : (
                <div className="h-[140px] rounded-xl border-2 border-dashed border-border/60 bg-surface/30 flex flex-col items-center justify-center p-4 text-center space-y-1">
                  <ImageIcon className="h-7 w-7 text-slate/30" />
                  <p className="text-xs font-bold text-slate/60">No address document uploaded yet</p>
                </div>
              )}
            </div>

            {utilityStatus === "Rejected" && utilityReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold">Rejection Reason:</p>
                  <p className="italic">{utilityReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-border/30 bg-surface/10 flex items-center gap-3">
            {utilityStatus === "Not Uploaded" ? (
              <Button disabled variant="outline" className="w-full h-11 rounded-xl text-xs font-bold text-slate/40 border-border/40 cursor-not-allowed">
                Awaiting Address Document Upload
              </Button>
            ) : utilityStatus === "Approved" ? (
              <div className="flex items-center justify-between w-full gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Address Verified & Approved
                </span>
                <Button
                  onClick={() => setRejectingDoc("UTILITY")}
                  disabled={isReviewing}
                  variant="outline"
                  className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                >
                  Revoke / Reject
                </Button>
              </div>
            ) : utilityStatus === "Rejected" ? (
              <div className="flex items-center justify-between w-full gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <XCircle className="h-4 w-4 text-red-500" /> Address Rejected
                </span>
                <Button
                  onClick={() => handleReview("UTILITY", "Approved")}
                  disabled={isReviewing}
                  className="h-10 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold cursor-pointer"
                >
                  Re-Approve Address
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setRejectingDoc("UTILITY")}
                  disabled={isReviewing}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Document
                </Button>
                <Button
                  onClick={() => handleReview("UTILITY", "Approved")}
                  disabled={isReviewing}
                  className="flex-1 h-11 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Document
                </Button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox Zoom Modal */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setActiveLightboxImage(null)} />
          <div className="relative w-full max-w-[800px] max-h-[90vh] bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden z-10">
            <div className="flex items-center justify-between pb-3 border-b border-border/30">
              <h3 className="font-bold font-outfit text-dark text-base">Document Preview</h3>
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="h-8 w-8 rounded-full bg-surface hover:bg-slate-100 flex items-center justify-center text-slate cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-900/5 rounded-2xl min-h-[350px]">
              <img
                src={activeLightboxImage}
                alt="Document Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setRejectingDoc(null)} />
          <div className="relative bg-white rounded-[24px] w-full max-w-[450px] p-8 shadow-2xl border border-border/50 space-y-6 animate-in zoom-in-95 duration-500 z-10">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <button
                onClick={() => setRejectingDoc(null)}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface/80 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5 text-slate/60" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-outfit text-dark">Specify Rejection Reason</h3>
              <p className="text-xs font-semibold text-slate/50">
                Provide explanation for rejecting {rejectingDoc === "NIN" ? "National ID" : "Utility Bill"}.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                {presetReasons.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionInput(reason)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      rejectionInput === reason
                        ? "bg-red-50/40 border-red-200 text-red-700 shadow-sm font-bold"
                        : "bg-surface/30 border-border/30 text-slate hover:border-slate/40"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-dark/70 ml-1">Custom Reason</label>
                <textarea
                  className="w-full min-h-[85px] p-3.5 bg-surface/50 border border-border/30 rounded-xl font-medium text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none"
                  placeholder="Type additional details here..."
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleRejectSubmit}
              disabled={isReviewing}
              className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/10 transition-all active:scale-95 cursor-pointer text-xs"
            >
              {isReviewing ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" /> : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
