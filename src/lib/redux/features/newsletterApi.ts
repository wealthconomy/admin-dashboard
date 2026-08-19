import { apiSlice } from "../apiSlice";

export const newsletterApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List newsletter subscribers with filters (status, q, period, pagination)
    getNewsletterSubscribers: builder.query({
      query: (params) => ({
        url: "/admin/newsletter/subscribers",
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          status: params?.status,
          q: params?.q,
          period: params?.period,
        },
      }),
      providesTags: ["Newsletter"],
    }),

    // Export subscribers as CSV
    exportNewsletterSubscribers: builder.mutation({
      query: (body) => ({
        url: "/admin/newsletter/subscribers/export",
        method: "POST",
        body,
        responseHandler: (response) => response.text(),
      }),
    }),

    // Create & dispatch newsletter broadcast
    sendNewsletterBroadcast: builder.mutation({
      query: (body: {
        title: string;
        subject: string;
        body: string;
        recipientSegment: "SUBSCRIBERS_ONLY" | "ALL_USERS" | "ALL";
      }) => ({
        url: "/admin/newsletter/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Newsletter"],
    }),
  }),
});

export const {
  useGetNewsletterSubscribersQuery,
  useExportNewsletterSubscribersMutation,
  useSendNewsletterBroadcastMutation,
} = newsletterApi;
