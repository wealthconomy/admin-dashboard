"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Layout,
  Eye,
  Bookmark,
  MoreVertical,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    label: "Published Articles",
    value: "237",
    icon: Layout,
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  {
    label: "Views",
    value: "124",
    icon: Eye,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    label: "Bookmarked",
    value: "98",
    icon: Bookmark,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
];

const articles = [
  {
    id: 1,
    title: "Emergency Funds 101",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFlex",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=300&h=200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Automation Secrets",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFam",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&h=200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Automation Secrets",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFam",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&h=200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Emergency Funds 101",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFlex",
    image:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=300&h=200&auto=format&fit=crop",
  },
];

const scheduledPosts = [
  {
    id: 5,
    title: "Emergency Funds 101",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFlex",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=300&h=200&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Automation Secrets",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFam",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&h=200&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Automation Secrets",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFam",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&h=200&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Emergency Funds 101",
    author: "Ayo Ogunseinde",
    readTime: "4 mins reading",
    category: "WealthFlex",
    image:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=300&h=200&auto=format&fit=crop",
  },
];

export default function BlogOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-white rounded-[20px] p-10 border border-border/50 shadow-sm w-full max-w-[1137px] min-h-[1000px] mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
          Blogs
        </h1>
        <Link href="/dashboard/blog/new">
          <Button className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-12 px-6 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
            <Plus className="h-5 w-5" />
            Create new blog
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="h-[175px] bg-[#F2FFFF] border border-[#155D5F4D] rounded-[20px] shadow-none overflow-hidden transition-all hover:bg-[#E6F9F9]"
          >
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl font-bold font-outfit text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold text-dark">
                    {stat.label}
                  </div>
                </div>
                <div
                  className={`p-2.5 rounded-full ${stat.color} absolute top-3 right-3`}
                >
                  <stat.icon className="h-5 w-5 bg-[#E6F9F9] rounded-full" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2.5"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
          <Input
            placeholder="Search for topics or keywords"
            className="pl-11 h-12 bg-white border-border/50 rounded-xl text-sm font-medium focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Published Articles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark font-outfit">
            Published Articles
          </h2>
          {/* Removed View all as requested */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href="/dashboard/blog/edit">
              <div className="bg-white border border-border/50 rounded-[20px] overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full">
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-primary uppercase tracking-wider">
                    {article.category}
                  </div>
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm text-dark line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-surface border border-border/50 flex items-center justify-center text-[10px] font-bold text-slate">
                        AO
                      </div>
                      <span className="text-[10px] font-semibold text-slate/70">
                        {article.author}
                      </span>
                    </div>
                    <span className="text-[9px] font-medium text-slate/40">
                      {article.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Scheduled Post Section */}
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark font-outfit">
            Scheduled Post
          </h2>
          {/* Removed View all as requested */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {scheduledPosts.map((post) => (
            <Link key={post.id} href="/dashboard/blog/edit">
              <div className="bg-white border border-border/50 rounded-[20px] overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full">
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-primary uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm text-dark line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-surface border border-border/50 flex items-center justify-center text-[10px] font-bold text-slate">
                        AO
                      </div>
                      <span className="text-[10px] font-semibold text-slate/70">
                        {post.author}
                      </span>
                    </div>
                    <span className="text-[9px] font-medium text-slate/40">
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
