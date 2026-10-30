"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  FileCheck,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function StudentPage() {
  const [studentInfo, setStudentInfo] = useState({
    name: "Aarav Sharma",
    gradeLevel: "Class 8",
    section: "A",
    rollNumber: "08-A-24",
    admissionNumber: "SCH-ADM-2026-0001",
    schoolName: "Oakridge International School",
    initials: "AS",
  });

  const [timetable] = useState([
    { period: "Period 1", time: "08:30 AM", subject: "Mathematics", teacher: "Prof. Miller", room: "Room 204" },
    { period: "Period 2", time: "09:20 AM", subject: "Physics", teacher: "Dr. Rao", room: "Lab 2" },
    { period: "Period 3", time: "10:15 AM", subject: "English Literature", teacher: "Ms. Clara", room: "Room 101" },
    { period: "Period 4", time: "11:00 AM", subject: "Computer Science", teacher: "Mr. Scott", room: "Lab 1" },
  ]);

  const [assignments] = useState([
    { id: 1, title: "Calculus Problem Set 4.2", subject: "Mathematics", due: "Tomorrow, 08:30 AM", urgent: true },
    { id: 2, title: "Optics & Lens Lab Report", subject: "Physics", due: "Friday, 02:00 PM", urgent: false },
    { id: 3, title: "Essay on Environmental Conservation", subject: "English", due: "Next Monday", urgent: false },
  ]);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const profile = await api.auth.getProfile();
        if (profile) {
          const profileData: any = profile.studentProfile || {};
          const fullName = profileData.fullName || profile.fullName || "Student";
          const initials = fullName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

          setStudentInfo({
            name: fullName,
            gradeLevel: profileData.gradeLevel || "Class 8",
            section: profileData.section || "A",
            rollNumber: profileData.rollNumber || "N/A",
            admissionNumber: profileData.admissionNumber || "SCH-ADM-2026-0001",
            schoolName: profile.school?.name || "School ERP",
            initials: initials || "ST",
          });
        }
      } catch (err) {
        console.warn("Unable to fetch live student profile:", err);
      }
    };

    fetchStudentProfile();
  }, []);

  return (
    <div className="space-y-6">
      {/* Student Badge Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-md shadow-sky-500/20">
            {studentInfo.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] tracking-wide font-mono">
                Adm: {studentInfo.admissionNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] tracking-wide">
                Roll No: {studentInfo.rollNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wide">
                Attendance: 96.2%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {studentInfo.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {studentInfo.gradeLevel} - Section {studentInfo.section} • {studentInfo.schoolName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Class 5+ Portal Verified
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Rule 6 Compliant</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Digital Library
          </Button>
        </div>
      </div>

      {/* 2-Column: Today's Timetable & Homework Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Today's Class Schedule
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">4 Periods Today</span>
          </div>

          <div className="space-y-3">
            {timetable.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center w-14 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{t.period}</span>
                    <span className="text-xs font-black text-slate-800">{t.time}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="text-xs font-bold text-slate-900 block">{t.subject}</span>
                    <span className="text-[10px] text-slate-500">{t.teacher} • {t.room}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Homework */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Homework & Submissions
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              3 Pending
            </span>
          </div>

          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {a.subject}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-0.5">{a.title}</h3>
                  </div>
                  {a.urgent ? (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Due Soon</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                      Normal
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Due: {a.due}</span>
                  <Button size="sm" variant="outline" className="text-[11px] h-6 px-2.5">
                    Submit Solution
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
