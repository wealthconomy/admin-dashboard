import { apiSlice } from "../apiSlice";

export const portfolioApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get portfolios by type (WEALTH_FLEX, WEALTH_FIX, etc)
    getPortfoliosByType: builder.query<any, { type: string; [key: string]: any }>({
      query: ({ type, ...params }) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });
        const qs = queryParams.toString();
        return `/admin/portfolios/${type}${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Portfolio"],
    }),

    // Get cooperative groups / tribes
    getTribes: builder.query<any, { [key: string]: any }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });
        const qs = queryParams.toString();
        return `/admin/portfolios/groups/tribes${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Tribes"],
    }),
    // Export cooperative groups / tribes
    exportTribes: builder.query<any, void>({
      query: () => ({
        url: "/admin/portfolios/groups/tribes/export",
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Export portfolios by type
    exportPortfoliosByType: builder.query<any, { type: string }>({
      query: ({ type }) => ({
        url: `/admin/portfolios/${type}/export`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPortfoliosByTypeQuery,
  useGetTribesQuery,
  useExportTribesQuery,
  useExportPortfoliosByTypeQuery,
  useLazyExportTribesQuery,
  useLazyExportPortfoliosByTypeQuery,
} = portfolioApi;
