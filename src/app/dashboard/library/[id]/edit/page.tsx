"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Save,
  FileText,
  Info,
  X,
  CheckCircle2,
  Play,
  AlertCircle,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useGetLibraryByIdQuery, useUpdateLibraryMutation } from "@/lib/redux/features/libraryApi";
import { useUploadFileMutation } from "@/lib/redux/features/adminApi";
import { Loader2 } from "lucide-react";
import type { ContentType, FileType, LibraryMaterial } from "@/types/library";

// ─── Helpers (same as new/page) ───────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: File): FileType {
  const ext = file.name.split(".").pop()?.toUpperCase();
  if (ext === "PDF") return "PDF";
  if (ext === "DOC" || ext === "DOCX") return "DOC";
  if (ext === "EPUB") return "EPUB";
  return "PDF";
}

function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^https?:\/\/youtu\.be\/[\w-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/,
  ];
  return patterns.some((p) => p.test(url.trim()));
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-bold text-dark flex items-center gap-1">
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span
      className="inline-flex text-slate/40 hover:text-primary transition-colors cursor-help"
      title={text}
    >
      <Info className="h-4 w-4" />
    </span>
  );
}

// ─── Mock data loader (replace with real API call) ───────────────────────────



// ─── Edit Form ────────────────────────────────────────────────────────────────

export default function EditLibraryMaterialPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const { data: response, isLoading: isFetching, isError } = useGetLibraryByIdQuery(id, { skip: !id });
  const existing = Array.isArray(response?.data) ? response.data[0] : response?.data || response;

  const [updateLibrary, { isLoading: isUpdating }] = useUpdateLibraryMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  const [contentType, setContentType] = useState<ContentType>("document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readingDuration, setReadingDuration] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isDownloadable, setIsDownloadable] = useState(true);

  const [publishToApp, setPublishToApp] = useState(true);
  const [publishToWeb, setPublishToWeb] = useState(true);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");

  const isSubmitting = isUpdating || isUploading;

  useEffect(() => {
    if (existing && !isFetching) {
      setContentType(existing.contentType || "document");
      setTitle(existing.title || "");
      setDescription(existing.description || "");
      setReadingDuration(existing.readingDuration || "");
      setCoverPreview(existing.image?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, process.env.NEXT_PUBLIC_API_URL || "") || null);
      setIsDownloadable(existing.isDownloadable ?? true);
      setPublishToApp(existing.publishToApp ?? true);
      setPublishToWeb(existing.publishToWeb ?? true);
      setYoutubeUrl(existing.youtubeUrl || "");
    }
  }, [existing, isFetching]);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = useCallback((file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }, []);

  const handleYoutubeChange = (url: string) => {
    setYoutubeUrl(url);
    if (url && !validateYouTubeUrl(url)) {
      setYoutubeError(
        "Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
      );
    } else {
      setYoutubeError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!description.trim()) { toast.error("Description is required."); return; }
    if (!readingDuration.trim()) { toast.error("Duration is required."); return; }
    if (contentType === "video") {
      if (!youtubeUrl.trim()) { toast.error("YouTube URL is required."); return; }
      if (!validateYouTubeUrl(youtubeUrl)) { toast.error("Invalid YouTube URL."); return; }
    }
    if (!publishToApp && !publishToWeb) {
      toast.error("Please select at least one publishing target.");
      return;
    }

    try {
      // 1. Upload new cover image if user selected one
      let finalImage = coverPreview ?? existing?.image ?? "";
      if (coverFile) {
        const coverFormData = new FormData();
        coverFormData.append("file", coverFile);
        const coverRes = await uploadFile(coverFormData).unwrap();
        if (coverRes.data?.url) {
          finalImage = coverRes.data.url;
        } else {
          throw new Error("Failed to upload new cover image");
        }
      }

      // 2. Upload new document if user selected one
      let finalDocumentUrl = existing?.documentUrl ?? "";
      if (contentType === "document" && documentFile) {
        const docFormData = new FormData();
        docFormData.append("file", documentFile);
        const docRes = await uploadFile(docFormData).unwrap();
        if (docRes.data?.url) {
          finalDocumentUrl = docRes.data.url;
        } else {
          throw new Error("Failed to upload new document");
        }
      }

      const updatedRecord = {
        contentType,
        title: title.trim(),
        description: description.trim(),
        image: finalImage,
        readingDuration: readingDuration.trim(),
        ...(contentType === "document"
          ? {
              documentUrl: finalDocumentUrl,
              fileType: documentFile ? getFileType(documentFile) : existing?.fileType,
              fileSize: documentFile
                ? formatFileSize(documentFile.size)
                : existing?.fileSize,
              isDownloadable,
            }
          : { youtubeUrl: youtubeUrl.trim() }),
        publishToApp,
        publishToWeb,
      };

      await updateLibrary({ id, ...updatedRecord }).unwrap();
      toast.success("Material updated successfully!");
      setTimeout(() => router.push("/dashboard/library"), 800);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update material");
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white rounded-[20px] p-24 border border-border/50 shadow-sm w-full text-center flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate/40 mb-4" />
        <p className="text-sm font-bold text-slate/60">Loading material details...</p>
      </div>
    );
  }

  if (!existing && !isFetching) {
    return (
      <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full text-center space-y-4">
        <p className="text-lg font-bold text-dark">Material not found.</p>
        <Link href="/dashboard/library">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pb-5 border-b border-border/40">
        <Link href="/dashboard/library">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-surface text-slate shrink-0 transition-all active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-outfit text-dark tracking-tight">
            Edit Library Material
          </h1>
          <p className="text-xs text-slate/60 mt-0.5">
            Update the details for this{" "}
            {contentType === "document" ? "document" : "video"}.
          </p>
        </div>
      </div>

      {/* Content type badge (read-only on edit) */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${
            contentType === "document"
              ? "bg-blue-50 border-blue-100 text-blue-700"
              : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          {contentType === "document" ? (
            <>
              <FileText className="h-4 w-4" /> 📄 Document / Book
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> ▶️ YouTube Video
            </>
          )}
        </div>
        <p className="text-xs text-slate/40 mt-2">
          Content type cannot be changed after upload.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FieldLabel>Cover Image</FieldLabel>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative h-52 w-full rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-surface/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
            >
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCoverFile(e.target.files[0]);
                }}
                className="hidden"
              />
              {coverPreview ? (
                <>
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="object-cover h-full w-full"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop" }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-xl">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate/40 group-hover:text-primary/60 transition-colors">
                  <ImageIcon className="h-10 w-10" />
                  <span className="text-sm font-semibold">Upload Thumbnail</span>
                </div>
              )}
            </div>
          </div>

          {/* Document or YouTube */}
          {contentType === "document" ? (
            <div className="space-y-2">
              <FieldLabel>
                Replace Document File{" "}
                <span className="text-xs font-medium text-slate/40 ml-1">
                  (optional)
                </span>
              </FieldLabel>
              <div
                onClick={() => documentInputRef.current?.click()}
                className="relative h-52 w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group border-border/60 hover:border-primary/50 hover:bg-surface/50"
              >
                <input
                  type="file"
                  ref={documentInputRef}
                  accept=".pdf,.doc,.docx,.epub"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setDocumentFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
                {documentFile ? (
                  <div className="flex flex-col items-center gap-3 text-emerald-600 px-4 text-center">
                    <CheckCircle2 className="h-10 w-10" />
                    <div>
                      <p className="text-sm font-bold break-all line-clamp-2">
                        {documentFile.name}
                      </p>
                      <p className="text-xs mt-1 text-emerald-500">
                        {formatFileSize(documentFile.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate/40 group-hover:text-primary/60 transition-colors px-4 text-center">
                    <UploadCloud className="h-10 w-10" />
                    <div>
                      <p className="text-sm font-semibold">
                        Upload replacement file
                      </p>
                      {existing.fileSize && (
                        <p className="text-xs mt-1 text-slate/30">
                          Current: {existing.fileType} · {existing.fileSize}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <FieldLabel required>YouTube URL</FieldLabel>
              <div className="h-52 w-full rounded-xl bg-gradient-to-br from-red-50 to-surface/30 border border-red-100 p-5 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Play className="h-6 w-6" />
                  <p className="text-sm font-bold">YouTube Video Link</p>
                </div>
                <div className="space-y-1.5">
                  <Input
                    id="youtube-url-edit"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => handleYoutubeChange(e.target.value)}
                    className={`h-11 bg-white text-sm ${
                      youtubeError
                        ? "border-red-300 focus-visible:ring-red-200"
                        : youtubeUrl && !youtubeError
                        ? "border-emerald-300 focus-visible:ring-emerald-200"
                        : "border-border/50 focus-visible:ring-primary/20"
                    }`}
                  />
                  {youtubeError && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                      <AlertCircle className="h-3 w-3" />
                      {youtubeError}
                    </p>
                  )}
                  {youtubeUrl && !youtubeError && (
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid YouTube URL
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Fields */}
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel required>Title</FieldLabel>
            <Input
              id="edit-title"
              placeholder="Material title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 bg-surface/50 border-border/50 text-sm focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel required>Short Description</FieldLabel>
              <span
                className={`text-[10px] font-semibold tabular-nums ${
                  description.length >= 150 ? "text-red-500" : "text-slate/40"
                }`}
              >
                {description.length}/150
              </span>
            </div>
            <textarea
              id="edit-description"
              placeholder="Briefly describe this material..."
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 150) setDescription(e.target.value);
              }}
              maxLength={150}
              rows={3}
              className="w-full rounded-xl bg-surface/50 border border-border/50 p-4 text-sm text-dark placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="space-y-2 max-w-[300px]">
            <FieldLabel required>
              {contentType === "document" ? "Reading Duration" : "Watch Duration"}
            </FieldLabel>
            <Input
              id="edit-duration"
              placeholder={
                contentType === "document" ? "e.g. 45 min read" : "e.g. 18 min watch"
              }
              value={readingDuration}
              onChange={(e) => setReadingDuration(e.target.value)}
              className="h-11 bg-surface/50 border-border/50 text-sm focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Target Platforms */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <div className="flex items-center gap-2">
            <FieldLabel required>Publish To</FieldLabel>
            <Tooltip text="Choose where you want this material to be visible: the mobile app, the web portal, or both." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                // Ensure at least one is selected
                if (publishToApp && !publishToWeb) return;
                setPublishToApp(!publishToApp);
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                publishToApp
                  ? "border-[#155D5F] bg-[#155D5F]/5 shadow-sm shadow-[#155D5F]/5"
                  : "border-border/40 bg-surface/50 text-slate/50 hover:bg-surface hover:border-border/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${publishToApp ? "bg-[#155D5F] text-white" : "bg-slate/10 text-slate/40"}`}>
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-dark">Mobile Application</p>
                <p className="text-xs text-slate/50 mt-1 leading-relaxed">
                  Make this material visible to users browsing from their mobile devices.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                // Ensure at least one is selected
                if (!publishToApp && publishToWeb) return;
                setPublishToWeb(!publishToWeb);
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                publishToWeb
                  ? "border-[#155D5F] bg-[#155D5F]/5 shadow-sm shadow-[#155D5F]/5"
                  : "border-border/40 bg-surface/50 text-slate/50 hover:bg-surface hover:border-border/60"
              }`}
            >
              <div className={`p-2 rounded-lg ${publishToWeb ? "bg-[#155D5F] text-white" : "bg-slate/10 text-slate/40"}`}>
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-dark">Web Portal</p>
                <p className="text-xs text-slate/50 mt-1 leading-relaxed">
                  Publish this material to the web dashboard and library resource center.
                </p>
              </div>
            </button>
          </div>
          {!publishToApp && !publishToWeb && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              You must select at least one publishing target.
            </p>
          )}
        </div>

        {/* Document-only: Download Toggle */}
        {contentType === "document" && (
          <div className="p-5 rounded-xl border bg-amber-50/50 border-amber-100 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-dark">
                    Allow Users to Download
                  </h3>
                  <Tooltip text="If disabled, users can only read the material inside the mobile app. The download button will be hidden." />
                </div>
                <p className="text-xs font-medium text-slate/60 max-w-[85%] leading-relaxed">
                  {isDownloadable
                    ? "Users can read in-app AND download the file."
                    : "File is read-only within the app. Download button is hidden."}
                </p>
              </div>
              <Switch
                id="edit-is-downloadable"
                checked={isDownloadable}
                onCheckedChange={setIsDownloadable}
                className="data-[state=checked]:bg-emerald-500 shrink-0 mt-0.5"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
          <Link href="/dashboard/library">
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-6 rounded-xl border border-border/50 font-bold text-slate hover:bg-surface transition-all"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            id="save-edit"
            disabled={isSubmitting}
            className="h-11 px-8 rounded-xl bg-[#155D5F] hover:bg-[#155D5F]/90 text-white font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
