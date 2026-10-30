"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Repeat,
  Search,
  PlusCircle,
  Barcode,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/services/api";

export default function LibraryCirculationPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showReturnModal, setShowReturnModal] = useState<any | null>(null);
  const [returnNote, setReturnNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.library.getIssues({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
      });
      setIssues(res.issues || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleReturn = async () => {
    if (!showReturnModal) return;
    setIsSubmitting(true);
    try {
      const res = await api.library.returnBook(showReturnModal.id, {
        conditionNote: returnNote || undefined,
      });
      showToast(
        "success",
        `Book returned! ${res.fineAmount > 0 ? `Late fine: ₹${res.fineAmount}` : "No fines incurred."}`
      );
      setShowReturnModal(null);
      setReturnNote("");
      loadIssues();
    } catch (err: any) {
      showToast("error", err.message || "Failed to return book");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const res = await api.library.renewBook(id);
      showToast(
        "success",
        `Renewed until ${new Date(res.dueDate).toLocaleDateString()} (Renewal #${res.renewalCount})`
      );
      loadIssues();
    } catch (err: any) {
      showToast("error", err.message || "Failed to renew book");
    }
  };

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

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Issue & Return Circulation Register
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track book loans, renewals, returns, copy barcodes, and active borrower quotas.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadIssues}
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50 shrink-0"
        >
          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Register
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-bold text-slate-700">Filter Status:</span>
        {["ALL", "ISSUED", "OVERDUE", "RETURNED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === st
                ? "bg-rose-50 text-rose-700 border-rose-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Book Title & Barcode</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fine Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading circulation logs...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No circulation records found.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{issue.book?.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Barcode className="h-3 w-3 text-slate-400" />
                        <span>{issue.bookCopy?.barcode}</span>
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
                          ? `Student • Adm: ${issue.student?.admissionNumber}`
                          : `Staff • ${issue.staffUser?.email}`}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(issue.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(issue.dueDate).toLocaleDateString()}
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
                            : issue.status === "OVERDUE"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {Number(issue.fineAmount) > 0 ? (
                        <span className="font-bold text-rose-600">₹{issue.fineAmount}</span>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={Boolean(showReturnModal)}
        onClose={() => setShowReturnModal(null)}
        title="Check-In Book"
        description="Verify copy condition and return book to circulation."
        maxWidth="md"
      >
        {showReturnModal && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <div className="font-bold text-slate-900">{showReturnModal.book?.title}</div>
              <div className="text-slate-600">Barcode: {showReturnModal.bookCopy?.barcode}</div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Condition Note (Optional)
              </label>
              <Input
                placeholder="e.g. Good condition"
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
                onClick={handleReturn}
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Processing..." : "Confirm Check-In"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
