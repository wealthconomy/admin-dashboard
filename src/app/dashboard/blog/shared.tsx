import { useState } from "react";
import { Heart, MessageSquare, ThumbsUp, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ArticleStatus = "published" | "scheduled" | "draft";

export interface Article {
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

interface BlogReactionComment {
  id: string;
  userName: string;
  userRole: string;
  content: string;
  timeAgo: string;
  likes: number;
}

export const MOCK_BLOG_ENGAGEMENT: Record<
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

export function BlogCommentsModal({
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

export function ConfirmActionModal({
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  isDanger = false,
  onConfirm,
  onClose
}: {
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-dark font-outfit mb-2">{title}</h3>
        <p className="text-sm text-slate/60 mb-6">{description}</p>
        <div className="flex gap-3 w-full">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl h-11 border-border/50 text-slate hover:bg-surface">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} className={`flex-1 rounded-xl h-11 text-white shadow-md ${isDanger ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"}`}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
