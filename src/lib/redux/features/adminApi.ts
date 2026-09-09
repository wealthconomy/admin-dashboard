import { apiSlice } from "../apiSlice";

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --------------------------------------------------------
    // Audit Logs
    // --------------------------------------------------------
    getAuditLogs: builder.query({
      query: (params?: { page?: number; limit?: number }) => {
        let qs = "";
        if (params?.page) qs += `page=${params.page}&`;
        if (params?.limit) qs += `limit=${params.limit}&`;
        return `/admin/audit-logs${qs ? `?${qs.slice(0, -1)}` : ""}`;
      },
      providesTags: ["Activities"],
    }),

    // --------------------------------------------------------
    // Admin Team Management
    // --------------------------------------------------------
    getTeam: builder.query({
      query: () => "/admin/team",
      providesTags: ["Users"],
    }),
    getTeamMember: builder.query({
      query: (id: string) => `/admin/team/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    provisionTeamMember: builder.mutation({
      query: (body) => ({
        url: "/admin/team",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateTeamMember: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/team/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteTeamMember: builder.mutation({
      query: (id: string) => ({
        url: `/admin/team/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // --------------------------------------------------------
    // Custom Roles
    // --------------------------------------------------------
    getRoles: builder.query({
      query: () => "/admin/roles",
      providesTags: ["Users"],
    }),
    getRole: builder.query({
      query: (id: string) => `/admin/roles/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    createRole: builder.mutation({
      query: (body) => ({
        url: "/admin/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteRole: builder.mutation({
      query: (id: string) => ({
        url: `/admin/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // --------------------------------------------------------
    // System Settings & Configs
    // --------------------------------------------------------
    getSystemConfigs: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              searchParams.append(key, value as string);
            }
          });
        }
        const queryString = searchParams.toString();
        return `/admin/system-config${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Dashboard"],
    }),
    updateSystemConfig: builder.mutation({
      query: ({ key, value }) => ({
        url: `/admin/system-config/${key}`,
        method: "PUT",
        body: { value },
      }),
      invalidatesTags: ["Dashboard"],
    }),
    getSettings: builder.query({
      query: () => "/admin/settings",
      providesTags: ["Dashboard"],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({
        url: "/admin/settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Dashboard"],
    }),

    // --------------------------------------------------------
    // Admin Profile & Auth
    // --------------------------------------------------------
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/admin/settings/profile",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    updatePassword: builder.mutation({
      query: (body) => ({
        url: "/admin/settings/password",
        method: "POST",
        body,
      }),
    }),
    updateProfilePhoto: builder.mutation({
      query: (body) => ({
        // Even if we upload the photo via /api/file/upload first, this endpoint sets it to the user's profile
        url: "/admin/settings/profile/photo",
        method: "POST",
        body, // likely { imageUrl: url } or similar. We will find out.
      }),
      invalidatesTags: ["Auth"],
    }),

    // --------------------------------------------------------
    // User Management (Admin actions on users)
    // --------------------------------------------------------
    resetUserPassword: builder.mutation({
      query: (id: string) => ({
        url: `/admin/users/${id}/reset-password`,
        method: "POST",
      }),
    }),
    resetUserMfa: builder.mutation({
      query: (id: string) => ({
        url: `/admin/users/${id}/reset-mfa`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),

    // --------------------------------------------------------
    // Notifications & Wealth Groups
    // --------------------------------------------------------
    getAdminNotifications: builder.query({
      query: (params?: { limit?: number; after?: string; before?: string; sortBy?: string; sortDir?: string; q?: string }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(params?.limit || 50));
        if (params?.after) queryParams.append('after', params.after);
        if (params?.before) queryParams.append('before', params.before);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params?.q) queryParams.append('q', params.q);
        const queryString = queryParams.toString();
        return `/admin/notifications${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["AdminNotifications"] as any,
    }),
    getUnreadNotificationsCount: builder.query({
      query: () => "/admin/notifications/unread-count",
      providesTags: ["AdminNotifications"] as any,
    }),
    markNotificationRead: builder.mutation({
      query: (id: string) => ({
        url: `/admin/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["AdminNotifications"] as any,
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: `/admin/notifications/read-all`,
        method: "POST",
      }),
      invalidatesTags: ["AdminNotifications"] as any,
    }),
    deleteAdminNotification: builder.mutation({
      query: (id: string) => ({
        url: `/admin/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminNotifications"] as any,
    }),
    clearAllAdminNotifications: builder.mutation({
      query: () => ({
        url: `/admin/notifications/clear-all`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminNotifications"] as any,
    }),
    // --------------------------------------------------------
    getBroadcastHistory: builder.query({
      query: () => "/admin/notifications/history",
      providesTags: ["Dashboard"],
    }),
    broadcastNotification: builder.mutation({
      query: (body) => ({
        url: "/admin/notifications/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Dashboard"],
    }),
    getWealthGroups: builder.query({
      query: () => "/admin/wealth-groups",
      providesTags: ["Dashboard"],
    }),

    // --------------------------------------------------------
    // Email Templates
    // --------------------------------------------------------
    seedEmailTemplates: builder.mutation({
      query: () => ({
        url: "/admin/email-templates/seed",
        method: "POST",
      }),
      invalidatesTags: ["EmailTemplates"] as any,
    }),
    getEmailTemplates: builder.query({
      query: () => "/admin/email-templates",
      providesTags: ["EmailTemplates"] as any,
    }),
    getEmailTemplateByKey: builder.query({
      query: (key: string) => `/admin/email-templates/${key}`,
      providesTags: ["EmailTemplates"] as any,
    }),
    updateEmailTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/email-templates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["EmailTemplates"] as any,
    }),
    previewEmailTemplate: builder.mutation({
      query: (body) => ({
        url: "/admin/email-templates/preview",
        method: "POST",
        body,
      }),
    }),

    // --------------------------------------------------------
    // File Uploads
    // --------------------------------------------------------
    uploadFile: builder.mutation({
      query: (formData: FormData) => ({
        url: "/file/upload?multiSizes=false",
        method: "POST",
        body: formData,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAuditLogsQuery,
  useGetTeamQuery,
  useGetTeamMemberQuery,
  useProvisionTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetSystemConfigsQuery,
  useUpdateSystemConfigMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useUpdateProfilePhotoMutation,
  useResetUserPasswordMutation,
  useResetUserMfaMutation,
  useUploadFileMutation,
  useGetBroadcastHistoryQuery,
  useBroadcastNotificationMutation,
  useGetWealthGroupsQuery,
  useGetAdminNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteAdminNotificationMutation,
  useClearAllAdminNotificationsMutation,
  useGetUnreadNotificationsCountQuery,
  useSeedEmailTemplatesMutation,
  useGetEmailTemplatesQuery,
  useGetEmailTemplateByKeyQuery,
  useUpdateEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
} = adminApi;
