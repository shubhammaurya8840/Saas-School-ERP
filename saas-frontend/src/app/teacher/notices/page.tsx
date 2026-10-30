"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Plus,
  Send,
  Calendar,
  X,
  Check,
  Building,
  GraduationCap,
  Users,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/services/api";

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "URGENT">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [showViewModal, setShowViewModal] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form state for authorized teachers
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
    targetAudience: "ALL" as "ALL" | "STAFF_ONLY" | "TEACHERS" | "PARENTS" | "STUDENTS" | "CLASS_SECTION",
    classSectionId: "",
  });

  useEffect(() => {
    const sessionUser = api.getSession();
    setCurrentUser(sessionUser);
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const [list, countData, sections] = await Promise.all([
        api.notices.list(),
        api.notices.getUnreadCount(),
        api.timetable.classSections.list().catch(() => []),
      ]);
      setNotices(Array.isArray(list) ? list : []);
      setUnreadCount(countData?.unreadCount ?? 0);
      setClassSections(Array.isArray(sections) ? sections : []);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load notices.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNotice = async (notice: any) => {
    setShowViewModal(notice);
    if (!notice.isRead) {
      try {
        await api.notices.markAsRead(notice.id);
        setNotices((prev) =>
          prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent fail
      }
    }
  };

  const handleMarkAsRead = async (noticeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notices.markAsRead(noticeId);
      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotification({ type: "success", text: "Notice marked as read." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to mark as read." });
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setNotification({ type: "error", text: "Title and message are required." });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        status: form.status,
        targetAudience: form.targetAudience,
      };
      if (form.targetAudience === "CLASS_SECTION") {
        if (!form.classSectionId) {
          throw new Error("Please select a target class section.");
        }
        payload.classSectionId = form.classSectionId;
      }
      await api.notices.create(payload);
      setNotification({
        type: "success",
        text: form.status === "PUBLISHED" ? "Notice broadcasted successfully!" : "Saved as draft.",
      });
      setShowCreateModal(false);
      await loadNotices();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to publish notice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManage = currentUser?.role === "SCHOOL_ADMIN" || currentUser?.canManageNotices === true;

  // Filtered notices
  const filtered = notices.filter((n) => {
    if (filterType === "UNREAD" && n.isRead) return false;
    if (filterType === "URGENT" && n.priority !== "URGENT" && n.priority !== "HIGH") return false;
    if (
      searchQuery &&
      !n.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.message?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" />
              Teacher Bulletins & Circulars
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Official school broadcasts, department meetings, faculty workshops, and student academic circulars.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
                {unreadCount} Unread Notice{unreadCount > 1 ? "s" : ""}
              </span>
            )}
            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Post Notice
              </button>
            )}
          </div>
        </div>

        {canManage && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50/60 p-2.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>
              You have been granted <strong>Notice Management Rights</strong> by School Administration. You can author and publish circulars.
            </span>
          </div>
        )}
      </div>

      {/* Notification */}
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search circulars and bulletins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none border-none bg-transparent placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === "ALL"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Notices ({notices.length})
          </button>
          <button
            onClick={() => setFilterType("UNREAD")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === "UNREAD"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilterType("URGENT")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === "URGENT"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Urgent / High
          </button>
        </div>
      </div>

      {/* Notice Feed */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading staff bulletins...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-medium text-slate-700">No notices in this view</p>
          <p className="text-xs text-slate-400 mt-1">
            {filterType === "UNREAD" ? "You have read all bulletins!" : "Check back later for updates."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => {
            const isUrgent = notice.priority === "URGENT";
            const isHigh = notice.priority === "HIGH";

            return (
              <div
                key={notice.id}
                onClick={() => handleOpenNotice(notice)}
                className={`bg-white border rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  !notice.isRead ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {!notice.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" title="Unread" />
                    )}

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

                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {notice.targetAudience}
                    </span>

                    {notice.classSection && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                        {notice.classSection.className}-{notice.classSection.section}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 ml-auto sm:ml-0">
                      {new Date(notice.publishDate || notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className={`font-semibold text-base ${!notice.isRead ? "text-slate-900" : "text-slate-700"}`}>
                    {notice.title}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">
                    {notice.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!notice.isRead ? (
                    <button
                      onClick={(e) => handleMarkAsRead(notice.id, e)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Read
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Read
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-medium text-slate-700">Priority:</span> {showViewModal.priority}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Published Date:</span>{" "}
                  {new Date(showViewModal.publishDate || showViewModal.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Author:</span>{" "}
                  {showViewModal.author?.fullName || "School Administration"}
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

      {/* CREATE NOTICE MODAL (FOR AUTHORIZED STAFF) */}
      {showCreateModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                Post Staff / Class Notice
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics Class Test Schedule"
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
                  placeholder="Details of the announcement..."
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
                    <option value="ALL">School-Wide</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="CLASS_SECTION">Specific Class Section</option>
                  </select>
                </div>
              </div>

              {form.targetAudience === "CLASS_SECTION" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Class Section *
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
                        {cs.className} - {cs.section}
                      </option>
                    ))}
                  </select>
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
                  {isSubmitting ? "Publishing..." : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
