"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Barcode,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function ParentLibraryPage() {
  const [childrenLoans, setChildrenLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadParentLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.library.getParentLoans();
      setChildrenLoans(res || []);
    } catch (err: any) {
      console.error("Failed to load parent library loans", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParentLoans();
  }, [loadParentLoans]);

  // Aggregate stats across children
  let totalBorrowed = 0;
  let totalOverdue = 0;
  let totalFines = 0;

  childrenLoans.forEach((child) => {
    (child.issues || []).forEach((issue: any) => {
      if (issue.status === "ISSUED" || issue.status === "OVERDUE") {
        totalBorrowed++;
        if (new Date(issue.dueDate) < new Date() || issue.status === "OVERDUE") {
          totalOverdue++;
        }
      }
      if (Number(issue.fineAmount) > 0 && !issue.isFinePaid) {
        totalFines += Number(issue.fineAmount);
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/60 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
            <span>Family Academic Oversight • Library Circulation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Children's Library Borrowing
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitor library book loans, upcoming return dates, overdue notices, and late return fees for your children.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadParentLoans}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shrink-0"
        >
          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Books on Active Loan
          </span>
          <div className="text-2xl font-black text-purple-600">{totalBorrowed}</div>
          <p className="text-[11px] text-slate-500">Currently in possession across your children</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Overdue Returns
          </span>
          <div className="text-2xl font-black text-rose-600">{totalOverdue}</div>
          <p className="text-[11px] text-slate-500">Books requiring immediate return</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Pending Late Return Fines
          </span>
          <div className="text-2xl font-black text-slate-900">₹{totalFines}</div>
          <p className="text-[11px] text-slate-500">Unsettled library penalty charges</p>
        </div>
      </div>

      {/* Children Loan Cards */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border">
            Loading your children's library records...
          </div>
        ) : childrenLoans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border">
            No enrolled student profiles currently linked to your family account.
          </div>
        ) : (
          childrenLoans.map((childData) => {
            const student = childData.student;
            const issues = childData.issues || [];
            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <div className="p-4 bg-slate-50/75 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
                    <span className="text-xs text-slate-500">
                      ({student.gradeLevel} {student.section ? `• Sec ${student.section}` : ""} • Adm: {student.admissionNumber})
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-600">
                    {issues.length} {issues.length === 1 ? "Record" : "Records"} on file
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Book Title</th>
                        <th className="py-2.5 px-4">Author</th>
                        <th className="py-2.5 px-4">Barcode</th>
                        <th className="py-2.5 px-4">Issue Date</th>
                        <th className="py-2.5 px-4">Due Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Fine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {issues.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            No books currently borrowed for {student.fullName}.
                          </td>
                        </tr>
                      ) : (
                        issues.map((issue: any) => {
                          const isOverdue =
                            issue.status === "OVERDUE" ||
                            (issue.status === "ISSUED" && new Date(issue.dueDate) < new Date());
                          return (
                            <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">{issue.book?.title}</td>
                              <td className="py-3 px-4 text-slate-600">{issue.book?.author}</td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                {issue.bookCopy?.barcode}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {new Date(issue.issueDate).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={
                                    isOverdue && issue.status !== "RETURNED"
                                      ? "text-rose-600 font-bold"
                                      : "text-slate-600"
                                  }
                                >
                                  {new Date(issue.dueDate).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    issue.status === "RETURNED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : isOverdue
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-purple-50 text-purple-700 border-purple-200"
                                  }`}
                                >
                                  {issue.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {Number(issue.fineAmount) > 0 ? (
                                  <span className="font-bold text-rose-600">
                                    ₹{issue.fineAmount} {issue.isFinePaid ? "(Paid)" : "(Unpaid)"}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
