import { apiSlice } from "../apiSlice";

export const referralsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /admin/referrals/stats
    getReferralStats: builder.query({
      query: () => "/admin/referrals/stats",
      providesTags: ["Referrals"],
    }),

    // GET /admin/referrals/list
    getReferralsList: builder.query({
      query: () => "/admin/referrals/list",
      providesTags: ["Referrals"],
    }),

    // GET /admin/referrals/payouts
    getReferralPayouts: builder.query({
      query: () => "/admin/referrals/payouts",
      providesTags: ["Referrals"],
    }),

    // POST /admin/referrals/payouts/{id}/approve
    approveReferralPayout: builder.mutation({
      query: (id: string) => ({
        url: `/admin/referrals/payouts/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Referrals"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReferralStatsQuery,
  useGetReferralsListQuery,
  useGetReferralPayoutsQuery,
  useApproveReferralPayoutMutation,
} = referralsApi;
