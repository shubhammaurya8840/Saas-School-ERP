"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Receipt,
  FileText,
  CreditCard,
  PlusCircle,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Percent,
  AlertCircle,
  Printer,
  X,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/services/api";
import Link from "next/link";

export default function AccountantPage() {
  const [summary, setSummary] = useState<{
    totalPlansAssigned: number;
    totalGrossBilled: number;
    totalConcessionsGranted: number;
    totalNetBilled: number;
    totalCollected: number;
    totalOutstandingDues: number;
    methodBreakdown: Record<string, number>;
    statusCounts: Record<string, number>;
  } | null>(null);

  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, payRes] = await Promise.all([
        api.fees.getSummary(),
        api.fees.payments.list({ limit: 7 }),
      ]);
      setSummary(sumRes);
      setRecentPayments(payRes.payments || []);
    } catch (err) {
      console.warn("Unable to load live financial summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleViewReceipt = async (receiptNumber: string) => {
    setIsReceiptLoading(true);
    try {
      const receipt = await api.fees.getReceipt(receiptNumber);
      setSelectedReceipt(receipt);
    } catch (err) {
      console.error("Failed to load receipt:", err);
    } finally {
      setIsReceiptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Financial Summary Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Manual Fee Ledger • Fiscal Year 2026-2027</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Accounts & Fee Management Console
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manual fee reconciliation, offline payment entries (Cash, UPI, Cheque, Bank Transfer), and audited receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={loadDashboardData}
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link href="/accountant/collections">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Record Manual Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Gross Billed
          </span>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary ? summary.totalGrossBilled.toLocaleString("en-IN") : "0"}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Across {summary ? summary.totalPlansAssigned : 0} Assigned Fee Plans
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Collections
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            ₹{summary ? summary.totalCollected.toLocaleString("en-IN") : "0"}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Cash, Bank Transfer, UPI, Cheque
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Outstanding Fee Dues
          </span>
          <div className="text-2xl font-bold text-rose-600">
            ₹{summary ? summary.totalOutstandingDues.toLocaleString("en-IN") : "0"}
          </div>
          <p className="text-[11px] text-rose-700 font-medium">
            {summary ? summary.statusCounts?.PENDING || 0 : 0} Pending •{" "}
            {summary ? summary.statusCounts?.PARTIALLY_PAID || 0 : 0} Partial
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Scholarships & Concessions
          </span>
          <div className="text-2xl font-bold text-indigo-600">
            ₹{summary ? summary.totalConcessionsGranted.toLocaleString("en-IN") : "0"}
          </div>
          <p className="text-[11px] text-indigo-700 font-medium">
            Sibling, Merit & EWS Aid Subsidies
          </p>
        </div>
      </div>

      {/* 2-Column: Payment Methods Breakdown & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <span>Collections by Payment Mode</span>
            <span className="text-xs font-normal text-slate-400">Manual Verification</span>
          </h2>

          <div className="space-y-3 text-xs">
            {[
              { label: "Bank Transfer (NEFT/RTGS/IMPS)", key: "BANK_TRANSFER", color: "bg-blue-600" },
              { label: "UPI (QR / Direct Transfer)", key: "UPI", color: "bg-emerald-600" },
              { label: "Cash Counter", key: "CASH", color: "bg-amber-600" },
              { label: "Cheque / Demand Draft", key: "CHEQUE", color: "bg-purple-600" },
            ].map((m) => {
              const amt = summary?.methodBreakdown?.[m.key] || 0;
              const total = summary?.totalCollected || 1;
              const pct = Math.round((amt / total) * 100);

              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="font-bold text-slate-900">
                      ₹{amt.toLocaleString("en-IN")} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Module Navigation Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/accountant/categories"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Fee Plans & Heads
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure curriculum fee heads, grade structures, and installment schedules.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-600 mt-4 flex items-center gap-1">
              Manage Structures →
            </span>
          </Link>

          <Link
            href="/accountant/invoices"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Student Invoices & Dues
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Assign plans with sibling or merit concessions, view balances and overdue dues.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 mt-4 flex items-center gap-1">
              View Dues Ledger →
            </span>
          </Link>

          <Link
            href="/accountant/collections"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Collections & Receipts
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Record manual receipts, generate printable copies, and manage audited refunds.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-4 flex items-center gap-1">
              View Receipts →
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Payment Transactions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Recent Payment Transactions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit record of manual fee collections entered into the ledger.
            </p>
          </div>
          <Link href="/accountant/collections">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              View All Payments
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mb-2"></div>
            <p>Loading real-time financial records...</p>
          </div>
        ) : recentPayments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use "Record Manual Payment" to log fee receipts from cash, UPI, bank transfer, or cheque.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Fee Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.receiptNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{p.student?.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {p.student?.admissionNumber} • {p.student?.gradeLevel}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {p.studentFeePlan?.feePlan?.name || "Curriculum Plan"}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(p.receiptNumber)}
                        className="text-xs h-7 px-2.5 text-slate-700 hover:text-emerald-700 flex items-center gap-1 ml-auto"
                      >
                        <Printer className="h-3 w-3" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Official Fee Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Letterhead */}
            <div className="text-center space-y-1 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {selectedReceipt.school?.name}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedReceipt.school?.city}, {selectedReceipt.school?.state} • Affiliated to{" "}
                {selectedReceipt.school?.board}
              </p>
              <div className="pt-2">
                <span className="font-mono text-xs font-bold bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-slate-800">
                  RECEIPT #{selectedReceipt.receiptNumber}
                </span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.student?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Admission Number</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedReceipt.student?.admissionNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Grade & Section</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.student?.gradeLevel} {selectedReceipt.student?.section ? `• Sec ${selectedReceipt.student?.section}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedReceipt.paymentDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.paymentMethod?.replace("_", " ")}
                  </span>
                </div>
                {selectedReceipt.transactionReference && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Reference / Cheque No:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedReceipt.transactionReference}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Amount Paid:</span>
                  <span className="text-sm font-bold text-emerald-700">
                    ₹{Number(selectedReceipt.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Remaining Balance:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(selectedReceipt.feePlan?.remainingBalance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Computer Generated Receipt</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Receipt
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedReceipt(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
