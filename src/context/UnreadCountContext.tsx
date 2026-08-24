"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { 
  useGetUnreadSummaryQuery, 
  useMarkInternalAsReadMutation 
} from "@/lib/redux/features/chatApi";
import { useMarkSupportChatReadMutation } from "@/lib/redux/features/supportApi";

interface UnreadCountContextValue {
  totalInternalUnread: number;
  totalSupportUnread: number;
  markInternalRead: (targetAdminId: string) => Promise<void>;
  markSupportRead: (chatId: string) => Promise<void>;
  refetchSummary: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextValue>({
  totalInternalUnread: 0,
  totalSupportUnread: 0,
  markInternalRead: async () => {},
  markSupportRead: async () => {},
  refetchSummary: () => {},
});

export const useUnreadCounts = () => useContext(UnreadCountContext);

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [totalInternalUnread, setTotalInternalUnread] = useState(0);
  const [totalSupportUnread, setTotalSupportUnread] = useState(0);

  const { data: summaryData, refetch: refetchSummary } = useGetUnreadSummaryQuery(undefined, {
    pollingInterval: 10000,
  });

  const [markInternalMutation] = useMarkInternalAsReadMutation();
  const [markSupportMutation] = useMarkSupportChatReadMutation();

  // Sync REST summary whenever data updates
  useEffect(() => {
    if (summaryData?.data) {
      if (typeof summaryData.data.totalInternalUnread === "number") {
        setTotalInternalUnread(summaryData.data.totalInternalUnread);
      }
      if (typeof summaryData.data.totalSupportUnread === "number") {
        setTotalSupportUnread(summaryData.data.totalSupportUnread);
      }
    }
  }, [summaryData]);

  // Listen to real-time WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleUnreadUpdate = (data: {
      totalInternalUnread?: number;
      totalSupportUnread?: number;
    }) => {
      if (typeof data?.totalInternalUnread === "number") {
        setTotalInternalUnread(data.totalInternalUnread);
      }
      if (typeof data?.totalSupportUnread === "number") {
        setTotalSupportUnread(data.totalSupportUnread);
      }
      refetchSummary();
    };

    const handleAnyNewMessage = () => {
      refetchSummary();
    };

    socket.on("chat:unread_count_update", handleUnreadUpdate);
    socket.on("unread_count_update", handleUnreadUpdate);
    socket.on("internal:new_message", handleAnyNewMessage);
    socket.on("chat:new_message", handleAnyNewMessage);
    socket.on("support:new_message", handleAnyNewMessage);

    return () => {
      socket.off("chat:unread_count_update", handleUnreadUpdate);
      socket.off("unread_count_update", handleUnreadUpdate);
      socket.off("internal:new_message", handleAnyNewMessage);
      socket.off("chat:new_message", handleAnyNewMessage);
      socket.off("support:new_message", handleAnyNewMessage);
    };
  }, [socket, refetchSummary]);

  // Mark an internal admin chat thread as read
  const markInternalRead = useCallback(
    async (targetAdminId: string) => {
      if (!targetAdminId) return;

      // 1. Emit real-time socket event
      if (socket && isConnected) {
        socket.emit("chat:mark_as_read", { targetAdminId });
      }

      // 2. Execute REST mutation for persistence & tag invalidation
      try {
        await markInternalMutation(targetAdminId).unwrap();
      } catch (err) {
        console.warn("REST markInternalAsRead error (socket handled):", err);
      }
    },
    [socket, isConnected, markInternalMutation]
  );

  // Mark a customer support chat thread as read
  const markSupportRead = useCallback(
    async (chatId: string) => {
      if (!chatId) return;

      // 1. Emit real-time socket event
      if (socket && isConnected) {
        socket.emit("chat:mark_as_read", { chatId, direction: "admin" });
      }

      // 2. Execute REST mutation
      try {
        await markSupportMutation(chatId).unwrap();
      } catch (err) {
        console.warn("REST markSupportChatRead error (socket handled):", err);
      }
    },
    [socket, isConnected, markSupportMutation]
  );

  return (
    <UnreadCountContext.Provider
      value={{
        totalInternalUnread,
        totalSupportUnread,
        markInternalRead,
        markSupportRead,
        refetchSummary,
      }}
    >
      {children}
    </UnreadCountContext.Provider>
  );
}
