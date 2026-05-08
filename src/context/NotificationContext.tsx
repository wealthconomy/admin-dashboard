"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ArrowRightLeft,
  ShieldCheck,
  Users,
  Info,
  AlertTriangle,
} from "lucide-react";

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
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Large Withdrawal Request",
    description:
      "Simon Smith requested a withdrawal of N120,000 from WealthFix plan. Review required.",
    time: "2 mins ago",
    date: "April 27, 2026",
    type: "financial",
    status: "unread",
    icon: ArrowRightLeft,
    color: "emerald",
  },
  {
    id: "2",
    title: "New Admin Login",
    description:
      "Jessica Smith logged into the admin dashboard from a new device in Lagos, NG.",
    time: "1 hour ago",
    date: "April 27, 2026",
    type: "security",
    status: "unread",
    icon: ShieldCheck,
    color: "blue",
  },
  {
    id: "3",
    title: "Pending User KYC",
    description:
      "5 new users have uploaded sensitive documents and are awaiting administrator verification.",
    time: "4 hours ago",
    date: "April 27, 2026",
    type: "management",
    status: "unread",
    icon: Users,
    color: "orange",
  },
  {
    id: "4",
    title: "System Update Scheduled",
    description:
      "The dashboard will undergo routine maintenance on May 1st at 02:00 AM UTC.",
    time: "1 day ago",
    date: "April 26, 2026",
    type: "system",
    status: "read",
    icon: Info,
    color: "slate",
  },
  {
    id: "5",
    title: "Suspicious Activity Detected",
    description:
      "Multiple failed login attempts detected on account for user ID: 527351.",
    time: "2 days ago",
    date: "April 25, 2026",
    type: "security",
    status: "read",
    icon: AlertTriangle,
    color: "red",
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  );

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" as const })),
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
