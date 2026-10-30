"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  Building,
  GraduationCap,
  Sparkles,
  RefreshCw,
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

export default function StudentTimetablePage() {
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [classSection, setClassSection] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Select current day if weekday
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const today = days[new Date().getDay()];
    if (today !== "SUNDAY") setSelectedDay(today);

    const fetchTimetable = async () => {
      try {
        const profile = await api.auth.getProfile();
        if (profile?.studentProfile?.id) {
          const res = await api.timetable.getStudentTimetable(profile.studentProfile.id);
          if (res) {
            setStudentInfo(res.student);
            setClassSection(res.classSection);
            setSlots(res.slots || []);
          }
        }
      } catch (err) {
        console.warn("Failed to load student timetable:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  // Filter slots for the selected day
  const daySlots = slots
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Schedule
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Monday - Saturday Timetable
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Class Timetable
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {classSection
              ? `${classSection.className} - ${classSection.section} • Room: ${classSection.room || "Main Wing"} • Academic Year ${classSection.academicYear}`
              : "Assigned Class Period Schedule"}
          </p>
        </div>

        {/* Day Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDay === day
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Loading your timetable...</p>
        </div>
      ) : daySlots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No classes scheduled for {selectedDay}</p>
          <p className="text-xs text-slate-500 mt-1">
            Check other days of the week or contact your class teacher.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {daySlots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 uppercase tracking-wider">
                  Period {slot.periodNumber}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{slot.subject?.name}</h3>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  Code: {slot.subject?.code}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Teacher:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {slot.teacher?.fullName || "Assigned Faculty"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    Room:
                  </span>
                  <span className="font-semibold text-purple-700">
                    {slot.room || "Regular Classroom"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
