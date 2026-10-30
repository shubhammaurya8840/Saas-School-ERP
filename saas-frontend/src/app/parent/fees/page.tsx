"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Receipt,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  HelpCircle,
  Users,
  GraduationCap,
  FileText,
  ShieldCheck,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface ChildFeeData {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  gradeLevel: string;
  section?: string;
  relationship?: string;
  schoolName: string;
  activeFeePlan: {
    id: string;
    name: string;
    academicYear: string;
    grossAmount: number;
    concessionAmount: number;
    concessionType?: string;
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    installments: Array<{
      id: string;
      title: string;
      dueDate: string;
      amount: number | string;
      paidAmount: number | string;
      status: string;
      lateFeeFine?: number | string;
    }>;
    payments: Array<{
      id: string;
      receiptNumber: string;
      amount: number | string;
      paymentMethod: string;
      transactionReference?: string;
      paymentDate: string;
      status: string;
      remarks?: string;
    }>;
  } | null;
}

export default function ParentFeesPage() {
  const [childrenFeeList, setChildrenFeeList] = useState<ChildFeeData[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  const fetchChildrenFees = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.fees.getParentChildren();
      if (Array.isArray(data)) {
        setChildrenFeeList(data);
      }
    } catch (err: any) {
      console.error("Failed to fetch parent fee data:", err);
      setErrorMsg(err.message || "Unable to load children fee records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenFees();
  }, []);

  const openReceiptModal = async (identifier: string) => {
    setIsReceiptLoading(true);
    try {
      const receipt = await api.fees.getReceipt(identifier);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      alert("Failed to load official receipt: " + (err.message || "Not found"));
    } finally {
      setIsReceiptLoading(false);
    }
  };

  const selectedChild = childrenFeeList[selectedChildIndex] || null;
  const plan = selectedChild?.activeFeePlan;

  return (
    <div className="space-y-6">
      {/* Top Header & Child Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fee Records & Receipts
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Audited Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Family Fee Statement
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official fee schedules, manual payment receipts, and outstanding dues for your children.
          </p>
        </div>

        {/* Child Selector Pills */}
        {childrenFeeList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Select Child:
            </span>
            {childrenFeeList.map((c, idx) => (
              <button
                key={c.studentId}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedChildIndex === idx
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                {c.fullName}
                <span className="text-[10px] opacity-80">
                  ({c.gradeLevel}
                  {c.section ? `-${c.section}` : ""})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual Payment Policy Notice */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm flex items-start gap-3">
        <Building className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold">Manual & Offline Fee Reconciliation Policy</p>
          <p className="text-blue-700 leading-relaxed">
            In accordance with institutional guidelines, online gateway checkouts are disabled.
            Fees may be deposited via <strong>Bank Transfer (NEFT / RTGS / IMPS)</strong>,{" "}
            <strong>Official UPI QR</strong>, <strong>Cheque</strong>, or <strong>Cash</strong> at
            the school Accounts Office. Once confirmed by the Accountant, your official numbered
            receipt is generated and instantly viewable below.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Loading student fee records...</p>
        </div>
      ) : errorMsg ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      ) : !selectedChild ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No linked children found</p>
          <p className="text-xs text-slate-500 mt-1">
            Please contact the school administration to link student records to your parent account.
          </p>
        </div>
      ) : !plan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">
            No active fee plan assigned for {selectedChild.fullName}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            The school accounts office has not yet assigned a fee plan for the current academic session.
          </p>
        </div>
      ) : (
        <>
          {/* Fee Balance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fee Structure
              </span>
              <div className="text-base font-bold text-slate-900 truncate">{plan.name}</div>
              <p className="text-[11px] text-slate-500 font-medium">Session: {plan.academicYear}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Net Annual Fee
              </span>
              <div className="text-2xl font-bold text-slate-900">
                ₹{plan.netAmount.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-500">
                Gross: ₹{plan.grossAmount.toLocaleString("en-IN")}{" "}
                {plan.concessionAmount > 0 && (
                  <span className="text-emerald-700 font-semibold">
                    (Concession: -₹{plan.concessionAmount.toLocaleString("en-IN")})
                  </span>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Amount Paid
              </span>
              <div className="text-2xl font-bold text-emerald-600">
                ₹{plan.paidAmount.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Reconciled by Accounts
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <div
                className={`text-2xl font-bold ${
                  plan.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                ₹{plan.balanceAmount.toLocaleString("en-IN")}
              </div>
              <p
                className={`text-[11px] font-bold ${
                  plan.status === "PAID"
                    ? "text-emerald-700"
                    : plan.status === "PARTIALLY_PAID"
                    ? "text-amber-700"
                    : "text-rose-700"
                }`}
              >
                Status: {plan.status.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Installment Schedule & Due Dates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Installment Schedule & Due Dates
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {plan.installments?.length || 0} Terms
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Term / Installment</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Scheduled Amount</th>
                    <th className="py-2.5 px-3">Paid Amount</th>
                    <th className="py-2.5 px-3">Due Balance</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plan.installments && plan.installments.length > 0 ? (
                    plan.installments.map((inst) => {
                      const amount = Number(inst.amount);
                      const paid = Number(inst.paidAmount);
                      const balance = Math.max(0, amount - paid);
                      const isOverdue =
                        balance > 0 && new Date(inst.dueDate).getTime() < Date.now();

                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-900">{inst.title}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {new Date(inst.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {isOverdue && (
                              <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            ₹{amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-600">
                            ₹{paid.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ₹{balance.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                inst.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : inst.status === "PARTIALLY_PAID"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {inst.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        No installments configured for this fee plan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History & Printable Receipts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Confirmed Payments & Official Receipts
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {plan.payments?.length || 0} Recorded Receipts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Reference / Txn ID</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plan.payments && plan.payments.length > 0 ? (
                    plan.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-purple-700">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {p.paymentMethod.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {p.transactionReference || "—"}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-600">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReceiptModal(p.receiptNumber)}
                            className="h-7 text-[11px] font-bold text-purple-700 border-purple-200 hover:bg-purple-50 flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            View Receipt
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No manual payments recorded yet. Receipts will appear here once money is received
                        by the accounts desk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Official Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Official Fee Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div
              id="printable-receipt"
              className="border-2 border-slate-300 rounded-xl p-6 bg-slate-50/40 space-y-5"
            >
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedReceipt.school?.name || "School ERP"}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedReceipt.school?.address || "Accounts & Finance Department"}
                </p>
                <div className="mt-3 inline-block px-3 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded-full">
                  OFFICIAL FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Details Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedReceipt.receiptNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Payment Date:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedReceipt.paymentDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Student Name:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.student?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Admission Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.student?.admissionNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Grade / Section:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.student?.gradeLevel}
                    {selectedReceipt.student?.section ? ` - ${selectedReceipt.student.section}` : ""}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Fee Structure:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.feePlan?.name} ({selectedReceipt.feePlan?.academicYear})
                  </span>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Payment Mode:</span>
                  <span className="font-bold text-slate-900">
                    {selectedReceipt.paymentMethod?.replace("_", " ")}
                  </span>
                </div>
                {selectedReceipt.transactionReference && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Transaction Reference:</span>
                    <span className="font-mono text-slate-800">
                      {selectedReceipt.transactionReference}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 text-sm font-bold border-b border-slate-200">
                  <span className="text-slate-900">Amount Received:</span>
                  <span className="text-purple-700 font-extrabold text-base">
                    ₹{Number(selectedReceipt.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Remaining Outstanding Balance:</span>
                  <span className="font-bold text-slate-900">
                    ₹{Number(selectedReceipt.feePlan?.remainingBalance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Status and Signature Footer */}
              <div className="pt-4 flex items-end justify-between text-xs">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    CONFIRMED & AUDITED
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Recorded by Accounts Officer: {selectedReceipt.recordedBy?.name || "Accountant"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Authorized Cashier / Stamp
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedReceipt(null)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Official Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
