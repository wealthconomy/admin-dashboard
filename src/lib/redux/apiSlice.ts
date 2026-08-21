import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

/**
 * ─── Central API Configuration ────────────────────────────────────────────────
 * All API calls route through here. To change the API version across the
 * entire app, update API_VERSION below — no other files need to change.
 * ──────────────────────────────────────────────────────────────────────────────
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_VERSION  = '/api/v1';

const baseQuery = fetchBaseQuery({
    baseUrl: `${API_BASE_URL}${API_VERSION}`,
    prepareHeaders: (headers) => {
      // Access localStorage only on the client side
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  });

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Define caching tags for different entities to enable automatic refetching
  tagTypes: [
    'Auth',
    'Dashboard',
    'Transactions',
    'Notifications',
    'Blogs',
    'Users',
    'Kyc',
    'Activities',
    'Referrals',
    'Library',
    'Portfolio',
    'Tribes',
    'AdminNotifications',
    'Support',
    'InternalChat',
    'EmailTemplates',
    'Newsletter',
    'Assessment',
    'AssessmentSubmission',
  ],
  endpoints: () => ({}),
});
