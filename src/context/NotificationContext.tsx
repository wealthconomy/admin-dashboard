"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ArrowRightLeft,
  ShieldCheck,
  Users,
  Info,
  AlertTriangle,
  Bell,
  BookOpen
} from "lucide-react";
import { 
  useGetAdminNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteAdminNotificationMutation,
  useClearAllAdminNotificationsMutation
} from "@/lib/redux/features/adminApi";
import { useGetUsersQuery, useGetTransactionsQuery } from "@/lib/redux/features/usersApi";
import { useGetBlogsQuery } from "@/lib/redux/features/blogApi";
import { toast } from "sonner";

export type NotificationType =
  | "financial"
  | "security"
  | "management"
  | "content"
  | "system"
  | string;

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
  isFetching: boolean;
  refetch: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  fetchNextPage: () => void;
  fetchPrevPage: () => void;
  pageNumber: number;
  totalCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cursor pagination state
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([]);

  // Use RTK Query to fetch notifications with cursor pagination
  const { data: apiData, isLoading, isFetching, refetch } = useGetAdminNotificationsQuery(
    { limit: 50, after: currentCursor },
    { refetchOnMountOrArgChange: true }
  );

  // Fetch users to map user IDs and wallet IDs to names in notifications
  const { data: usersData } = useGetUsersQuery(
    { limit: 500 },
    { refetchOnMountOrArgChange: true }
  );

  // Fetch transactions to map wallet CUIDs directly to user names
  const { data: transactionsData } = useGetTransactionsQuery(
    { limit: 200 },
    { refetchOnMountOrArgChange: true }
  );

  // Fetch blogs to map post IDs to titles in notifications
  const { data: blogsData } = useGetBlogsQuery(
    { limit: 100 },
    { refetchOnMountOrArgChange: true }
  );

  const [markReadMut] = useMarkNotificationReadMutation();
  const [markAllReadMut] = useMarkAllNotificationsReadMutation();
  const [deleteMut] = useDeleteAdminNotificationMutation();
  const [clearAllMut] = useClearAllAdminNotificationsMutation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pagination metadata
  const paginationData = apiData?.data && typeof apiData.data === "object" && !Array.isArray(apiData.data)
    ? apiData.data
    : apiData;

  const nextCursor = paginationData?.nextCursor || null;
  const prevCursor = paginationData?.prevCursor || null;
  const hasNext = Boolean(paginationData?.hasNext ?? (nextCursor != null));
  const hasPrev = cursorStack.length > 0 || Boolean(paginationData?.hasPrev ?? (prevCursor != null));
  const totalCount = typeof paginationData?.totalCount === "number" ? paginationData.totalCount : 0;
  const pageNumber = cursorStack.length + 1;

  const fetchNextPage = () => {
    if (nextCursor) {
      setCursorStack((prev) => [...prev, currentCursor]);
      setCurrentCursor(nextCursor);
    }
  };

  const fetchPrevPage = () => {
    if (cursorStack.length > 0) {
      const prevCursorVal = cursorStack[cursorStack.length - 1];
      setCursorStack((prev) => prev.slice(0, -1));
      setCurrentCursor(prevCursorVal);
    }
  };

  // Map API response to our UI Notification interface safely
  useEffect(() => {
    try {
      let rawData = apiData?.data || apiData;
      
      // If the response is paginated, extract the items array
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData) && Array.isArray((rawData as any).items)) {
        rawData = (rawData as any).items;
      }
      
      if (!rawData || !Array.isArray(rawData)) {
        setNotifications([]);
        setUnreadCount(apiData?.unreadCount || 0);
        return;
      }

      // Build user & wallet ID map with exact and prefix matching
      const userMap = new Map<string, string>();
      const prefixMap7 = new Map<string, string>();
      const prefixMap6 = new Map<string, string>();

      const recordUser = (id: any, name: any) => {
        if (!id || !name) return;
        const strId = String(id).trim();
        const cleanName = String(name).trim();
        if (!cleanName || cleanName.toLowerCase() === "undefined" || cleanName.toLowerCase() === "null") return;

        userMap.set(strId, cleanName);
        if (strId.startsWith("c") && strId.length >= 7) {
          if (!prefixMap7.has(strId.slice(0, 7))) {
            prefixMap7.set(strId.slice(0, 7), cleanName);
          }
          if (!prefixMap6.has(strId.slice(0, 6))) {
            prefixMap6.set(strId.slice(0, 6), cleanName);
          }
        }
      };

      // 1. Populate from usersData
      const usersList = usersData?.data?.items || usersData?.data || (Array.isArray(usersData) ? usersData : []);
      if (Array.isArray(usersList)) {
        usersList.forEach((u: any) => {
          const firstName = u.firstName || u.first_name || "";
          const lastName = u.lastName || u.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();
          const name = fullName || u.name || u.fullName || u.username || u.email;
          
          if (name) {
            [u.id, u._id, u.userId, u.walletId, u.wallet_id, u.wallet?.id, u.wallet?._id, u.primaryWallet?.id, u.primaryWalletId].forEach((id) => {
              if (id) recordUser(id, name);
            });
            if (Array.isArray(u.wallets)) {
              u.wallets.forEach((w: any) => {
                if (w?.id) recordUser(w.id, name);
                if (w?._id) recordUser(w._id, name);
              });
            }
          }
        });
      }

      // 2. Populate from transactionsData
      const txList = transactionsData?.data?.items || transactionsData?.data || (Array.isArray(transactionsData) ? transactionsData : []);
      if (Array.isArray(txList)) {
        txList.forEach((tx: any) => {
          const userObj = tx.user || tx.customer;
          const firstName = userObj?.firstName || tx.firstName || "";
          const lastName = userObj?.lastName || tx.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          const name = fullName || userObj?.name || userObj?.fullName || userObj?.email || tx.userName || tx.email;
          
          if (name) {
            [tx.walletId, tx.wallet_id, tx.wallet?.id, tx.wallet?._id, tx.userId, tx.user?.id, tx.primaryWalletId, tx.destinationWalletId, tx.sourceWalletId].forEach((id) => {
              if (id) recordUser(id, name);
            });

            // Scan narrative or description for any wallet CUIDs
            const textToScan = `${tx.description || ""} ${tx.narrative || ""} ${tx.details || ""}`;
            const matchedCuids = textToScan.match(/c[a-z0-9]{20,}/gi);
            if (matchedCuids) {
              matchedCuids.forEach((cuid) => recordUser(cuid, name));
            }
          }
        });
      }

      // Helper function to resolve name using exact CUID or prefix match
      const getOwnerName = (cuid: string): string | undefined => {
        if (!cuid) return undefined;
        if (userMap.has(cuid)) return userMap.get(cuid);
        if (cuid.startsWith("c") && cuid.length >= 7) {
          const p7 = cuid.slice(0, 7);
          if (prefixMap7.has(p7)) return prefixMap7.get(p7);
          const p6 = cuid.slice(0, 6);
          if (prefixMap6.has(p6)) return prefixMap6.get(p6);
        }
        return undefined;
      };

      // Build blog post ID → title map
      const blogMap = new Map<string, string>();
      const blogsList = (blogsData as any)?.data?.items || (blogsData as any)?.data || blogsData;
      if (blogsList && Array.isArray(blogsList)) {
        blogsList.forEach((b: any) => {
          if (b.id && b.title) {
            blogMap.set(String(b.id), b.title);
          }
        });
      }

      const mapped: Notification[] = rawData.map((n: any) => {
        let description = n.description || n.message || "You have a new notification";

        // Step 1: Format kobo amounts into clean Naira
        description = description.replace(/(\d+)\s*kobo/gi, (_match: string, koboStr: string) => {
          const naira = Number(koboStr) / 100;
          return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        });

        // Convert standalone large integer kobo amounts like "deposit of 500000 was"
        description = description.replace(/\bof\s+(\d{5,})\s+(was|for|to)\b/gi, (_match: string, numStr: string, follow: string) => {
          const naira = Number(numStr) / 100;
          return `of ₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${follow}`;
        });

        // Step 2: Clean up "for wallet [cuid]" or "wallet [cuid]" to use actual user name
        const walletCuidRegex = /\b(?:for\s+)?wallet\s+(c[a-z0-9]{20,})\b\.?/gi;
        description = description.replace(walletCuidRegex, (_match: string, cuid: string) => {
          const ownerName = getOwnerName(cuid);
          return ownerName ? `for ${ownerName}'s wallet` : "for user's wallet";
        });

        // Step 3: Clean up "Withdrawal request [cuid] was initiated"
        const withdrawalCuidRegex = /\bWithdrawal request\s+(c[a-z0-9]{20,})\b/gi;
        description = description.replace(withdrawalCuidRegex, (_match: string, cuid: string) => {
          const ownerName = getOwnerName(cuid);
          return ownerName ? `Withdrawal request for ${ownerName}` : `Withdrawal request`;
        });

        // Step 4: Replace "to user [cuid]" pattern with name
        const toUserCuidRegex = /\bto user\s+(c[a-z0-9]{20,})\b\.?/gi;
        description = description.replace(toUserCuidRegex, (_match: string, cuid: string) => {
          const name = getOwnerName(cuid);
          return name ? `to ${name}` : "to user";
        });

        // Replace "User [cuid]" pattern with resolved name
        const userCuidRegex = /\bUser\s+(c[a-z0-9]{20,})\b/gi;
        description = description.replace(userCuidRegex, (_match: string, cuid: string) => {
          return getOwnerName(cuid) || "A user";
        });

        // Step 5: Strip duplicate leading "User " prefix before a name that was already resolved
        description = description.replace(/\bUser\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g, '$1');

        // Step 6: Replace blog post CUIDs with their titles
        const blogCuidRegex = /\bblog post\s+(c[a-z0-9]{20,})\b\.?/gi;
        description = description.replace(blogCuidRegex, (_match: string, cuid: string) => {
          const title = blogMap.get(cuid);
          return title ? `blog post "${title}"` : "the blog post";
        });

        // Step 7: Fallback — replace any remaining bare CUIDs
        const cuidRegex = /\bc[a-z0-9]{20,}\b/g;
        description = description.replace(cuidRegex, (match: string) => {
          return getOwnerName(match) || match.slice(0, 8);
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
      
      const computedUnread = apiData?.unreadCount !== undefined 
        ? apiData.unreadCount 
        : mapped.filter((x: Notification) => x.status === "unread").length;
        
      setUnreadCount(computedUnread);
      
    } catch (err) {
      console.error("Error parsing notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [apiData, usersData, transactionsData, blogsData]);

  // Helper functions for UI mapping
  const getIconForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "financial": return ArrowRightLeft;
      case "security": return ShieldCheck;
      case "management": return Users;
      case "content": return BookOpen;
      case "system": return Info;
      default: return Bell;
    }
  };

  const getColorForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "financial": return "emerald";
      case "security": return "blue";
      case "management": return "orange";
      case "content": return "purple";
      case "system": return "slate";
      default: return "primary";
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markReadMut(id).unwrap();
    } catch (e) {
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
        isLoading,
        isFetching,
        refetch,
        hasNext,
        hasPrev,
        fetchNextPage,
        fetchPrevPage,
        pageNumber,
        totalCount
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
