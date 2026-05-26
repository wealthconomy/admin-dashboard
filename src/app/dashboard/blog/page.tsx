"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, PenLine, Layout, Eye, Bookmark,
  MoreVertical, Clock, Calendar, BookOpen,
  Send, FileEdit, CheckCircle2, X, MessageSquare,
  Heart, User, ThumbsUp, Smartphone, Globe
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

type ArticleStatus = "published" | "scheduled" | "draft";

interface Article {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  timeAgo: string;
  bookmarks: number;
  views: number;
  category: string;
  categoryColor: string;
  image: string;
  status: ArticleStatus;
  scheduledFor?: string;
  publishToApp?: boolean;
  publishToWeb?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  WealthFlex: "bg-purple-100 text-purple-700",
  WealthFam:  "bg-teal-100 text-teal-700",
  WealthFix:  "bg-blue-100 text-blue-700",
  WealthFlow: "bg-orange-100 text-orange-700",
};

const INITIAL_ARTICLES: Article[] = [
  { id: 1,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo1",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: true },
  { id: 2,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo2",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: false },
  { id: 3,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo3",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: false, publishToWeb: true },
  { id: 4,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo4",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: true },
  { id: 5,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo5",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: true },
  { id: 6,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo6",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: true },
  { id: 7,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo7",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: true },
  { id: 8,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo8",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=400&h=200&auto=format&fit=crop", status: "published", publishToApp: true, publishToWeb: true },
  { id: 9,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo9",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 15, 2026 · 9:00 AM", publishToApp: true, publishToWeb: true },
  { id: 10, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo10", timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 16, 2026 · 2:00 PM", publishToApp: true, publishToWeb: true },
  { id: 11, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo11", timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 18, 2026 · 10:00 AM", publishToApp: true, publishToWeb: true },
  { id: 12, title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo12", timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 20, 2026 · 8:00 AM", publishToApp: true, publishToWeb: true },
  { id: 13, title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo13", timeAgo: "3 hours ago",  bookmarks: 0, views: 0, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&h=200&auto=format&fit=crop", status: "draft", publishToApp: true, publishToWeb: true },
  { id: 14, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo14", timeAgo: "1 hour ago",   bookmarks: 0, views: 0, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&h=200&auto=format&fit=crop", status: "draft", publishToApp: true, publishToWeb: true },
  { id: 15, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo15", timeAgo: "2 hours ago",  bookmarks: 0, views: 0, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=400&h=200&auto=format&fit=crop", status: "draft", publishToApp: true, publishToWeb: true },
  { id: 16, title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo16", timeAgo: "5 hours ago",  bookmarks: 0, views: 0, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=400&h=200&auto=format&fit=crop", status: "draft", publishToApp: true, publishToWeb: true },
];

// ─── Blog Comments & Reactions Detail Modal ─────────────────────────

interface BlogReactionComment {
  id: string;
  userName: string;
  userRole: string;
  content: string;
  timeAgo: string;
  likes: number;
}

const MOCK_BLOG_ENGAGEMENT: Record<
  number,
  {
    likes: { user: string; role: string }[];
    comments: BlogReactionComment[];
  }
> = {
  1: {
    likes: [
      { user: "Sarah Jenkins", role: "Investor" },
      { user: "Michael Chen", role: "Entrepreneur" },
    ],
    comments: [
      {
        id: "bc1",
        userName: "Sarah Jenkins",
        userRole: "Investor",
        content: "Super helpful breakdown of how much emergency savings to keep. 3-6 months is definitely a sweet spot!",
        timeAgo: "2 days ago",
        likes: 4,
      },
    ],
  },
  2: {
    likes: [
      { user: "Jessica Taylor", role: "Investor" },
    ],
    comments: [],
  },
};

function BlogCommentsModal({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  const engagement = MOCK_BLOG_ENGAGEMENT[article.id] || {
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
            Blog Engagement Details
          </span>
          <h3 className="text-lg font-bold font-outfit text-dark tracking-tight mt-2 line-clamp-1">
            {article.title}
          </h3>
          <p className="text-xs text-slate/50 mt-1">
            Author: <span className="font-bold text-dark">{article.author}</span> · Views: <span className="font-bold text-dark">{article.views}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40 mb-4">
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === "comments"
                ? "border-primary text-primary"
                : "border-transparent text-slate/40 hover:text-slate"
            }`}
          >
            Comments ({engagement.comments.length})
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === "likes"
                ? "border-primary text-primary"
                : "border-transparent text-slate/40 hover:text-slate"
            }`}
          >
            Liked By ({engagement.likes.length > 0 ? engagement.likes.length : article.bookmarks})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === "comments" ? (
            engagement.comments.length > 0 ? (
              <div className="space-y-4">
                {engagement.comments.map((comment) => (
                  <div
                    key={comment.id}
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
                engagement.likes.map((like, index) => (
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
                  <p className="text-xs font-semibold">No bookmarks or likes recorded.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  onPublish,
  onViewEngagement,
}: {
  article: Article;
  onPublish: (id: number) => void;
  onViewEngagement: (article: Article) => void;
}) {
  const router = useRouter();
  const catColor = CATEGORY_COLORS[article.categoryColor] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="flex items-start gap-2.5 py-2.5 group">
      {/* Thumbnail */}
      <div className="relative h-[68px] w-[90px] rounded-lg overflow-hidden shrink-0">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 pt-0.5">
        {/* Category & platform badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full self-start leading-none ${catColor}`}>
            {article.category}
          </span>
          {article.publishToApp !== false && (
            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 py-0.2 uppercase leading-none" title="Visible on Mobile App">
              <Smartphone className="h-2 w-2" /> App
            </span>
          )}
          {article.publishToWeb !== false && (
            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1 py-0.2 uppercase leading-none" title="Visible on Web Portal">
              <Globe className="h-2 w-2" /> Web
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[12px] font-bold text-dark leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Author + meta row */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <Avatar className="h-5 w-5 shrink-0 border border-white shadow-sm">
            <AvatarImage src={article.authorAvatar} />
            <AvatarFallback className="text-[7px] bg-primary/10 text-primary font-bold">AO</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-dark font-semibold leading-tight truncate">{article.author}</span>
            <div className="flex items-center gap-1">
              {article.status === "published" && (
                <span className="text-[9px] text-slate/50">{article.bookmarks} Bookmarks</span>
              )}
              {article.status === "published" && (
                <><span className="text-[9px] text-slate/30">•</span>
                <span className="text-[9px] text-slate/50">{article.views} Views</span></>
              )}
              {article.status !== "published" && (
                <span className="text-[9px] text-slate/50">{article.timeAgo}</span>
              )}
              {article.status === "scheduled" && article.scheduledFor && (
                <><span className="text-[9px] text-slate/30">•</span>
                <span className="text-[9px] text-orange-500 font-semibold">Scheduled</span></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="shrink-0 p-0.5 mt-1 rounded-lg hover:bg-surface transition-colors text-slate/30 hover:text-slate/60">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-[14px] border-border/50 shadow-xl p-1 bg-white">
          {/* Edit Article — not shown for scheduled (Reschedule covers it) */}
          {article.status !== "scheduled" && (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/edit`)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-dark cursor-pointer rounded-xl gap-2">
              <FileEdit className="h-3.5 w-3.5 text-primary" /> Edit Article
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
            <DropdownMenuItem className="py-2 px-3 text-xs font-bold focus:bg-surface text-slate cursor-pointer rounded-xl gap-2">
              <X className="h-3.5 w-3.5 text-slate/50" /> Unpublish
            </DropdownMenuItem>
          )}
          {article.status === "scheduled" && (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/edit`)} className="py-2 px-3 text-xs font-bold focus:bg-surface text-orange-500 cursor-pointer rounded-xl gap-2">
              <Calendar className="h-3.5 w-3.5" /> Reschedule
            </DropdownMenuItem>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function BlogOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [viewingBlogComments, setViewingBlogComments] = useState<Article | null>(null);

  const published  = articles.filter((a) => a.status === "published");
  const scheduled  = articles.filter((a) => a.status === "scheduled");
  const drafts     = articles.filter((a) => a.status === "draft");

  const filteredPublished = published.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePublish = (id: number) => {
    setArticles((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: "published" as ArticleStatus } : a)
    );
    toast.success("Article published successfully!");
  };

  return (
    <>
      {viewingBlogComments && (
        <BlogCommentsModal
          article={viewingBlogComments}
          onClose={() => setViewingBlogComments(null)}
        />
      )}

      <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">

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
          { label: "Published Articles", value: published.length.toString(), icon: <Layout className="h-5 w-5 text-white" /> },
          { label: "Views",              value: "124",                        icon: <Eye className="h-5 w-5 text-white" /> },
          { label: "Bookmarked",         value: "98",                         icon: <Bookmark className="h-5 w-5 text-white" /> },
        ].map((s, i) => (
          <div key={i} className="h-[130px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] flex items-center justify-between px-7 hover:bg-[#E8FAFA] transition-colors">
            <div>
              <p className="text-4xl font-bold font-outfit text-primary leading-none">{s.value}</p>
              <p className="text-sm font-semibold text-primary/80 mt-2">{s.label}</p>
            </div>
            <div className="h-11 w-11 rounded-full bg-[#155D5F] flex items-center justify-center shrink-0">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
          {filteredPublished.slice(0, 8).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPublish={handlePublish}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
          {scheduled.slice(0, 4).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPublish={handlePublish}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
          {drafts.slice(0, 4).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPublish={handlePublish}
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

      </div>
    </>
  );
}
