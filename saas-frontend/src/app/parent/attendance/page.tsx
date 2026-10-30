"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ParentAttendancePage() {
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize current date on client mount
  useEffect(() => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  // Fetch Parent's linked children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await api.attendance.getParentChildren();
        if (Array.isArray(data) && data.length > 0) {
          setChildrenList(data);
        }
      } catch (err) {
        console.warn("Failed to load parent children attendance:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // Fetch monthly attendance for selected child
  const loadChildAttendance = async () => {
    const activeChild = childrenList[selectedChildIndex];
    if (!activeChild) return;
    setIsLoading(true);

    try {
      const data = await api.attendance.getStudentMonthly(
        activeChild.studentId,
        selectedMonth,
        selectedYear
      );
      setMonthlyData(data);
    } catch (err) {
      console.warn("Failed to fetch detailed monthly attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (childrenList.length > 0) {
      loadChildAttendance();
    }
  }, [childrenList, selectedChildIndex, selectedMonth, selectedYear]);

  const activeChild = childrenList[selectedChildIndex] || null;
  const summary = monthlyData?.summary;

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Child Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Student Attendance Record
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Official Register
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Monthly Presence & Leave Register
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track daily attendance presence, tardiness, and sanctioned leaves for your children.
          </p>
        </div>

        {/* Children Selector Pills */}
        {childrenList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Child:
            </span>
            {childrenList.map((c, idx) => (
              <button
                key={c.studentId}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedChildIndex === idx
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                {c.fullName}
                <span className="text-[10px] opacity-80">({c.gradeLevel})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Month Navigation & Stats Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold text-slate-900 min-w-36 text-center">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0 rounded-lg cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Active Student: <strong className="text-slate-800">{activeChild?.fullName}</strong> (
            {activeChild?.admissionNumber})
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Monthly Presence Rate
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            {summary?.attendancePercentage ?? 100}%
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold">
            {summary?.effectivePresent ?? 0} of {summary?.totalDaysRecorded ?? 0} Recorded Days
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Present Days
          </span>
          <div className="text-2xl font-bold text-slate-900">{summary?.presentDays ?? 0}</div>
          <p className="text-[10px] text-slate-500">Full day presence</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Absent Days
          </span>
          <div
            className={`text-2xl font-bold ${
              (summary?.absentDays ?? 0) > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {summary?.absentDays ?? 0}
          </div>
          <p className="text-[10px] text-slate-500">Unexcused absence</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tardy / Leaves
          </span>
          <div className="text-2xl font-bold text-amber-600">
            {(summary?.lateDays ?? 0) + (summary?.leaveDays ?? 0) + (summary?.halfDays ?? 0)}
          </div>
          <p className="text-[10px] text-amber-700 font-semibold">Late arrivals & leaves</p>
        </div>
      </div>

      {/* Daily Attendance Logs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Daily Attendance Breakdown ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {monthlyData?.attendances?.length ?? 0} Days Logged
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Loading monthly attendance register...</p>
          </div>
        ) : !monthlyData || monthlyData.attendances.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No attendance records logged for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day of Week</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Teacher Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.attendances.map((att: any) => {
                  const d = new Date(att.date);
                  const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {d.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{dayName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            att.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : att.status === "ABSENT"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : att.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : att.status === "HALF_DAY"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {att.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {att.remarks ? (
                          <span className="italic">{att.remarks}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* School Holidays Notice */}
      {monthlyData?.holidays && monthlyData.holidays.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-900">
              Institutional Holidays in {MONTH_NAMES[selectedMonth - 1]}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {monthlyData.holidays.map((h: any) => (
              <div
                key={h.id}
                className="p-3 bg-white rounded-xl border border-amber-200/60 shadow-xs space-y-1"
              >
                <span className="font-bold text-slate-900 block">{h.title}</span>
                <p className="text-[11px] text-slate-500">
                  {new Date(h.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  -{" "}
                  {new Date(h.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {h.description && (
                  <p className="text-[10px] text-slate-400">{h.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
