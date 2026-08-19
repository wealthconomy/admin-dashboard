"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  BookOpen,
  FileText,
  Video,
  PlusCircle,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ThumbsUp,
  Heart,
  User,
  X,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  Flame,
  Calendar,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { LibraryMaterial, ContentType } from "@/types/library";
import { useGetLibrariesQuery, useDeleteLibraryMutation, useGetLibraryStatsQuery, useRecordLibraryDownloadMutation, useGetLibraryEngagementQuery } from "@/lib/redux/features/libraryApi";
import { Loader2 } from "lucide-react";
// Removed MOCK_ENGAGEMENT_DATA and SEED_MATERIALS

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function CommentsModal({
  material,
  onClose,
}: {
  material: LibraryMaterial;
  onClose: () => void;
}) {
  const { data: engagementData, isLoading } = useGetLibraryEngagementQuery(material.id);
  
  const engagement = engagementData?.data || {
    likes: [],
    comments: [],
  };

  const [activeTab, setActiveTab] = useState<"likes" | "comments">("comments");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[24px] p-6 w-full max-w-[580px] h-[520px] flex flex-col shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-surface text-slate/50 hover:text-slate transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary bg-primary/5 px-2.5 py-1 rounded-full">
            {material.contentType} Engagement Details
          </span>
          <h3 className="text-lg font-bold font-outfit text-dark tracking-tight mt-2 line-clamp-1">
            {material.title}
          </h3>
          <p className="text-xs text-slate/50 mt-1">
            Total Likes: <span className="font-bold text-dark">{material.likesCount}</span> · Comments: <span className="font-bold text-dark">{material.commentsCount}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40 mb-4">
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "comments"
              ? "border-primary text-primary"
              : "border-transparent text-slate/40 hover:text-slate"
              }`}
          >
            Comments ({engagement.comments.length})
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "likes"
              ? "border-primary text-primary"
              : "border-transparent text-slate/40 hover:text-slate"
              }`}
          >
            Liked By ({engagement.likes.length > 0 ? engagement.likes.length : material.likesCount})
          </button>
        </div>

        {/* Tab Content (Scrollable Container) */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === "comments" ? (
            engagement.comments.length > 0 ? (
              <div className="space-y-4">
                {engagement.comments.map((comment: any) => (
                  <div
                    key={comment.id || comment._id || Math.random()}
                    className="p-4 rounded-2xl bg-surface/30 border border-border/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {comment.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-dark">
                            {comment.userName}
                          </p>
                          <p className="text-[10px] text-slate/40">
                            {comment.userRole}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate/40 font-medium">
                        {comment.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-dark font-medium leading-relaxed">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate/40 font-bold pt-1">
                      <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                      <span>{comment.likes} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate/40">
                <MessageSquare className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-xs font-semibold">No comments posted yet.</p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {engagement.likes.length > 0 ? (
                engagement.likes.map((like: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-surface/30 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-[11px]">
                        {like.user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-dark">
                          {like.user}
                        </p>
                        <p className="text-[9px] text-slate/40">{like.role}</p>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center">
                      <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate/40">
                  <ThumbsUp className="h-10 w-10 opacity-20 mb-2" />
                  <p className="text-xs font-semibold">No reaction logs recorded.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  material,
  onConfirm,
  onCancel,
}: {
  material: LibraryMaterial;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl border border-border/50 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-outfit text-dark tracking-tight">
              Delete this material?
            </h3>
            <p className="text-sm font-medium text-slate/60 leading-relaxed">
              <span className="font-bold text-dark">&ldquo;{material.title}&rdquo;</span> will be
              permanently removed and cannot be restored.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-12 rounded-xl border border-border/50 font-bold text-slate hover:bg-surface transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { data: response, isLoading } = useGetLibrariesQuery({ limit: 50 });
  const rawMaterials = Array.isArray(response) 
    ? response 
    : Array.isArray(response?.data) 
      ? response.data 
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

  const materials: LibraryMaterial[] = rawMaterials.map((m: any) => ({
    id: m.id || m._id,
    contentType: m.contentType || "document",
    title: m.title || "Untitled",
    description: m.description,
    image: m.image?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, process.env.NEXT_PUBLIC_API_URL || "") || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop",
    timePosted: m.createdAt || new Date().toISOString(),
    readingDuration: m.readingDuration || "",
    documentUrl: m.documentUrl?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, process.env.NEXT_PUBLIC_API_URL || ""),
    fileType: m.fileType,
    fileSize: m.fileSize,
    isDownloadable: m.isDownloadable,
    youtubeUrl: m.youtubeUrl,
    likesCount: m.likesCount || 0,
    commentsCount: m.commentsCount || 0,
    publishToApp: m.publishToApp,
    publishToWeb: m.publishToWeb,
  }));

  const [deleteLibrary] = useDeleteLibraryMutation();
  const [recordDownload] = useRecordLibraryDownloadMutation();

  const handleDownload = async (material: LibraryMaterial) => {
    if (!material.documentUrl) return;
    try {
      // Fire-and-forget: record the download event on the backend for accurate KPI stats
      await recordDownload(material.id).unwrap();
    } catch {
      // Non-blocking — don't prevent the download if tracking fails
    }

    // Generate clean filename with extension
    let extension = material.fileType?.toLowerCase() || "pdf";
    if (extension.includes("pdf")) extension = "pdf";
    else if (extension.includes("doc")) extension = "docx";
    else if (extension.includes("epub")) extension = "epub";

    const sanitizedTitle = (material.title || "wealthconomy_material")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const filename = `${sanitizedTitle}.${extension}`;

    try {
      // 1. Attempt client blob download with proper filename
      const response = await fetch(material.documentUrl);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        return;
      }
    } catch (err) {
      console.warn("Direct blob download restricted (CORS), applying Cloudinary attachment URL fallback:", err);
    }

    // 2. Cloudinary attachment transformation fallback
    let finalUrl = material.documentUrl;
    if (finalUrl.includes("cloudinary.com") && finalUrl.includes("/upload/")) {
      finalUrl = finalUrl.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(sanitizedTitle)}/`);
    }

    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<LibraryMaterial | null>(
    null
  );
  const [viewingCommentsMaterial, setViewingCommentsMaterial] =
    useState<LibraryMaterial | null>(null);

  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("all");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const { data: statsResponse, isLoading: isLoadingStats } = useGetLibraryStatsQuery(timeFilter);
  const backendStats = statsResponse?.data;

  // Stats from backend API (no dummy calculations)
  const totalMaterials = backendStats?.materials?.totalCount ?? 0;
  const uploadsThisMonth = backendStats?.materials?.uploadsThisMonth ?? 0;

  const totalDocs = backendStats?.documentsCount ?? 0;
  const totalVideos = backendStats?.videosCount ?? 0;
  const totalDownloadable = backendStats?.totalDownloads ?? 0;

  // New & Returning Library Users based on timeFilter
  const getUserStats = () => {
    const timeKey = timeFilter === "all" ? "allTime" : timeFilter;
    return {
      newUsers: backendStats?.users?.[timeKey]?.newUsers || 0,
      returningUsers: backendStats?.users?.[timeKey]?.returningUsers || 0,
      label: timeFilter === "all" ? "all time" : timeFilter === "today" ? "today" : `this ${timeFilter}`
    };
  };

  const { newUsers, returningUsers, label: filterLabel } = getUserStats();

  // Identify Top Performing Content (highest sum of likes + comments)
  const topPerformingMaterial = [...materials].sort(
    (a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0))
  )[0];

  // Filtering
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || m.contentType === typeFilter;
    return matchesSearch && matchesType;
  });



  // Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLibrary(deleteTarget.id).unwrap();
      toast.success("Material deleted successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete material");
    }
    setDeleteTarget(null);
  };

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          material={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Comments / Reactions Details Modal ── */}
      {viewingCommentsMaterial && (
        <CommentsModal
          material={viewingCommentsMaterial}
          onClose={() => setViewingCommentsMaterial(null)}
        />
      )}

      <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[900px] mx-auto space-y-8 animate-in fade-in duration-500">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
              Library Management
            </h1>
            <p className="text-sm text-slate/60 mt-1">
              Manage your educational materials — documents and videos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 rounded-xl border border-border/50 font-bold text-slate hover:bg-surface transition-all gap-2"
                >
                  <Calendar className="h-4 w-4 text-[#155D5F]" />
                  <span className="capitalize">{timeFilter === "all" ? "All Time" : timeFilter}</span>
                  <ChevronDown className="h-4 w-4 text-slate/40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[160px] bg-white border border-border/50 rounded-xl shadow-xl p-1 z-50">
                {(["today", "week", "month", "all"] as const).map((filter) => (
                  <DropdownMenuItem
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className="rounded-lg h-9 px-3 text-xs font-semibold text-slate hover:text-dark hover:bg-surface cursor-pointer flex items-center justify-between"
                  >
                    <span className="capitalize">{filter === "all" ? "All Time" : filter}</span>
                    {timeFilter === filter && <CheckCircle2 className="h-3.5 w-3.5 text-[#155D5F]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/dashboard/library/new">
              <Button
                id="upload-material-btn"
                className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-5 font-bold text-sm shadow-lg shadow-primary/10 gap-2 cursor-pointer transition-all active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                Upload Material
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Summary Stats Cards (Collapsible Grid) ── */}
        <div className="relative">
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="absolute top-[48px] -right-4 w-9 h-9 rounded-xl bg-white border border-slate/20 shadow-sm flex items-center justify-center text-slate hover:bg-surface transition-all duration-300 z-10 cursor-pointer"
          >
            {isStatsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pr-8">
            {/* Card 1: Total Materials */}
            <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  {isLoadingStats || isLoading ? (
                    <div className="h-7 flex items-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold font-outfit text-primary leading-none">
                      {totalMaterials.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-primary/80 mt-2">
                    Total Materials
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {uploadsThisMonth} uploads this month
              </div>
            </div>

            {/* Card 2: Documents */}
            <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  {isLoadingStats || isLoading ? (
                    <div className="h-7 flex items-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold font-outfit text-primary leading-none">
                      {totalDocs.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-primary/80 mt-2">
                    Documents
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                PDF & EPUB formats
              </div>
            </div>

            {/* Card 3: Videos */}
            <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  {isLoadingStats || isLoading ? (
                    <div className="h-7 flex items-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold font-outfit text-primary leading-none">
                      {totalVideos.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-primary/80 mt-2">
                    Videos
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                  <Video className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                YouTube lectures & guides
              </div>
            </div>

            {/* Expanded items */}
            {isStatsExpanded && (
              <>
                {/* Card 4: Downloadable Docs */}
                <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      {isLoadingStats || isLoading ? (
                        <div className="h-7 flex items-center">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold font-outfit text-primary leading-none">
                          {totalDownloadable.toLocaleString()}
                        </p>
                      )}
                      <p className="text-[11px] font-semibold text-primary/80 mt-2">
                        Total Downloads                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-slate/50 font-bold">
                    Available for offline reading
                  </div>
                </div>

                {/* Card 5: New Users */}
                <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      {isLoadingStats || isLoading ? (
                        <div className="h-7 flex items-center">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold font-outfit text-primary leading-none">
                          {newUsers.toLocaleString()}
                        </p>
                      )}
                      <p className="text-[11px] font-semibold text-primary/80 mt-2">
                        New Users
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                    <TrendingUp className="h-3 w-3" />
                    Active learners {filterLabel}
                  </div>
                </div>

                {/* Card 6: Returning Users */}
                <div className="h-[135px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] p-5 flex flex-col justify-between hover:bg-[#E8FAFA] hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      {isLoadingStats || isLoading ? (
                        <div className="h-7 flex items-center">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold font-outfit text-primary leading-none">
                          {returningUsers.toLocaleString()}
                        </p>
                      )}
                      <p className="text-[11px] font-semibold text-primary/80 mt-2">
                        Returning Users
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0 shadow-sm">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#155D5F1A] flex items-center gap-1.5 text-[10px] text-[#155D5F] font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    Repeat viewers {filterLabel}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Table Section ── */}
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-dark font-outfit shrink-0">
              Uploaded Materials
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border/30">
                {(["all", "document", "video"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all capitalize ${typeFilter === f
                      ? "bg-white text-primary shadow-sm border border-border/30"
                      : "text-slate/60 hover:text-slate"
                      }`}
                  >
                    {f === "all" ? "All" : f === "document" ? "📄 Docs" : "▶️ Videos"}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate/40" />
                <Input
                  id="library-search"
                  placeholder="Search by title..."
                  className="pl-9 h-9 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-border/40 rounded-[20px] overflow-hidden bg-white shadow-sm">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate/40">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p className="text-sm font-semibold">Loading materials...</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface/50 text-slate/60 text-[11px] font-semibold uppercase tracking-wider border-b border-border/40">
                  <tr>
                    <th className="px-3 py-2.5 w-[90px]">Cover</th>
                    <th className="px-3 py-2.5">Title</th>
                    <th className="px-3 py-2.5 text-center">Type</th>
                    <th className="px-3 py-2.5 text-center">Publish To</th>
                    <th className="px-3 py-2.5">Date Uploaded</th>
                    <th className="px-3 py-2.5 text-center">Downloadable</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredMaterials.map((material) => (
                    <tr
                      key={material.id}
                      className={`transition-colors group ${topPerformingMaterial && material.id === topPerformingMaterial.id
                        ? "bg-[#155D5F]/5 hover:bg-[#155D5F]/10 border-l-[3px] border-l-[#155D5F]"
                        : "hover:bg-surface/30"
                        }`}
                    >
                      {/* Cover Image */}
                      <td className="px-3 py-2.5">
                        <div className="relative h-12 w-16 shrink-0 rounded-lg overflow-hidden bg-surface border border-border/50 shadow-sm">
                          <img
                            src={material.image}
                            alt={material.title}
                            className="object-cover h-full w-full"
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop" }}
                          />
                          {material.contentType === "video" && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <div className="h-5 w-5 bg-red-600 rounded-full flex items-center justify-center shadow-sm">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="white"
                                  className="h-2.5 w-2.5 ml-0.5"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[220px]">
                          <p className="text-xs font-bold text-dark truncate max-w-[140px] md:max-w-[180px]">
                            {material.title}
                          </p>
                          {topPerformingMaterial && material.id === topPerformingMaterial.id && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                              <Flame className="h-2 w-2 fill-current" />
                              Top
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate/50 mt-0.5 truncate max-w-[140px] md:max-w-[180px]">
                          {material.readingDuration}
                          {material.fileSize && (
                            <span className="ml-1.5 text-slate/40">
                              · {material.fileSize}
                            </span>
                          )}
                        </p>
                      </td>

                      {/* Type Badge */}
                      <td className="px-3 py-2.5 text-center">
                        {material.contentType === "document" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                            Document
                            {material.fileType && (
                              <span className="text-[8px] bg-blue-100 px-1 rounded font-semibold text-blue-800 leading-none">
                                {material.fileType}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold border border-red-100 uppercase tracking-wider">
                            Video
                          </span>
                        )}
                      </td>

                      {/* Publish To Badge */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {material.publishToApp !== false && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider leading-none"
                              title="Visible on Mobile App"
                            >
                              <Smartphone className="h-2.5 w-2.5" /> App
                            </span>
                          )}
                          {material.publishToWeb !== false && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold uppercase tracking-wider leading-none"
                              title="Visible on Web Portal"
                            >
                              <Globe className="h-2.5 w-2.5" /> Web
                            </span>
                          )}
                          {material.publishToApp === false && material.publishToWeb === false && (
                            <span className="text-[9px] text-slate/40 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Date Uploaded */}
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-dark/80">
                          {formatDate(material.timePosted)}
                        </p>
                      </td>

                      {/* Downloadable - Icon indicator */}
                      <td className="px-3 py-2.5 text-center">
                        {material.contentType === "document" ? (
                          <div className="flex items-center justify-center">
                            {material.isDownloadable ? (
                              <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[10px] font-bold">
                                <CheckCircle2 className="h-3 w-3" />
                                Yes
                              </div>
                            ) : (
                              <div className="flex items-center gap-0.5 text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 text-[10px] font-bold">
                                <XCircle className="h-3 w-3" />
                                No
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate/40 font-medium italic">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Actions Dropdown */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-surface text-slate/40 hover:text-slate transition-all shrink-0 cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-[14px] border-border/50 shadow-xl p-1 bg-white"
                            >
                              {material.contentType === "document" && (
                                <DropdownMenuItem
                                  onClick={() => setViewingCommentsMaterial(material)}
                                  className="py-2.5 px-3 text-xs font-bold focus:bg-surface text-emerald-600 cursor-pointer rounded-xl gap-2"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" /> View Engagement
                                </DropdownMenuItem>
                              )}
                              {material.contentType === "document" && material.isDownloadable && material.documentUrl && (
                                <DropdownMenuItem
                                  onClick={() => handleDownload(material)}
                                  className="py-2.5 px-3 text-xs font-bold focus:bg-surface text-blue-600 cursor-pointer rounded-xl gap-2"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download File
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                asChild
                                className="focus:bg-surface rounded-xl"
                              >
                                <Link
                                  href={`/dashboard/library/${material.id}/edit`}
                                  className="flex items-center gap-2 py-2.5 px-3 w-full text-xs font-bold text-dark cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5 text-primary" /> Edit Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(material)}
                                className="py-2.5 px-3 text-xs font-bold focus:bg-surface text-red-500 cursor-pointer rounded-xl gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Material
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {filteredMaterials.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate/40">
                  <BookOpen className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">
                    No materials found.
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery
                      ? "Try adjusting your search."
                      : "Upload a material to get started."}
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Row count */}
          {filteredMaterials.length > 0 && (
            <p className="text-xs text-slate/50 font-medium text-right">
              Showing {filteredMaterials.length} of {materials.length} materials
            </p>
          )}
        </div>
      </div>
    </>
  );
}
