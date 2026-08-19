import { apiSlice } from "../apiSlice";

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
      invalidatesTags: (result, error, { id }) => [{ type: "Support", id }],
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
  }),
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
} = supportApi;
