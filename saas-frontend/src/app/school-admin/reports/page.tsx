"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  BookOpen,
  Repeat,
  AlertCircle,
  CalendarCheck,
  CreditCard,
  Award,
  Search,
  Filter,
  Download,
  RotateCw,
  Printer,
  ChevronRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "inventory" | "issued" | "overdue" | "attendance" | "fees" | "exams"
  >("inventory");

  const [loading, setLoading] = useState(false);

  // 1. Library Inventory Report State
  const [inventoryCategory, setInventoryCategory] = useState("");
  const [inventoryData, setInventoryData] = useState<{
    totalTitles: number;
    totalCopies: number;
    availableCopies: number;
    issuedCopies: number;
    lostCopies: number;
    books: any[];
  } | null>(null);

  // 2. Library Issued Report State
  const [issuedStatus, setIssuedStatus] = useState("all");
  const [issuedData, setIssuedData] = useState<{
    totalCount: number;
    issues: any[];
  } | null>(null);

  // 3. Library Overdue Report State
  const [overdueData, setOverdueData] = useState<{
    overdueCount: number;
    totalAccruedFine: number;
    issues: any[];
  } | null>(null);

  // 4. Attendance Summary Report State
  const [attGrade, setAttGrade] = useState("");
  const [attSection, setAttSection] = useState("");
  const [attStartDate, setAttStartDate] = useState("");
  const [attEndDate, setAttEndDate] = useState("");
  const [attendanceData, setAttendanceData] = useState<{
    gradeLevel: string;
    section?: string;
    totalStudents: number;
    averageAttendancePercentage: number;
    students: any[];
  } | null>(null);

  // 5. Fees Summary Report State
  const [feeGrade, setFeeGrade] = useState("");
  const [feeData, setFeeData] = useState<{
    gradeLevel: string;
    totalStudents: number;
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
    plans: any[];
  } | null>(null);

  // 6. Exam Results Report State
  const [examYear, setExamYear] = useState("");
  const [examTerm, setExamTerm] = useState("");
  const [examGrade, setExamGrade] = useState("");
  const [examData, setExamData] = useState<{
    summary: {
      totalStudentsWithResults: number;
      overallAveragePercentage: number;
      gradeDistribution: Record<string, number>;
      passCount: number;
      failCount: number;
    };
    results: any[];
  } | null>(null);

  // Load Inventory Report
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.reports.getLibraryInventory(inventoryCategory || undefined);
      setInventoryData(res);
    } catch (err: any) {
      console.error("Failed to load inventory report", err);
    } finally {
      setLoading(false);
    }
  }, [inventoryCategory]);

  // Load Issued Report
  const loadIssued = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.reports.getLibraryIssued(issuedStatus);
      setIssuedData(res);
    } catch (err: any) {
      console.error("Failed to load issued report", err);
    } finally {
      setLoading(false);
    }
  }, [issuedStatus]);

  // Load Overdue Report
  const loadOverdue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.reports.getLibraryOverdue();
      setOverdueData(res);
    } catch (err: any) {
      console.error("Failed to load overdue report", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Attendance Report
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.reports.getAttendanceSummary({
        gradeLevel: attGrade || undefined,
        section: attSection || undefined,
        startDate: attStartDate || undefined,
        endDate: attEndDate || undefined,
      });
      setAttendanceData(res);
    } catch (err: any) {
      console.error("Failed to load attendance report", err);
    } finally {
      setLoading(false);
    }
  }, [attGrade, attSection, attStartDate, attEndDate]);

  // Load Fees Report
  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.reports.getFeesSummary(feeGrade || undefined);
      setFeeData(res);
    } catch (err: any) {
      console.error("Failed to load fees report", err);
    } finally {
      setLoading(false);
    }
  }, [feeGrade]);

  // Load Exams Report
  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.reports.getExamResults({
        academicYear: examYear || undefined,
        term: examTerm || undefined,
        gradeLevel: examGrade || undefined,
      });
      setExamData(res);
    } catch (err: any) {
      console.error("Failed to load exams report", err);
    } finally {
      setLoading(false);
    }
  }, [examYear, examTerm, examGrade]);

  useEffect(() => {
    if (activeTab === "inventory") loadInventory();
    else if (activeTab === "issued") loadIssued();
    else if (activeTab === "overdue") loadOverdue();
    else if (activeTab === "attendance") loadAttendance();
    else if (activeTab === "fees") loadFees();
    else if (activeTab === "exams") loadExams();
  }, [
    activeTab,
    loadInventory,
    loadIssued,
    loadOverdue,
    loadAttendance,
    loadFees,
    loadExams,
  ]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>Executive Reporting & Institutional Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Comprehensive School Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Audited reports for book inventory, circulation, overdue fines, student attendance, fee collections, and published examination scores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* 6 Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto bg-white p-1 rounded-2xl border shadow-xs">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "inventory"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          1. Book Inventory
        </button>

        <button
          onClick={() => setActiveTab("issued")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "issued"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Repeat className="h-4 w-4" />
          2. Issued Books Log
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "overdue"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          3. Overdue & Fines
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          4. Student Attendance
        </button>

        <button
          onClick={() => setActiveTab("fees")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "fees"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          5. Fee Dues & Collections
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "exams"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Award className="h-4 w-4" />
          6. Published Exam Results
        </button>
      </div>

      {/* TAB 1: BOOK INVENTORY REPORT */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {inventoryData && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Titles</span>
                <div className="text-xl font-black text-slate-900">{inventoryData.totalTitles}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Copies</span>
                <div className="text-xl font-black text-slate-900">{inventoryData.totalCopies}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Available</span>
                <div className="text-xl font-black text-emerald-600">{inventoryData.availableCopies}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Issued</span>
                <div className="text-xl font-black text-blue-600">{inventoryData.issuedCopies}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Lost / Damaged</span>
                <div className="text-xl font-black text-rose-600">{inventoryData.lostCopies}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Category:</span>
              <select
                value={inventoryCategory}
                onChange={(e) => setInventoryCategory(e.target.value)}
                className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-700"
              >
                <option value="">All Categories</option>
                <option value="General">General</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Literature">Literature</option>
                <option value="History">History</option>
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={loadInventory}
              className="text-xs h-8 text-slate-600 border-slate-200"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title & ISBN</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Rack / Shelf</th>
                    <th className="py-3 px-4 text-center">Total Copies</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-center">Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Generating inventory report...
                      </td>
                    </tr>
                  ) : !inventoryData || inventoryData.books.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No book volumes found.
                      </td>
                    </tr>
                  ) : (
                    inventoryData.books.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {b.title}
                          <span className="block text-[11px] text-slate-500 font-normal">
                            ISBN: {b.isbn || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{b.author}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border">
                            {b.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{b.locationRack || "General"}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">{b.totalCopies}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{b.availableCopies}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-600">{b.issuedCopies}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ISSUED BOOKS REPORT */}
      {activeTab === "issued" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Loan Status:</span>
              <select
                value={issuedStatus}
                onChange={(e) => setIssuedStatus(e.target.value)}
                className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-700"
              >
                <option value="all">All Loans</option>
                <option value="ISSUED">Active Issues Only</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="RETURNED">Returned History</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-700">
              Total Records: {issuedData?.totalCount || 0}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Barcode</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Generating circulation log report...
                      </td>
                    </tr>
                  ) : !issuedData || issuedData.issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No issued books match criteria.
                      </td>
                    </tr>
                  ) : (
                    issuedData.issues.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{i.book?.title}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{i.bookCopy?.barcode}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {i.borrowerType === "STUDENT" ? i.student?.fullName : i.staffUser?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {i.borrowerType === "STUDENT" ? `Adm: ${i.student?.admissionNumber}` : i.staffUser?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{new Date(i.issueDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-slate-600">{new Date(i.dueDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              i.status === "RETURNED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : i.status === "OVERDUE"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {i.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {Number(i.fineAmount) > 0 ? (
                            <span className="font-bold text-rose-600">₹{i.fineAmount}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OVERDUE & FINES REPORT */}
      {activeTab === "overdue" && (
        <div className="space-y-4">
          {overdueData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Overdue Returns</span>
                <div className="text-2xl font-black text-rose-600">{overdueData.overdueCount}</div>
                <p className="text-xs text-slate-500 mt-1">Books exceeding assigned loan period</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Accrued Fines</span>
                <div className="text-2xl font-black text-slate-900">₹{overdueData.totalAccruedFine}</div>
                <p className="text-xs text-slate-500 mt-1">Accumulated across active overdue loans</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Barcode</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Days Overdue</th>
                    <th className="py-3 px-4 text-right">Accrued Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Generating overdue report...
                      </td>
                    </tr>
                  ) : !overdueData || overdueData.issues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Zero overdue books! All loans are on schedule.
                      </td>
                    </tr>
                  ) : (
                    overdueData.issues.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{i.book?.title}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{i.bookCopy?.barcode}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {i.borrowerType === "STUDENT" ? i.student?.fullName : i.staffUser?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {i.borrowerType === "STUDENT" ? `Adm: ${i.student?.admissionNumber}` : i.staffUser?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">
                          {new Date(i.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {i.daysOverdue} days
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                          ₹{i.calculatedFine}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT ATTENDANCE REPORT */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Grade (e.g. Grade 10)"
                value={attGrade}
                onChange={(e) => setAttGrade(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <Input
                placeholder="Section (e.g. A)"
                value={attSection}
                onChange={(e) => setAttSection(e.target.value)}
                className="h-8 text-xs w-28"
              />
              <Input
                type="date"
                value={attStartDate}
                onChange={(e) => setAttStartDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <Input
                type="date"
                value={attEndDate}
                onChange={(e) => setAttEndDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>

            <Button
              size="sm"
              onClick={loadAttendance}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
            >
              Apply Filter
            </Button>
          </div>

          {attendanceData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Enrolled Students</span>
                <div className="text-2xl font-black text-slate-900">{attendanceData.totalStudents}</div>
                <p className="text-xs text-slate-500 mt-1">Class: {attendanceData.gradeLevel} {attendanceData.section || ""}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Average Attendance Rate</span>
                <div className="text-2xl font-black text-emerald-600">
                  {attendanceData.averageAttendancePercentage}%
                </div>
                <p className="text-xs text-slate-500 mt-1">Period aggregate roll-call compliance</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Grade & Section</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-center">Late</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Calculating attendance summary...
                      </td>
                    </tr>
                  ) : !attendanceData || attendanceData.students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No attendance records found for criteria.
                      </td>
                    </tr>
                  ) : (
                    attendanceData.students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{s.fullName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.admissionNumber}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.gradeLevel} {s.section || ""}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{s.presentDays}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-rose-600">{s.absentDays}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-600">{s.lateDays}</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {s.percentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FEES SUMMARY REPORT */}
      {activeTab === "fees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Grade:</span>
              <Input
                placeholder="e.g. Grade 10"
                value={feeGrade}
                onChange={(e) => setFeeGrade(e.target.value)}
                className="h-8 text-xs w-40"
              />
            </div>

            <Button
              size="sm"
              onClick={loadFees}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
            >
              Generate Fee Report
            </Button>
          </div>

          {feeData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Billed</span>
                <div className="text-xl font-black text-slate-900">₹{feeData.totalBilled}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Collected</span>
                <div className="text-xl font-black text-emerald-600">₹{feeData.totalPaid}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Outstanding Dues</span>
                <div className="text-xl font-black text-rose-600">₹{feeData.totalOutstanding}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Collection Rate</span>
                <div className="text-xl font-black text-blue-600">{feeData.collectionRate}%</div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Fee Plan</th>
                    <th className="py-3 px-4 text-right">Net Billed</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Aggregating fee dues...
                      </td>
                    </tr>
                  ) : !feeData || feeData.plans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No assigned fee plans found.
                      </td>
                    </tr>
                  ) : (
                    feeData.plans.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.student?.fullName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{p.student?.admissionNumber}</td>
                        <td className="py-3.5 px-4 text-slate-600">{p.student?.gradeLevel}</td>
                        <td className="py-3.5 px-4 text-slate-800">{p.feePlan?.name}</td>
                        <td className="py-3.5 px-4 text-right font-semibold">₹{p.netAmount}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">₹{p.paidAmount}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">₹{p.balanceAmount}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : p.status === "PARTIAL"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PUBLISHED EXAM RESULTS REPORT */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Academic Year (e.g. 2026-2027)"
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                className="h-8 text-xs w-48"
              />
              <Input
                placeholder="Term (e.g. Term 1)"
                value={examTerm}
                onChange={(e) => setExamTerm(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <Input
                placeholder="Grade Level (e.g. Grade 10)"
                value={examGrade}
                onChange={(e) => setExamGrade(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>

            <Button
              size="sm"
              onClick={loadExams}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
            >
              Filter Results
            </Button>
          </div>

          {examData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Graded Students</span>
                <div className="text-xl font-black text-slate-900">
                  {examData.summary.totalStudentsWithResults}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Overall Average</span>
                <div className="text-xl font-black text-indigo-600">
                  {examData.summary.overallAveragePercentage}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Passing Students</span>
                <div className="text-xl font-black text-emerald-600">
                  {examData.summary.passCount}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Failing Students</span>
                <div className="text-xl font-black text-rose-600">
                  {examData.summary.failCount}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Grade Level</th>
                    <th className="py-3 px-4 text-center">Subjects Evaluated</th>
                    <th className="py-3 px-4 text-right">Marks (Total / Max)</th>
                    <th className="py-3 px-4 text-right">Percentage</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Gathering published results...
                      </td>
                    </tr>
                  ) : !examData || examData.results.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No published exam results match criteria.
                      </td>
                    </tr>
                  ) : (
                    examData.results.map((r) => (
                      <tr key={r.studentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{r.studentName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{r.admissionNumber}</td>
                        <td className="py-3.5 px-4 text-slate-600">{r.gradeLevel}</td>
                        <td className="py-3.5 px-4 text-center text-slate-700">{r.subjectMarks.length}</td>
                        <td className="py-3.5 px-4 text-right font-semibold">
                          {r.totalMarksObtained} / {r.maxMarksPossible}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {r.percentage}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                            {r.overallGrade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              r.isPassed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {r.isPassed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
