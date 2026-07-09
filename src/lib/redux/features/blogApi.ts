import { apiSlice } from "../apiSlice";

export const blogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List all blogs with filtering
    getBlogs: builder.query({
      query: (params) => ({
        url: "/admin/blogs",
        params: {
          q: params?.q,
          status: params?.status,
          sortBy: params?.sortBy || "createdAt",
          sortDir: params?.sortDir || "desc",
          limit: params?.limit || 20,
        },
      }),
      providesTags: ["Blogs"],
    }),

    // Get blog stats
    getBlogStats: builder.query({
      query: () => "/admin/blogs/stats",
      providesTags: ["Blogs"],
    }),

    // Get a single blog
    getBlog: builder.query({
      query: (id: string) => `/admin/blogs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Blogs", id }],
    }),

    // Create a new blog
    createBlog: builder.mutation({
      query: (body) => ({
        url: "/admin/blogs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Blogs"],
    }),

    // Update an existing blog
    updateBlog: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/blogs/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Blogs"],
    }),

    // Delete a blog
    deleteBlog: builder.mutation({
      query: (id: string) => ({
        url: `/admin/blogs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Blogs"],
    }),

    // Publish a blog
    publishBlog: builder.mutation({
      query: (id: string) => ({
        url: `/admin/blogs/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["Blogs"],
    }),

    // Get blog engagement
    getBlogEngagement: builder.query({
      query: (id: string) => `/admin/blogs/${id}/engagement`,
      providesTags: (_result, _error, id) => [{ type: "Blogs", id }],
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogStatsQuery,
  useGetBlogQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
  usePublishBlogMutation,
  useGetBlogEngagementQuery,
} = blogApi;
