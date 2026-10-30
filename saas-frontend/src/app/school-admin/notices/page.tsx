"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Shield,
  Eye,
  Edit,
  Trash2,
  Send,
  Calendar,
  Layers,
  X,
  FileText,
  Building,
  GraduationCap,
  Briefcase,
  UserCheck,
  Check,
} from "lucide-react";
import { api } from "@/services/api";

export default function SchoolAdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"notices" | "permissions" | "queue">("notices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<any | null>(null);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
    targetAudience: "ALL" as "ALL" | "STAFF_ONLY" | "TEACHERS" | "PARENTS" | "STUDENTS" | "CLASS_SECTION",
    classSectionId: "",
    targetGrade: "",
    publishDate: "",
    expiryDate: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      publishDate: new Date().toISOString().split("T")[0],
    }));
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [noticesData, permissionsData, sectionsData] = await Promise.all([
        api.notices.list(),
        api.notices.listStaffPermissions(),
        api.timetable.classSections.list().catch(() => []),
      ]);
      setNotices(Array.isArray(noticesData) ? noticesData : []);
      setStaffList(Array.isArray(permissionsData) ? permissionsData : []);
      setClassSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load notices & configuration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setForm({
      title: "",
      message: "",
      priority: "NORMAL",
      status: "PUBLISHED",
      targetAudience: "ALL",
      classSectionId: "",
      targetGrade: "",
      publishDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (notice: any) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title || "",
      message: notice.message || "",
      priority: notice.priority || "NORMAL",
      status: notice.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      targetAudience: notice.targetAudience || "ALL",
      classSectionId: notice.classSectionId || "",
      targetGrade: notice.targetGrade || "",
      publishDate: notice.publishDate ? new Date(notice.publishDate).toISOString().split("T")[0] : "",
      expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split("T")[0] : "",
    });
    setShowCreateModal(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setNotification({ type: "error", text: "Please enter both title and message." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        targetAudience: form.targetAudience,
        publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : undefined,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
      };

      if (form.targetAudience === "CLASS_SECTION") {
        if (!form.classSectionId) {
          throw new Error("Please select a target Class Section.");
        }
        payload.classSectionId = form.classSectionId;
      }

      if (editingNotice) {
        await api.notices.update(editingNotice.id, payload);
        setNotification({ type: "success", text: "Notice updated successfully." });
      } else {
        payload.status = form.status;
        await api.notices.create(payload);
        setNotification({
          type: "success",
          text: form.status === "PUBLISHED" ? "Notice broadcasted successfully!" : "Notice saved as Draft.",
        });
      }

      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save notice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraft = async (noticeId: string) => {
    try {
      await api.notices.publish(noticeId);
      setNotification({ type: "success", text: "Notice published successfully!" });
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to publish notice." });
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!window.confirm("Are you sure you want to delete this notice? This action is recorded in audit logs.")) {
      return;
    }
    try {
      await api.notices.delete(noticeId);
      setNotification({ type: "success", text: "Notice deleted." });
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete notice." });
    }
  };

  const handleToggleStaffPermission = async (userId: string, currentVal: boolean) => {
    try {
      await api.notices.setStaffPermission(userId, !currentVal);
      setNotification({
        type: "success",
        text: `Notice management permission ${!currentVal ? "granted" : "revoked"}.`,
      });
      // update state locally
      setStaffList((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, canManageNotices: !currentVal } : s))
      );
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update permission." });
    }
  };

  // Filtered notices
  const filteredNotices = notices.filter((n) => {
    if (statusFilter !== "ALL" && n.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && n.priority !== priorityFilter) return false;
    if (audienceFilter !== "ALL" && n.targetAudience !== audienceFilter) return false;
    if (
      searchQuery &&
      !n.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.message?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const draftCount = notices.filter((n) => n.status === "DRAFT").length;
  const publishedCount = notices.filter((n) => n.status === "PUBLISHED").length;
  const totalCount = notices.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / KPIs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" />
              Notices & Broadcasts Console
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Publish school-wide announcements, target specific classes and roles, and manage staff publishing credentials.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Notice
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Notices</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Active Broadcasts</span>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{publishedCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Drafts In Queue</span>
            <p className="text-2xl font-bold text-amber-900 mt-1">{draftCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <span className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Authorized Staff</span>
            <p className="text-2xl font-bold text-indigo-900 mt-1">
              {staffList.filter((s) => s.canManageNotices).length}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("notices")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "notices"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          All Bulletins & Notices ({notices.length})
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "queue"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          Draft & Review Queue ({draftCount})
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "permissions"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield className="w-4 h-4" />
          Staff Publishing Authorizations ({staffList.length})
        </button>
      </div>

      {/* TAB 1 & 2: Notices / Drafts */}
      {(activeTab === "notices" || activeTab === "queue") && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notices by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm outline-none border-none bg-transparent placeholder-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "notices" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              )}

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Audiences</option>
                <option value="ALL">School-Wide (ALL)</option>
                <option value="STAFF_ONLY">Staff Only</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="PARENTS">Parents Only</option>
                <option value="STUDENTS">Students Only</option>
                <option value="CLASS_SECTION">Class Section</option>
              </select>
            </div>
          </div>

          {/* Notices Grid / Feed */}
          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading notices and circulars...</div>
          ) : (activeTab === "queue" ? notices.filter((n) => n.status === "DRAFT") : filteredNotices).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No notices found</p>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === "queue"
                  ? "No draft notices awaiting publication."
                  : "Try adjusting your search filters or click 'Create Notice'."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeTab === "queue" ? notices.filter((n) => n.status === "DRAFT") : filteredNotices).map((notice) => {
                const isUrgent = notice.priority === "URGENT";
                const isHigh = notice.priority === "HIGH";
                const isExpired = notice.status === "EXPIRED" || Boolean(notice.isExpired);

                return (
                  <div
                    key={notice.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-shadow shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Priority badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                              isUrgent
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : isHigh
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {notice.priority}
                          </span>

                          {/* Status badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isExpired
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : notice.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isExpired ? "EXPIRED" : notice.status}
                          </span>

                          {/* Target Audience */}
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {notice.targetAudience === "CLASS_SECTION" && notice.classSection
                              ? `${notice.classSection.className}-${notice.classSection.section}`
                              : notice.targetAudience}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">
                          {new Date(notice.publishDate || notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-base line-clamp-1">{notice.title}</h3>
                      <p className="text-slate-600 text-sm mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line">
                        {notice.message}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        By: <span className="font-medium text-slate-700">{notice.author?.fullName || "Admin"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {notice.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublishDraft(notice.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                          >
                            <Send className="w-3 h-3" /> Publish
                          </button>
                        )}
                        <button
                          onClick={() => setShowViewModal(notice)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(notice)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded"
                          title="Edit Notice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Staff Publishing Permissions */}
      {activeTab === "permissions" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Staff Notice Management Authorizations</h2>
            <p className="text-xs text-slate-500 mt-1">
              By default, only School Admins can publish notices. Explicitly grant or revoke publishing permissions for teachers and staff. All changes are recorded in audit logs.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3 text-right">Notice Publishing Rights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{staff.fullName}</div>
                      <div className="text-xs text-slate-400">{staff.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">{staff.department || "—"}</td>
                    <td className="px-6 py-4 text-xs">{staff.designation || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStaffPermission(staff.id, staff.canManageNotices)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          staff.canManageNotices
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {staff.canManageNotices ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" /> Authorized
                          </>
                        ) : (
                          "Unauthorized"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                {editingNotice ? "Edit Notice" : "Create New Notice / Broadcast"}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Meet 2026 Schedule & Guidelines"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the full announcement message here..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e: any) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">School-Wide (Everyone)</option>
                    <option value="STAFF_ONLY">All Staff (Staff + Teachers)</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="CLASS_SECTION">Specific Class Section</option>
                  </select>
                </div>
              </div>

              {form.targetAudience === "CLASS_SECTION" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Class Section *
                  </label>
                  <select
                    value={form.classSectionId}
                    onChange={(e) => setForm({ ...form, classSectionId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Class Section --</option>
                    {classSections.map((cs) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.className} - {cs.section} {cs.room ? `(${cs.room})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={form.publishDate}
                    onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Optional Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {!editingNotice && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Publishing Workflow
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === "PUBLISHED"}
                        onChange={() => setForm({ ...form, status: "PUBLISHED" })}
                      />
                      Publish Immediately
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === "DRAFT"}
                        onChange={() => setForm({ ...form, status: "DRAFT" })}
                      />
                      Save as Draft
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingNotice ? "Update Notice" : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW NOTICE MODAL */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                  {showViewModal.targetAudience}
                </span>
                <h2 className="font-bold text-slate-900 text-lg mt-0.5">{showViewModal.title}</h2>
              </div>
              <button
                onClick={() => setShowViewModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {showViewModal.message}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-medium text-slate-700">Priority:</span> {showViewModal.priority}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Status:</span> {showViewModal.status}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Author:</span> {showViewModal.author?.fullName || "Admin"}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Total Reads:</span>{" "}
                  {showViewModal._count?.reads ?? showViewModal.reads?.length ?? 0}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
