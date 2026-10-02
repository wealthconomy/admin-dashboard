import { apiSlice } from "../apiSlice";

export type GroupType = "FIXED" | "FLEX" | "ROTATIONAL";

export interface TribeGroupItem {
  id: string;
  groupName?: string;
  name?: string;
  title?: string;
  type?: GroupType;
  status?: string;
  groupTarget?: number;
  totalSaved?: number;
  totalSavings?: number;
  startDate?: string;
  endDate?: string;
  members?: any[];
  [key: string]: any;
}

export interface TribesResponse {
  success?: boolean;
  message?: string;
  data?: {
    items?: TribeGroupItem[];
    totalGroups?: number;
    totalSavings?: number;
    totalBalance?: number;
    totalMembers?: number;
    totalInterest?: number;
    totalWealthpact?: number;
    [key: string]: any;
  } | any;
  items?: TribeGroupItem[];
  totalGroups?: number;
  totalSavings?: number;
  totalBalance?: number;
  totalMembers?: number;
  totalInterest?: number;
  totalWealthpact?: number;
  [key: string]: any;
}

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
  overrideExisting: true,
});

export const {
  useGetPortfoliosByTypeQuery,
  useGetTribesQuery,
  useExportTribesQuery,
  useExportPortfoliosByTypeQuery,
  useLazyExportTribesQuery,
  useLazyExportPortfoliosByTypeQuery,
} = portfolioApi;
