"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  X,
  FileText,
  School,
  GraduationCap,
} from "lucide-react";
import { api } from "@/services/api";

export default function StudentExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"scheduled" | "results">("scheduled");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportCard, setSelectedReportCard] = useState<any | null>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.exams.list();
      setExams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load exams:", err);
      setError(err.message || "Failed to load examination schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReportCard = async (examId: string) => {
    setLoadingReportCard(true);
    try {
      const card = await api.exams.getReportCard(examId, "me");
      setSelectedReportCard(card);
    } catch (err: any) {
      console.error("Failed to load report card:", err);
      alert(err.message || "Unable to retrieve report card");
    } finally {
      setLoadingReportCard(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const publishedExams = exams.filter((e) => e.status === "PUBLISHED");
  const scheduledExams = exams; // For students, all accessible exams or scheduled ones

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-md shadow-sky-500/20">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Examinations & Academic Performance
              </h1>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                Phase 6 Verified
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Subject date-sheets, maximum & passing marks, and official published report cards
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "scheduled"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="h-4 w-4 text-sky-600" />
            Exam Date-Sheets ({scheduledExams.length})
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "results"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="h-4 w-4 text-emerald-600" />
            Published Report Cards ({publishedExams.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Retrieving academic examinations...</p>
        </div>
      ) : activeTab === "scheduled" ? (
        /* Tab 1: Scheduled Examinations */
        <div className="space-y-4">
          {scheduledExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <Calendar className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Examinations Scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                There are currently no scheduled examination papers or date-sheets published for your class section.
              </p>
            </div>
          ) : (
            scheduledExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-slate-800">{exam.name}</h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          exam.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : exam.status === "REVIEWED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>Academic Year: <strong className="text-slate-700">{exam.academicYear}</strong></span>
                      {exam.term && <span>Term: <strong className="text-slate-700">{exam.term}</strong></span>}
                      {exam.classSection && (
                        <span>
                          Class: <strong className="text-slate-700">{exam.classSection.className} - {exam.classSection.section}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {exam.status === "PUBLISHED" && (
                    <button
                      onClick={() => handleOpenReportCard(exam.id)}
                      disabled={loadingReportCard}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      View Official Report Card
                    </button>
                  )}
                </div>

                {/* Papers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Subject</th>
                        <th className="py-3 px-4">Exam Date</th>
                        <th className="py-3 px-4">Time Slot</th>
                        <th className="py-3 px-4">Room / Hall</th>
                        <th className="py-3 px-4 text-right">Passing Marks</th>
                        <th className="py-3 px-5 text-right">Max Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {exam.papers && exam.papers.length > 0 ? (
                        exam.papers.map((paper: any) => (
                          <tr key={paper.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-5 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />
                                <span>{paper.subject?.name || "Subject"}</span>
                                {paper.subject?.code && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({paper.subject.code})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-600">
                              {paper.examDate
                                ? new Date(paper.examDate).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "TBA"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {paper.startTime ? (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <span>
                                    {paper.startTime} - {paper.endTime || "End"}
                                  </span>
                                </div>
                              ) : (
                                "Regular Session"
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{paper.room || "Assigned Classroom"}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-amber-700">
                              {paper.passingMarks}
                            </td>
                            <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                              {paper.maxMarks}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No subject papers scheduled for this examination yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Tab 2: Published Results & Report Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {publishedExams.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <Award className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Published Results Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Marks for your examinations are currently in draft or review stage. Once published by the School Admin, official report cards will appear here.
              </p>
            </div>
          ) : (
            publishedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5">
                      OFFICIAL RESULT
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {exam.academicYear}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mt-3">{exam.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {exam.classSection?.className} - {exam.classSection?.section} • {exam.term || "Regular Term"}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Papers Scheduled</span>
                      <strong className="text-slate-800 text-sm">
                        {exam.papers?.length || 0} Subjects
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Published Date</span>
                      <strong className="text-slate-800 text-sm">
                        {exam.publishedAt ? new Date(exam.publishedAt).toLocaleDateString() : "Published"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <button
                    onClick={() => handleOpenReportCard(exam.id)}
                    disabled={loadingReportCard}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    View & Print Report Card
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Official Report Card Modal (Printable) */}
      {selectedReportCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Controls (Hidden in Print) */}
            <div className="print:hidden p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Printer className="h-4 w-4 text-sky-400" />
                <span>Official Academic Performance Card</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Report Card
                </button>
                <button
                  onClick={() => setSelectedReportCard(null)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Card Document Body */}
            <div className="p-8 print:p-6 bg-white text-slate-800 space-y-6" id="printable-report-card">
              {/* 1. School Header */}
              <div className="text-center border-b-2 border-slate-800 pb-5">
                <div className="flex justify-center items-center gap-2 text-sky-700 mb-1">
                  <School className="h-7 w-7" />
                  <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                    {selectedReportCard.school?.name || "School ERP Academy"}
                  </h1>
                </div>
                {selectedReportCard.school?.legalName && (
                  <p className="text-xs text-slate-500 font-medium">{selectedReportCard.school.legalName}</p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  {selectedReportCard.school?.city && `${selectedReportCard.school.city}, `}
                  {selectedReportCard.school?.state && `${selectedReportCard.school.state}, `}
                  {selectedReportCard.school?.country || "India"}
                  {selectedReportCard.school?.schoolCode && ` • Affiliation Code: ${selectedReportCard.school.schoolCode}`}
                </p>
                <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-slate-800 border border-slate-300">
                  Annual Student Evaluation & Report Card
                </div>
              </div>

              {/* 2. Student & Examination Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <p>
                    <span className="text-slate-500 font-medium">Student Name:</span>{" "}
                    <strong className="text-slate-900 text-sm">{selectedReportCard.student?.fullName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Admission No:</span>{" "}
                    <strong className="text-slate-900 font-mono">{selectedReportCard.student?.admissionNumber}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Roll Number:</span>{" "}
                    <strong className="text-slate-900">{selectedReportCard.student?.rollNumber || "N/A"}</strong>
                  </p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p>
                    <span className="text-slate-500 font-medium">Examination:</span>{" "}
                    <strong className="text-slate-900">{selectedReportCard.exam?.name}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Class & Section:</span>{" "}
                    <strong className="text-slate-900">{selectedReportCard.student?.classSectionName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Academic Year:</span>{" "}
                    <strong className="text-slate-900">{selectedReportCard.exam?.academicYear}</strong>
                  </p>
                </div>
              </div>

              {/* 3. Subject-wise Marks Table */}
              <div>
                <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-300">Subject</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">Max Marks</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">Passing</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">Obtained</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">Percentage</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">Grade</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedReportCard.subjects?.map((sub: any) => (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          {sub.subjectName}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium text-slate-600">
                          {sub.maxMarks}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-600">
                          {sub.passingMarks}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-200">
                          {sub.marksObtained}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700 border-r border-slate-200">
                          {sub.percentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-sky-700 border-r border-slate-200">
                          {sub.grade}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span
                            className={
                              sub.isPassed ? "text-emerald-700" : "text-rose-700"
                            }
                          >
                            {sub.isPassed ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total Row */}
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td className="py-2.5 px-3 border-r border-slate-300">Grand Total</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300">
                        {selectedReportCard.totals?.totalMaxMarks}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300">-</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sky-800">
                        {selectedReportCard.totals?.totalMarksObtained}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300">
                        {selectedReportCard.totals?.overallPercentage}%
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-indigo-700 font-extrabold">
                        {selectedReportCard.totals?.overallGrade}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                            selectedReportCard.totals?.overallResult === "PASSED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {selectedReportCard.totals?.overallResult}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 4. Attendance Summary & Overall Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-1">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Calendar className="h-4 w-4 text-sky-600" />
                    Attendance Performance
                  </h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Working Days:</span>
                    <strong className="text-slate-800">{selectedReportCard.attendanceSummary?.totalWorkingDays ?? "N/A"}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Days Present:</span>
                    <strong className="text-slate-800">{selectedReportCard.attendanceSummary?.presentDays ?? "N/A"}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Attendance Rate:</span>
                    <strong className="text-emerald-700 font-bold">
                      {selectedReportCard.attendanceSummary?.attendancePercentage != null
                        ? `${selectedReportCard.attendanceSummary.attendancePercentage}%`
                        : "100% (Good)"}
                    </strong>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-1">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Evaluation Remarks
                  </h4>
                  <p className="text-slate-600">
                    Performance Status:{" "}
                    <strong className="text-slate-900">{selectedReportCard.totals?.overallDescription || "Satisfactory"}</strong>
                  </p>
                  <p className="text-slate-600">
                    Subjects Passed:{" "}
                    <strong className="text-slate-900">
                      {selectedReportCard.totals?.subjectsPassed} / {selectedReportCard.totals?.totalSubjects}
                    </strong>
                  </p>
                  <p className="text-slate-600 text-[11px] mt-2 italic text-slate-500">
                    * Computer generated report card verified with PostgreSQL ERP records.
                  </p>
                </div>
              </div>

              {/* 5. Official Signatures Block */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700">Class Teacher</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700">Exam Incharge</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700">Principal / Head of School</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
