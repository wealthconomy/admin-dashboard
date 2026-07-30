"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ArrowRightLeft,
  ShieldCheck,
  Users,
  Info,
  AlertTriangle,
  Bell
} from "lucide-react";
import { 
  useGetAdminNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteAdminNotificationMutation,
  useClearAllAdminNotificationsMutation
} from "@/lib/redux/features/adminApi";
import { useGetUsersQuery } from "@/lib/redux/features/usersApi";
import { useGetBlogsQuery } from "@/lib/redux/features/blogApi";
import { toast } from "sonner";

export type NotificationType =
  | "financial"
  | "security"
  | "management"
  | "system";

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  type: NotificationType;
  status: "read" | "unread";
  icon: any;
  color: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use RTK Query to fetch notifications (Poll every 60 seconds)
  const { data: apiData, isLoading, refetch } = useGetAdminNotificationsQuery(
    { limit: 50 },
    { pollingInterval: 60000 }
  );

  // Fetch users to map user IDs to names in notifications
  const { data: usersData } = useGetUsersQuery(
    { limit: 100 },
    { pollingInterval: 120000 }
  );

  // Fetch blogs to map post IDs to titles in notifications
  const { data: blogsData } = useGetBlogsQuery(
    { limit: 100 },
    { pollingInterval: 120000 }
  );

  const [markReadMut] = useMarkNotificationReadMutation();
  const [markAllReadMut] = useMarkAllNotificationsReadMutation();
  const [deleteMut] = useDeleteAdminNotificationMutation();
  const [clearAllMut] = useClearAllAdminNotificationsMutation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Map API response to our UI Notification interface safely
  useEffect(() => {
    try {
      let rawData = apiData?.data || apiData;
      
      // If the response is paginated, extract the items array
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData) && Array.isArray((rawData as any).items)) {
        rawData = (rawData as any).items;
      }
      
      // Fallback robust check while backend API is not fully deployed/integrated
      if (!rawData || !Array.isArray(rawData)) {
        setNotifications([]);
        setUnreadCount(apiData?.unreadCount || 0); // In case backend implements unreadCount at root
        return;
      }

      // Build user map from usersData
      const userMap = new Map<string, string>();
      const usersList = usersData?.data?.items || usersData?.data || usersData;
      if (usersList && Array.isArray(usersList)) {
        usersList.forEach((u: any) => {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || u.email;
          if (u.id && name) {
            userMap.set(u.id, name);
          }
        });
      }

      // Build blog post ID → title map
      const blogMap = new Map<string, string>();
      const blogsList = (blogsData as any)?.data?.items || (blogsData as any)?.data || blogsData;
      if (blogsList && Array.isArray(blogsList)) {
        blogsList.forEach((b: any) => {
          if (b.id && b.title) {
            blogMap.set(b.id, b.title);
          }
        });
      }

      const mapped: Notification[] = rawData.map((n: any) => {
        let description = n.description || n.message || "You have a new notification";

        // Step 1: Replace "User [cuid]" pattern with just the resolved name (drops "User " prefix)
        const userCuidRegex = /\bUser\s+(c[a-z0-9]{24})\b/gi;
        description = description.replace(userCuidRegex, (_match: string, cuid: string) => {
          return userMap.get(cuid) || _match;
        });

        // Step 2: Strip leading "User " prefix before a name that was already resolved
        // e.g. "User Favour Efemiaya" → "Favour Efemiaya"
        description = description.replace(/\bUser\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g, '$1');

        // Step 3: Replace blog post CUIDs with their titles
        // e.g. "blog post cmr6nbfkh0002h23tdbd8yrt0" → "blog post titled My Post Title"
        const blogCuidRegex = /\bblog post\s+(c[a-z0-9]{20,})\b\.?/gi;
        description = description.replace(blogCuidRegex, (_match: string, cuid: string) => {
          const title = blogMap.get(cuid);
          return title ? `blog post titled "${title}"` : `blog post titled "${cuid}"`;
        });

        // Step 4: Fallback — replace any remaining bare CUIDs (user IDs not yet resolved)
        const cuidRegex = /\bc[a-z0-9]{24}\b/g;
        description = description.replace(cuidRegex, (match: string) => {
          return userMap.get(match) || match;
        });

        return {
          id: n.id || n._id || Math.random().toString(),
          title: n.title || "Notification",
          description,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
          date: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          type: (n.type || "system") as NotificationType,
          status: (n.isRead || n.status === "read" ? "read" : "unread") as "read" | "unread",
          icon: getIconForType(n.type),
          color: getColorForType(n.type),
        };
      });

      setNotifications(mapped);
      
      // If the backend doesn't send a global unread count, calculate it locally
      const computedUnread = apiData?.unreadCount !== undefined 
        ? apiData.unreadCount 
        : mapped.filter((x: Notification) => x.status === "unread").length;
        
      setUnreadCount(computedUnread);
      
    } catch (err) {
      console.error("Error parsing notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [apiData, usersData, blogsData]);

  // Helper functions for UI mapping
  const getIconForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "financial": return ArrowRightLeft;
      case "security": return ShieldCheck;
      case "management": return Users;
      case "system": return Info;
      default: return Bell;
    }
  };

  const getColorForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "financial": return "emerald";
      case "security": return "blue";
      case "management": return "orange";
      case "system": return "slate";
      default: return "primary";
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markReadMut(id).unwrap();
    } catch (e) {
      // Revert if error
      refetch();
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    setUnreadCount(0);
    try {
      await markAllReadMut({}).unwrap();
    } catch (e) {
      refetch();
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteMut(id).unwrap();
    } catch (e) {
      refetch();
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await clearAllMut({}).unwrap();
      toast.success("All notifications cleared");
    } catch (e) {
      refetch();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
        isLoading
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
