"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  School,
  X,
  BookOpen,
} from "lucide-react";
import { api } from "@/services/api";

export default function ParentReportCardPage() {
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [selectedExamCard, setSelectedExamCard] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportCards();
  }, []);

  const fetchReportCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.exams.getParentChildrenReportCards();
      const list = Array.isArray(data) ? data : [];
      setChildrenData(list);
      if (list.length > 0 && list[0].reportCards?.length > 0) {
        setSelectedExamCard(list[0].reportCards[0]);
      }
    } catch (err: any) {
      console.error("Failed to load children report cards:", err);
      setError(err.message || "Failed to retrieve student academic reports");
    } finally {
      setIsLoading(false);
    }
  };

  const currentChild = childrenData[selectedChildIndex] || null;
  const childReportCards = currentChild?.reportCards || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-600 text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-md shadow-indigo-500/20">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Children Academic Evaluations & Report Cards
              </h1>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Multi-Child Authorized
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Verified term examination scores, grades, teacher assessments, and printable performance cards
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={!selectedExamCard}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Printer className="h-4 w-4 text-sky-400" />
          Print Active Report Card
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Child Switcher Tabs (Rule 8: Linked-Child Authorization) */}
      {!isLoading && childrenData.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 px-3 flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Select Ward:
          </span>
          {childrenData.map((childObj, idx) => (
            <button
              key={childObj.student.id}
              onClick={() => {
                setSelectedChildIndex(idx);
                if (childObj.reportCards?.length > 0) {
                  setSelectedExamCard(childObj.reportCards[0]);
                } else {
                  setSelectedExamCard(null);
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedChildIndex === idx
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span>{childObj.student.fullName}</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                {childObj.student.classSectionName || childObj.student.gradeLevel}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Retrieving student report cards...</p>
        </div>
      ) : childrenData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <Users className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Linked Children Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Your parent profile currently does not have any active student admissions linked in this school.
          </p>
        </div>
      ) : childReportCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <Award className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            No Published Results for {currentChild?.student.fullName}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Examination marks for this student are either still being evaluated by teachers or pending review/publication by the School Administrator.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Examination Selector Tabs for current child */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {childReportCards.map((rc: any) => (
              <button
                key={rc.exam.id}
                onClick={() => setSelectedExamCard(rc)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedExamCard?.exam.id === rc.exam.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>{rc.exam.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    selectedExamCard?.exam.id === rc.exam.id
                      ? "bg-indigo-700 text-indigo-100"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {rc.totals?.overallGrade} • {rc.totals?.overallPercentage}%
                </span>
              </button>
            ))}
          </div>

          {/* Active Report Card View */}
          {selectedExamCard && (
            <div className="space-y-6">
              {/* Performance Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">Total Marks</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {selectedExamCard.totals?.totalMarksObtained}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {selectedExamCard.totals?.totalMaxMarks}
                    </span>
                  </div>
                  <span className="text-[11px] text-sky-600 mt-2 block font-medium">
                    Cumulative aggregate
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">Overall Percentage</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {selectedExamCard.totals?.overallPercentage}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-2 block font-medium">
                    Across {selectedExamCard.totals?.totalSubjects} subjects
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">Grade & Evaluation</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-indigo-600">
                      {selectedExamCard.totals?.overallGrade}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      ({selectedExamCard.totals?.overallDescription})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-2 block font-medium">
                    Result: <strong className={selectedExamCard.totals?.overallResult === "PASSED" ? "text-emerald-700" : "text-rose-700"}>{selectedExamCard.totals?.overallResult}</strong>
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">Attendance Rate</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-emerald-700">
                      {selectedExamCard.attendanceSummary?.attendancePercentage != null
                        ? `${selectedExamCard.attendanceSummary.attendancePercentage}%`
                        : "100%"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-2 block font-medium">
                    {selectedExamCard.attendanceSummary?.presentDays ?? 0} days present of {selectedExamCard.attendanceSummary?.totalWorkingDays ?? 0}
                  </span>
                </div>
              </div>

              {/* Printable Report Card Container */}
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 print:p-4 text-slate-800 space-y-6"
                id="parent-printable-card"
              >
                {/* 1. School Header */}
                <div className="text-center border-b-2 border-slate-800 pb-5">
                  <div className="flex justify-center items-center gap-2 text-indigo-700 mb-1">
                    <School className="h-7 w-7" />
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                      {selectedExamCard.school?.name || "School ERP"}
                    </h2>
                  </div>
                  {selectedExamCard.school?.legalName && (
                    <p className="text-xs text-slate-500 font-medium">{selectedExamCard.school.legalName}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedExamCard.school?.city && `${selectedExamCard.school.city}, `}
                    {selectedExamCard.school?.state && `${selectedExamCard.school.state}, `}
                    {selectedExamCard.school?.country || "India"}
                    {selectedExamCard.school?.schoolCode && ` • Affiliation Code: ${selectedExamCard.school.schoolCode}`}
                  </p>
                  <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-slate-800 border border-slate-300">
                    Official Student Progress Report
                  </div>
                </div>

                {/* 2. Ward Details */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1.5">
                    <p>
                      <span className="text-slate-500 font-medium">Student Name:</span>{" "}
                      <strong className="text-slate-900 text-sm">{selectedExamCard.student?.fullName}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Admission Number:</span>{" "}
                      <strong className="text-slate-900 font-mono">{selectedExamCard.student?.admissionNumber}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Roll Number:</span>{" "}
                      <strong className="text-slate-900">{selectedExamCard.student?.rollNumber || "N/A"}</strong>
                    </p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p>
                      <span className="text-slate-500 font-medium">Examination:</span>{" "}
                      <strong className="text-slate-900">{selectedExamCard.exam?.name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Class / Section:</span>{" "}
                      <strong className="text-slate-900">{selectedExamCard.student?.classSectionName}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Academic Year:</span>{" "}
                      <strong className="text-slate-900">{selectedExamCard.exam?.academicYear}</strong>
                    </p>
                  </div>
                </div>

                {/* 3. Subject-wise Marks Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-300">Subject</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Max Marks</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Passing</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Marks Obtained</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Percentage</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Grade</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedExamCard.subjects?.map((sub: any) => (
                        <tr key={sub.subjectId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                            {sub.subjectName}
                            {sub.remarks && (
                              <span className="block text-[10px] text-slate-500 font-normal italic">
                                &quot;{sub.remarks}&quot;
                              </span>
                            )}
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
                          <td className="py-2.5 px-3 text-center font-extrabold text-indigo-700 border-r border-slate-200">
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
                    {/* Grand Total */}
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <tr>
                        <td className="py-2.5 px-3 border-r border-slate-300">Grand Total</td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300">
                          {selectedExamCard.totals?.totalMaxMarks}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300">-</td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300 text-indigo-700">
                          {selectedExamCard.totals?.totalMarksObtained}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300">
                          {selectedExamCard.totals?.overallPercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300 text-indigo-800 font-black">
                          {selectedExamCard.totals?.overallGrade}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                              selectedExamCard.totals?.overallResult === "PASSED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {selectedExamCard.totals?.overallResult}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. Attendance Summary & Remarks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-1">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      Attendance Performance
                    </h4>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Working Days:</span>
                      <strong className="text-slate-800">
                        {selectedExamCard.attendanceSummary?.totalWorkingDays ?? "N/A"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Days Present:</span>
                      <strong className="text-slate-800">
                        {selectedExamCard.attendanceSummary?.presentDays ?? "N/A"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Attendance Rate:</span>
                      <strong className="text-emerald-700 font-bold">
                        {selectedExamCard.attendanceSummary?.attendancePercentage != null
                          ? `${selectedExamCard.attendanceSummary.attendancePercentage}%`
                          : "100% (Good)"}
                      </strong>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-1">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-4 w-4 text-sky-600" />
                      Evaluation Summary
                    </h4>
                    <p className="text-slate-600">
                      Overall Remarks:{" "}
                      <strong className="text-slate-900">{selectedExamCard.totals?.overallDescription || "Satisfactory"}</strong>
                    </p>
                    <p className="text-slate-600">
                      Subjects Cleared:{" "}
                      <strong className="text-slate-900">
                        {selectedExamCard.totals?.subjectsPassed} / {selectedExamCard.totals?.totalSubjects}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      * This is an authorized digital report card certified by the school examination authority.
                    </p>
                  </div>
                </div>

                {/* 5. Signatures */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">Class Teacher</span>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">Exam Controller</span>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">Principal Stamp</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
