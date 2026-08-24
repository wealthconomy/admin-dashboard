"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, PenLine, Layout, Eye, Bookmark,
  MoreVertical, Clock, Calendar, BookOpen,
  Send, FileEdit, CheckCircle2, X, MessageSquare,
  Heart, User, ThumbsUp, Smartphone, Globe, Trash2, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  useGetBlogsQuery,
  useGetBlogStatsQuery,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} from "@/lib/redux/features/blogApi";

import { Article, BlogCommentsModal, ConfirmActionModal } from "./shared";

const CATEGORY_COLORS: Record<string, string> = {
  WealthFlex: "bg-purple-100 text-purple-700",
  WealthFam:  "bg-teal-100 text-teal-700",
  WealthFix:  "bg-blue-100 text-blue-700",
  WealthFlow: "bg-orange-100 text-orange-700",
};



const getInitials = (name: string): string => {
  if (!name || typeof name !== "string") return "A";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function ArticleCard({
  article,
  onPublish,
  onUnpublish,
  onDelete,
  onViewEngagement,
}: {
  article: Article;
  onPublish: (id: number) => void;
  onUnpublish: (id: number) => void;
  onDelete: (id: number) => void;
  onViewEngagement: (article: Article) => void;
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-border/40 overflow-hidden bg-white hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col h-full">
      {/* Image Thumbnail */}
      <div className="relative h-44 w-full bg-surface shrink-0">
        <img
          src={article.image}
          alt={article.title}
          className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop" }}
        />
        
        {/* Category & platform badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[80%]">
          <span className="text-[10px] font-extrabold uppercase bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-primary shadow-sm border border-border/20">
            {article.category}
          </span>
          {article.publishToApp !== false && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-full px-2 py-0.5 shadow-sm uppercase leading-none" title="Visible on Mobile App">
              <Smartphone className="h-2.5 w-2.5" /> App
            </span>
          )}
          {article.publishToWeb !== false && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-full px-2 py-0.5 shadow-sm uppercase leading-none" title="Visible on Web Portal">
              <Globe className="h-2.5 w-2.5" /> Web
            </span>
          )}
        </div>

        {/* Action menu */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm text-slate flex items-center justify-center hover:bg-white transition-colors shadow-sm border border-border/20 cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
              {/* Edit Article — not shown for scheduled (Reschedule covers it) */}
              {article.status !== "scheduled" && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/edit/${article.id}`)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
                  <FileEdit className="h-3.5 w-3.5 text-primary" /> Edit Article
                </DropdownMenuItem>
              )}
              {article.status === "scheduled" && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/edit/${article.id}`)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-orange-500 cursor-pointer rounded-xl gap-2">
                  <Calendar className="h-3.5 w-3.5" /> Reschedule
                </DropdownMenuItem>
              )}
              {article.status === "published" && (
                <DropdownMenuItem onClick={() => onViewEngagement(article)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-emerald-600 cursor-pointer rounded-xl gap-2">
                  <MessageSquare className="h-3.5 w-3.5" /> View Engagement
                </DropdownMenuItem>
              )}
              {article.status === "draft" && (
                <DropdownMenuItem onClick={() => onPublish(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-emerald-600 cursor-pointer rounded-xl gap-2">
                  <Send className="h-3.5 w-3.5" /> Publish Now
                </DropdownMenuItem>
              )}
              {article.status === "published" && (
                <DropdownMenuItem onClick={() => onUnpublish(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-slate cursor-pointer rounded-xl gap-2">
                  <X className="h-3.5 w-3.5 text-slate/50" /> Unpublish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(article.id)} className="py-2 px-3 text-xs font-bold focus:bg-red-50 text-red-600 cursor-pointer rounded-xl gap-2 mt-0.5">
                <Trash2 className="h-3.5 w-3.5" /> Delete Article
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-dark leading-snug line-clamp-2 group-hover:text-primary transition-colors">
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
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={article.authorAvatar} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                {getInitials(article.author)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-[10px] font-bold text-dark truncate max-w-[90px]">{article.author}</span>
              {article.status !== "scheduled" && (
                <><span className="text-[9px] text-slate/30">•</span>
                <span className="text-[9px] text-slate/40">{article.timeAgo}</span></>
              )}
            </div>
          </div>

          {article.status === "published" && (
            <div className="flex items-center gap-2 text-slate/40 text-[10px] font-bold shrink-0">
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
  );
}

export default function BlogOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: rawArticlesData, isLoading: isLoadingArticles } = useGetBlogsQuery({ q: searchQuery, limit: 100 });
  const { data: statsData, isLoading: isLoadingStats } = useGetBlogStatsQuery(undefined);
  
  const [updateBlogMutation] = useUpdateBlogMutation();
  const [deleteBlogMutation] = useDeleteBlogMutation();

  const rawArticles = Array.isArray(rawArticlesData) 
    ? rawArticlesData 
    : Array.isArray(rawArticlesData?.data) 
      ? rawArticlesData.data 
      : Array.isArray(rawArticlesData?.data?.items)
        ? rawArticlesData.data.items
        : [];
  
  // Helper parsers to guarantee primitive strings for React rendering
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

  // Format articles to match UI expectations safely
  const articles: Article[] = rawArticles.map((a: any) => ({
    id: a.id || a._id,
    title: typeof a.title === "string" ? a.title : (a.title?.name || "Untitled"),
    author: parseAuthorName(a),
    authorAvatar: parseAuthorAvatar(a),
    timeAgo: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Just now",
    bookmarks: typeof a.bookmarks === "number" ? a.bookmarks : 0,
    views: typeof a.views === "number" ? a.views : 0,
    category: parseCategory(a),
    categoryColor: typeof a.categoryColor === "string" ? a.categoryColor : "WealthFlex",
    image: parseImage(a),
    status: (a.status || "draft") as any,
    scheduledFor: a.scheduledFor ? new Date(a.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined,
    publishToApp: a.publishToApp,
    publishToWeb: a.publishToWeb
  }));

  const published  = articles.filter((a) => a.status === "published");
  const scheduled  = articles.filter((a) => a.status === "scheduled");
  const drafts     = articles.filter((a) => a.status === "draft");

  const filteredPublished = published.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isStatsLoading = isLoadingStats;
  const totalPublishedCount = Number(statsData?.data?.totalPublished ?? 0);
  const totalViewsCount = Number(statsData?.data?.totalViews ?? 0);
  const totalBookmarksCount = Number(statsData?.data?.totalBookmarks ?? 0);

  const handlePublish = async (id: number) => {
    try {
      await updateBlogMutation({ id: id.toString(), status: "published" }).unwrap();
      toast.success("Article published successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to publish article");
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await updateBlogMutation({ id: id.toString(), status: "draft" }).unwrap();
      toast.success("Article unpublished successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to unpublish article");
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">Blogs</h1>
        <Link href="/dashboard/blog/new">
          <Button className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-5 font-bold text-sm shadow-lg shadow-primary/10 gap-2 cursor-pointer">
            <PenLine className="h-4 w-4" />
            Write new blog
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Published Articles", value: totalPublishedCount, icon: <Layout className="h-5 w-5 text-white" /> },
          { label: "Views",              value: totalViewsCount,     icon: <Eye className="h-5 w-5 text-white" /> },
          { label: "Bookmarked",         value: totalBookmarksCount, icon: <Bookmark className="h-5 w-5 text-white" /> },
        ].map((s, i) => (
          <div key={i} className="h-[130px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] flex items-center justify-between px-7 hover:bg-[#E8FAFA] transition-colors">
            <div>
              {isStatsLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : (
                <p className="text-4xl font-bold font-outfit text-primary leading-none">{s.value}</p>
              )}
              <p className="text-sm font-semibold text-primary/80 mt-2">{s.label}</p>
            </div>
            <div className="h-11 w-11 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {isLoadingArticles ? (
        <div className="py-20 flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-slate/40">Loading blogs...</p>
        </div>
      ) : (
        <>

      {/* Published Articles */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-dark font-outfit shrink-0">Published Articles</h2>
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate/40" />
              <Input
                placeholder="Search for topics or keywords"
                className="pl-9 h-8 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Link href="/dashboard/blog/view-all?status=published" className="text-primary text-xs font-bold hover:underline shrink-0">View all</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPublished.slice(0, 8).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
              onViewEngagement={(art) => setViewingBlogComments(art)}
            />
          ))}
        </div>
        {filteredPublished.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-slate/40">
            <BookOpen className="h-8 w-8" />
            <p className="text-sm font-medium">No published articles match your search.</p>
          </div>
        )}
      </div>

      {/* Scheduled Posts */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark font-outfit">
            Scheduled Post<span className="text-slate/50 font-medium">({scheduled.length})</span>
          </h2>
          <Link href="/dashboard/blog/view-all?status=scheduled" className="text-primary text-xs font-bold hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {scheduled.slice(0, 4).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
              onViewEngagement={(art) => setViewingBlogComments(art)}
            />
          ))}
        </div>
        {scheduled.length === 0 && (
          <div className="py-10 flex flex-col items-center gap-2 text-slate/40">
            <Clock className="h-6 w-6" />
            <p className="text-sm font-medium">No scheduled posts.</p>
          </div>
        )}
      </div>

      {/* Draft */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark font-outfit">
            Draft<span className="text-slate/50 font-medium">({drafts.length})</span>
          </h2>
          <Link href="/dashboard/blog/view-all?status=draft" className="text-primary text-xs font-bold hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {drafts.slice(0, 4).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
              onViewEngagement={(art) => setViewingBlogComments(art)}
            />
          ))}
        </div>
        {drafts.length === 0 && (
          <div className="py-10 flex flex-col items-center gap-2 text-slate/40">
            <FileEdit className="h-6 w-6" />
            <p className="text-sm font-medium">No drafts.</p>
          </div>
        )}
      </div>
      </>
      )}

      </div>
    </>
  );
}
