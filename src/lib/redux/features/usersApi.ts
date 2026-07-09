import { apiSlice } from "../apiSlice";

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => {
        // Construct query string dynamically
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              searchParams.append(key, value as string);
            }
          });
        }
        const queryString = searchParams.toString();
        return {
          url: `/admin/users${queryString ? `?${queryString}` : ""}`,
        };
      },
      providesTags: ["Users"],
    }),
    getUserDetails: builder.query({
      query: (id: string) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    getUserCredentials: builder.query({
      query: (id: string) => `/admin/users/${id}/credentials`,
      providesTags: (_result, _error, id) => [{ type: "Kyc", id }],
    }),
    suspendUser: builder.mutation({
      query: ({ id, durationDays, reason }) => ({
        url: `/admin/users/${id}/suspend`,
        method: "POST",
        body: { durationDays, reason },
      }),
      invalidatesTags: ["Users"],
    }),
    unsuspendUser: builder.mutation({
      query: (id: string) => ({
        url: `/admin/users/${id}/unsuspend`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    blockUser: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/block`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Users"],
    }),
    unblockUser: builder.mutation({
      query: (id: string) => ({
        url: `/admin/users/${id}/unblock`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id: string) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    downloadUsersReport: builder.query({
      query: () => ({
        url: "/admin/users/download-report",
        responseHandler: (response) => response.blob(), // For downloading CSVs
      }),
    }),
    // KYC Action Endpoints
    approveKycDoc: builder.mutation({
      query: ({ id, documentType, reason }) => ({
        url: `/admin/kyc/users/${id}/credentials/approve`,
        method: "POST",
        body: { documentType, reason },
      }),
      invalidatesTags: ["Kyc"],
    }),
    rejectKycDoc: builder.mutation({
      query: ({ id, documentType, reason }) => ({
        url: `/admin/kyc/users/${id}/credentials/reject`,
        method: "POST",
        body: { documentType, reason },
      }),
      invalidatesTags: ["Kyc"],
    }),
    resetKycDoc: builder.mutation({
      query: ({ id, documentType, reason }) => ({
        url: `/admin/kyc/users/${id}/credentials/reset`,
        method: "POST",
        body: { documentType, reason },
      }),
      invalidatesTags: ["Kyc"],
    }),
    updateKycLevel: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/admin/kyc/users/${id}`,
        method: "PUT",
        body: { status, reason },
      }),
      invalidatesTags: ["Kyc", "Users"],
    }),
    // Transactions
    getUserTransactions: builder.query({
      query: ({ id, ...params }: { id: string, [key: string]: any }) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value as string);
          }
        });
        const queryString = searchParams.toString();
        return `/admin/users/${id}/transactions${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Transactions"],
    }),
    getTransactions: builder.query({
      query: (params?: { [key: string]: any }) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              searchParams.append(key, value as string);
            }
          });
        }
        const queryString = searchParams.toString();
        return `/admin/transactions${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Transactions"],
    }),
    getTransactionDetails: builder.query({
      query: (id: string) => `/admin/transactions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Transactions", id }],
    }),
    rollbackTransaction: builder.mutation({
      query: (id: string) => ({
        url: `/admin/transactions/${id}/rollback`,
        method: "POST",
      }),
      invalidatesTags: ["Transactions"],
    }),
    // Activities
    getActivities: builder.query({
      query: (params?: { [key: string]: any }) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              searchParams.append(key, value as string);
            }
          });
        }
        const queryString = searchParams.toString();
        return `/admin/activities${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Activities"],
    }),
    searchActivities: builder.query({
      query: (params: { userId?: string, action?: string }) => {
        const searchParams = new URLSearchParams();
        if (params.userId) searchParams.append("userId", params.userId);
        if (params.action) searchParams.append("action", params.action);
        const queryString = searchParams.toString();
        return `/admin/activities/search${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Activities"],
    }),
    getActivityDetails: builder.query({
      query: (id: string) => `/admin/activities/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Activities", id }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserDetailsQuery,
  useGetUserCredentialsQuery,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
  useDownloadUsersReportQuery,
  useLazyDownloadUsersReportQuery,
  useApproveKycDocMutation,
  useRejectKycDocMutation,
  useResetKycDocMutation,
  useUpdateKycLevelMutation,
  useGetTransactionsQuery,
  useGetTransactionDetailsQuery,
  useRollbackTransactionMutation,
  useGetActivitiesQuery,
  useSearchActivitiesQuery,
  useGetActivityDetailsQuery,
  useGetUserTransactionsQuery,
} = usersApi;
