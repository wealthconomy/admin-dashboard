import { apiSlice } from "../apiSlice";

export const supportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSupportChats: builder.query<any, { stage: string; search: string }>({
      query: ({ stage, search }) => {
        let url = `/admin/support/chats?stage=${stage}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        return url;
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
} = supportApi;
