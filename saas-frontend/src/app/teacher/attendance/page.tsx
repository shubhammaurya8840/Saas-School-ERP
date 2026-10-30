"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Check,
  X,
  Clock,
  Sparkles,
  RefreshCw,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface StudentRosterItem {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  gender?: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "EXCUSED_LEAVE";
  remarks?: string;
  isAlreadyMarked: boolean;
}

export default function TeacherAttendancePage() {
  const [classSections, setClassSections] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isMarkedToday, setIsMarkedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Initialize date safely on client mount
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Fetch Class Sections
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const sections = await api.timetable.classSections.list();
        if (Array.isArray(sections) && sections.length > 0) {
          setClassSections(sections);
          setSelectedClassId(sections[0].id);
        }
      } catch (err: any) {
        console.error("Failed to fetch class sections:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch Roster whenever selectedClassId or selectedDate changes
  const loadRoster = async () => {
    if (!selectedClassId || !selectedDate) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const data = await api.attendance.getClassDaily(selectedClassId, selectedDate);
      if (data && Array.isArray(data.roster)) {
        setRoster(
          data.roster.map((r: any) => ({
            ...r,
            status: r.status || "PRESENT",
            remarks: r.remarks || "",
          }))
        );
        setIsMarkedToday(data.isMarkedToday);
      }
    } catch (err: any) {
      console.error("Failed to load attendance roster:", err);
      setMessage({ type: "error", text: err.message || "Failed to load class roll call." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      loadRoster();
    }
  }, [selectedClassId, selectedDate]);

  // Mark all present helper
  const handleMarkAllPresent = () => {
    setRoster((prev) =>
      prev.map((s) => ({
        ...s,
        status: "PRESENT",
      }))
    );
  };

  // Change single student status
  const handleStatusChange = (
    studentId: string,
    newStatus: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "EXCUSED_LEAVE"
  ) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Change single student remark
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  // Submit Roll Call
  const handleSubmitAttendance = async () => {
    if (!selectedClassId || roster.length === 0) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await api.attendance.markStudents({
        date: selectedDate,
        classSectionId: selectedClassId,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks,
        })),
      });

      setMessage({
        type: "success",
        text: `Roll call submitted successfully! ${res.presentCount} Present, ${res.absentCount} Absent.`,
      });
      setIsMarkedToday(true);
    } catch (err: any) {
      console.error("Failed to submit attendance:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to submit attendance roll call.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Derived statistics
  const totalStudents = roster.length;
  const presentCount = roster.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const leaveCount = roster.filter((r) => r.status === "EXCUSED_LEAVE" || r.status === "HALF_DAY").length;
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "100.0";

  const filteredRoster = roster.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectedClass = classSections.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Daily Attendance Register
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Bulk Roll Call
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Classroom Roll Call & Attendance
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mark daily presence for your assigned class section with safe upsert and remarks.
          </p>
        </div>

        {/* Action Controls: Class Select & Date Select */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Class Section
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {classSections.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.className} - {cs.section} ({cs.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Roll Call Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleMarkAllPresent}
              variant="outline"
              size="sm"
              className="text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50 h-9 rounded-xl cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Mark All Present
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Enrolled
          </span>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
          <p className="text-[10px] text-slate-500 font-medium">Class Roster</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Present Count
          </span>
          <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
          <p className="text-[10px] text-emerald-700 font-semibold">Attending Today</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Absent Count
          </span>
          <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
          <p className="text-[10px] text-rose-700 font-medium">Unexcused Absentees</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Daily Attendance Rate
          </span>
          <div className="text-2xl font-bold text-purple-700">{attendanceRate}%</div>
          <p className="text-[10px] text-purple-600 font-semibold">Class Presence</p>
        </div>
      </div>

      {/* Roster & Roll Call Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header / Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {selectedClass ? `${selectedClass.className} - ${selectedClass.section}` : "Class"}{" "}
              Student Roster ({filteredRoster.length})
            </h2>
            {isMarkedToday && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Submitted
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Loading student roll call...</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found enrolled in this class section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Admission No</th>
                  <th className="py-2.5 px-3">Attendance Status</th>
                  <th className="py-2.5 px-3">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/40">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {student.rollNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{student.fullName}</span>
                      {student.gender && (
                        <span className="text-[10px] text-slate-400">{student.gender}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      {student.admissionNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EXCUSED_LEAVE"] as const).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, st)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                student.status === st
                                  ? st === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : st === "ABSENT"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : st === "LATE"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : st === "HALF_DAY"
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "bg-blue-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {st === "EXCUSED_LEAVE" ? "LEAVE" : st.replace("_", " ")}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. sick leave)..."
                        value={student.remarks || ""}
                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                        className="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            {isMarkedToday
              ? "Attendance for this date is already on record. Re-submitting will update records safely."
              : "Review roster and click submit to record daily attendance."}
          </p>

          <Button
            onClick={handleSubmitAttendance}
            disabled={isSaving || roster.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 h-9 rounded-xl shadow-xs cursor-pointer"
          >
            {isSaving ? "Saving Roll Call..." : "Submit Daily Attendance"}
          </Button>
        </div>
      </div>
    </div>
  );
}
