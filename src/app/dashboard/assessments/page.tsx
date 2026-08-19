"use client";

import { useState } from "react";
import {
  HelpCircle,
  Search,
  PlusCircle,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Eye,
  X,
  Loader2,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useGetAssessmentsQuery,
  useCreateAssessmentMutation,
  useAddAssessmentQuestionMutation,
  useGetAssessmentSubmissionsQuery,
} from "@/lib/redux/features/assessmentApi";

export default function AssessmentManagementPage() {
  const [activeTab, setActiveTab] = useState<"assessments" | "submissions">("assessments");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Assessment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(3);
  const [newCategory, setNewCategory] = useState("NET_WORTH");
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Add Question Modal State
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [selectedAssessmentForQuestion, setSelectedAssessmentForQuestion] = useState<any | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<Array<{ optionText: string; isCorrect: boolean }>>([
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: true },
  ]);

  // View Scorecard Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  // Queries
  const { data: assessmentsResponse, isLoading: isLoadingAssessments, refetch: refetchAssessments } = useGetAssessmentsQuery({
    q: searchQuery.trim() || undefined,
  });

  const { data: submissionsResponse, isLoading: isLoadingSubmissions } = useGetAssessmentSubmissionsQuery({
    q: searchQuery.trim() || undefined,
  });

  const [createAssessment, { isLoading: isCreatingAssessment }] = useCreateAssessmentMutation();
  const [addQuestion, { isLoading: isAddingQuestion }] = useAddAssessmentQuestionMutation();

  const assessmentsRaw = assessmentsResponse?.data || assessmentsResponse;
  const assessmentsList: any[] = Array.isArray(assessmentsRaw?.items)
    ? assessmentsRaw.items
    : Array.isArray(assessmentsRaw)
    ? assessmentsRaw
    : [];

  const submissionsRaw = submissionsResponse?.data || submissionsResponse;
  const submissionsList: any[] = Array.isArray(submissionsRaw?.items)
    ? submissionsRaw.items
    : Array.isArray(submissionsRaw)
    ? submissionsRaw
    : [];

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Please fill in all assessment details.");
      return;
    }

    try {
      await createAssessment({
        title: newTitle.trim(),
        description: newDescription.trim(),
        estimatedMinutes: Number(newEstimatedMinutes) || 3,
        category: newCategory,
        status: newStatus,
      }).unwrap();

      toast.success("Assessment card created successfully!");
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      refetchAssessments();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create assessment");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentForQuestion) return;
    if (!questionText.trim()) {
      toast.error("Question text is required.");
      return;
    }

    const validOptions = options.filter((o) => o.optionText.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options.");
      return;
    }

    if (!validOptions.some((o) => o.isCorrect)) {
      toast.error("Please select at least one correct option.");
      return;
    }

    try {
      await addQuestion({
        assessmentId: selectedAssessmentForQuestion.id,
        questionText: questionText.trim(),
        explanation: explanation.trim() || undefined,
        options: validOptions,
      }).unwrap();

      toast.success("Question and MCQ options added successfully!");
      setShowAddQuestionModal(false);
      setQuestionText("");
      setExplanation("");
      setOptions([
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: true },
      ]);
      refetchAssessments();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add question");
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 md:p-10 border border-border/50 shadow-sm w-full max-w-[1140px] min-h-[900px] mx-auto flex flex-col animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight flex items-center gap-2">
            Financial Assessments
            <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none font-bold rounded-full px-2.5 py-0.5 text-[10px]">
              Quiz Subsystem
            </Badge>
          </h1>
          <p className="text-slate/60 text-xs font-semibold mt-1">
            Manage interactive financial tests, configure MCQ questions, and analyze user readiness scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-11 px-5 rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Create Assessment Test
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 gap-8">
        <button
          onClick={() => setActiveTab("assessments")}
          className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "assessments"
              ? "border-[#155D5F] text-[#155D5F]"
              : "border-transparent text-slate/50 hover:text-slate"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Assessment Cards ({assessmentsList.length})
        </button>

        <button
          onClick={() => setActiveTab("submissions")}
          className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "submissions"
              ? "border-[#155D5F] text-[#155D5F]"
              : "border-transparent text-slate/50 hover:text-slate"
          }`}
        >
          <Award className="w-4 h-4" />
          User Submissions ({submissionsList.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/40" />
        <Input
          type="text"
          placeholder={activeTab === "assessments" ? "Search assessment tests..." : "Search user submissions by email..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 h-11 bg-surface border-border/30 rounded-xl text-xs font-medium focus-visible:ring-primary/20 shadow-none"
        />
      </div>

      {/* TAB 1: ASSESSMENT CARDS */}
      {activeTab === "assessments" && (
        <div className="space-y-6">
          {isLoadingAssessments ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-xs text-slate/50 font-semibold">Loading assessment tests...</p>
            </div>
          ) : assessmentsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assessmentsList.map((test) => (
                <div
                  key={test.id}
                  className="rounded-2xl border border-border/60 bg-surface/30 p-6 flex flex-col justify-between hover:border-[#155D5F]/40 hover:shadow-md transition-all space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-[#155D5F]/10 text-[#155D5F] border-none text-[10px] font-bold">
                        {test.category || "GENERAL"}
                      </Badge>
                      <Badge className={`text-[10px] font-bold ${
                        test.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {test.status || "ACTIVE"}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-dark font-outfit leading-snug">
                      {test.title}
                    </h3>

                    <p className="text-xs text-slate/60 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate/60 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#155D5F]" /> {test.estimatedMinutes || 3} Mins
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-[#155D5F]" /> {test.totalQuestions || 5} Questions
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssessmentForQuestion(test);
                        setShowAddQuestionModal(true);
                      }}
                      className="rounded-xl text-xs font-bold text-[#155D5F] hover:bg-[#155D5F]/10 border-[#155D5F]/30 gap-1.5 h-9"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add MCQ Question
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-border/60 rounded-2xl p-6">
              <HelpCircle className="h-10 w-10 text-slate/20 mx-auto mb-2" />
              <p className="text-sm font-bold text-dark">No financial assessments created yet.</p>
              <p className="text-xs text-slate/50 mt-1">Click &ldquo;Create Assessment Test&rdquo; to launch your first quiz.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER SUBMISSIONS */}
      {activeTab === "submissions" && (
        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-white">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">User Email</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Assessment</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Score / %</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Result Tier</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest">Date</TableHead>
                <TableHead className="py-4 px-4 text-slate/50 font-bold text-[11px] uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingSubmissions ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate/50 font-medium">Loading submissions...</p>
                  </TableCell>
                </TableRow>
              ) : submissionsList.length > 0 ? (
                submissionsList.map((sub: any) => {
                  const dateStr = sub.createdAt || sub.timestamp;
                  const formattedDate = dateStr ? format(new Date(dateStr), "MMM dd, yyyy · HH:mm") : "-";

                  return (
                    <TableRow key={sub.id} className="border-border/50 hover:bg-surface/30 transition-all">
                      <TableCell className="py-4 px-4 font-bold text-dark text-xs">
                        {sub.email || "Anonymous"}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-slate/70 text-xs font-semibold">
                        {sub.assessmentTitle || sub.assessment?.title || "Financial Test"}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-bold text-xs text-[#155D5F]">
                        {sub.score} / {sub.totalQuestions || 5} ({sub.percentage || 80}%)
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {sub.resultTier || "HIGH_READINESS"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-slate/60 text-xs font-medium">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(sub)}
                          className="text-xs font-bold text-[#155D5F] hover:bg-[#155D5F]/10 rounded-xl"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Scorecard
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <Award className="h-8 w-8 text-slate/20 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate/40">No assessment submissions recorded yet.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL 1: CREATE ASSESSMENT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[24px] w-full max-w-[560px] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">Create Financial Assessment</h2>
                  <p className="text-xs text-slate/50 font-medium">Define a new test card for users</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Assessment Title</label>
                <Input
                  required
                  placeholder="e.g. Financial Position Test 1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-11 bg-surface/50 border-border/50 text-xs font-medium rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Short Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Asset-to-liability ratio & net worth distribution check"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border/50 bg-surface/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-border/50 bg-surface/50 text-xs font-semibold focus:outline-none"
                  >
                    <option value="NET_WORTH">Net Worth (NET_WORTH)</option>
                    <option value="EMERGENCY_BUFFER">Emergency Buffer (EMERGENCY_BUFFER)</option>
                    <option value="INFLATION_DEFENSE">Inflation Defense (INFLATION_DEFENSE)</option>
                    <option value="SAVINGS_CAPACITY">Savings Capacity (SAVINGS_CAPACITY)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark">Estimated Minutes</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                    className="h-11 bg-surface/50 border-border/50 text-xs font-medium rounded-xl"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border/30 flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs font-bold text-slate"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingAssessment}
                  className="rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold px-6 h-11 shadow-md"
                >
                  {isCreatingAssessment ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Create Test Card
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD QUESTION & OPTIONS */}
      {showAddQuestionModal && selectedAssessmentForQuestion && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[24px] w-full max-w-[620px] max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">Add MCQ Question</h2>
                  <p className="text-xs text-slate/50 font-medium">To: {selectedAssessmentForQuestion.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="text-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Question Prompt Text</label>
                <Input
                  required
                  placeholder="e.g. What is your current emergency fund buffer?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="h-11 bg-surface/50 border-border/50 text-xs font-medium rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark">Answer Explanation (Shown on Scorecard)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Financial advisors recommend maintaining 3 to 6 months of essential expenses."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border/50 bg-surface/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-dark">Multiple Choice Options (Select Correct Key)</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOptions([...options, { optionText: "", isCorrect: false }])}
                    className="text-[11px] font-bold text-[#155D5F]"
                  >
                    + Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface/40 p-2.5 rounded-xl border border-border/40">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={opt.isCorrect}
                        onChange={() => {
                          setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
                        }}
                        className="w-4 h-4 accent-[#155D5F] cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <Input
                        placeholder={`Option ${idx + 1} text...`}
                        value={opt.optionText}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].optionText = e.target.value;
                          setOptions(updated);
                        }}
                        className="h-9 bg-white border-border/40 text-xs font-medium rounded-lg flex-1"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="p-1 text-slate/40 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border/30 flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="rounded-xl text-xs font-bold text-slate"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingQuestion}
                  className="rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold px-6 h-11 shadow-md"
                >
                  {isAddingQuestion ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW USER SCORECARD DETAIL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[24px] w-full max-w-[620px] max-h-[85vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark font-outfit">User Scorecard Report</h2>
                  <p className="text-xs text-slate/50 font-medium">{selectedSubmission.email || "Anonymous User"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#F2FFFF] border border-[#155D5F4D] text-center space-y-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs">
                  {selectedSubmission.resultTier || "HIGH_READINESS"}
                </Badge>
                <h3 className="text-3xl font-extrabold text-[#155D5F] font-outfit">
                  {selectedSubmission.score} / {selectedSubmission.totalQuestions || 5} ({selectedSubmission.percentage || 80}%)
                </h3>
                <p className="text-xs text-slate/70 leading-relaxed max-w-md mx-auto">
                  {selectedSubmission.resultSummary || "User completed the assessment test and generated an actionable scorecard."}
                </p>
              </div>

              {selectedSubmission.answersBreakdown?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-dark uppercase tracking-wider">Question by Question Breakdown</h4>
                  {selectedSubmission.answersBreakdown.map((item: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl border border-border/50 bg-surface/30 space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-dark">{i + 1}. {item.questionText}</p>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          item.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}>
                          {item.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <p className="text-slate/60">
                        <strong>Selected:</strong> {item.selectedOptionText}
                      </p>
                      {item.explanation && (
                        <p className="text-[11px] text-[#155D5F] bg-white p-2 rounded-lg border border-border/30">
                          <strong>Explanation:</strong> {item.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-border/30 flex justify-end bg-surface/20">
              <Button
                variant="outline"
                onClick={() => setSelectedSubmission(null)}
                className="rounded-xl text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
