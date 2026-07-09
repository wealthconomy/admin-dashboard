import { apiSlice } from "../apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Admin Login
    login: builder.mutation({
      query: (credentials: { email: string; password?: string }) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Request password reset OTP
    forgotPassword: builder.mutation({
      query: (body: { destination: string }) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    // Verify OTP code
    verifyOtp: builder.mutation({
      query: (body: { destination: string; code: string }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
    }),

    // Complete password reset
    resetPassword: builder.mutation({
      query: (body: {
        destination: string;
        resetToken: string;
        newPassword?: string;
        confirmPassword?: string;
      }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    // Change password (authenticated session)
    changePassword: builder.mutation({
      query: (body: { oldPassword?: string; newPassword?: string }) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    // Logout
    logout: builder.mutation({
      query: (body: { refreshToken: string }) => ({
        url: "/auth/logout",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Get My Profile
    getMe: builder.query({
      query: () => "/user/me",
      providesTags: ["Auth"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
