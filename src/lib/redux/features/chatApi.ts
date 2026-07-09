import { apiSlice } from "../apiSlice";

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInternalTeam: builder.query<any, void>({
      query: () => "/internal-chat/team",
      providesTags: ["InternalChat"],
    }),
    getInternalMessages: builder.query<any, string>({
      query: (adminId) => `/internal-chat/messages/${adminId}`,
      providesTags: (result, error, adminId) => [{ type: "InternalChat", id: adminId }],
    }),
    sendInternalMessage: builder.mutation<any, { receiverId: string; text: string; attachmentUrl?: string }>({
      query: (body) => ({
        url: "/internal-chat/messages",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { receiverId }) => [{ type: "InternalChat", id: receiverId }],
    }),
  }),
});

export const {
  useGetInternalTeamQuery,
  useGetInternalMessagesQuery,
  useSendInternalMessageMutation,
} = chatApi;
