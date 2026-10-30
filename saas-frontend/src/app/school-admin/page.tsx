"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  HardDrive,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Sliders,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiUser } from "@/services/api";

export default function SchoolAdminPage() {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const session = api.getSession();
    if (session) setCurrentUser(session);
  }, []);

  const schoolName = currentUser?.school?.name || "Oakridge International Campus";
  const schoolCode = currentUser?.school?.schoolCode || "SCH-2237";
  const plan = currentUser?.school?.plan || "ENTERPRISE";

  const quotas = [
    {
      title: "Student Enrollment",
      current: 842,
      max: 2500,
      unit: "Students",
      percent: 33.6,
      icon: GraduationCap,
      color: "bg-blue-600",
    },
    {
      title: "Faculty & Staff",
      current: 48,
      max: 150,
      unit: "Members",
      percent: 32.0,
      icon: Users,
      color: "bg-indigo-600",
    },
    {
      title: "Cloud Storage Quota",
      current: 3.2,
      max: 15,
      unit: "GB",
      percent: 21.3,
      icon: HardDrive,
      color: "bg-emerald-600",
    },
  ];

  const onboardingSteps = [
    { title: "Academic Calendar 2026-27", desc: "Terms, holidays, and examination windows defined", completed: true },
    { title: "Class & Section Allocation", desc: "Grade 1 to 12 sections mapped to classroom wings", completed: true },
    { title: "Departmental Heads Appointed", desc: "Science, Math, and Humanities faculties assigned", completed: true },
    { title: "Fee Category Structures", desc: "Tuition, lab, and transport fee schedules configured", completed: false },
  ];

  return (
    <div className="space-y-6">
      {/* School Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-md shadow-blue-500/20">
            {schoolName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] tracking-wide">
                {schoolCode}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wide">
                Affiliated: CBSE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] tracking-wide">
                {plan} Tier
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Academic Session 2026-2027 • Bengaluru, Karnataka, India
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Academic Setup Wizard
          </Button>
        </div>
      </div>

      {/* Tenant Resource Quota Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quotas.map((q) => {
          const Icon = q.icon;
          return (
            <div
              key={q.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {q.title}
                </span>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {q.current} <span className="text-xs font-medium text-slate-400">/ {q.max} {q.unit}</span>
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {q.percent}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${q.color} rounded-full transition-all duration-500`}
                  style={{ width: `${q.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column: Setup Milestones & Modules Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Milestones */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                School Onboarding Checklist
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">3 of 4 Ready</span>
          </div>

          <div className="space-y-3">
            {onboardingSteps.map((s, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div className="mt-0.5">
                  {s.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-800">{s.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                </div>
                {!s.completed && (
                  <Button size="sm" variant="outline" className="text-[11px] h-7 px-2 shrink-0">
                    Configure
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Modules Strip */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Enabled Platform Modules
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              10 Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              "Student Records & Enrollment",
              "Accounts & Fee Ledgers",
              "Attendance Tracking",
              "Examinations & Grading",
              "Timetable & Schedules",
              "Library Management",
              "Transport Fleet",
              "Teacher Academic Portal",
              "Parent Multi-Child Portal",
              "Student Learning Desk",
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/40 text-slate-700 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{m}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800 flex items-center justify-between">
            <span>Need additional modules like Payroll HR or Inventory?</span>
            <Button size="sm" variant="ghost" className="text-blue-700 font-bold text-xs h-7">
              Upgrade Entitlements
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
