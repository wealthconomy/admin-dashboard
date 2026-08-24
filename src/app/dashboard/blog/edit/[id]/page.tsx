"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  Upload,
  Play,
  Calendar,
  ChevronDown,
  Check,
  X,
  Smartphone,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useGetBlogQuery, useUpdateBlogMutation } from "@/lib/redux/features/blogApi";
import { useUploadFileMutation } from "@/lib/redux/features/adminApi";

const PORTFOLIOS = [
  "General",
  "WealthFix",
  "WealthFlex",
  "WealthFlow",
  "WealthGroup",
  "WealthGoal",
  "WealthFam",
];

const formatRelativeDate = (dateStr: string) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const now = new Date();
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(
    (dNow.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dDate.getTime() === dNow.getTime()) return "Just now";
  if (diffInMs < 0) return "Scheduled";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " / ");
};

const parseAuthorName = (author: any): string => {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (typeof author === "object") {
    return (
      author.name ||
      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
      author.username ||
      author.email ||
      ""
    );
  }
  return String(author);
};

const parseAuthorAvatar = (item: any): string => {
  if (typeof item?.authorAvatar === "string" && item.authorAvatar) return item.authorAvatar;
  const authorObj = typeof item?.author === "object" ? item.author : null;
  if (authorObj) {
    return authorObj.image || authorObj.imageUrl || authorObj.avatar || authorObj.avatarUrl || "";
  }
  return "";
};

const parseCategory = (cat: any): string => {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat.name || cat.title || cat.label || "General";
  return String(cat);
};

const parseImage = (img: any): string => {
  let url = "";
  if (typeof img === "string") url = img;
  else if (typeof img === "object" && img?.url) url = img.url;
  return url;
};

const renderPreviewContent = (text: any) => {
  if (!text || typeof text !== "string") return "No content provided.";

  return text.split("\n").map((line, i) => {
    // Headers
    if (line.startsWith("# ")) {
      return (
        <h2
          key={i}
          className="text-lg font-bold text-dark mt-4 mb-2 first:mt-0 break-words"
        >
          {line.slice(2)}
        </h2>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3
          key={i}
          className="text-base font-bold text-dark mt-3 mb-1 first:mt-0 break-words"
        >
          {line.slice(3)}
        </h3>
      );
    }
    // Bold markers (simple implementation)
    const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-bold text-dark break-words">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return (
      <p
        key={i}
        className="min-h-[1.5em] text-slate/70 text-xs leading-relaxed font-medium break-words"
      >
        {formattedLine}
      </p>
    );
  });
};

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resolvedParams = use(params);
  const resolvedId = resolvedParams.id;

  const { data: blogData, isLoading: isLoadingBlog } = useGetBlogQuery(resolvedId);
  const [updateBlogMutation, { isLoading: isUpdating }] = useUpdateBlogMutation();
  const [uploadFileMutation, { isLoading: isUploading }] = useUploadFileMutation();

  const [formData, setFormData] = useState({
    author: "",
    title: "",
    content: "",
    category: "General",
    date: "",
    image: "",
    authorAvatar: "",
    publishToApp: true,
    publishToWeb: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const authorAvatarInputRef = useRef<HTMLInputElement>(null);

  // Get current local time in YYYY-MM-DDThh:mm format for min date
  const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  useEffect(() => {
    if (blogData?.data || blogData) {
      const b = blogData?.data || blogData;
      const parsedAuthor = parseAuthorName(b.author ?? b.authorName ?? b.user);
      const parsedAvatar = parseAuthorAvatar(b);
      const parsedCategory = parseCategory(b.category);
      const parsedImage = parseImage(b.image || b.coverImage || b.imageUrl || b.bannerUrl);

      const newFormData = {
        author: parsedAuthor,
        title: typeof b.title === "string" ? b.title : (b.title?.name || ""),
        content: typeof b.content === "string" ? b.content : "",
        category: parsedCategory,
        date: b.scheduledFor
          ? new Date(b.scheduledFor).toISOString().slice(0, 16)
          : b.createdAt
            ? new Date(b.createdAt).toISOString().slice(0, 16)
            : "",
        image: parsedImage,
        authorAvatar: parsedAvatar,
        publishToApp: b.publishToApp ?? true,
        publishToWeb: b.publishToWeb ?? true,
      };
      setFormData(newFormData);
      setPreviewData(newFormData);
    }
  }, [blogData]);

  const [previewData, setPreviewData] = useState<typeof formData | null>({
    ...formData,
  });

  const handlePreview = () => {
    setPreviewData({ ...formData });
  };

  const handlePost = async () => {
    if (!formData.title.trim()) { toast.error("Title is required."); return; }
    if (!formData.author.trim()) { toast.error("Author is required."); return; }
    if (!formData.content.trim()) { toast.error("Content is required."); return; }
    if (!formData.publishToApp && !formData.publishToWeb) {
      toast.error("Please select at least one publishing target.");
      return;
    }

    try {
      let finalImageUrl = formData.image;
      
      // Upload image if a new file was selected
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const res = await uploadFileMutation(uploadData).unwrap();
        finalImageUrl = res.data?.url || res.url || finalImageUrl;
      }

      let finalAuthorAvatarUrl = formData.authorAvatar;
      if (authorImageFile) {
        const uploadAuthorData = new FormData();
        uploadAuthorData.append("file", authorImageFile);
        const resAuthor = await uploadFileMutation(uploadAuthorData).unwrap();
        finalAuthorAvatarUrl = resAuthor.data?.url || resAuthor.url || finalAuthorAvatarUrl;
      } else if (!finalAuthorAvatarUrl || finalAuthorAvatarUrl.includes("ui-avatars.com")) {
        finalAuthorAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.author || "Author")}&background=155D5F&color=fff`;
      }

      const payload = {
        title: formData.title,
        author: formData.author,
        authorAvatar: finalAuthorAvatarUrl,
        content: formData.content,
        category: formData.category,
        categoryColor: formData.category,
        image: finalImageUrl,
        scheduledFor: formData.date ? new Date(formData.date).toISOString() : undefined,
        publishToApp: formData.publishToApp,
        publishToWeb: formData.publishToWeb,
      };

      await updateBlogMutation({ id: resolvedId, ...payload }).unwrap();
      
      toast.success("Blog updated successfully!");
      setTimeout(() => router.push("/dashboard/blog"), 800);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update blog");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setFormData({ ...formData, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAuthorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAuthorImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, authorAvatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAuthorImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAuthorImageFile(null);
    setFormData({ ...formData, authorAvatar: "" });
    if (authorAvatarInputRef.current) {
      authorAvatarInputRef.current.value = "";
    }
  };

  if (isLoadingBlog) {
    return (
      <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[500px] mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] p-8 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto space-y-10 mb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/blog">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-surface border border-transparent hover:border-border/50"
            >
              <ChevronLeft className="h-5 w-5 text-slate" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
              Edit blog
            </h1>
            <p className="text-slate/40 text-[10px] font-bold uppercase tracking-wider">
              Edit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-20">
          <span className="text-2xl font-bold font-outfit text-dark tracking-tight">
            Preview
          </span>
          <Button 
            onClick={handlePost}
            disabled={isUpdating || isUploading}
            className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-12 px-10 font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {(isUpdating || isUploading) ? <Loader2 className="h-5 w-5 animate-spin" /> : "Post"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-border/50 pt-10">
        {/* Left: Form */}
        <div className="lg:col-span-7 lg:pr-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-[13px] font-bold text-slate/70 ml-1">
                Author
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={authorAvatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAuthorImageUpload}
                />
                <div 
                  onClick={() => authorAvatarInputRef.current?.click()}
                  className="h-12 w-12 rounded-full border border-dashed border-border/60 bg-surface/50 flex items-center justify-center cursor-pointer hover:bg-surface/80 transition-all shrink-0 overflow-hidden relative group"
                  title="Upload Author Avatar"
                >
                  {formData.authorAvatar ? (
                    <>
                      <img src={formData.authorAvatar} alt="Author" className="w-full h-full object-cover" />
                      <div onClick={removeAuthorImage} className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Upload className="h-4 w-4 text-slate/40" />
                  )}
                </div>
                <Input
                  placeholder="Enter author name"
                  className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none flex-1"
                  value={formData.author}
                  onChange={(e) => {
                    const newAuthor = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      author: newAuthor,
                      authorAvatar: authorImageFile
                        ? prev.authorAvatar
                        : (prev.authorAvatar && !prev.authorAvatar.includes("ui-avatars.com")
                            ? prev.authorAvatar
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(newAuthor || "Author")}&background=155D5F&color=fff`)
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[13px] font-bold text-slate/70 ml-1">
                Title
              </Label>
              <Input
                placeholder="Enter blog title"
                className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[13px] font-bold text-slate/70 ml-1 flex justify-between items-center">
                <span>Content</span>
                <span className="text-[10px] text-slate/40 capitalize font-medium">
                  Use # for Header, ## for Subheader, **text** for bold
                </span>
              </Label>
              <textarea
                placeholder="Write your content here..."
                className="min-h-[350px] w-full bg-surface/50 border border-border/30 rounded-xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-none"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[13px] font-bold text-slate/70 ml-1">
                Upload Cover Image
              </Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative min-h-[120px] w-full rounded-2xl overflow-hidden group cursor-pointer border border-dashed border-border/30 bg-surface/30 px-5 flex items-center justify-center transition-all hover:bg-surface/50"
              >
                {formData.image ? (
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-border/20 shadow-sm">
                      <img
                        src={formData.image}
                        alt="Cover"
                        className="object-cover w-full h-full"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop"; }}
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-dark">
                        Image Selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        className="h-7 px-2 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 -ml-2 gap-1.5"
                      >
                        <X className="h-3 w-3" />
                        Remove image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-primary mb-1" />
                    <span className="text-[11px] font-bold text-dark">
                      Upload cover image
                    </span>
                    <span className="text-[10px] font-medium text-slate/50">
                      Max size 2MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[13px] font-bold text-slate/70 ml-1">
                  Schedule Post
                </Label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    min={minDateTime}
                    className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none pr-4"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[13px] font-bold text-slate/70 ml-1">
                  Select Portfolio
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="h-12 bg-surface/50 border border-border/30 rounded-xl px-4 flex items-center justify-between text-sm font-medium text-dark cursor-pointer hover:bg-surface/80 transition-all">
                      <span>{formData.category}</span>
                      <ChevronDown className="h-5 w-5 text-slate/40" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[300px] bg-white border border-border/50 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200">
                    {PORTFOLIOS.map((item) => (
                      <DropdownMenuItem
                        key={item}
                        className="rounded-lg h-10 px-4 text-sm font-medium text-slate hover:text-dark hover:bg-surface cursor-pointer flex items-center justify-between"
                        onClick={() =>
                          setFormData({ ...formData, category: item })
                        }
                      >
                        {item}
                        {formData.category === item && (
                          <Check className="h-4 w-4 text-[#155D5F]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Publish To Platforms Selection */}
            <div className="space-y-2.5 border-t border-border/30 pt-6">
              <Label className="text-[13px] font-bold text-slate/70 ml-1 flex items-center gap-1">
                <span>Publish To</span>
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (formData.publishToApp && !formData.publishToWeb) return;
                    setFormData({ ...formData, publishToApp: !formData.publishToApp });
                  }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    formData.publishToApp
                      ? "border-[#155D5F] bg-[#155D5F]/5"
                      : "border-border/30 bg-surface/50 text-slate/40 hover:bg-surface/80"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${formData.publishToApp ? "bg-[#155D5F] text-white" : "bg-slate/10 text-slate/40"}`}>
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-dark">Mobile Application</p>
                    <p className="text-[10px] text-slate/50 mt-1 leading-relaxed">
                      Publish post to mobile app feed.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!formData.publishToApp && formData.publishToWeb) return;
                    setFormData({ ...formData, publishToWeb: !formData.publishToWeb });
                  }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    formData.publishToWeb
                      ? "border-[#155D5F] bg-[#155D5F]/5"
                      : "border-border/30 bg-surface/50 text-slate/40 hover:bg-surface/80"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${formData.publishToWeb ? "bg-[#155D5F] text-white" : "bg-slate/10 text-slate/40"}`}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-dark">Web Portal</p>
                    <p className="text-[10px] text-slate/50 mt-1 leading-relaxed">
                      Publish post to client web portal.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <Button
              onClick={handlePreview}
              className="w-full h-12 bg-[#155D5F]/10 hover:bg-[#155D5F]/20 text-[#155D5F] rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-[#155D5F]/5 transition-all"
            >
              Preview
              <Play className="h-3 w-3 fill-current" />
            </Button>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:flex lg:col-span-1 justify-center">
          <div className="w-[3px] bg-border/40 h-full"></div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 space-y-6 sticky top-8">
            {previewData && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div className="relative h-[200px] w-full rounded-[20px] overflow-hidden bg-white border border-border/20 shadow-sm">
                  {previewData.image ? (
                    <img
                      src={previewData.image}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <Upload className="h-8 w-8 text-slate/20" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-1 bg-red-50 text-[10px] font-bold text-red-500 uppercase tracking-widest inline-block rounded-md">
                      {previewData.category}
                    </div>
                    {previewData.publishToApp && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold uppercase tracking-wider">
                        <Smartphone className="h-2.5 w-2.5" /> App
                      </span>
                    )}
                    {previewData.publishToWeb && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-extrabold uppercase tracking-wider">
                        <Globe className="h-2.5 w-2.5" /> Web
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl font-bold font-outfit text-dark leading-tight tracking-tight break-words">
                    {previewData.title}
                  </h1>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm shrink-0 overflow-hidden">
                      {previewData.authorAvatar ? (
                        <img src={previewData.authorAvatar} alt="Author" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        previewData.author ? previewData.author[0]?.toUpperCase() : "A"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-dark truncate">
                        {previewData.author}
                      </p>
                      <p className="text-[9px] font-semibold text-slate/40 flex items-center gap-1">
                        {formatRelativeDate(previewData.date)}{" "}
                        <span className="h-1 w-1 bg-slate/20 rounded-full" /> 4
                        mins reading
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      {renderPreviewContent(previewData.content)}
                    </div>
                    <div className="mt-6 text-slate/40 text-[11px] font-bold">
                      Thanks for reading!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
