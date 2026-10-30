"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  Search,
  Send,
  Users,
  Printer,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { api } from "@/services/api";

interface StudentScoreItem {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  rollNumber?: string;
  marksObtained: number | string;
  remarks: string;
  grade?: string;
  percentage?: number;
  isPassed?: boolean;
}

export default function TeacherGradebookPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedPaperId, setSelectedPaperId] = useState<string>("");
  const [examDetail, setExamDetail] = useState<any | null>(null);
  const [scores, setScores] = useState<StudentScoreItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load teacher exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await api.exams.list();
        if (Array.isArray(data) && data.length > 0) {
          setExams(data);
          setSelectedExamId(data[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load exams:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  // When selected exam changes, load exam details and marks sheet
  useEffect(() => {
    if (!selectedExamId) return;

    const loadExamDetails = async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const detail = await api.exams.getById(selectedExamId);
        setExamDetail(detail);

        if (detail.papers && detail.papers.length > 0) {
          const firstPaperId = detail.papers[0].id;
          setSelectedPaperId(firstPaperId);
          await loadMarksSheet(selectedExamId, firstPaperId, detail);
        } else {
          setScores([]);
        }
      } catch (err: any) {
        console.error("Failed to load exam details:", err);
        setMessage({
          type: "error",
          text: err.message || "Failed to load examination details",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExamDetails();
  }, [selectedExamId]);

  const loadMarksSheet = async (
    examId: string,
    paperId: string,
    detailOverride?: any
  ) => {
    try {
      const detail = detailOverride || examDetail;
      const sheet = await api.exams.getMarksSheet(examId, paperId);

      const paper = detail?.papers?.find((p: any) => p.id === paperId);
      const maxMarks = paper?.maxMarks ?? 100;
      const passingMarks = paper?.passingMarks ?? 35;

      // Map class students with existing marks
      const studentMap = new Map(sheet.marks?.map((m: any) => [m.studentId, m]));

      const scoreItems: StudentScoreItem[] = (sheet.students || []).map(
        (s: any) => {
          const existing = studentMap.get(s.id);
          const val =
            existing && existing.marksObtained !== undefined
              ? existing.marksObtained
              : "";
          const numVal = Number(val);
          const percentage =
            val !== "" && !isNaN(numVal)
              ? Number(((numVal / maxMarks) * 100).toFixed(1))
              : undefined;

          return {
            studentId: s.id,
            fullName: s.fullName,
            admissionNumber: s.admissionNumber,
            rollNumber: s.rollNumber,
            marksObtained: val,
            remarks: existing?.remarks || "",
            grade: existing?.grade,
            percentage,
            isPassed:
              val !== "" && !isNaN(numVal) ? numVal >= passingMarks : undefined,
          };
        }
      );

      setScores(scoreItems);
    } catch (err: any) {
      console.error("Failed to load marks sheet:", err);
    }
  };

  const handlePaperChange = (paperId: string) => {
    setSelectedPaperId(paperId);
    if (selectedExamId) {
      loadMarksSheet(selectedExamId, paperId);
    }
  };

  const currentPaper = examDetail?.papers?.find(
    (p: any) => p.id === selectedPaperId
  );
  const maxMarks = currentPaper?.maxMarks ?? 100;
  const passingMarks = currentPaper?.passingMarks ?? 35;

  // Handle Score Input Change
  const handleScoreChange = (studentId: string, value: string) => {
    setScores((prev) =>
      prev.map((item) => {
        if (item.studentId !== studentId) return item;

        const numVal = Number(value);
        let percentage: number | undefined = undefined;
        let isPassed: boolean | undefined = undefined;

        if (value !== "" && !isNaN(numVal)) {
          percentage = Number(((numVal / maxMarks) * 100).toFixed(1));
          isPassed = numVal >= passingMarks;
        }

        return {
          ...item,
          marksObtained: value,
          percentage,
          isPassed,
        };
      })
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setScores((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, remarks } : item
      )
    );
  };

  // Save Marks to Database
  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedPaperId) return;

    // Validate entries
    const invalidEntry = scores.find((s) => {
      if (s.marksObtained === "") return false;
      const num = Number(s.marksObtained);
      return isNaN(num) || num < 0 || num > maxMarks;
    });

    if (invalidEntry) {
      setMessage({
        type: "error",
        text: `Invalid marks for ${invalidEntry.fullName}. Marks must be between 0 and ${maxMarks}.`,
      });
      return;
    }

    const marksToSubmit = scores
      .filter((s) => s.marksObtained !== "")
      .map((s) => ({
        studentId: s.studentId,
        marksObtained: Number(s.marksObtained),
        remarks: s.remarks,
      }));

    if (marksToSubmit.length === 0) {
      setMessage({
        type: "error",
        text: "Please enter marks for at least one student before saving.",
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await api.exams.enterMarks(selectedExamId, {
        examPaperId: selectedPaperId,
        marks: marksToSubmit,
      });

      setMessage({
        type: "success",
        text: `Successfully saved marks for ${marksToSubmit.length} students!`,
      });
      // Refresh sheet to update server-computed grades
      await loadMarksSheet(selectedExamId, selectedPaperId);
    } catch (err: any) {
      console.error("Failed to save marks:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to record student marks",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for Review
  const handleSubmitReview = async () => {
    if (!selectedExamId) return;
    try {
      await api.exams.updateStatus(selectedExamId, "REVIEWED");
      setMessage({
        type: "success",
        text: "Examination marks submitted for Administrator review!",
      });
      setExamDetail((prev: any) => ({ ...prev, status: "REVIEWED" }));
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to submit exam for review",
      });
    }
  };

  // Computed KPI Metrics
  const validScores = scores
    .map((s) => Number(s.marksObtained))
    .filter((n) => !isNaN(n) && n >= 0);
  const totalEntered = validScores.length;
  const classAvg =
    totalEntered > 0
      ? (validScores.reduce((a, b) => a + b, 0) / totalEntered).toFixed(1)
      : "0.0";
  const passCount = scores.filter((s) => s.isPassed === true).length;
  const passRate =
    totalEntered > 0 ? ((passCount / totalEntered) * 100).toFixed(0) : "0";

  const filteredScores = scores.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Gradebook & Assessment Entry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter, validate, and submit student marks for your assigned subjects
            and classes.
          </p>
        </div>

        {/* Global Save and Review Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Sheet
          </button>

          {examDetail?.status === "DRAFT" && (
            <button
              onClick={handleSubmitReview}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-amber-600" />
              Submit Review
            </button>
          )}

          <button
            onClick={handleSaveMarks}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Marks"}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Examination & Subject Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Exam Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Select Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.classSection?.className}-{ex.classSection?.section})
              </option>
            ))}
          </select>
        </div>

        {/* Paper / Subject Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Select Subject Paper
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => handlePaperChange(e.target.value)}
            disabled={!examDetail?.papers?.length}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 disabled:opacity-50"
          >
            {examDetail?.papers?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.subject?.name} (Max: {p.maxMarks}, Pass: {p.passingMarks})
              </option>
            ))}
          </select>
        </div>

        {/* Exam Status Pill */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Examination Status
          </label>
          <div className="flex items-center h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                examDetail?.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : examDetail?.status === "REVIEWED"
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {examDetail?.status || "DRAFT"}
            </span>
            <span className="text-xs text-slate-400 ml-2">
              {examDetail?.status === "PUBLISHED"
                ? "Official results published to students & parents"
                : examDetail?.status === "REVIEWED"
                ? "Under administrative review"
                : "Marks entry in progress by teachers"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              Students Evaluated
            </div>
            <div className="text-xl font-bold text-slate-900">
              {totalEntered} / {scores.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Class Average</div>
            <div className="text-xl font-bold text-slate-900">
              {classAvg} / {maxMarks}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Pass Rate</div>
            <div className="text-xl font-bold text-emerald-700">
              {passRate}% ({passCount} Pass)
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Passing Cutoff</div>
            <div className="text-xl font-bold text-slate-900">
              {passingMarks} / {maxMarks}
            </div>
          </div>
        </div>
      </div>

      {/* Marks Entry Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Search & Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or admission no..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{filteredScores.length}</strong> students enrolled in{" "}
            <strong>
              {examDetail?.classSection?.className}-
              {examDetail?.classSection?.section}
            </strong>
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4 w-36 text-center">
                  Obtained Marks
                  <span className="block text-[9px] text-slate-400 normal-case">
                    Max: {maxMarks} | Pass: {passingMarks}
                  </span>
                </th>
                <th className="py-3 px-4 w-24 text-center">Percentage</th>
                <th className="py-3 px-4 w-24 text-center">Grade</th>
                <th className="py-3 px-4 w-24 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {filteredScores.map((student, idx) => {
                const markNum = Number(student.marksObtained);
                const isInvalid =
                  student.marksObtained !== "" &&
                  (isNaN(markNum) || markNum < 0 || markNum > maxMarks);

                return (
                  <tr
                    key={student.studentId}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-xs text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.fullName}
                      {student.rollNumber && (
                        <span className="ml-2 text-xs text-slate-400 font-normal">
                          (Roll: {student.rollNumber})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {student.admissionNumber}
                    </td>

                    {/* Marks Input with Instant Validation */}
                    <td className="py-3 px-4 text-center">
                      <div className="relative inline-block w-28">
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          step="0.5"
                          value={student.marksObtained}
                          onChange={(e) =>
                            handleScoreChange(student.studentId, e.target.value)
                          }
                          className={`w-full text-center py-1.5 px-2 text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 ${
                            isInvalid
                              ? "border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-400"
                              : student.marksObtained !== ""
                              ? "border-indigo-300 bg-indigo-50/30 text-indigo-900 focus:ring-indigo-500"
                              : "border-slate-200 bg-white text-slate-800 focus:ring-indigo-500"
                          }`}
                          placeholder="—"
                        />
                      </div>
                      {isInvalid && (
                        <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                          0 to {maxMarks}
                        </div>
                      )}
                    </td>

                    {/* Percentage */}
                    <td className="py-3 px-4 text-center text-xs font-semibold text-slate-700">
                      {student.percentage !== undefined
                        ? `${student.percentage}%`
                        : "—"}
                    </td>

                    {/* Grade Pill */}
                    <td className="py-3 px-4 text-center">
                      {student.grade ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {student.grade}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Pass / Fail Badge */}
                    <td className="py-3 px-4 text-center">
                      {student.isPassed !== undefined ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            student.isPassed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {student.isPassed ? "PASS" : "FAIL"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Remarks Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={student.remarks}
                        onChange={(e) =>
                          handleRemarksChange(student.studentId, e.target.value)
                        }
                        placeholder="Add assessment remarks..."
                        className="w-full text-xs py-1 px-2 border border-slate-200 rounded-lg bg-slate-50/40 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })}

              {filteredScores.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
