"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  User,
  BookOpen,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

export default function LibraryMembersPage() {
  const [membersType, setMembersType] = useState<"STUDENT" | "STAFF">("STUDENT");
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stRes, staffRes, issuesRes] = await Promise.all([
        api.students.list({ search: search || undefined, limit: 100 }).catch(() => ({ students: [] })),
        api.users.list({ search: search || undefined, limit: 100 }).catch(() => ({ users: [] })),
        api.library.getIssues({ status: "ISSUED", limit: 200 }).catch(() => ({ issues: [] })),
      ]);
      setStudents(stRes.students || []);
      setStaff(staffRes.users || []);
      setActiveLoans(issuesRes.issues || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate active loans per member
  const getLoanCount = (id: string, type: "STUDENT" | "STAFF") => {
    return activeLoans.filter((issue) =>
      type === "STUDENT" ? issue.studentId === id : issue.staffUserId === id
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Library Members Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            View active borrowers, borrower limits, and currently loaned volumes.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50 shrink-0"
        >
          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMembersType("STUDENT")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              membersType === "STUDENT"
                ? "bg-rose-50 text-rose-700 border-rose-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Enrolled Students ({students.length})
          </button>
          <button
            onClick={() => setMembersType("STAFF")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              membersType === "STAFF"
                ? "bg-rose-50 text-rose-700 border-rose-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Faculty & Staff ({staff.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search member name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          >
          </Input>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Identifier / Grade</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Current Active Loans</th>
                <th className="py-3 px-4">Borrowing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading members...
                  </td>
                </tr>
              ) : membersType === "STUDENT" ? (
                students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => {
                    const count = getLoanCount(st.id, "STUDENT");
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{st.fullName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {st.gradeLevel} {st.section ? `(${st.section})` : ""} • Adm: {st.admissionNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {st.parentPhone || st.parentEmail || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              count > 0
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {count} Books on loan
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Eligible
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No staff found.
                  </td>
                </tr>
              ) : (
                staff.map((u) => {
                  const count = getLoanCount(u.id, "STAFF");
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.role} {u.department ? `• ${u.department}` : ""}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            count > 0
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {count} Books on loan
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Faculty
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
