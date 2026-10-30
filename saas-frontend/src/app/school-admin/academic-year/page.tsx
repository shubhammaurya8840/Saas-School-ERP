"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Building,
  BookOpen,
  Clock,
  Plus,
  Users,
  UserCheck,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sun,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export default function AcademicYearPage() {
  const [activeTab, setActiveTab] = useState<"sections" | "subjects" | "timetable" | "holidays">("sections");

  // Data states
  const [classSections, setClassSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Timetable builder state
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");
  const [classTimetable, setClassTimetable] = useState<any[]>([]);

  // Modals state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  // Form states
  const [sectionForm, setSectionForm] = useState({
    className: "Class 8",
    section: "A",
    room: "Room 101",
    academicYear: "2026-2027",
    classTeacherId: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    applicableGrade: "Class 8",
    description: "",
  });

  const [slotForm, setSlotForm] = useState({
    periodNumber: 1,
    startTime: "08:30",
    endTime: "09:15",
    subjectId: "",
    teacherId: "",
    room: "",
  });

  const [holidayForm, setHolidayForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    description: "",
    academicYear: "2026-2027",
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sections, subjs, hols, usersRes] = await Promise.allSettled([
        api.timetable.classSections.list(),
        api.timetable.subjects.list(),
        api.attendance.holidays.list(),
        api.users.list({ role: "TEACHER" }),
      ]);

      if (sections.status === "fulfilled" && Array.isArray(sections.value)) {
        setClassSections(sections.value);
        if (sections.value.length > 0 && !selectedClassId) {
          setSelectedClassId(sections.value[0].id);
        }
      }

      if (subjs.status === "fulfilled" && Array.isArray(subjs.value)) {
        setSubjects(subjs.value);
        if (subjs.value.length > 0 && !slotForm.subjectId) {
          setSlotForm((prev) => ({ ...prev, subjectId: subjs.value[0].id }));
        }
      }

      if (hols.status === "fulfilled" && Array.isArray(hols.value)) {
        setHolidays(hols.value);
      }

      if (usersRes.status === "fulfilled" && usersRes.value?.users) {
        setTeachers(usersRes.value.users);
      }
    } catch (err) {
      console.warn("Failed to load academic data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch class timetable when selectedClassId changes
  const loadClassTimetable = async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.timetable.getClassTimetable(selectedClassId);
      if (res?.slots) {
        setClassTimetable(res.slots);
      }
    } catch (err) {
      console.warn("Failed to load class timetable:", err);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadClassTimetable();
    }
  }, [selectedClassId]);

  // Handle Create Class Section
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.timetable.classSections.create({
        ...sectionForm,
        classTeacherId: sectionForm.classTeacherId || undefined,
      });
      setIsSectionModalOpen(false);
      setSectionForm({
        className: "Class 8",
        section: "A",
        room: "Room 101",
        academicYear: "2026-2027",
        classTeacherId: "",
      });
      loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create class section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.timetable.subjects.create(subjectForm);
      setIsSubjectModalOpen(false);
      setSubjectForm({
        name: "",
        code: "",
        applicableGrade: "Class 8",
        description: "",
      });
      loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Slot (With Conflict Detection Feedback)
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.timetable.slots.save({
        classSectionId: selectedClassId,
        dayOfWeek: selectedDay,
        periodNumber: Number(slotForm.periodNumber),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        subjectId: slotForm.subjectId,
        teacherId: slotForm.teacherId || undefined,
        room: slotForm.room || undefined,
      });
      setIsSlotModalOpen(false);
      loadClassTimetable();
    } catch (err: any) {
      // Conflict detection message e.g. Teacher Conflict or Room Double-booking
      setModalError(err.message || "Failed to schedule slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Holiday
  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.attendance.holidays.create(holidayForm);
      setIsHolidayModalOpen(false);
      setHolidayForm({
        title: "",
        startDate: "",
        endDate: "",
        description: "",
        academicYear: "2026-2027",
      });
      loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Infrastructure
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Phase 5 Architecture
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Sessions & Timetable Engine
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure class sections, master subject catalogs, conflict-free timetable grids, and holiday schedules.
          </p>
        </div>

        {/* Action Button based on Tab */}
        <div className="shrink-0">
          {activeTab === "sections" && (
            <Button
              onClick={() => {
                setModalError(null);
                setIsSectionModalOpen(true);
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Class Section
            </Button>
          )}

          {activeTab === "subjects" && (
            <Button
              onClick={() => {
                setModalError(null);
                setIsSubjectModalOpen(true);
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Subject
            </Button>
          )}

          {activeTab === "timetable" && (
            <Button
              onClick={() => {
                setModalError(null);
                setIsSlotModalOpen(true);
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Schedule Period Slot
            </Button>
          )}

          {activeTab === "holidays" && (
            <Button
              onClick={() => {
                setModalError(null);
                setIsHolidayModalOpen(true);
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("sections")}
          className={`pb-3 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === "sections"
              ? "border-b-2 border-purple-600 text-purple-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Class Sections ({classSections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`pb-3 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === "subjects"
              ? "border-b-2 border-purple-600 text-purple-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Subject Catalog ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`pb-3 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === "timetable"
              ? "border-b-2 border-purple-600 text-purple-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Weekly Timetable Scheduler</span>
        </button>

        <button
          onClick={() => setActiveTab("holidays")}
          className={`pb-3 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === "holidays"
              ? "border-b-2 border-purple-600 text-purple-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sun className="h-4 w-4" />
          <span>Institutional Holidays ({holidays.length})</span>
        </button>
      </div>

      {/* TAB 1: CLASS SECTIONS */}
      {activeTab === "sections" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Configured Class Sections & Class Teachers
            </h2>
            <span className="text-xs text-slate-400">Academic Year 2026-2027</span>
          </div>

          {classSections.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No class sections created yet. Click "New Class Section" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Class & Section</th>
                    <th className="py-2.5 px-3">Classroom / Room</th>
                    <th className="py-2.5 px-3">Assigned Class Teacher</th>
                    <th className="py-2.5 px-3">Academic Session</th>
                    <th className="py-2.5 px-3">Enrolled Students</th>
                    <th className="py-2.5 px-3 text-right">Scheduled Periods</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classSections.map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {cs.className} - {cs.section}
                      </td>
                      <td className="py-3 px-3 font-semibold text-purple-700">
                        {cs.room || "Main Building"}
                      </td>
                      <td className="py-3 px-3 text-slate-800">
                        {cs.classTeacher ? (
                          <span className="font-semibold">{cs.classTeacher.fullName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{cs.academicYear}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {cs._count?.students || 0} Students
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-purple-700">
                        {cs._count?.timetableSlots || 0} Slots
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBJECT CATALOG */}
      {activeTab === "subjects" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">School Master Subject Catalog</h2>
            <span className="text-xs text-slate-400">Total {subjects.length} Subjects</span>
          </div>

          {subjects.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No subjects added yet. Click "New Subject" to register academic courses.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {sub.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {sub.applicableGrade || "All Grades"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                  {sub.description && (
                    <p className="text-[11px] text-slate-500">{sub.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TIMETABLE SCHEDULER & CONFLICT DETECTION */}
      {activeTab === "timetable" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Select Class:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {classSections.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.className} - {cs.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedDay === d
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Guard Notice */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Real-Time Conflict Prevention Guard</p>
              <p className="text-[11px] text-purple-700">
                The scheduler automatically blocks teacher schedule overlaps and classroom double-bookings across all classes simultaneously.
              </p>
            </div>
          </div>

          {/* Periods Table for Selected Class & Day */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Time Slot</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => {
                  const slot = classTimetable.find(
                    (s) => s.dayOfWeek === selectedDay && s.periodNumber === periodNum
                  );

                  return (
                    <tr key={periodNum} className="hover:bg-slate-50/40">
                      <td className="py-3 px-3 font-bold text-slate-900">Period {periodNum}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {slot ? `${slot.startTime} - ${slot.endTime}` : "—"}
                      </td>
                      <td className="py-3 px-3">
                        {slot ? (
                          <span className="font-bold text-purple-700">{slot.subject?.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unscheduled Slot</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {slot?.teacher ? (
                          <span className="font-semibold text-slate-800">
                            {slot.teacher.fullName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {slot?.room || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL HOLIDAYS */}
      {activeTab === "holidays" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Institutional School Holidays</h2>
            <span className="text-xs text-slate-400">Total {holidays.length} Holidays</span>
          </div>

          {holidays.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No holidays registered yet. Click "Add Holiday" to configure school calendar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{h.title}</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {h.academicYear || "2026-2027"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {new Date(h.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    to{" "}
                    {new Date(h.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {h.description && (
                    <p className="text-[11px] text-slate-500">{h.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW CLASS SECTION */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New Class Section</h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class / Grade Level</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 8"
                  value={sectionForm.className}
                  onChange={(e) => setSectionForm({ ...sectionForm, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Section</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C"
                  value={sectionForm.section}
                  onChange={(e) => setSectionForm({ ...sectionForm, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Classroom / Room No</label>
                <input
                  type="text"
                  placeholder="e.g. Room 201"
                  value={sectionForm.room}
                  onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Class Teacher</label>
                <select
                  value={sectionForm.classTeacherId}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, classTeacherId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">None (Unassigned)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.designation || "Teacher"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Create Section"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SUBJECT */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Subject to Catalog</h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH-08"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Applicable Grade Level</label>
                <input
                  type="text"
                  placeholder="e.g. Class 8 (or leave empty for all grades)"
                  value={subjectForm.applicableGrade}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, applicableGrade: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Add Subject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE PERIOD SLOT (With Conflict Prevention) */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schedule Period Slot</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedDay} • Period {slotForm.periodNumber}
                </p>
              </div>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold flex items-start gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Period Number</label>
                  <select
                    value={slotForm.periodNumber}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, periodNumber: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room / Lab</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 201"
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <select
                  required
                  value={slotForm.subjectId}
                  onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Teacher</label>
                <select
                  value={slotForm.teacherId}
                  onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.designation || "Teacher"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? "Checking Conflicts..." : "Save Slot"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW HOLIDAY */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add School Holiday</h3>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateHoliday} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Holiday Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Break"
                  value={holidayForm.title}
                  onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.startDate}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.endDate}
                    onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Festival vacation"
                  value={holidayForm.description}
                  onChange={(e) =>
                    setHolidayForm({ ...holidayForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Add Holiday"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
