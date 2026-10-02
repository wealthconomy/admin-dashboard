import { apiSlice } from "../apiSlice";

export interface SupportMessage {
  id: string;
  chatId?: string;
  senderName?: string;
  text: string;
  time: string;
  isMe: boolean;
  isRead?: boolean;
  readAt?: string | null;
  sender?: string;
  senderRole?: string;
  senderImage?: string;
  createdAt?: string;
  isAdmin?: boolean;
}

export interface SupportChat {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  avatarUrl?: string;
  status?: "online" | "offline" | string;
  stage: "queue" | "active" | "resolved" | string;
  isAdmin?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  adminUnreadCount?: number;
  clientUnreadCount?: number;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
  messages?: SupportMessage[];
  name?: string;
  image?: string;
}

export interface SupportAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  role: string;
  online: boolean;
}

export interface WealthGroupReportGroup {
  id: string;
  name: string;
  category: string;
  status: string;
  creatorId?: string;
  createdAt?: string;
  membersCount?: number;
  members?: any[];
  coverImage?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  groupImage?: string | null;
  groupImageUrl?: string | null;
  avatarUrl?: string | null;
  logo?: string | null;
  icon?: string | null;
}

export interface WealthGroupReportReporter {
  id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  photoUrl?: string | null;
}

export interface WealthGroupReport {
  id: string;
  groupId: string;
  reporterId: string;
  reason: string;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" | string;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  group?: WealthGroupReportGroup;
  reporter?: WealthGroupReportReporter;
}

export interface WealthGroupReportsResponse {
  items: WealthGroupReport[];
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string | null;
  prevCursor?: string | null;
}

export const supportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSupportChats: builder.query<any, { stage?: string; search?: string; q?: string }>({
      query: ({ stage, search, q }) => {
        const params = new URLSearchParams();
        if (stage) params.append("stage", stage);
        const queryTerm = search || q;
        if (queryTerm) {
          params.append("q", queryTerm);
          params.append("search", queryTerm);
        }
        const qs = params.toString();
        return `/admin/support/chats${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Support"],
    }),
    getSupportChat: builder.query<any, string>({
      query: (id) => `/admin/support/chats/${id}`,
      providesTags: (result, error, id) => [{ type: "Support", id }],
    }),
    replySupportChat: builder.mutation<any, { id: string; text: string; attachmentUrl?: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/support/chats/${id}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Support", id }, "Support"],
    }),
    claimSupportChat: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/support/chats/${id}/claim`,
        method: "POST",
      }),
      invalidatesTags: ["Support"],
    }),
    resolveSupportChat: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/support/chats/${id}/resolve`,
        method: "POST",
      }),
      invalidatesTags: ["Support"],
    }),
    reopenSupportChat: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/support/chats/${id}/reopen`,
        method: "POST",
      }),
      invalidatesTags: ["Support"],
    }),
    getSupportAdmins: builder.query<any, void>({
      query: () => "/admin/support/admins",
      providesTags: ["Support"],
    }),
    markSupportChatRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/support/chats/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Support", id }, "Support"],
    }),
    markClientRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/support/chats/${id}/client-read`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Support", id }, "Support"],
    }),
    // Wealth Group Reports Endpoints
    getWealthGroupReports: builder.query<
      any,
      {
        populate?: string;
        status?: string;
        search?: string;
        limit?: number;
        page?: number;
      } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append("populate", params?.populate || "reporter,group");
        if (params?.status && params.status !== "ALL") {
          queryParams.append("status", params.status);
        }
        if (params?.search) {
          queryParams.append("search", params.search);
        }
        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }
        if (params?.page) {
          queryParams.append("page", String(params.page));
        }
        const qs = queryParams.toString();
        return `/admin/groups/reports${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Support"],
    }),
    getWealthGroupReportDetail: builder.query<any, string>({
      query: (id) => `/admin/groups/reports/${id}`,
      providesTags: (result, error, id) => [{ type: "Support", id }],
    }),
    updateWealthGroupReportStatus: builder.mutation<
      any,
      { id: string; status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" | string; resolutionNote?: string }
    >({
      query: ({ id, status, resolutionNote }) => ({
        url: `/admin/groups/reports/${id}/status`,
        method: "PATCH",
        body: { status, resolutionNote },
      }),
      invalidatesTags: ["Support"],
    }),
    deleteWealthGroupReport: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/wealth-groups/reports/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Support"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSupportChatsQuery,
  useGetSupportChatQuery,
  useReplySupportChatMutation,
  useClaimSupportChatMutation,
  useResolveSupportChatMutation,
  useReopenSupportChatMutation,
  useGetSupportAdminsQuery,
  useMarkSupportChatReadMutation,
  useMarkClientReadMutation,
  useGetWealthGroupReportsQuery,
  useGetWealthGroupReportDetailQuery,
  useUpdateWealthGroupReportStatusMutation,
  useDeleteWealthGroupReportMutation,
} = supportApi;

