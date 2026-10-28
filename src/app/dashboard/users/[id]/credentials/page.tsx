"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
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
  FileText,
  ExternalLink,
  Camera,
  Globe,
  Users,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetUserDetailsQuery,
  useGetUserCredentialsQuery,
  useReviewKycDocumentsMutation,
  useUpdateOverallKycStatusMutation,
  useUpdateKycLevelMutation,
} from "@/lib/redux/features/usersApi";
import { format } from "date-fns";

export default function CredentialsVerificationPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const resolvedId = (routeParams?.id as string) || "";

  // Fetch both user details and dedicated credentials endpoint
  const { data: userDataResponse, isLoading: isUserLoading, refetch: refetchUser } = useGetUserDetailsQuery(resolvedId);
  const { data: credsDataResponse, isLoading: isCredsLoading, refetch: refetchCreds } = useGetUserCredentialsQuery(resolvedId);

  const user = userDataResponse?.data?.data || userDataResponse?.data || userDataResponse;
  const credsData = credsDataResponse?.data?.data || credsDataResponse?.data || credsDataResponse;

  // Unified KYC data object combining all possible backend shapes
  const kycProfile = {
    ...(user?.kycProfile || {}),
    ...(user?.kycData || {}),
    ...(credsData?.kycProfile || {}),
    ...(credsData?.kycData || {}),
    ...(typeof credsData === "object" && !Array.isArray(credsData) ? credsData : {}),
  };

  // Specific Government ID type submitted (International Passport, Driver's License, NIN)
  const resolvedIdType = kycProfile.idType || credsData?.idType || user?.idType || "National ID";

  const [reviewKycDocuments, { isLoading: isReviewing }] = useReviewKycDocumentsMutation();
  const [updateOverallKycStatus, { isLoading: isUpdatingOverall }] = useUpdateOverallKycStatusMutation();
  const [updateKycLevel] = useUpdateKycLevelMutation();

  // Document statuses
  const [idStatus, setIdStatus] = useState<string>("Pending");
  const [idReason, setIdReason] = useState<string>("");

  const [faceStatus, setFaceStatus] = useState<string>("Pending");
  const [faceReason, setFaceReason] = useState<string>("");

  const [utilityStatus, setUtilityStatus] = useState<string>("Not Uploaded");
  const [utilityReason, setUtilityReason] = useState<string>("");

  // Document URLs - checking both Swagger official names and legacy alternatives
  const idImageUrl =
    kycProfile.idImageUrl ||
    kycProfile.idImage ||
    credsData?.idImageUrl ||
    user?.idImageUrl ||
    null;

  const selfieUrl =
    kycProfile.faceImageUrl ||
    kycProfile.selfieUrl ||
    credsData?.faceImageUrl ||
    credsData?.selfieUrl ||
    user?.faceImageUrl ||
    user?.selfieUrl ||
    null;

  const addressDocUrl =
    kycProfile.addressDocUrl ||
    kycProfile.proofOfAddressUrl ||
    credsData?.addressDocUrl ||
    user?.addressDocUrl ||
    null;

  const passportUrl =
    kycProfile.passportUrl ||
    credsData?.passportUrl ||
    user?.passportUrl ||
    null;

  // Provider automated verification metrics from Swagger
  const bvnProviderVerified = kycProfile.bvnProviderVerified ?? credsData?.bvnProviderVerified;
  const ninProviderVerified = kycProfile.ninProviderVerified ?? credsData?.ninProviderVerified;
  const idProviderVerified = kycProfile.idProviderVerified ?? credsData?.idProviderVerified;
  const faceProviderVerified = kycProfile.faceProviderVerified ?? credsData?.faceProviderVerified;

  // Sync statuses from backend response
  useEffect(() => {
    if (kycProfile) {
      // 1. Government ID Status
      const rawIdStatus =
        kycProfile.idStatus ||
        (resolvedIdType.toLowerCase().includes("passport") ? kycProfile.passportStatus : kycProfile.ninStatus) ||
        kycProfile.passportStatus ||
        kycProfile.ninStatus;

      const hasId = Boolean(idImageUrl || passportUrl || kycProfile.idNumber || user?.nin);
      const isIdApproved =
        rawIdStatus === "Approved" ||
        (hasId && (Number(user?.kycLevel) >= 2 || user?.kycStatus === "VERIFIED") && rawIdStatus !== "Rejected");

      setIdStatus(
        isIdApproved
          ? "Approved"
          : hasId
          ? (rawIdStatus || "Pending")
          : "Not Uploaded"
      );
      setIdReason(
        rawIdStatus === "Rejected"
          ? (kycProfile.idRejectionReason || kycProfile.passportRejectionReason || kycProfile.ninRejectionReason || "")
          : ""
      );

      // 2. Face Selfie Status
      const rawFaceStatus = kycProfile.faceStatus || (kycProfile.faceVerified ? "Approved" : undefined);
      const hasFace = Boolean(selfieUrl || kycProfile.faceVerified);
      const isFaceApproved =
        rawFaceStatus === "Approved" ||
        (hasFace && (Number(user?.kycLevel) >= 2 || user?.kycStatus === "VERIFIED") && rawFaceStatus !== "Rejected");

      setFaceStatus(
        isFaceApproved
          ? "Approved"
          : hasFace
          ? (rawFaceStatus || "Pending")
          : "Not Uploaded"
      );
      setFaceReason(
        rawFaceStatus === "Rejected"
          ? (kycProfile.faceRejectionReason || "")
          : ""
      );

      // 3. Proof of Address Status (Level 3)
      // Must only be Approved if explicitly approved or if an address document exists and user is verified at Level 3
      const hasAddress = Boolean(addressDocUrl);
      const isUtilityApproved =
        kycProfile.utilityStatus === "Approved" ||
        (hasAddress && Number(user?.kycLevel) >= 3 && kycProfile.utilityStatus !== "Rejected");

      setUtilityStatus(
        isUtilityApproved
          ? "Approved"
          : hasAddress
          ? (kycProfile.utilityStatus || "Pending")
          : "Not Uploaded"
      );
      setUtilityReason(
        kycProfile.utilityStatus === "Rejected"
          ? (kycProfile.utilityRejectionReason || "")
          : ""
      );
    }
  }, [kycProfile, idImageUrl, selfieUrl, addressDocUrl, passportUrl, user?.kycLevel, user?.kycStatus, resolvedIdType]);

  // Log user and credentials data to console for direct comparison with App responses
  useEffect(() => {
    if (userDataResponse || credsDataResponse) {
      console.log("\n================ [ADMIN: USER DETAILS & KYC CREDENTIALS RESPONSE] ================");
      console.log("Resolved User ID:", resolvedId);
      console.log("1. User Data (GET /admin/users/" + resolvedId + "):", {
        id: user?.id,
        name: `${user?.firstName || ""} ${user?.lastName || ""}`,
        email: user?.email,
        kycLevel: user?.kycLevel,
        kycStatus: user?.kycStatus,
        kycVerified: user?.kycVerified,
        rawUserData: user,
      });
      console.log("2. KYC Credentials Data (GET /admin/kyc/users/" + resolvedId + "/credentials):", credsData);
      console.log("3. Synthesized kycProfile in Admin UI:", kycProfile);
      console.log("4. Resolved Image URLs:", {
        idImageUrl,
        selfieUrl,
        addressDocUrl,
        passportUrl,
      });
      console.log("==================================================================================\n");
    }
  }, [userDataResponse, credsDataResponse, resolvedId, idImageUrl, selfieUrl, addressDocUrl, passportUrl]);

  // Modal controls
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<"ID" | "NIN" | "FACE" | "UTILITY" | "PASSPORT" | "OVERALL" | null>(null);
  const [rejectionInput, setRejectionInput] = useState<string>("");

  const isWebUrl = (url: string | null) => Boolean(url && (url.startsWith("http://") || url.startsWith("https://")));
  const isPdfUrl = (url: string | null) => Boolean(url && url.toLowerCase().includes(".pdf"));

  const isIdImageWeb = isWebUrl(idImageUrl);
  const isAddressDocWeb = isWebUrl(addressDocUrl);
  const isPassportWeb = isWebUrl(passportUrl);
  const isSelfieWeb = isWebUrl(selfieUrl);

  // Next of kin data
  const nextOfKinName = kycProfile.nextOfKinName || kycProfile.nextOfKin?.fullName || user?.nextOfKinName || "";
  const nextOfKinRel = kycProfile.nextOfKinRelationship || kycProfile.nextOfKin?.relationship || user?.nextOfKinRelationship || "";
  const nextOfKinPhone = kycProfile.nextOfKinPhone || kycProfile.nextOfKin?.phone || user?.nextOfKinPhone || "";

  const presetReasons = [
    "Document is blurry or illegible",
    "Name on document does not match account name",
    "Document has expired",
    "Address on document does not match registered address",
    "Face selfie does not match ID photograph",
    "Incorrect document type uploaded",
  ];

  // Helper to resolve specific ID type string for review
  const resolveBackendIdDocType = (typeStr: string) => {
    const lower = (typeStr || "").toLowerCase();
    if (lower.includes("passport")) return "PASSPORT";
    if (lower.includes("driver") || lower.includes("license")) return "DRIVERS_LICENSE";
    if (lower.includes("voter")) return "VOTERS_CARD";
    return "NIN";
  };

  // Review single document (POST /api/v1/admin/kyc/users/{id}/credentials/review)
  const handleReview = async (type: "ID" | "NIN" | "FACE" | "UTILITY" | "PASSPORT", status: "Approved" | "Rejected", reason?: string) => {
    try {
      const isIdType = type === "ID" || type === "NIN" || type === "PASSPORT";
      const docTitle =
        isIdType
          ? resolvedIdType
          : type === "FACE"
          ? "Live Face Selfie"
          : "Proof of Address (Level 3)";

      const effectiveDocType = isIdType ? resolveBackendIdDocType(resolvedIdType) : type;

      await reviewKycDocuments({
        id: resolvedId,
        documents: [
          {
            type: effectiveDocType,
            status,
            reason: reason || (status === "Approved" ? `${docTitle} verified successfully` : `${docTitle} rejected`),
          },
        ],
      }).unwrap();

      if (isIdType) {
        setIdStatus(status);
        setIdReason(reason || "");
      } else if (type === "FACE") {
        setFaceStatus(status);
        setFaceReason(reason || "");
      } else if (type === "UTILITY") {
        setUtilityStatus(status);
        setUtilityReason(reason || "");
      }

      // Synchronize overall user account level and KYC status based on document changes
      if (status === "Approved") {
        if (type === "UTILITY") {
          // Level 3 document approved -> upgrade user to Level 3 Verified
          try {
            await updateOverallKycStatus({
              id: resolvedId,
              status: "VERIFIED",
              kycLevel: 3,
              level: 3,
              reason: "Level 3 Proof of Address approved",
            }).unwrap();
          } catch (e) {
            console.warn("updateOverallKycStatus Level 3 error:", e);
          }
        } else if ((isIdType && faceStatus === "Approved") || (type === "FACE" && idStatus === "Approved")) {
          // Both Level 2 credentials now approved -> upgrade user to Level 2 Verified
          try {
            await updateOverallKycStatus({
              id: resolvedId,
              status: "VERIFIED",
              kycLevel: 2,
              level: 2,
              reason: "Level 2 credentials approved",
            }).unwrap();
          } catch (e) {
            console.warn("updateOverallKycStatus Level 2 error:", e);
          }
        }
      } else if (status === "Rejected") {
        if (type === "UTILITY") {
          // Level 3 rejected: demote user back to Level 2
          try {
            await updateOverallKycStatus({
              id: resolvedId,
              status: "VERIFIED",
              kycLevel: 2,
              level: 2,
              reason: reason || "Proof of Address rejected",
            }).unwrap();
          } catch (e) {
            console.warn("Demote to Level 2 error:", e);
          }
        } else {
          // Level 2 credential rejected: set user status to REJECTED and demote kycLevel to 1
          try {
            await updateOverallKycStatus({
              id: resolvedId,
              status: "REJECTED",
              kycLevel: 1,
              level: 1,
              reason: reason || `${docTitle} rejected`,
            }).unwrap();
          } catch (e) {
            console.warn("updateOverallKycStatus rejection error:", e);
          }
        }
      }

      toast.success(`${docTitle} marked as ${status}`);
      refetchUser();
      refetchCreds();
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to review ${type}`);
    }
  };

  // Bulk review Level 2 credentials (both ID and Face Selfie)
  const handleReviewLevel2 = async (status: "Approved" | "Rejected", reason?: string) => {
    try {
      const effectiveIdType = resolveBackendIdDocType(resolvedIdType);

      await reviewKycDocuments({
        id: resolvedId,
        documents: [
          {
            type: effectiveIdType,
            status,
            reason: reason || (status === "Approved" ? `${resolvedIdType} verified` : `${resolvedIdType} rejected`),
          },
          {
            type: "FACE",
            status,
            reason: reason || (status === "Approved" ? "Face verified" : "Face rejected"),
          },
        ],
      }).unwrap();

      setIdStatus(status);
      setFaceStatus(status);

      // Synchronize overall user account level and KYC status
      if (status === "Approved") {
        try {
          await updateOverallKycStatus({
            id: resolvedId,
            status: "VERIFIED",
            kycLevel: 2,
            level: 2,
            reason: "Level 2 KYC approved by admin",
          }).unwrap();
        } catch (e) {
          console.warn("updateOverallKycStatus Level 2 bulk error:", e);
        }
      } else {
        try {
          await updateOverallKycStatus({
            id: resolvedId,
            status: "REJECTED",
            kycLevel: 1,
            level: 1,
            reason: reason || "Level 2 credentials rejected",
          }).unwrap();
        } catch (e) {
          console.warn("updateOverallKycStatus rejection error:", e);
        }
      }


      toast.success(
        status === "Approved"
          ? `Level 2 approved & user upgraded to Level 2 (Verified)`
          : `Level 2 marked as ${status}`
      );
      refetchUser();
      refetchCreds();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update Level 2 documents");
    }
  };

  // Review Level 3 Proof of Address
  const handleReviewLevel3 = async (status: "Approved" | "Rejected", reason?: string) => {
    try {
      await reviewKycDocuments({
        id: resolvedId,
        documents: [
          {
            type: "UTILITY",
            status,
            reason: reason || (status === "Approved" ? "Proof of Address verified successfully" : "Proof of Address rejected"),
          },
        ],
      }).unwrap();

      setUtilityStatus(status);
      setUtilityReason(reason || "");

      // Synchronize overall user account level and KYC status
      if (status === "Approved") {
        try {
          await updateOverallKycStatus({
            id: resolvedId,
            status: "VERIFIED",
            kycLevel: 3,
            level: 3,
            reason: "Level 3 Proof of Address approved by admin",
          }).unwrap();
        } catch (e) {
          console.warn("updateOverallKycStatus Level 3 error:", e);
        }
      } else {
        // Demote back to Level 2
        try {
          await updateOverallKycStatus({
            id: resolvedId,
            status: "VERIFIED",
            kycLevel: 2,
            level: 2,
            reason: reason || "Proof of Address rejected",
          }).unwrap();
        } catch (e) {
          console.warn("Demote to Level 2 error:", e);
        }
      }

      toast.success(
        status === "Approved"
          ? `Level 3 approved & user upgraded to Level 3 (Verified)`
          : `Level 3 Proof of Address marked as ${status}`
      );
      refetchUser();
      refetchCreds();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update Level 3 Proof of Address");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionInput.trim()) {
      toast.error("Please provide or select a rejection reason");
      return;
    }
    if (!rejectingDoc) return;

    if (rejectingDoc === "OVERALL") {
      await handleOverallKyc("REJECTED", rejectionInput.trim());
    } else {
      await handleReview(rejectingDoc, "Rejected", rejectionInput.trim());
    }

    setRejectingDoc(null);
    setRejectionInput("");
  };

  // Update Overall User KYC (PUT /api/v1/admin/kyc/users/{id})
  const handleOverallKyc = async (status: "VERIFIED" | "REJECTED", reason?: string) => {
    try {
      await updateOverallKycStatus({
        id: resolvedId,
        status,
        reason: reason || (status === "VERIFIED" ? "User KYC approved" : "User KYC rejected"),
      }).unwrap();

      toast.success(`Overall user KYC updated to ${status}`);
      refetchUser();
      refetchCreds();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update overall KYC status");
    }
  };

  if (isUserLoading && isCredsLoading) {
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

  const allReviewedDocsApproved =
    idStatus === "Approved" &&
    (faceStatus === "Approved" || faceStatus === "Not Uploaded") &&
    (utilityStatus === "Approved" || utilityStatus === "Not Uploaded");

  const hasAnyApproved =
    idStatus === "Approved" ||
    utilityStatus === "Approved" ||
    faceStatus === "Approved";

  const isAnyRejected =
    idStatus === "Rejected" ||
    faceStatus === "Rejected" ||
    utilityStatus === "Rejected" ||
    user?.kycStatus === "REJECTED";

  const isOverallVerified =
    user?.kycStatus === "VERIFIED" ||
    user?.kycStatus === "verified" ||
    user?.kycVerified === true ||
    (allReviewedDocsApproved && hasAnyApproved && !isAnyRejected) ||
    (Number(user?.kycLevel) >= 2 && !isAnyRejected && user?.kycStatus !== "REJECTED");

  const isLevel2BothApproved = idStatus === "Approved" && faceStatus === "Approved";

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1240px] min-h-[900px] mx-auto flex flex-col space-y-8 animate-in fade-in duration-500">
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
                      : isAnyRejected
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  } border shadow-none px-3 py-1 rounded-full text-[10px] font-bold`}
                >
                  KYC {isOverallVerified ? "VERIFIED" : isAnyRejected ? "REJECTED" : (user?.kycStatus || "PENDING")} (Level {user?.kycLevel ?? (isOverallVerified ? 3 : 1)})
                </Badge>
              </div>
              <p className="text-slate/60 text-xs font-semibold">
                User ID: <span className="text-dark font-bold">{resolvedId}</span> • {user?.email || "No Email"}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* KYC Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
        {/* CARD 1: Live Face Selfie (Level 2 Biometrics) */}
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col h-full w-full min-w-0">
          <div className="p-5 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-dark font-outfit">Live Face Selfie</h3>
              <p className="text-[11px] font-medium text-slate/40">Biometric Verification (Level 2)</p>
            </div>
            {renderStatusBadge(faceStatus)}
          </div>

          <div className="p-5 flex-1 space-y-4">
            {/* Automated Gateway Badges (AI match removed per request) */}
            {(bvnProviderVerified || faceProviderVerified) && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F2FFFF] border border-[#CCFBF1] rounded-xl">
                {bvnProviderVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    BVN Verified
                  </span>
                )}
                {faceProviderVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Face Verified
                  </span>
                )}
              </div>
            )}

            {/* Extracted Fields */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <User className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Full Name</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Not Provided"}
                </p>
              </div>

              <div className="p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">BVN</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.bvn || user?.bvn || "Not Provided"}
                </p>
              </div>

              <div className="p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Date of Birth</span>
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

            {/* Face Selfie Image */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate/50 uppercase tracking-wider">Submitted Face Selfie</span>
                <span className="text-[9px] font-semibold text-slate/40">{faceStatus}</span>
              </div>
              {isSelfieWeb ? (
                <div
                  className="relative group h-[180px] rounded-xl border border-border/40 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer shadow-inner"
                  onClick={() => setActiveLightboxImage(selfieUrl)}
                >
                  <img src={selfieUrl!} alt="Face Selfie" className="w-full h-full object-contain p-1.5" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-2.5 rounded-full shadow-md">
                      <ZoomIn className="h-5 w-5 text-dark" />
                    </div>
                  </div>
                </div>
              ) : selfieUrl ? (
                <div className="h-[180px] rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-2 text-center space-y-1">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-[10px] font-bold text-dark">Mobile URI</p>
                  <span className="text-[8px] font-mono text-slate/40 truncate max-w-[140px]">{selfieUrl}</span>
                </div>
              ) : (
                <div className="h-[180px] rounded-xl border-2 border-dashed border-border/60 bg-surface/30 flex flex-col items-center justify-center p-2 text-center space-y-1">
                  <Camera className="h-6 w-6 text-slate/30" />
                  <p className="text-[10px] font-semibold text-slate/50">No face selfie captured</p>
                </div>
              )}
            </div>

            {faceStatus === "Rejected" && faceReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold">Face Rejection Reason:</p>
                  <p className="italic">{faceReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/30 bg-surface/10 flex items-center gap-2">
            {faceStatus === "Not Uploaded" ? (
              <Button disabled variant="outline" className="w-full h-10 rounded-xl text-xs font-bold text-slate/40 border-border/40 cursor-not-allowed">
                Awaiting Face Selfie
              </Button>
            ) : faceStatus === "Approved" ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Face Approved
                </span>
                <Button
                  onClick={() => setRejectingDoc("FACE")}
                  disabled={isReviewing}
                  variant="outline"
                  className="h-9 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                >
                  Revoke Face
                </Button>
              </div>
            ) : faceStatus === "Rejected" ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 truncate">
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /> Rejected
                </span>
                <Button
                  onClick={() => handleReview("FACE", "Approved")}
                  disabled={isReviewing}
                  className="h-9 px-3 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold cursor-pointer"
                >
                  Re-Approve Face
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setRejectingDoc("FACE")}
                  disabled={isReviewing}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs gap-1 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview("FACE", "Approved")}
                  disabled={isReviewing}
                  className="flex-1 h-10 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-1 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Face
                </Button>
              </>
            )}
          </div>
        </div>

        {/* CARD 2: Government Valid ID Card (Level 2) */}
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col h-full w-full min-w-0">
          <div className="p-5 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-dark font-outfit">
                {resolvedIdType}
              </h3>
              <p className="text-[11px] font-medium text-slate/40">Proof of Identification (Level 2)</p>
            </div>
            {renderStatusBadge(idStatus)}
          </div>

          <div className="p-5 flex-1 space-y-4">
            {/* Verification Badges */}
            {(ninProviderVerified || idProviderVerified) && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F2FFFF] border border-[#CCFBF1] rounded-xl">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {resolvedIdType} Verified
                </span>
              </div>
            )}

            {/* Extracted Fields */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <User className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Full Name</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Not Provided"}
                </p>
              </div>

              <div className="p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <CreditCard className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {resolvedIdType.toLowerCase().includes("passport")
                      ? "Passport Number"
                      : resolvedIdType.toLowerCase().includes("driver") || resolvedIdType.toLowerCase().includes("license")
                      ? "Driver's License No."
                      : "NIN / ID Number"}
                  </span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.idNumber || user?.nin || "Not Provided"}
                </p>
              </div>

              <div className="p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Date of Birth</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.dateOfBirth
                    ? format(new Date(kycProfile.dateOfBirth), "MMM dd, yyyy")
                    : user?.dob
                    ? format(new Date(user.dob), "MMM dd, yyyy")
                    : "Not Provided"}
                </p>
              </div>

              {nextOfKinName && (
                <div className="col-span-2 p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate/50">
                    <Users className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Next of Kin</span>
                  </div>
                  <p className="text-xs font-bold text-dark truncate">
                    {nextOfKinName} {nextOfKinRel ? `(${nextOfKinRel})` : ""} {nextOfKinPhone ? `• ${nextOfKinPhone}` : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Submitted ID Document Image */}
            {(() => {
              const effectiveIdUrl = idImageUrl || passportUrl;
              const isEffectiveIdWeb = isWebUrl(effectiveIdUrl);
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate/50 uppercase tracking-wider">
                      Submitted {resolvedIdType}
                    </span>
                    <span className="text-[9px] font-semibold text-slate/40">{idStatus}</span>
                  </div>
                  {isEffectiveIdWeb ? (
                    isPdfUrl(effectiveIdUrl) ? (
                      <div className="h-[180px] rounded-xl border border-border/40 bg-slate-50 flex flex-col items-center justify-center p-3 text-center space-y-2 shadow-inner">
                        <FileText className="h-8 w-8 text-primary" />
                        <p className="text-xs font-bold text-dark">PDF Document</p>
                        <a
                          href={effectiveIdUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View / Download PDF
                        </a>
                      </div>
                    ) : (
                      <div
                        className="relative group h-[180px] rounded-xl border border-border/40 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer shadow-inner"
                        onClick={() => setActiveLightboxImage(effectiveIdUrl)}
                      >
                        <img src={effectiveIdUrl!} alt="Uploaded ID" className="w-full h-full object-contain p-1.5" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white p-2.5 rounded-full shadow-md">
                            <ZoomIn className="h-5 w-5 text-dark" />
                          </div>
                        </div>
                      </div>
                    )
                  ) : effectiveIdUrl ? (
                    <div className="h-[180px] rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-2 text-center space-y-1">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <p className="text-[10px] font-bold text-dark">Mobile URI</p>
                      <span className="text-[8px] font-mono text-slate/40 truncate max-w-[140px]">{effectiveIdUrl}</span>
                    </div>
                  ) : (
                    <div className="h-[180px] rounded-xl border-2 border-dashed border-border/60 bg-surface/30 flex flex-col items-center justify-center p-2 text-center space-y-1">
                      <ImageIcon className="h-6 w-6 text-slate/30" />
                      <p className="text-[10px] font-semibold text-slate/50">No ID uploaded</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {idStatus === "Rejected" && idReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold">{resolvedIdType} Rejection Reason:</p>
                  <p className="italic">{idReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/30 bg-surface/10 flex items-center gap-2">
            {idStatus === "Not Uploaded" ? (
              <Button disabled variant="outline" className="w-full h-10 rounded-xl text-xs font-bold text-slate/40 border-border/40 cursor-not-allowed">
                Awaiting {resolvedIdType} Upload
              </Button>
            ) : idStatus === "Approved" ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {resolvedIdType} Approved
                </span>
                <Button
                  onClick={() => setRejectingDoc("ID")}
                  disabled={isReviewing}
                  variant="outline"
                  className="h-9 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                >
                  Revoke ID
                </Button>
              </div>
            ) : idStatus === "Rejected" ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 truncate">
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /> Rejected
                </span>
                <Button
                  onClick={() => handleReview("ID", "Approved")}
                  disabled={isReviewing}
                  className="h-9 px-3 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold cursor-pointer"
                >
                  Re-Approve ID
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setRejectingDoc("ID")}
                  disabled={isReviewing}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs gap-1 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview("ID", "Approved")}
                  disabled={isReviewing}
                  className="flex-1 h-10 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-1 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve ID
                </Button>
              </>
            )}
          </div>
        </div>

        {/* CARD 3: Proof of Address (Level 3) */}
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col h-full w-full min-w-0">
          <div className="p-5 border-b border-border/30 bg-surface/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-dark font-outfit">Proof of Address</h3>
              <p className="text-[11px] font-medium text-slate/40">Residential Verification (Level 3)</p>
            </div>
            {renderStatusBadge(utilityStatus)}
          </div>

          <div className="p-5 flex-1 space-y-4">
            {/* Extracted Fields */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Residential Address</span>
                </div>
                <p className="text-xs font-bold text-dark">
                  {user?.address || kycProfile.address || "Not Provided"}
                </p>
                {(user?.city || user?.state) && (
                  <p className="text-[11px] font-medium text-slate/60">
                    {[user?.city, user?.state, user?.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              <div className="p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <Building className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Provider / Type</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {kycProfile.utilityProvider || "Utility Bill / Statement"}
                </p>
              </div>

              <div className="p-2.5 bg-surface/40 border border-border/20 rounded-xl space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate/50">
                  <User className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Account Name</span>
                </div>
                <p className="text-xs font-bold text-dark truncate">
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Not Provided"}
                </p>
              </div>
            </div>

            {/* Document Image or PDF */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate/50 uppercase tracking-wider">Submitted Document</span>
              {isAddressDocWeb ? (
                isPdfUrl(addressDocUrl) ? (
                  <div className="h-[180px] rounded-xl border border-border/40 bg-slate-50 flex flex-col items-center justify-center p-3 text-center space-y-2 shadow-inner">
                    <FileText className="h-8 w-8 text-primary" />
                    <p className="text-xs font-bold text-dark">PDF Proof of Address</p>
                    <a
                      href={addressDocUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View / Download PDF
                    </a>
                  </div>
                ) : (
                  <div
                    className="relative group h-[180px] rounded-xl border border-border/40 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer shadow-inner"
                    onClick={() => setActiveLightboxImage(addressDocUrl)}
                  >
                    <img src={addressDocUrl!} alt="Address Document" className="w-full h-full object-contain p-1.5" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white p-2.5 rounded-full shadow-md">
                        <ZoomIn className="h-5 w-5 text-dark" />
                      </div>
                    </div>
                  </div>
                )
              ) : addressDocUrl ? (
                <div className="h-[180px] rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-2 text-center space-y-1">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-[10px] font-bold text-dark">Mobile URI</p>
                  <span className="text-[8px] font-mono text-slate/40 truncate max-w-[200px]">{addressDocUrl}</span>
                </div>
              ) : utilityStatus === "Approved" ? (
                <div className="h-[180px] rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center p-2 text-center space-y-1">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-800">Verified by Compliance</p>
                  <p className="text-[10px] text-emerald-600 font-medium">No document attachment uploaded</p>
                </div>
              ) : (
                <div className="h-[180px] rounded-xl border-2 border-dashed border-border/60 bg-surface/30 flex flex-col items-center justify-center p-2 text-center space-y-1">
                  <ImageIcon className="h-6 w-6 text-slate/30" />
                  <p className="text-[10px] font-semibold text-slate/50">No address document uploaded</p>
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

          <div className="p-4 border-t border-border/30 bg-surface/10 flex items-center gap-2">
            {utilityStatus === "Not Uploaded" ? (
              <Button disabled variant="outline" className="w-full h-10 rounded-xl text-xs font-bold text-slate/40 border-border/40 cursor-not-allowed">
                Awaiting Address Document
              </Button>
            ) : utilityStatus === "Approved" ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Level 3 Verified
                </span>
                <Button
                  onClick={() => setRejectingDoc("UTILITY")}
                  disabled={isReviewing}
                  variant="outline"
                  className="h-9 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                >
                  Revoke Level 3
                </Button>
              </div>
            ) : utilityStatus === "Rejected" ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 truncate">
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /> Rejected
                </span>
                <Button
                  onClick={() => handleReview("UTILITY", "Approved")}
                  disabled={isReviewing}
                  className="h-9 px-3 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold cursor-pointer"
                >
                  Re-Approve Level 3
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setRejectingDoc("UTILITY")}
                  disabled={isReviewing}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs gap-1 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview("UTILITY", "Approved")}
                  disabled={isReviewing}
                  className="flex-1 h-10 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-1 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Level 3
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
              {isPdfUrl(activeLightboxImage) ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <FileText className="h-16 w-16 text-primary" />
                  <p className="text-sm font-semibold text-dark">PDF Document Preview</p>
                  <a
                    href={activeLightboxImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" /> Open PDF in New Window
                  </a>
                </div>
              ) : (
                <img
                  src={activeLightboxImage}
                  alt="Document Preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                />
              )}
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
                {rejectingDoc === "OVERALL"
                  ? "Provide explanation for rejecting the user's overall KYC account status."
                  : `Provide explanation for rejecting ${
                      rejectingDoc === "ID" || rejectingDoc === "NIN" || rejectingDoc === "PASSPORT"
                        ? resolvedIdType
                        : rejectingDoc === "FACE"
                        ? "Face Selfie"
                        : rejectingDoc === "UTILITY"
                        ? "Proof of Address (Level 3)"
                        : "International Passport"
                    }.`}
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
              disabled={isReviewing || isUpdatingOverall}
              className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/10 transition-all active:scale-95 cursor-pointer text-xs"
            >
              {isReviewing || isUpdatingOverall ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" /> : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
