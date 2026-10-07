import { apiSlice } from "../apiSlice";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // KPI summary cards
    getDashboardStats: builder.query<any, string>({
      query: (period) => `/admin/dashboard/stats?filter=${period || "today"}`,
      providesTags: ["Dashboard"],
    }),

    // Portfolio distribution
    getPortfolioStats: builder.query<any[], string | void>({
      query: (filter) => `/admin/dashboard/portfolio-stats${filter ? `?filter=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Donut / transaction analytics
    getDonutAnalytics: builder.query<any, string | void>({
      query: (filter) => `/admin/dashboard/analytics/donut${filter ? `?filter=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // User growth chart
    getUserGrowth: builder.query<any, string | void>({
      query: (filter) => `/admin/dashboard/analytics/user-growth${filter ? `?filter=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Wealth growth chart
    getWealthGrowth: builder.query<any, string | void>({
      query: (filter) => `/admin/dashboard/analytics/wealth-growth${filter ? `?filter=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Reports: Savings
    getSavingsReport: builder.query<any[], string | void>({
      query: (filter) => `/admin/dashboard/reports/savings${filter ? `?filter=${filter}&period=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Reports: Transactions
    getTransactionsReport: builder.query<any[], string | void>({
      query: (filter) => `/admin/dashboard/reports/transactions${filter ? `?filter=${filter}&period=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Reports: Interest
    getInterestReport: builder.query<any[], string | void>({
      query: (filter) => `/admin/dashboard/reports/interest${filter ? `?filter=${filter}&period=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Reports: Revenue
    getRevenueReport: builder.query<any[], string | void>({
      query: (filter) => `/admin/dashboard/reports/revenue${filter ? `?filter=${filter}&period=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),

    // Reports: Retention
    getRetentionReport: builder.query<any[], string | void>({
      query: (filter) => `/admin/dashboard/reports/retention${filter ? `?filter=${filter}&period=${filter}` : ""}`,
      providesTags: ["Dashboard"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardStatsQuery,
  useGetPortfolioStatsQuery,
  useGetDonutAnalyticsQuery,
  useGetUserGrowthQuery,
  useGetWealthGrowthQuery,
  useGetSavingsReportQuery,
  useGetTransactionsReportQuery,
  useGetInterestReportQuery,
  useGetRevenueReportQuery,
  useGetRetentionReportQuery,
} = dashboardApi;
