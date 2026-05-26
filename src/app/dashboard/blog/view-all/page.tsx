"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Calendar, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
type ArticleStatus = "published" | "scheduled" | "draft";

// Seed articles matching the main page
const SEED_ARTICLES = [
  { id: 1,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo1",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 2,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo2",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 3,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo3",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 4,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo4",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 5,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo5",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 6,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo6",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 7,  title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo7",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 8,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo8",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=400&h=200&auto=format&fit=crop", status: "published" },
  { id: 9,  title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo9",  timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 15, 2026 · 9:00 AM" },
  { id: 10, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo10", timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 16, 2026 · 2:00 PM" },
  { id: 11, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo11", timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 18, 2026 · 10:00 AM" },
  { id: 12, title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo12", timeAgo: "7 hours ago", bookmarks: 2, views: 4, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400&h=200&auto=format&fit=crop", status: "scheduled", scheduledFor: "May 20, 2026 · 8:00 AM" },
  { id: 13, title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo13", timeAgo: "3 hours ago",  bookmarks: 0, views: 0, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&h=200&auto=format&fit=crop", status: "draft" },
  { id: 14, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo14", timeAgo: "1 hour ago",   bookmarks: 0, views: 0, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&h=200&auto=format&fit=crop", status: "draft" },
  { id: 15, title: "Automation Secrets",           author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo15", timeAgo: "2 hours ago",  bookmarks: 0, views: 0, category: "WealthFam",  categoryColor: "WealthFam",  image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=400&h=200&auto=format&fit=crop", status: "draft" },
  { id: 16, title: "Emergency Funds 101",         author: "Ayo Ogunseinde", authorAvatar: "https://i.pravatar.cc/150?u=ayo16", timeAgo: "5 hours ago",  bookmarks: 0, views: 0, category: "WealthFlex", categoryColor: "WealthFlex", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=400&h=200&auto=format&fit=crop", status: "draft" },
];

function BlogViewAllContent() {
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get("status") || "published") as ArticleStatus;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = SEED_ARTICLES.filter((article) => {
    const matchesStatus = article.status === statusParam;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
    <div className="bg-white rounded-[20px] p-8 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[900px] mx-auto space-y-8 animate-in fade-in duration-500">
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

      {/* Grid of articles */}
      {filteredArticles.length > 0 ? (
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
                />
                <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-primary shadow-sm border border-border/20">
                  {article.category}
                </span>
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
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">AO</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-dark">{article.author}</span>
                      <span className="text-[9px] text-slate/40">{article.timeAgo}</span>
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
