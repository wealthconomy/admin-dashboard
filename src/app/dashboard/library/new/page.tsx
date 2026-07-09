"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Save,
  Video,
  FileText,
  Info,
  X,
  CheckCircle2,
  Play,
  AlertCircle,
  Smartphone,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCreateLibraryMutation } from "@/lib/redux/features/libraryApi";
import { useUploadFileMutation } from "@/lib/redux/features/adminApi";
import type { ContentType, FileType } from "@/types/library";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return "PDF"; // fallback
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

// ─── Field Label ──────────────────────────────────────────────────────────────

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

// ─── Tooltip ─────────────────────────────────────────────────────────────────

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

// ─── Upload Drop Zone ──────────────────────────────────────────────────────────

function DropZone({
  label,
  accept,
  file,
  onFile,
  icon: Icon,
  description,
  preview,
  id,
}: {
  label: string;
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
  icon: React.ElementType;
  description: string;
  preview?: string | null;
  id: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  return (
    <div className="space-y-2">
      <FieldLabel required>{label}</FieldLabel>
      <div
        id={id}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative h-52 w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : file
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-border/60 hover:border-primary/50 hover:bg-surface/50"
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.[0]) onFile(e.target.files[0]);
          }}
          className="hidden"
        />

        {preview ? (
          <>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-xl">
                Change Image
              </span>
            </div>
          </>
        ) : file ? (
          <div className="flex flex-col items-center gap-3 text-emerald-600 px-4 text-center">
            <CheckCircle2 className="h-10 w-10" />
            <div>
              <p className="text-sm font-bold break-all line-clamp-2">
                {file.name}
              </p>
              <p className="text-xs mt-1 text-emerald-500">
                {formatFileSize(file.size)} · Click to change
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate/40 group-hover:text-primary/60 transition-colors px-4 text-center">
            <Icon className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">{description}</p>
              <p className="text-xs mt-1 text-slate/30">
                Click or drag & drop
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function NewLibraryMaterialPage() {
  const router = useRouter();

  // Content type
  const [contentType, setContentType] = useState<ContentType>("document");

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readingDuration, setReadingDuration] = useState("");

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Document-specific
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isDownloadable, setIsDownloadable] = useState(true);

  // Video-specific
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");

  const [publishToApp, setPublishToApp] = useState(true);
  const [publishToWeb, setPublishToWeb] = useState(true);

  const [createLibrary, { isLoading: isCreating }] = useCreateLibraryMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const isSubmitting = isCreating || isUploading;

  // Handlers
  const handleCoverFile = useCallback((file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }, []);

  const handleDocumentFile = useCallback((file: File) => {
    setDocumentFile(file);
  }, []);

  const handleSwitchType = (type: ContentType) => {
    setContentType(type);
    // Reset type-specific state
    setDocumentFile(null);
    setYoutubeUrl("");
    setYoutubeError("");
    if (type === "video") setIsDownloadable(false);
    else setIsDownloadable(true);
  };

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

    // Validation
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!description.trim()) {
      toast.error("Short description is required.");
      return;
    }
    if (!readingDuration.trim()) {
      toast.error("Duration is required.");
      return;
    }
    if (!coverFile) {
      toast.error("Please upload a cover image.");
      return;
    }
    if (contentType === "document" && !documentFile) {
      toast.error("Please upload the document file.");
      return;
    }
    if (contentType === "video") {
      if (!youtubeUrl.trim()) {
        toast.error("Please provide a YouTube URL.");
        return;
      }
      if (!validateYouTubeUrl(youtubeUrl)) {
        toast.error("Please enter a valid YouTube URL.");
        return;
      }
    }
    if (!publishToApp && !publishToWeb) {
      toast.error("Please select at least one publishing target.");
      return;
    }

    try {
      // 1. Upload Cover Image
      const coverFormData = new FormData();
      coverFormData.append("file", coverFile);
      const coverRes = await uploadFile(coverFormData).unwrap();
      const coverUrl = coverRes.data?.url;

      if (!coverUrl) {
        throw new Error("Failed to get cover image URL after upload");
      }

      // 2. Upload Document (if applicable)
      let docUrl = "";
      if (contentType === "document" && documentFile) {
        const docFormData = new FormData();
        docFormData.append("file", documentFile);
        const docRes = await uploadFile(docFormData).unwrap();
        docUrl = docRes.data?.url;

        if (!docUrl) {
          throw new Error("Failed to get document URL after upload");
        }
      }

      // 3. Build the record payload
      const record = {
        contentType,
        title: title.trim(),
        description: description.trim(),
        image: coverUrl,
        readingDuration: readingDuration.trim(),
        ...(contentType === "document"
          ? {
              documentUrl: docUrl,
              fileType: documentFile ? getFileType(documentFile) : "PDF",
              fileSize: documentFile
                ? formatFileSize(documentFile.size)
                : "0 MB",
              isDownloadable,
            }
          : {
              youtubeUrl: youtubeUrl.trim(),
            }),
        publishToApp,
        publishToWeb,
      };

      await createLibrary(record).unwrap();
      toast.success("Material uploaded successfully!");
      setTimeout(() => router.push("/dashboard/library"), 800);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to upload material");
    }
  };

  const descCharCount = description.length;
  const descAtLimit = descCharCount >= 150;

  return (
    <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full animate-in fade-in duration-500">
      {/* ── Header ── */}
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
            Upload Library Material
          </h1>
          <p className="text-xs text-slate/60 mt-0.5">
            Add a new document or video to the app library.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Step 1: Content Type ── */}
        <div className="space-y-3">
          <FieldLabel required>Content Type</FieldLabel>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              id="type-document"
              onClick={() => handleSwitchType("document")}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-bold text-sm ${
                contentType === "document"
                  ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                  : "border-border/40 bg-surface text-slate/60 hover:bg-surface/80 hover:border-border/60"
              }`}
            >
              <FileText className="h-5 w-5" />
              📄 Document / Book
            </button>
            <button
              type="button"
              id="type-video"
              onClick={() => handleSwitchType("video")}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-bold text-sm ${
                contentType === "video"
                  ? "border-red-400 bg-red-50 text-red-600 shadow-sm shadow-red-100"
                  : "border-border/40 bg-surface text-slate/60 hover:bg-surface/80 hover:border-border/60"
              }`}
            >
              <Play className="h-5 w-5" />
              ▶️ YouTube Video
            </button>
          </div>
        </div>

        {/* ── Step 2: Cover Image + File/Link ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cover Image */}
          <DropZone
            id="cover-upload"
            label="Cover Image"
            accept="image/*"
            file={coverFile}
            onFile={handleCoverFile}
            icon={ImageIcon}
            description="Upload a thumbnail image"
            preview={coverPreview}
          />

          {/* Document File or YouTube URL */}
          {contentType === "document" ? (
            <DropZone
              id="document-upload"
              label="Document File"
              accept=".pdf,.doc,.docx,.epub"
              file={documentFile}
              onFile={handleDocumentFile}
              icon={UploadCloud}
              description="Upload .pdf, .doc, or .epub"
            />
          ) : (
            <div className="space-y-2">
              <FieldLabel required>YouTube URL</FieldLabel>
              <div className="h-52 w-full rounded-xl bg-gradient-to-br from-red-50 to-surface/30 border border-red-100 p-5 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Play className="h-6 w-6" />
                  <p className="text-sm font-bold">YouTube Video Link</p>
                </div>
                <p className="text-xs text-slate/60">
                  Paste the full YouTube video URL. Users will be redirected to
                  watch the video on YouTube.
                </p>
                <div className="space-y-1.5">
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => handleYoutubeChange(e.target.value)}
                    className={`h-11 bg-white text-sm transition-all ${
                      youtubeError
                        ? "border-red-300 focus-visible:ring-red-200"
                        : youtubeUrl && !youtubeError
                        ? "border-emerald-300 focus-visible:ring-emerald-200"
                        : "border-border/50 focus-visible:ring-primary/20"
                    }`}
                  />
                  {youtubeError && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium animate-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="h-3 w-3" />
                      {youtubeError}
                    </p>
                  )}
                  {youtubeUrl && !youtubeError && (
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium animate-in slide-in-from-top-1 duration-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid YouTube URL
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Step 3: Common Text Fields ── */}
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <FieldLabel required>Title</FieldLabel>
            <Input
              id="material-title"
              placeholder={
                contentType === "document"
                  ? "e.g. The Psychology of Money"
                  : "e.g. Understanding Compound Interest"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 bg-surface/50 border-border/50 text-sm focus-visible:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel required>Short Description</FieldLabel>
              <span
                className={`text-[10px] font-semibold tabular-nums ${
                  descAtLimit ? "text-red-500" : "text-slate/40"
                }`}
              >
                {descCharCount}/150
              </span>
            </div>
            <textarea
              id="material-description"
              placeholder="Briefly describe the contents of this material..."
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  setDescription(e.target.value);
                }
              }}
              maxLength={150}
              rows={3}
              className="w-full rounded-xl bg-surface/50 border border-border/50 p-4 text-sm text-dark placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2 max-w-[300px]">
            <FieldLabel required>
              {contentType === "document"
                ? "Reading Duration"
                : "Watch Duration"}
            </FieldLabel>
            <Input
              id="material-duration"
              placeholder={
                contentType === "document"
                  ? "e.g. 45 min read, 2 hrs"
                  : "e.g. 18 min watch"
              }
              value={readingDuration}
              onChange={(e) => setReadingDuration(e.target.value)}
              className="h-11 bg-surface/50 border-border/50 text-sm focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* ── Step 4: Target Platforms ── */}
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

        {/* ── Step 5: Document-only — File Info & Download Toggle ── */}
        {contentType === "document" && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Auto-calculated file info */}
            {documentFile && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/50 border border-border/40">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-dark truncate">
                    {documentFile.name}
                  </p>
                  <p className="text-xs text-slate/50 mt-0.5">
                    <span className="font-semibold text-primary/70">
                      {getFileType(documentFile)}
                    </span>
                    {" · "}
                    <span>{formatFileSize(documentFile.size)}</span>
                    {" · "}
                    <span className="text-emerald-600 font-semibold">
                      File size auto-calculated
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDocumentFile(null)}
                  className="text-slate/40 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Download Toggle */}
            <div className="p-5 rounded-xl border bg-amber-50/50 border-amber-100">
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
                      ? "Users can read in-app AND download the file to their device."
                      : "Protect your content — file is read-only within the app. Download button is hidden."}
                  </p>
                </div>
                <Switch
                  id="is-downloadable"
                  checked={isDownloadable}
                  onCheckedChange={setIsDownloadable}
                  className="data-[state=checked]:bg-emerald-500 shrink-0 mt-0.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Video info banner ── */}
        {contentType === "video" && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 items-start animate-in slide-in-from-top-2 duration-300">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              Videos are hosted on YouTube. Users will see a play overlay on the
              cover image and tap to watch on YouTube. No file upload or
              download option is available for videos.
            </p>
          </div>
        )}

        {/* ── Actions ── */}
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
            id="submit-material"
            disabled={isSubmitting}
            className="h-11 px-8 rounded-xl bg-[#155D5F] hover:bg-[#155D5F]/90 text-white font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
                Uploading...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save &amp; Upload
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
