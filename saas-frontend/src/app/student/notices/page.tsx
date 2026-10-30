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
  Calendar,
  X,
  Check,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { api } from "@/services/api";

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "URGENT">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const [list, countData] = await Promise.all([
        api.notices.list(),
        api.notices.getUnreadCount(),
      ]);
      setNotices(Array.isArray(list) ? list : []);
      setUnreadCount(countData?.unreadCount ?? 0);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load student notice board.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNotice = async (notice: any) => {
    setSelectedNotice(notice);
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
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to mark as read." });
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" />
              Student Notice Board
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              School circulars, class updates, holiday notifications, and academic announcements.
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold self-start sm:self-center">
              {unreadCount} Unread Notice{unreadCount > 1 ? "s" : ""}
            </span>
          )}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notice board..."
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
            Important
          </button>
        </div>
      </div>

      {/* Notices Feed */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading notice board...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-medium text-slate-700">No notices in this view</p>
          <p className="text-xs text-slate-400 mt-1">
            {filterType === "UNREAD" ? "All caught up! No unread notices." : "There are currently no circulars posted."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((notice) => {
            const isUrgent = notice.priority === "URGENT";
            const isHigh = notice.priority === "HIGH";

            return (
              <div
                key={notice.id}
                onClick={() => handleOpenNotice(notice)}
                className={`bg-white border rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between ${
                  !notice.isRead ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
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

                      {notice.classSection && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                          {notice.classSection.className}-{notice.classSection.section}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-400">
                      {new Date(notice.publishDate || notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className={`font-semibold text-base line-clamp-1 ${!notice.isRead ? "text-slate-900" : "text-slate-700"}`}>
                    {notice.title}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {notice.message}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>From: {notice.author?.fullName || "School Administration"}</span>

                  {!notice.isRead ? (
                    <button
                      onClick={(e) => handleMarkAsRead(notice.id, e)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark as read
                    </button>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Read
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  {selectedNotice.priority} PRIORITY
                </span>
                <h2 className="font-bold text-slate-900 text-lg mt-0.5">{selectedNotice.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {selectedNotice.message}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Published: {new Date(selectedNotice.publishDate || selectedNotice.createdAt).toLocaleDateString()}</span>
                <span>Announced By: {selectedNotice.author?.fullName || "School Administration"}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
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
