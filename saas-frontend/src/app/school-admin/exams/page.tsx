"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  Sliders,
  Users,
  ChevronRight,
  TrendingUp,
  FileCheck,
  CheckCircle,
  Clock,
  Layers,
  X,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/services/api";

export default function SchoolAdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [gradingRules, setGradingRules] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"directory" | "rules" | "queue">("directory");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPaperModal, setShowAddPaperModal] = useState<any | null>(null);
  const [showMarksSheetModal, setShowMarksSheetModal] = useState<any | null>(null);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Exam Form
  const [createForm, setCreateForm] = useState({
    name: "",
    academicYear: "2026-2027",
    term: "Term 1",
    classSectionId: "",
    description: "",
    subjectId: "",
    examDate: "",
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    maxMarks: 100,
    passingMarks: 35,
    room: "Hall A",
  });

  // Add Paper Form
  const [addPaperForm, setAddPaperForm] = useState({
    subjectId: "",
    examDate: "",
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    maxMarks: 100,
    passingMarks: 35,
    room: "Hall A",
  });

  // Create Grading Rule Form
  const [ruleForm, setRuleForm] = useState({
    name: "CBSE Standard Tier",
    grade: "A+",
    minPercentage: 90,
    maxPercentage: 100,
    gradePoint: 10,
    description: "Outstanding Academic Distinction",
    isPassing: true,
    academicYear: "2026-2027",
  });

  // Selected Marks Sheet state
  const [selectedMarksSheet, setSelectedMarksSheet] = useState<any | null>(null);
  const [loadingMarksSheet, setLoadingMarksSheet] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCreateForm((prev) => ({ ...prev, examDate: today }));
    setAddPaperForm((prev) => ({ ...prev, examDate: today }));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [examsRes, rulesRes, sectionsRes, subjectsRes] = await Promise.allSettled([
        api.exams.list(),
        api.exams.getGradingRules("2026-2027"),
        api.timetable.classSections.list(),
        api.timetable.subjects.list(),
      ]);

      if (examsRes.status === "fulfilled" && Array.isArray(examsRes.value)) {
        setExams(examsRes.value);
      }
      if (rulesRes.status === "fulfilled" && Array.isArray(rulesRes.value)) {
        setGradingRules(rulesRes.value);
      }
      if (sectionsRes.status === "fulfilled" && Array.isArray(sectionsRes.value)) {
        setClassSections(sectionsRes.value);
        if (sectionsRes.value.length > 0 && !createForm.classSectionId) {
          setCreateForm((prev) => ({ ...prev, classSectionId: sectionsRes.value[0].id }));
        }
      }
      if (subjectsRes.status === "fulfilled" && Array.isArray(subjectsRes.value)) {
        setSubjects(subjectsRes.value);
        if (subjectsRes.value.length > 0) {
          setCreateForm((prev) => ({ ...prev, subjectId: subjectsRes.value[0].id }));
          setAddPaperForm((prev) => ({ ...prev, subjectId: subjectsRes.value[0].id }));
        }
      }
    } catch (err: any) {
      console.error("Failed to load school admin exams data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.classSectionId || !createForm.subjectId) {
      setNotification({
        type: "error",
        text: "Please fill in all required fields (Exam Name, Class Section, Initial Subject).",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.exams.create({
        name: createForm.name,
        academicYear: createForm.academicYear,
        term: createForm.term,
        classSectionId: createForm.classSectionId,
        description: createForm.description,
        subjectId: createForm.subjectId,
        examDate: createForm.examDate,
        startTime: createForm.startTime,
        endTime: createForm.endTime,
        maxMarks: Number(createForm.maxMarks),
        passingMarks: Number(createForm.passingMarks),
        room: createForm.room,
      });

      setNotification({
        type: "success",
        text: `Examination '${createForm.name}' successfully created in DRAFT state.`,
      });
      setShowCreateModal(false);
      setCreateForm((prev) => ({ ...prev, name: "", description: "" }));
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to create examination",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddPaperModal || !addPaperForm.subjectId) return;

    setIsSubmitting(true);
    try {
      await api.exams.addPaper(showAddPaperModal.id, {
        subjectId: addPaperForm.subjectId,
        examDate: addPaperForm.examDate,
        startTime: addPaperForm.startTime,
        endTime: addPaperForm.endTime,
        maxMarks: Number(addPaperForm.maxMarks),
        passingMarks: Number(addPaperForm.passingMarks),
        room: addPaperForm.room,
      });

      setNotification({
        type: "success",
        text: "Subject paper successfully added to examination schedule.",
      });
      setShowAddPaperModal(null);
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to schedule subject paper",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    examId: string,
    newStatus: "DRAFT" | "REVIEWED" | "PUBLISHED",
    examName: string
  ) => {
    if (newStatus === "PUBLISHED") {
      const confirm = window.confirm(
        `Are you sure you want to PUBLISH results for '${examName}'?\n\nOnce published, students and parents can instantly view official report cards and marks.`
      );
      if (!confirm) return;
    }

    try {
      await api.exams.updateStatus(examId, newStatus);
      setNotification({
        type: "success",
        text: `Exam '${examName}' updated to ${newStatus} status.`,
      });
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update examination status",
      });
    }
  };

  const handleOpenMarksSheet = async (exam: any) => {
    setShowMarksSheetModal(exam);
    if (exam.papers && exam.papers.length > 0) {
      const firstPaperId = exam.papers[0].id;
      setSelectedPaperId(firstPaperId);
      await loadMarksSheet(exam.id, firstPaperId);
    }
  };

  const loadMarksSheet = async (examId: string, paperId: string) => {
    setLoadingMarksSheet(true);
    try {
      const res = await api.exams.getMarksSheet(examId, paperId);
      setSelectedMarksSheet(res);
    } catch (err: any) {
      console.error("Failed to load marks sheet:", err);
      setNotification({
        type: "error",
        text: err.message || "Failed to retrieve student marks sheet",
      });
    } finally {
      setLoadingMarksSheet(false);
    }
  };

  const handleCreateGradingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.exams.createGradingRule({
        name: ruleForm.name,
        grade: ruleForm.grade.toUpperCase(),
        minPercentage: Number(ruleForm.minPercentage),
        maxPercentage: Number(ruleForm.maxPercentage),
        gradePoint: Number(ruleForm.gradePoint),
        description: ruleForm.description,
        isPassing: ruleForm.isPassing,
        academicYear: ruleForm.academicYear,
      });

      setNotification({
        type: "success",
        text: `Grading tier '${ruleForm.grade}' successfully configured.`,
      });
      setShowCreateRuleModal(false);
      const rules = await api.exams.getGradingRules("2026-2027");
      setGradingRules(Array.isArray(rules) ? rules : []);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to create grading tier",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered examinations
  const filteredExams = exams.filter((exam) => {
    const matchesStatus =
      statusFilter === "ALL" || exam.status === statusFilter;
    const matchesSearch =
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.academicYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.classSection?.className &&
        exam.classSection.className.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const reviewedExams = exams.filter((e) => e.status === "REVIEWED");
  const publishedCount = exams.filter((e) => e.status === "PUBLISHED").length;
  const draftCount = exams.filter((e) => e.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-md shadow-sky-500/20">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Examination Management & Results Console
              </h1>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                School Admin Authority
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Schedule exams, configure grading rules, track teacher marks entry, and publish verified report cards
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Examination
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Total Scheduled Exams</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{exams.length}</span>
            <span className="text-xs text-slate-400">All sessions</span>
          </div>
          <span className="text-[11px] text-sky-600 mt-2 block font-medium">
            {draftCount} in Draft Preparation
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Publication Ready Queue</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">{reviewedExams.length}</span>
            <span className="text-xs text-amber-500 font-medium">Reviewed</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">
            Pending Admin publication approval
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Published Results</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{publishedCount}</span>
            <span className="text-xs text-slate-400">Live</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">
            Visible to parents & students
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Grading Rules Configured</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600">{gradingRules.length}</span>
            <span className="text-xs text-slate-400">Tiers</span>
          </div>
          <span className="text-[11px] text-indigo-600 mt-2 block font-medium">
            School-level calculation engine
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "directory"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4 text-sky-600" />
          Examinations Directory ({exams.length})
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "queue"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileCheck className="h-4 w-4 text-amber-600" />
          Publication Approval Queue ({reviewedExams.length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "rules"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="h-4 w-4 text-indigo-600" />
          School Grading Rules ({gradingRules.length})
        </button>
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading examination data...</p>
        </div>
      ) : activeTab === "directory" ? (
        /* Tab 1: Directory */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search examination, class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">All Statuses ({exams.length})</option>
                <option value="DRAFT">DRAFT ({draftCount})</option>
                <option value="REVIEWED">REVIEWED ({reviewedExams.length})</option>
                <option value="PUBLISHED">PUBLISHED ({publishedCount})</option>
              </select>
            </div>
          </div>

          {/* Exams List */}
          {filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <Calendar className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Examinations Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                No examinations match your current filter criteria. Click &quot;Create Examination&quot; to schedule a new one.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Examination</th>
                      <th className="py-3 px-4">Class & Section</th>
                      <th className="py-3 px-4">Academic Year</th>
                      <th className="py-3 px-4">Papers Scheduled</th>
                      <th className="py-3 px-4">Lifecycle Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 text-sm">{exam.name}</div>
                          {exam.term && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              Term: {exam.term}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-800">
                          {exam.classSection ? (
                            <span className="rounded-lg bg-sky-50 text-sky-700 px-2.5 py-1 border border-sky-100 font-semibold">
                              {exam.classSection.className} - {exam.classSection.section}
                            </span>
                          ) : (
                            <span className="text-slate-400">All Sections</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-600">
                          {exam.academicYear}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900">
                            {exam.papers?.length || 0}
                          </span>{" "}
                          <span className="text-slate-400">Subjects</span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              exam.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-800"
                                : exam.status === "REVIEWED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {exam.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Marks Sheet */}
                            <button
                              onClick={() => handleOpenMarksSheet(exam)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Marks Sheet
                            </button>

                            {/* Add Paper */}
                            <button
                              onClick={() => setShowAddPaperModal(exam)}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Paper
                            </button>

                            {/* Status Workflow Action */}
                            {exam.status === "DRAFT" && (
                              <button
                                onClick={() => handleUpdateStatus(exam.id, "REVIEWED", exam.name)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                              >
                                Mark Reviewed
                              </button>
                            )}

                            {exam.status === "REVIEWED" && (
                              <button
                                onClick={() => handleUpdateStatus(exam.id, "PUBLISHED", exam.name)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Publish Results
                              </button>
                            )}

                            {exam.status === "PUBLISHED" && (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Live & Locked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "queue" ? (
        /* Tab 2: Publication Queue */
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <strong>Publication Approval Workflow:</strong> Teachers submit scores in DRAFT status. Once verified, School Admin reviews and publishes them to the Student & Parent portals.
            </div>
          </div>

          {reviewedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <CheckCircle className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                There are no examinations waiting in REVIEWED status for publication.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5">
                        PENDING PUBLICATION
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {exam.academicYear}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3">{exam.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class: {exam.classSection?.className} - {exam.classSection?.section} • Term: {exam.term || "Regular"}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Papers Scheduled:</span>
                        <strong className="text-slate-800">{exam.papers?.length || 0} Subjects</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Marks Entries:</span>
                        <strong className="text-slate-800">{exam._count?.marks || 0} Recorded</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 flex items-center gap-3">
                    <button
                      onClick={() => handleOpenMarksSheet(exam)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                    >
                      Audit Marks Sheet
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(exam.id, "PUBLISHED", exam.name)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Publish Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab 3: Configurable Grading Rules */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                School Evaluation Criteria & Grading Scale (2026-2027)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rules govern calculation of grades, grade points, and pass/fail indicators on student report cards.
              </p>
            </div>
            <button
              onClick={() => setShowCreateRuleModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Grading Tier
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Grade Letter</th>
                    <th className="py-3 px-4">Score Range (%)</th>
                    <th className="py-3 px-4">Grade Point</th>
                    <th className="py-3 px-4">Evaluation Description</th>
                    <th className="py-3 px-4 text-center">Passing Status</th>
                    <th className="py-3 px-5 text-right">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {gradingRules.map((rule, idx) => (
                    <tr key={rule.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-black text-indigo-700 text-sm px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
                          {rule.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {rule.minPercentage}% - {rule.maxPercentage}%
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {rule.gradePoint ?? "N/A"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {rule.description || rule.name || "Standard Performance"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                            rule.isPassing
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {rule.isPassing ? "PASSED" : "FAILED"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                        {rule.academicYear || "All"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Examination */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-base">Schedule New Examination</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Assessments 2026-2027"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={createForm.academicYear}
                    onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Term / Evaluation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Term 1"
                    value={createForm.term}
                    onChange={(e) => setCreateForm({ ...createForm, term: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Class & Section *</label>
                <select
                  required
                  value={createForm.classSectionId}
                  onChange={(e) => setCreateForm({ ...createForm, classSectionId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">Select Class Section...</option>
                  {classSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.className} - {sec.section} ({sec.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Paper Schedule */}
              <div className="pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">Initial Subject Paper Schedule</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                    <select
                      required
                      value={createForm.subjectId}
                      onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                    >
                      <option value="">Select Subject...</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Exam Date *</label>
                    <input
                      type="date"
                      required
                      value={createForm.examDate}
                      onChange={(e) => setCreateForm({ ...createForm, examDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Marks *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={createForm.maxMarks}
                      onChange={(e) => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Passing Marks *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={createForm.maxMarks}
                      value={createForm.passingMarks}
                      onChange={(e) => setCreateForm({ ...createForm, passingMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Room / Hall</label>
                    <input
                      type="text"
                      placeholder="e.g. Hall A"
                      value={createForm.room}
                      onChange={(e) => setCreateForm({ ...createForm, room: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? "Creating..." : "Save Examination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Subject Paper to Exam */}
      {showAddPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Schedule Subject Paper</h3>
                <p className="text-xs text-slate-500 mt-0.5">{showAddPaperModal.name}</p>
              </div>
              <button
                onClick={() => setShowAddPaperModal(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaper} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <select
                  required
                  value={addPaperForm.subjectId}
                  onChange={(e) => setAddPaperForm({ ...addPaperForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Exam Date *</label>
                <input
                  type="date"
                  required
                  value={addPaperForm.examDate}
                  onChange={(e) => setAddPaperForm({ ...addPaperForm, examDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={addPaperForm.startTime}
                    onChange={(e) => setAddPaperForm({ ...addPaperForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={addPaperForm.endTime}
                    onChange={(e) => setAddPaperForm({ ...addPaperForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={addPaperForm.maxMarks}
                    onChange={(e) => setAddPaperForm({ ...addPaperForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Marks *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={addPaperForm.maxMarks}
                    value={addPaperForm.passingMarks}
                    onChange={(e) => setAddPaperForm({ ...addPaperForm, passingMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={addPaperForm.room}
                    onChange={(e) => setAddPaperForm({ ...addPaperForm, room: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPaperModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? "Adding..." : "Add Paper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Marks Sheet Roster Audit */}
      {showMarksSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Audit Marks Sheet Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {showMarksSheetModal.name} ({showMarksSheetModal.status})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMarksSheetModal(null);
                  setSelectedMarksSheet(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Paper Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {showMarksSheetModal.papers?.map((paper: any) => (
                  <button
                    key={paper.id}
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      loadMarksSheet(showMarksSheetModal.id, paper.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                      selectedPaperId === paper.id
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {paper.subject?.name || "Subject"} (Max: {paper.maxMarks})
                  </button>
                ))}
              </div>

              {loadingMarksSheet ? (
                <div className="p-10 flex justify-center items-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                </div>
              ) : selectedMarksSheet ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Student</th>
                        <th className="py-2.5 px-3">Admission No</th>
                        <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Result</th>
                        <th className="py-2.5 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedMarksSheet.students?.map((student: any) => {
                        const mark = selectedMarksSheet.marks?.find(
                          (m: any) => m.studentId === student.id
                        );
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {student.fullName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {student.admissionNumber}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                              {mark ? mark.marksObtained : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                              {mark ? `${mark.percentage}%` : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-indigo-700">
                              {mark ? mark.grade : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {mark ? (
                                <span
                                  className={
                                    mark.isPassed ? "text-emerald-700" : "text-rose-700"
                                  }
                                >
                                  {mark.isPassed ? "PASSED" : "FAILED"}
                                </span>
                              ) : (
                                <span className="text-slate-400">Not Entered</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 italic">
                              {mark?.remarks || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-6">Select a paper to audit marks</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Grading Rule */}
      {showCreateRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Configure Grading Tier</h3>
              </div>
              <button
                onClick={() => setShowCreateRuleModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGradingRule} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade Letter *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A+"
                    value={ruleForm.grade}
                    onChange={(e) => setRuleForm({ ...ruleForm, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade Point</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={ruleForm.gradePoint}
                    onChange={(e) => setRuleForm({ ...ruleForm, gradePoint: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Percentage *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={ruleForm.minPercentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, minPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Percentage *</label>
                  <input
                    type="number"
                    required
                    min={ruleForm.minPercentage}
                    max={100}
                    value={ruleForm.maxPercentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evaluation Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outstanding Performance"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPassing"
                  checked={ruleForm.isPassing}
                  onChange={(e) => setRuleForm({ ...ruleForm, isPassing: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPassing" className="font-semibold text-slate-700 cursor-pointer">
                  Consider scores in this tier as PASSED
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateRuleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save Rule Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
