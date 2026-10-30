"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  UserCheck,
  Award,
  BookMarked,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function TeacherPage() {
  const [teacherName, setTeacherName] = useState("Teacher");
  const [employeeId, setEmployeeId] = useState("TCH-FAC");
  const [department, setDepartment] = useState("Academics");
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Today's Day Name (e.g. MONDAY, TUESDAY)
  const [todayDay, setTodayDay] = useState<string>("MONDAY");

  useEffect(() => {
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const day = days[new Date().getDay()];
    setTodayDay(day === "SUNDAY" ? "MONDAY" : day);

    const loadData = async () => {
      try {
        const [profile, schedule] = await Promise.allSettled([
          api.auth.getProfile(),
          api.timetable.getTeacherMySchedule(),
        ]);

        if (profile.status === "fulfilled" && profile.value) {
          const u = profile.value;
          if (u.fullName) setTeacherName(u.fullName);
          if (u.employeeId) setEmployeeId(u.employeeId);
          if (u.department) setDepartment(u.department);
        }

        if (schedule.status === "fulfilled" && schedule.value?.slots) {
          setScheduleSlots(schedule.value.slots);
        }
      } catch (err) {
        console.warn("Failed to load teacher portal data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter slots for today
  const todaySlots = scheduleSlots.filter((s) => s.dayOfWeek === todayDay);

  return (
    <div className="space-y-6">
      {/* Teacher Profile Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/60 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span>Faculty ID: {employeeId} • Department of {department}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {teacherName}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Weekly teaching schedule, period allocations, and daily roll call register.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/teacher/attendance">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer">
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Daily Roll Call
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Today's Scheduled Periods
          </span>
          <div className="text-2xl font-bold text-slate-900">{todaySlots.length} Periods</div>
          <p className="text-[11px] text-slate-500 font-medium">Scheduled for {todayDay}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Weekly Teaching Load
          </span>
          <div className="text-2xl font-bold text-purple-600">{scheduleSlots.length} Periods</div>
          <p className="text-[11px] text-purple-700 font-medium">Across all allocated classes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Attendance Status
          </span>
          <div className="text-2xl font-bold text-emerald-600">Active</div>
          <p className="text-[11px] text-emerald-700 font-medium">Daily register ready</p>
        </div>
      </div>

      {/* Today's Schedule Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Today's Class Schedule ({todayDay})
            </h2>
          </div>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            {todaySlots.length} Periods Scheduled
          </span>
        </div>

        {todaySlots.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No periods scheduled for {todayDay}. Check your weekly timetable or contact school administration.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySlots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                    Period {slot.periodNumber} ({slot.startTime} - {slot.endTime})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {slot.room || "Classroom"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{slot.subject?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {slot.classSection ? `${slot.classSection.className} - ${slot.classSection.section}` : "Assigned Class"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Code: {slot.subject?.code}
                  </span>

                  <Link href="/teacher/attendance">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-purple-200 text-purple-700 hover:bg-purple-50 cursor-pointer">
                      <span>Roll Call</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
