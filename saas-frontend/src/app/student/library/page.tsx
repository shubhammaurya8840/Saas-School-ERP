"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Bookmark,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

export default function StudentLibraryPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"loans" | "catalogue">("loans");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const [loansRes, booksRes] = await Promise.all([
        api.library.getStudentLoans().catch(() => []),
        api.library.getBooks({
          search: search || undefined,
          category: category === "ALL" ? undefined : category,
          limit: 100,
        }).catch(() => ({ books: [] })),
      ]);
      setLoans(loansRes || []);
      setBooks(booksRes.books || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handleRenew = async (issueId: string) => {
    try {
      const res = await api.library.renewBook(issueId);
      showToast(
        "success",
        `Book loan renewed until ${new Date(res.dueDate).toLocaleDateString()}!`
      );
      loadStudentData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to renew book loan");
    }
  };

  const activeLoans = loans.filter((l) => l.status === "ISSUED" || l.status === "OVERDUE");
  const pastLoans = loans.filter((l) => l.status === "RETURNED");

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/60 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-600 animate-pulse" />
            <span>Campus Digital Library & Pass</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Library Account & Catalogue
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Check your active borrowed volumes, return due dates, renewals, and browse available library books.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadStudentData}
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
            Books Currently Borrowed
          </span>
          <div className="text-2xl font-black text-sky-600">{activeLoans.length}</div>
          <p className="text-[11px] text-slate-500">Active loans in your possession</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Overdue Warnings
          </span>
          <div className="text-2xl font-black text-rose-600">
            {activeLoans.filter((l) => new Date(l.dueDate) < new Date()).length}
          </div>
          <p className="text-[11px] text-slate-500">Books past scheduled due date</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Returned History
          </span>
          <div className="text-2xl font-black text-emerald-600">{pastLoans.length}</div>
          <p className="text-[11px] text-slate-500">Total books read & returned</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab("loans")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "loans"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          My Borrowed Books ({loans.length})
        </button>

        <button
          onClick={() => setActiveTab("catalogue")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "catalogue"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Browse Library Catalogue ({books.length})
        </button>
      </div>

      {/* TAB 1: MY BORROWED BOOKS */}
      {activeTab === "loans" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Book Title & Author</th>
                    <th className="py-3 px-4">Barcode</th>
                    <th className="py-3 px-4">Borrowed Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Late Fine</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading your loans...
                      </td>
                    </tr>
                  ) : loans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        You do not have any borrowed books. Visit the campus library to check out books!
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => {
                      const isOverdue =
                        loan.status === "OVERDUE" ||
                        (loan.status === "ISSUED" && new Date(loan.dueDate) < new Date());
                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {loan.book?.title}
                            <span className="block text-[11px] text-slate-500 font-normal">
                              by {loan.book?.author}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {loan.bookCopy?.barcode}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {new Date(loan.issueDate).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={
                                isOverdue && loan.status !== "RETURNED"
                                  ? "text-rose-600 font-bold"
                                  : "text-slate-600"
                              }
                            >
                              {new Date(loan.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                loan.status === "RETURNED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isOverdue
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {Number(loan.fineAmount) > 0 ? (
                              <span className="font-bold text-rose-600">
                                ₹{loan.fineAmount} {loan.isFinePaid ? "(Paid)" : "(Unpaid)"}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {loan.status !== "RETURNED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRenew(loan.id)}
                                className="h-7 text-[11px] text-sky-700 border-sky-200 hover:bg-sky-50 font-medium"
                              >
                                Renew Book
                              </Button>
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
        </div>
      )}

      {/* TAB 2: BROWSE CATALOGUE */}
      {activeTab === "catalogue" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search title, author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="General">General</option>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Literature">Literature</option>
              <option value="History">History</option>
              <option value="Fiction">Fiction</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title & Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Publisher / Edition</th>
                    <th className="py-3 px-4">Shelf Location</th>
                    <th className="py-3 px-4 text-right">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No books match your search.
                      </td>
                    </tr>
                  ) : (
                    books.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {b.title}
                          <span className="block text-[11px] text-slate-500 font-normal">
                            by {b.author}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border">
                            {b.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {b.publisher || "—"} {b.edition ? `(${b.edition})` : ""}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{b.locationRack || "General Shelf"}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              b.availableCopies > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {b.availableCopies > 0
                              ? `${b.availableCopies} Copies Available`
                              : "Currently Checked Out"}
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
