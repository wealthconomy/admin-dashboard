import { apiSlice } from "../apiSlice";

export const libraryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List all library materials
    getLibraries: builder.query({
      query: (params) => ({
        url: "/admin/library",
        params: {
          q: params?.q,
          type: params?.type,
          sortBy: params?.sortBy || "createdAt",
          sortDir: params?.sortDir || "desc",
          limit: params?.limit || 20,
        },
      }),
      providesTags: ["Library"],
    }),

    // Get a single library material
    getLibraryById: builder.query({
      query: (id: string) => `/admin/library/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Library", id }],
    }),

    // Create library material
    createLibrary: builder.mutation({
      query: (body) => ({
        url: "/admin/library",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Library"],
    }),

    // Update library material
    updateLibrary: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/library/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Library",
        { type: "Library", id },
      ],
    }),

    // Delete library material
    deleteLibrary: builder.mutation({
      query: (id: string) => ({
        url: `/admin/library/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Library"],
    }),

    // Get library engagement
    getLibraryEngagement: builder.query({
      query: (id: string) => `/admin/library/${id}/engagement`,
      providesTags: (_result, _error, id) => [{ type: "Library", id: `${id}-engagement` }],
    }),

    // Get library stats (KPIs)
    getLibraryStats: builder.query({
      query: (timeFilter?: string) => ({
        url: "/admin/library/stats",
        params: timeFilter && timeFilter !== "all" ? { timeFilter } : undefined,
      }),
      providesTags: ["Library"],
    }),

    // Record a download event for a library material (client-side endpoint)
    // Used to track downloads so the backend can count them accurately for KPI stats
    recordLibraryDownload: builder.mutation({
      query: (id: string) => ({
        url: `/client/library/${id}/download`,
        method: "POST",
      }),
      invalidatesTags: ["Library"],
    }),
  }),
});

export const {
  useGetLibrariesQuery,
  useGetLibraryByIdQuery,
  useCreateLibraryMutation,
  useUpdateLibraryMutation,
  useDeleteLibraryMutation,
  useGetLibraryEngagementQuery,
  useGetLibraryStatsQuery,
  useRecordLibraryDownloadMutation,
} = libraryApi;
