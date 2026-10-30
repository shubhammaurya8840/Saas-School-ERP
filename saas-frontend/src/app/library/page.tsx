"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Repeat,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bookmark,
  Layers,
  Settings,
  ShieldAlert,
  ArrowRight,
  Filter,
  DollarSign,
  User,
  Users,
  Check,
  RotateCw,
  Trash2,
  Edit2,
  Barcode,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/services/api";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<
    "circulation" | "catalogue" | "overdue" | "settings"
  >("circulation");

  // Stats
  const [stats, setStats] = useState({
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    issuedCopies: 0,
    overdueCount: 0,
    activeLoansCount: 0,
  });

  // Settings
  const [settings, setSettings] = useState({
    maxBooksPerStudent: 3,
    maxBooksPerStaff: 5,
    loanPeriodDays: 14,
    renewalLimit: 2,
    finePerDay: 5,
    isFineEnabled: true,
  });

  // Issues list
  const [issues, setIssues] = useState<any[]>([]);
  const [issueFilterStatus, setIssueFilterStatus] = useState("ALL");
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Books list
  const [books, setBooks] = useState<any[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [bookCategory, setBookCategory] = useState("ALL");
  const [booksLoading, setBooksLoading] = useState(false);

  // Overdue issues
  const [overdueIssues, setOverdueIssues] = useState<any[]>([]);

  // Students & Staff lookups
  const [students, setStudents] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  // Feedback Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<any | null>(null);
  const [showAdjustFeeModal, setShowAdjustFeeModal] = useState<any | null>(null);
  const [studentFeePlans, setStudentFeePlans] = useState<any[]>([]);
  const [selectedFeePlanId, setSelectedFeePlanId] = useState("");
  const [feePlanRemarks, setFeePlanRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issue Form State
  const [issueForm, setIssueForm] = useState({
    borrowerType: "STUDENT" as "STUDENT" | "STAFF",
    studentId: "",
    staffUserId: "",
    bookId: "",
    bookCopyId: "",
    dueDate: "",
    remarks: "",
  });

  // Book Form State
  const [bookForm, setBookForm] = useState({
    id: "",
    isbn: "",
    title: "",
    author: "",
    category: "General",
    publisher: "",
    edition: "",
    description: "",
    locationRack: "",
    initialCopies: 1,
  });

  // Return Note
  const [returnNote, setReturnNote] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load stats & settings
  const loadStatsAndSettings = useCallback(async () => {
    try {
      const [sRes, setRes] = await Promise.all([
        api.library.getStats().catch(() => null),
        api.library.getSettings().catch(() => null),
      ]);
      if (sRes) setStats(sRes);
      if (setRes) setSettings(setRes);
    } catch (err: any) {
      console.error("Error loading library stats/settings", err);
    }
  }, []);

  // Load issues
  const loadIssues = useCallback(async () => {
    setIssuesLoading(true);
    try {
      const res = await api.library.getIssues({
        status: issueFilterStatus === "ALL" ? undefined : issueFilterStatus,
        limit: 100,
      });
      setIssues(res.issues || []);
    } catch (err: any) {
      console.error("Error loading issues", err);
    } finally {
      setIssuesLoading(false);
    }
  }, [issueFilterStatus]);

  // Load books
  const loadBooks = useCallback(async () => {
    setBooksLoading(true);
    try {
      const res = await api.library.getBooks({
        search: bookSearch || undefined,
        category: bookCategory === "ALL" ? undefined : bookCategory,
        limit: 100,
      });
      setBooks(res.books || []);
    } catch (err: any) {
      console.error("Error loading books", err);
    } finally {
      setBooksLoading(false);
    }
  }, [bookSearch, bookCategory]);

  // Load overdue
  const loadOverdue = useCallback(async () => {
    try {
      const res = await api.library.getOverdueIssues();
      setOverdueIssues(res || []);
    } catch (err: any) {
      console.error("Error loading overdue issues", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStatsAndSettings();
    loadIssues();
    loadBooks();
    loadOverdue();

    // Fetch students and staff for borrower selectors
    api.students.list({ limit: 150 }).then((res) => {
      setStudents(res.students || []);
    }).catch(() => {});

    api.users.list({ limit: 100 }).then((res) => {
      setStaffUsers(res.users || []);
    }).catch(() => {});
  }, [loadStatsAndSettings, loadIssues, loadBooks, loadOverdue]);

  // Handle Quick Issue Book
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.bookId && !issueForm.bookCopyId) {
      showToast("error", "Please select a book or enter a specific copy ID");
      return;
    }
    if (issueForm.borrowerType === "STUDENT" && !issueForm.studentId) {
      showToast("error", "Please select a student borrower");
      return;
    }
    if (issueForm.borrowerType === "STAFF" && !issueForm.staffUserId) {
      showToast("error", "Please select a staff member");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.library.issueBook({
        bookId: issueForm.bookId || undefined,
        bookCopyId: issueForm.bookCopyId || undefined,
        borrowerType: issueForm.borrowerType,
        studentId:
          issueForm.borrowerType === "STUDENT" ? issueForm.studentId : undefined,
        staffUserId:
          issueForm.borrowerType === "STAFF" ? issueForm.staffUserId : undefined,
        dueDate: issueForm.dueDate || undefined,
        remarks: issueForm.remarks || undefined,
      });

      showToast("success", "Book successfully issued!");
      setShowIssueModal(false);
      setIssueForm({
        borrowerType: "STUDENT",
        studentId: "",
        staffUserId: "",
        bookId: "",
        bookCopyId: "",
        dueDate: "",
        remarks: "",
      });
      loadStatsAndSettings();
      loadIssues();
      loadBooks();
    } catch (err: any) {
      showToast("error", err.message || "Failed to issue book");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Return Book
  const handleReturnSubmit = async () => {
    if (!showReturnModal) return;
    setIsSubmitting(true);
    try {
      const res = await api.library.returnBook(showReturnModal.id, {
        conditionNote: returnNote || undefined,
      });
      const fineMsg =
        res.fineAmount > 0
          ? ` Book returned with ₹${res.fineAmount} late fine.`
          : " Book returned in good order.";
      showToast("success", `Success!${fineMsg}`);
      setShowReturnModal(null);
      setReturnNote("");
      loadStatsAndSettings();
      loadIssues();
      loadBooks();
      loadOverdue();
    } catch (err: any) {
      showToast("error", err.message || "Failed to return book");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Renew Book
  const handleRenew = async (issueId: string) => {
    try {
      const res = await api.library.renewBook(issueId);
      showToast(
        "success",
        `Book renewed successfully until ${new Date(res.dueDate).toLocaleDateString()} (Renewal #${res.renewalCount})`
      );
      loadIssues();
      loadStatsAndSettings();
    } catch (err: any) {
      showToast("error", err.message || "Failed to renew book");
    }
  };

  // Open Adjust Fee Modal
  const handleOpenAdjustFee = async (issue: any) => {
    setShowAdjustFeeModal(issue);
    setSelectedFeePlanId("");
    setFeePlanRemarks(`Library late return fine for: ${issue.book?.title || "Book"}`);
    if (issue.studentId) {
      try {
        const ledger = await api.fees.getStudentLedger(issue.studentId);
        setStudentFeePlans(ledger.feePlans || []);
        if (ledger.feePlans && ledger.feePlans.length > 0) {
          setSelectedFeePlanId(ledger.feePlans[0].id);
        }
      } catch (err: any) {
        console.error("Could not load student fee plans", err);
      }
    }
  };

  // Submit Adjust Fee
  const handleAdjustFeeSubmit = async () => {
    if (!showAdjustFeeModal || !selectedFeePlanId) {
      showToast("error", "Please select a student fee plan to post the fine");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.library.adjustFineToFee(showAdjustFeeModal.id, {
        studentFeePlanId: selectedFeePlanId,
        remarks: feePlanRemarks || "Library late fine adjusted to fee account",
      });
      showToast(
        "success",
        `Fine of ₹${showAdjustFeeModal.fineAmount} successfully posted to student fee ledger with audit log!`
      );
      setShowAdjustFeeModal(null);
      loadIssues();
      loadOverdue();
    } catch (err: any) {
      showToast("error", err.message || "Failed to adjust fine to fee");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add/Edit Book Submit
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author) {
      showToast("error", "Title and Author are required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (bookForm.id) {
        await api.library.updateBook(bookForm.id, {
          isbn: bookForm.isbn || undefined,
          title: bookForm.title,
          author: bookForm.author,
          category: bookForm.category,
          publisher: bookForm.publisher || undefined,
          edition: bookForm.edition || undefined,
          description: bookForm.description || undefined,
          locationRack: bookForm.locationRack || undefined,
        });
        showToast("success", "Book details updated!");
      } else {
        await api.library.createBook({
          isbn: bookForm.isbn || undefined,
          title: bookForm.title,
          author: bookForm.author,
          category: bookForm.category,
          publisher: bookForm.publisher || undefined,
          edition: bookForm.edition || undefined,
          description: bookForm.description || undefined,
          locationRack: bookForm.locationRack || undefined,
          initialCopies: Number(bookForm.initialCopies) || 1,
        });
        showToast("success", "New book titled and copies barcoded successfully!");
      }
      setShowAddBookModal(false);
      setBookForm({
        id: "",
        isbn: "",
        title: "",
        author: "",
        category: "General",
        publisher: "",
        edition: "",
        description: "",
        locationRack: "",
        initialCopies: 1,
      });
      loadStatsAndSettings();
      loadBooks();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save book");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book? Books with active loans cannot be deleted.")) return;
    try {
      await api.library.deleteBook(bookId);
      showToast("success", "Book removed from catalogue");
      loadStatsAndSettings();
      loadBooks();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete book");
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.library.updateSettings({
        maxBooksPerStudent: Number(settings.maxBooksPerStudent),
        maxBooksPerStaff: Number(settings.maxBooksPerStaff),
        loanPeriodDays: Number(settings.loanPeriodDays),
        renewalLimit: Number(settings.renewalLimit),
        finePerDay: Number(settings.finePerDay),
        isFineEnabled: Boolean(settings.isFineEnabled),
      });
      showToast("success", "Library circulation policy updated!");
      loadStatsAndSettings();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/60 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Campus Central Library • Digital Catalog</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Library & Circulation Desk
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Barcode book loans, student lending limits, fine calculations, and catalog acquisition.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            size="sm"
            onClick={() => {
              setBookForm({
                id: "",
                isbn: "",
                title: "",
                author: "",
                category: "General",
                publisher: "",
                edition: "",
                description: "",
                locationRack: "",
                initialCopies: 1,
              });
              setShowAddBookModal(true);
            }}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Add New Book
          </Button>

          <Button
            size="sm"
            onClick={() => {
              // Set default due date: today + loanPeriodDays
              const d = new Date();
              d.setDate(d.getDate() + (settings.loanPeriodDays || 14));
              setIssueForm({
                borrowerType: "STUDENT",
                studentId: "",
                staffUserId: "",
                bookId: books[0]?.id || "",
                bookCopyId: "",
                dueDate: d.toISOString().split("T")[0],
                remarks: "",
              });
              setShowIssueModal(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Issue Book
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Catalog Volumes
          </span>
          <div className="text-2xl font-black text-slate-900">{stats.totalCopies}</div>
          <p className="text-[11px] text-slate-500 font-medium">
            {stats.totalTitles} Unique titles cataloged
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Books in Circulation
          </span>
          <div className="text-2xl font-black text-blue-600">{stats.issuedCopies}</div>
          <p className="text-[11px] text-blue-700 font-medium">
            {stats.availableCopies} Copies available on shelves
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Overdue Returns
          </span>
          <div className="text-2xl font-black text-rose-600">{stats.overdueCount}</div>
          <p className="text-[11px] text-rose-700 font-medium">Active loans past due date</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Late Return Fine Policy
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {settings.isFineEnabled ? `₹${settings.finePerDay}/day` : "Disabled"}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Standard loan period: {settings.loanPeriodDays} days
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("circulation")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "circulation"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Repeat className="h-4 w-4" />
          Circulation & Loans ({issues.length})
        </button>

        <button
          onClick={() => setActiveTab("catalogue")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "catalogue"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Book Repository ({books.length})
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "overdue"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          Overdue & Fines ({overdueIssues.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "settings"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Settings className="h-4 w-4" />
          Policy & Settings
        </button>
      </div>

      {/* TAB 1: CIRCULATION & ACTIVE LOANS */}
      {activeTab === "circulation" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Status:</span>
              {["ALL", "ISSUED", "OVERDUE", "RETURNED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setIssueFilterStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    issueFilterStatus === st
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadIssues();
                loadStatsAndSettings();
              }}
              className="text-xs h-8 text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Book Title & Copy</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Fine Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {issuesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading circulation issues...
                      </td>
                    </tr>
                  ) : issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No circulation records match this filter.
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => {
                      const isOverdue =
                        issue.status === "OVERDUE" ||
                        (issue.status === "ISSUED" &&
                          new Date(issue.dueDate) < new Date());
                      return (
                        <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {issue.book?.title || "Unknown Book"}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Barcode className="h-3 w-3 text-slate-400" />
                              <span>Copy: {issue.bookCopy?.copyNumber || "1"}</span>
                              <span>•</span>
                              <span>{issue.bookCopy?.barcode}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              {issue.borrowerType === "STUDENT" ? (
                                <>
                                  <User className="h-3 w-3 text-blue-500" />
                                  <span>{issue.student?.fullName || "Student"}</span>
                                </>
                              ) : (
                                <>
                                  <Users className="h-3 w-3 text-purple-500" />
                                  <span>{issue.staffUser?.fullName || "Staff"}</span>
                                </>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {issue.borrowerType === "STUDENT"
                                ? `${issue.student?.gradeLevel || ""} • Adm: ${issue.student?.admissionNumber || ""}`
                                : issue.staffUser?.email || "Faculty"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {new Date(issue.issueDate).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={
                                isOverdue && issue.status !== "RETURNED"
                                  ? "text-rose-600 font-bold"
                                  : "text-slate-600"
                              }
                            >
                              {new Date(issue.dueDate).toLocaleDateString()}
                            </span>
                            {issue.renewalCount > 0 && (
                              <span className="block text-[10px] text-slate-400">
                                Renewed x{issue.renewalCount}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                issue.status === "RETURNED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : issue.status === "OVERDUE" || isOverdue
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {issue.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {Number(issue.fineAmount) > 0 ? (
                              <div>
                                <span className="font-bold text-rose-600">
                                  ₹{issue.fineAmount}
                                </span>
                                {issue.isFinePaid ? (
                                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                                    Unpaid
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {issue.status !== "RETURNED" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setShowReturnModal(issue)}
                                  className="h-7 text-[11px] bg-slate-900 hover:bg-slate-800 text-white font-medium px-2.5"
                                >
                                  Return
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRenew(issue.id)}
                                  className="h-7 text-[11px] text-slate-700 border-slate-200 hover:bg-slate-50 font-medium px-2.5"
                                >
                                  Renew
                                </Button>
                              </>
                            )}

                            {issue.borrowerType === "STUDENT" &&
                              Number(issue.fineAmount) > 0 &&
                              !issue.isFinePaid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenAdjustFee(issue)}
                                  className="h-7 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50 font-medium px-2.5"
                                >
                                  Adjust to Fee
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

      {/* TAB 2: BOOK REPOSITORY / CATALOGUE */}
      {activeTab === "catalogue" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search title, author, ISBN..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <select
                value={bookCategory}
                onChange={(e) => setBookCategory(e.target.value)}
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
                <option value="Reference">Reference</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setBookForm({
                  id: "",
                  isbn: "",
                  title: "",
                  author: "",
                  category: "General",
                  publisher: "",
                  edition: "",
                  description: "",
                  locationRack: "",
                  initialCopies: 1,
                });
                setShowAddBookModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 shrink-0"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Add Book to Catalog
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title & ISBN</th>
                    <th className="py-3 px-4">Author & Publisher</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location / Shelf</th>
                    <th className="py-3 px-4">Copies (Total / Avail)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {booksLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading book catalog...
                      </td>
                    </tr>
                  ) : books.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No books found in catalogue.
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{book.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {book.isbn ? `ISBN: ${book.isbn}` : "No ISBN recorded"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{book.author}</div>
                          <div className="text-[11px] text-slate-500">{book.publisher || "—"}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            {book.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {book.locationRack || "General Shelf"}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                book.availableCopies > 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {book.availableCopies} Available
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              / {book.totalCopies} total
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setBookForm({
                                id: book.id,
                                isbn: book.isbn || "",
                                title: book.title,
                                author: book.author,
                                category: book.category,
                                publisher: book.publisher || "",
                                edition: book.edition || "",
                                description: book.description || "",
                                locationRack: book.locationRack || "",
                                initialCopies: 1,
                              });
                              setShowAddBookModal(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBook(book.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* TAB 3: OVERDUE & FINES */}
      {activeTab === "overdue" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  Late Return Fine Auditing & Recovery
                </h4>
                <p className="text-[11px] text-rose-700">
                  Fines accumulate daily based on policy rules. Direct fee account adjustment requires
                  explicit authorized sign-off.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadOverdue}
              className="text-xs bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1" />
              Recalculate
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Book & Barcode</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Days Overdue</th>
                    <th className="py-3 px-4">Accrued Fine</th>
                    <th className="py-3 px-4">Fine Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {overdueIssues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No overdue books currently recorded. Great job!
                      </td>
                    </tr>
                  ) : (
                    overdueIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{issue.book?.title}</div>
                          <div className="text-[11px] text-slate-500">
                            Barcode: {issue.bookCopy?.barcode}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {issue.borrowerType === "STUDENT"
                              ? issue.student?.fullName
                              : issue.staffUser?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {issue.borrowerType === "STUDENT"
                              ? `Adm: ${issue.student?.admissionNumber}`
                              : issue.staffUser?.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-rose-600 font-semibold">
                          {new Date(issue.dueDate).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {issue.daysOverdue || 0} days
                        </td>

                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          ₹{issue.calculatedFine || issue.fineAmount || 0}
                        </td>

                        <td className="py-3.5 px-4">
                          {issue.isFinePaid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              Unpaid Fine
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {issue.status !== "RETURNED" && (
                            <Button
                              size="sm"
                              onClick={() => setShowReturnModal(issue)}
                              className="h-7 text-[11px] bg-slate-900 hover:bg-slate-800 text-white font-medium px-2.5"
                            >
                              Return Book
                            </Button>
                          )}

                          {issue.borrowerType === "STUDENT" && !issue.isFinePaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAdjustFee(issue)}
                              className="h-7 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50 font-medium px-2.5"
                            >
                              Post to Fee Ledger
                            </Button>
                          )}
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

      {/* TAB 4: SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Library Circulation Policies</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure maximum lending quotas, overdue fine calculations, and loan durations.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Books Per Student
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxBooksPerStudent}
                  onChange={(e) =>
                    setSettings({ ...settings, maxBooksPerStudent: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Books Per Staff
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxBooksPerStaff}
                  onChange={(e) =>
                    setSettings({ ...settings, maxBooksPerStaff: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Loan Period (Days)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.loanPeriodDays}
                  onChange={(e) =>
                    setSettings({ ...settings, loanPeriodDays: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Permitted Renewals
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.renewalLimit}
                  onChange={(e) =>
                    setSettings({ ...settings, renewalLimit: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Late Fine Per Day (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="500"
                  value={settings.finePerDay}
                  onChange={(e) =>
                    setSettings({ ...settings, finePerDay: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={settings.isFineEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, isFineEnabled: e.target.checked })
                    }
                    className="h-4 w-4 text-rose-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Enable Late Return Fines
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Saving..." : "Save Policy Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ISSUE BOOK */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Book to Borrower"
        description="Select student or staff borrower, verify quota limits, and set the due date."
        maxWidth="lg"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Borrower Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="borrowerType"
                  value="STUDENT"
                  checked={issueForm.borrowerType === "STUDENT"}
                  onChange={() => setIssueForm({ ...issueForm, borrowerType: "STUDENT" })}
                  className="text-rose-600"
                />
                <span className="font-medium text-slate-700">Student</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="borrowerType"
                  value="STAFF"
                  checked={issueForm.borrowerType === "STAFF"}
                  onChange={() => setIssueForm({ ...issueForm, borrowerType: "STAFF" })}
                  className="text-rose-600"
                />
                <span className="font-medium text-slate-700">Staff / Faculty</span>
              </label>
            </div>
          </div>

          {issueForm.borrowerType === "STUDENT" ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
              <select
                value={issueForm.studentId}
                onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                required
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
              >
                <option value="">-- Choose Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} (Adm: {st.admissionNumber} • {st.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Staff Member</label>
              <select
                value={issueForm.staffUserId}
                onChange={(e) => setIssueForm({ ...issueForm, staffUserId: e.target.value })}
                required
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
              >
                <option value="">-- Choose Staff Member --</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role} • {u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Book Title (or specify copy barcode below)
            </label>
            <select
              value={issueForm.bookId}
              onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
            >
              <option value="">-- Select Available Book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                  {b.title} by {b.author} ({b.availableCopies} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={issueForm.dueDate}
              onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
              required
              className="text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
            <Input
              placeholder="e.g. Issued for semester research project"
              value={issueForm.remarks}
              onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowIssueModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isSubmitting ? "Issuing..." : "Confirm Issue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT BOOK */}
      <Modal
        isOpen={showAddBookModal}
        onClose={() => setShowAddBookModal(false)}
        title={bookForm.id ? "Edit Book Details" : "Add Book to Catalogue"}
        description="Enter book metadata, shelf location, and initial inventory copies."
        maxWidth="lg"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
              <Input
                required
                placeholder="e.g. A Brief History of Time"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Author *</label>
              <Input
                required
                placeholder="e.g. Stephen Hawking"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ISBN</label>
              <Input
                placeholder="e.g. 978-0553380163"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
              >
                <option value="General">General</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Literature">Literature</option>
                <option value="History">History</option>
                <option value="Fiction">Fiction</option>
                <option value="Reference">Reference</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Publisher</label>
              <Input
                placeholder="e.g. Bantam Books"
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shelf / Rack Location</label>
              <Input
                placeholder="e.g. Shelf B-4, Rack 2"
                value={bookForm.locationRack}
                onChange={(e) => setBookForm({ ...bookForm, locationRack: e.target.value })}
                className="text-xs"
              />
            </div>

            {!bookForm.id && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Physical Copies
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={bookForm.initialCopies}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, initialCopies: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
            <Input
              placeholder="Brief summary or description of the book"
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddBookModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isSubmitting ? "Saving..." : bookForm.id ? "Update Book" : "Add to Catalog"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RETURN BOOK */}
      <Modal
        isOpen={Boolean(showReturnModal)}
        onClose={() => setShowReturnModal(null)}
        title="Check-In / Return Book"
        description="Verify book condition and settle overdue fines if applicable."
        maxWidth="md"
      >
        {showReturnModal && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900">{showReturnModal.book?.title}</div>
              <div className="text-slate-600">
                Barcode: {showReturnModal.bookCopy?.barcode}
              </div>
              <div className="text-slate-600">
                Borrower:{" "}
                {showReturnModal.borrowerType === "STUDENT"
                  ? showReturnModal.student?.fullName
                  : showReturnModal.staffUser?.fullName}
              </div>
              <div className="text-slate-600">
                Due Date: {new Date(showReturnModal.dueDate).toLocaleDateString()}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Copy Condition Note (Optional)
              </label>
              <Input
                placeholder="e.g. Good condition, spine intact"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReturnModal(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReturnSubmit}
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Processing..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: ADJUST FINE TO FEE */}
      <Modal
        isOpen={Boolean(showAdjustFeeModal)}
        onClose={() => setShowAdjustFeeModal(null)}
        title="Post Library Fine to Fee Account"
        description="Authorized ledger adjustment: posts fine to the student's fee plan and audits the transaction."
        maxWidth="md"
      >
        {showAdjustFeeModal && (
          <div className="space-y-4 text-xs">
            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-rose-900 space-y-1">
              <div className="font-bold">
                Student: {showAdjustFeeModal.student?.fullName} (Adm:{" "}
                {showAdjustFeeModal.student?.admissionNumber})
              </div>
              <div>Book: {showAdjustFeeModal.book?.title}</div>
              <div className="text-sm font-black text-rose-700">
                Accrued Fine: ₹{showAdjustFeeModal.fineAmount}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Fee Plan *
              </label>
              {studentFeePlans.length === 0 ? (
                <div className="text-slate-500 italic p-2 bg-slate-50 rounded border">
                  No active fee plans found for this student. Please assign a fee plan first in the Fees module.
                </div>
              ) : (
                <select
                  value={selectedFeePlanId}
                  onChange={(e) => setSelectedFeePlanId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                >
                  {studentFeePlans.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.feePlan?.name || "Fee Plan"} (Outstanding: ₹{fp.balanceAmount})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audit Remarks</label>
              <Input
                value={feePlanRemarks}
                onChange={(e) => setFeePlanRemarks(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdjustFeeModal(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdjustFeeSubmit}
                disabled={isSubmitting || !selectedFeePlanId}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Posting..." : "Confirm & Post Fine"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
