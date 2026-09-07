import { apiSlice } from "../apiSlice";

export const assessmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List financial assessments
    getAssessments: builder.query({
      query: (params) => ({
        url: "/admin/assessments",
        params: {
          page: params?.page || 1,
          limit: params?.limit || 50,
          status: params?.status,
          q: params?.q,
          period: params?.period,
          populate: "questions",
        },
      }),
      providesTags: ["Assessment"],
    }),

    // Get single assessment details & questions
    getAssessmentById: builder.query({
      query: (id: string) => `/admin/assessments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Assessment", id }],
    }),

    // Get assessment questions subroute fallback
    getAssessmentQuestions: builder.query({
      query: (assessmentId: string) => `/admin/assessments/${assessmentId}/questions`,
      providesTags: (_result, _error, assessmentId) => [{ type: "Assessment", id: assessmentId }],
    }),

    // Create a new financial assessment card
    createAssessment: builder.mutation({
      query: (body: {
        title: string;
        description: string;
        estimatedMinutes: number;
        category: string;
        status?: "ACTIVE" | "INACTIVE" | "DRAFT";
      }) => ({
        url: "/admin/assessments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Assessment"],
    }),

    // Add MCQ question with options & answer key
    addAssessmentQuestion: builder.mutation({
      query: ({
        assessmentId,
        ...body
      }: {
        assessmentId: string;
        questionText: string;
        explanation?: string;
        options: { optionText: string; isCorrect: boolean }[];
      }) => ({
        url: `/admin/assessments/${assessmentId}/questions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { assessmentId }) => [
        "Assessment",
        { type: "Assessment", id: assessmentId },
      ],
    }),

    // Update assessment test card settings
    updateAssessment: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        title?: string;
        description?: string;
        estimatedMinutes?: number;
        category?: string;
        status?: "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
      }) => ({
        url: `/admin/assessments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Assessment",
        { type: "Assessment", id },
      ],
    }),

    // Delete assessment test card
    deleteAssessment: builder.mutation({
      query: (id: string) => ({
        url: `/admin/assessments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Assessment"],
    }),

    // Update MCQ question
    updateAssessmentQuestion: builder.mutation({
      query: ({
        assessmentId,
        questionId,
        ...body
      }: {
        assessmentId: string;
        questionId: string;
        questionText?: string;
        explanation?: string;
        options?: { optionText: string; isCorrect: boolean }[];
      }) => ({
        url: `/admin/assessments/${assessmentId}/questions/${questionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { assessmentId }) => [
        "Assessment",
        { type: "Assessment", id: assessmentId },
      ],
    }),

    // Delete MCQ question
    deleteAssessmentQuestion: builder.mutation({
      query: ({
        assessmentId,
        questionId,
      }: {
        assessmentId: string;
        questionId: string;
      }) => ({
        url: `/admin/assessments/${assessmentId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { assessmentId }) => [
        "Assessment",
        { type: "Assessment", id: assessmentId },
      ],
    }),

    // View all user submissions & analytics
    getAssessmentSubmissions: builder.query({
      query: (params) => ({
        url: "/admin/assessments/submissions",
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          assessmentId: params?.assessmentId,
          userId: params?.userId,
          q: params?.q,
          period: params?.period,
        },
      }),
      providesTags: ["AssessmentSubmission"],
    }),
  }),
});

export const {
  useGetAssessmentsQuery,
  useGetAssessmentByIdQuery,
  useGetAssessmentQuestionsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useAddAssessmentQuestionMutation,
  useUpdateAssessmentQuestionMutation,
  useDeleteAssessmentQuestionMutation,
  useGetAssessmentSubmissionsQuery,
} = assessmentApi;
