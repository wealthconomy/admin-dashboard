"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Calendar, Heart, MessageSquare, MoreVertical, FileEdit, Send, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ArticleStatus, Article, BlogCommentsModal, ConfirmActionModal } from "../shared";

import { useGetBlogsQuery, useUpdateBlogMutation, useDeleteBlogMutation } from "@/lib/redux/features/blogApi";
import { Loader2 } from "lucide-react";

const getInitials = (name: string): string => {
  if (!name || typeof name !== "string") return "A";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function BlogViewAllContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = (searchParams.get("status") || "published") as ArticleStatus;
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: blogsResponse, isLoading } = useGetBlogsQuery({
    status: statusParam,
    q: searchQuery,
  });

  const [updateBlogMutation] = useUpdateBlogMutation();
  const [deleteBlogMutation] = useDeleteBlogMutation();

  const rawArticles = Array.isArray(blogsResponse) 
    ? blogsResponse 
    : Array.isArray(blogsResponse?.data) 
      ? blogsResponse.data 
      : Array.isArray(blogsResponse?.data?.items)
        ? blogsResponse.data.items
        : [];
  
  const parseAuthorName = (item: any): string => {
    if (!item) return "Unknown";
    const author = item.author ?? item.authorName ?? item.user;
    if (!author) return "Unknown";
    if (typeof author === "string") return author;
    if (typeof author === "object") {
      return author.name 
        || `${author.firstName || ""} ${author.lastName || ""}`.trim() 
        || author.username 
        || author.email 
        || "Unknown";
    }
    return String(author);
  };

  const parseAuthorAvatar = (item: any): string => {
    if (typeof item.authorAvatar === "string" && item.authorAvatar) return item.authorAvatar;
    const authorObj = typeof item.author === "object" ? item.author : null;
    if (authorObj) {
      return authorObj.image || authorObj.imageUrl || authorObj.avatar || authorObj.avatarUrl || "";
    }
    return "";
  };

  const parseCategory = (item: any): string => {
    const cat = item.category;
    if (!cat) return "Uncategorized";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object") return cat.name || cat.title || cat.label || "Uncategorized";
    return String(cat);
  };

  const parseImage = (item: any): string => {
    const img = item.image || item.coverImage || item.imageUrl || item.bannerUrl;
    let url = "";
    if (typeof img === "string") url = img;
    else if (typeof img === "object" && img?.url) url = img.url;

    if (url) {
      return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, process.env.NEXT_PUBLIC_API_URL || "");
    }
    return "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop";
  };
  
  const articles: Article[] = rawArticles.map((a: any) => ({
    id: a.id || a._id,
    title: typeof a.title === "string" ? a.title : (a.title?.name || "Untitled"),
    author: parseAuthorName(a),
    authorAvatar: parseAuthorAvatar(a),
    timeAgo: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Just now",
    bookmarks: typeof a.bookmarks === "number" ? a.bookmarks : 0,
    views: typeof a.views === "number" ? a.views : 0,
    category: parseCategory(a),
    categoryColor: typeof a.categoryColor === "string" ? a.categoryColor : "General",
    image: parseImage(a),
    status: (a.status || "draft") as ArticleStatus,
    scheduledFor: a.scheduledFor ? new Date(a.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined,
  }));

  const [viewingBlogComments, setViewingBlogComments] = useState<Article | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    onConfirm: () => {}
  });

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePublish = async (id: number) => {
    try {
      await updateBlogMutation({ id: id.toString(), status: "published" }).unwrap();
      toast.success("Article published successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to publish article");
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePublishConfirm = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Publish Article",
      description: "Are you sure you want to publish this article? It will be immediately visible to all users.",
      confirmText: "Publish Now",
      isDanger: false,
      onConfirm: () => handlePublish(id),
    });
  };

  const handleReschedule = (id: number) => {
    router.push(`/dashboard/blog/edit/${id}`);
  };

  const handleUnpublish = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Unpublish Article",
      description: "Are you sure you want to unpublish this article? It will be moved to drafts.",
      confirmText: "Unpublish",
      isDanger: false,
      onConfirm: async () => {
        try {
          await updateBlogMutation({ id: id.toString(), status: "draft" }).unwrap();
          toast.success("Article unpublished and moved to drafts.");
        } catch (err: any) {
          toast.error(err?.data?.message || "Failed to unpublish article");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Article",
      description: "Are you sure you want to delete this article? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteBlogMutation(id.toString()).unwrap();
          toast.success("Article deleted successfully.");
        } catch (err: any) {
          toast.error(err?.data?.message || "Failed to delete article");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getPageTitle = () => {
    switch (statusParam) {
      case "published":
        return "All Published Articles";
      case "scheduled":
        return "All Scheduled Articles";
      case "draft":
        return "All Draft Articles";
      default:
        return "All Articles";
    }
  };

  return (
    <>
      {viewingBlogComments && (
        <BlogCommentsModal
          article={viewingBlogComments}
          onClose={() => setViewingBlogComments(null)}
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmActionModal
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          isDanger={confirmModal.isDanger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full max-w-[1140px] mx-auto space-y-8 mb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/blog">
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
              {getPageTitle()}
            </h1>
            <p className="text-xs text-slate/60 mt-0.5">
              Browse and manage list details for {statusParam} entries.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
          <Input
            placeholder="Search topics or categories..."
            className="pl-10 h-10 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate/40">
          <Loader2 className="h-10 w-10 animate-spin mb-2" />
          <p className="text-sm font-semibold">Loading articles...</p>
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="rounded-2xl border border-border/40 overflow-hidden bg-white hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col h-full"
            >
              {/* Image Thumbnail */}
              <div className="relative h-44 w-full bg-surface shrink-0">
                <img
                  src={article.image}
                  alt={article.title}
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop" }}
                />
                <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-primary shadow-sm border border-border/20">
                  {article.category}
                </span>

                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm text-slate flex items-center justify-center hover:bg-white transition-colors shadow-sm border border-border/20">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
                      {article.status !== "scheduled" && (
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/edit/${article.id}`)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                          <FileEdit className="h-3.5 w-3.5 text-primary" /> Edit Article
                        </DropdownMenuItem>
                      )}
                      {article.status === "scheduled" && (
                        <DropdownMenuItem onClick={() => handleReschedule(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-orange-500 cursor-pointer rounded-xl gap-2">
                          <Calendar className="h-3.5 w-3.5" /> Reschedule
                        </DropdownMenuItem>
                      )}
                      {article.status === "published" && (
                        <DropdownMenuItem onClick={() => setViewingBlogComments(article as Article)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-emerald-600 cursor-pointer rounded-xl gap-2">
                          <MessageSquare className="h-3.5 w-3.5" /> View Engagement
                        </DropdownMenuItem>
                      )}
                      {article.status === "draft" && (
                        <DropdownMenuItem onClick={() => handlePublishConfirm(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-emerald-600 cursor-pointer rounded-xl gap-2">
                          <Send className="h-3.5 w-3.5" /> Publish Now
                        </DropdownMenuItem>
                      )}
                      {article.status === "published" && (
                        <DropdownMenuItem onClick={() => handleUnpublish(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-slate cursor-pointer rounded-xl gap-2">
                          <X className="h-3.5 w-3.5 text-slate/50" /> Unpublish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-red-50 text-red-600 cursor-pointer rounded-xl gap-2 mt-0.5">
                        <Trash2 className="h-3.5 w-3.5" /> Delete Article
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-dark leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  {article.status === "scheduled" && article.scheduledFor && (
                    <p className="text-[11px] font-semibold text-orange-500 bg-orange-50/50 px-2 py-1 rounded-lg border border-orange-100/50 inline-block">
                      ⏰ {article.scheduledFor}
                    </p>
                  )}
                </div>

                {/* Author profile and meta */}
                <div className="flex items-center justify-between border-t border-border/20 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={article.authorAvatar} />
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                        {getInitials(article.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-dark">{article.author}</span>
                      {article.status !== "scheduled" && (
                         <><span className="text-[9px] text-slate/30">•</span>
                         <span className="text-[9px] text-slate/40">{article.timeAgo}</span></>
                      )}
                    </div>
                  </div>

                  {article.status === "published" && (
                    <div className="flex items-center gap-2 text-slate/40 text-[10px] font-bold">
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                        {article.bookmarks}
                      </span>
                      <span>·</span>
                      <span>{article.views} views</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center text-slate/40">
          <MessageSquare className="h-10 w-10 opacity-20 mb-2" />
          <p className="text-sm font-semibold">No articles found.</p>
          <p className="text-xs">Adjust your search or add a new article.</p>
        </div>
      )}
      </div>
    </>
  );
}

export default function BlogViewAllPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[900px] mx-auto flex items-center justify-center">
        <div className="text-slate/40 text-sm font-semibold">Loading details...</div>
      </div>
    }>
      <BlogViewAllContent />
    </Suspense>
  );
}
