"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  Printer,
  Building2,
  X,
  AlertCircle,
  CheckCircle2,
  Undo2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/services/api";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash Counter" },
  { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
  { value: "UPI", label: "UPI (QR / Direct Transfer)" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "DEMAND_DRAFT", label: "Demand Draft (DD)" },
];

export default function PaymentCollectionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [studentPlans, setStudentPlans] = useState<any[]>([]);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Record Form
  const [recordForm, setRecordForm] = useState({
    studentFeePlanId: "",
    amount: "",
    paymentMethod: "CASH",
    transactionReference: "",
    paymentDate: "",
    remarks: "",
  });

  useEffect(() => {
    setRecordForm((prev) => ({
      ...prev,
      paymentDate: new Date().toISOString().split("T")[0],
    }));
  }, []);

  // Printable Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Refund / Reversal Modal
  const [refundPaymentTarget, setRefundPaymentTarget] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.fees.payments.list({
        search: searchQuery.trim() || undefined,
        paymentMethod: methodFilter !== "all" ? methodFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setPayments(res.payments || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.warn("Unable to load fee collections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnpaidPlans = async () => {
    try {
      const res = await api.fees.getDues({ limit: 100 });
      // Filter only those with outstanding balance > 0
      const pending = (res.records || []).filter((r: any) => Number(r.balanceAmount) > 0);
      setStudentPlans(pending);
    } catch (err) {
      console.warn("Unable to load unpaid fee plans:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, methodFilter, statusFilter]);

  const handleOpenRecordModal = () => {
    setRecordForm({
      studentFeePlanId: "",
      amount: "",
      paymentMethod: "CASH",
      transactionReference: "",
      paymentDate: new Date().toISOString().split("T")[0],
      remarks: "",
    });
    setModalError("");
    loadUnpaidPlans();
    setIsRecordModalOpen(true);
  };

  const selectedPlan = studentPlans.find((p) => p.id === recordForm.studentFeePlanId);
  const currentBalance = selectedPlan ? Number(selectedPlan.balanceAmount) : 0;

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    const payAmount = parseFloat(recordForm.amount);
    if (!payAmount || payAmount <= 0) {
      setModalError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (payAmount > currentBalance + 0.01) {
      setModalError(`Payment amount (₹${payAmount}) exceeds outstanding balance of ₹${currentBalance}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate client-side idempotency key to prevent accidental duplicate submission
      const idempotencyKey = `rec-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const res = await api.fees.payments.record({
        studentFeePlanId: recordForm.studentFeePlanId,
        amount: payAmount,
        paymentMethod: recordForm.paymentMethod,
        transactionReference: recordForm.transactionReference.trim() || undefined,
        paymentDate: new Date(recordForm.paymentDate).toISOString(),
        remarks: recordForm.remarks.trim() || undefined,
        idempotencyKey,
      });

      setIsRecordModalOpen(false);
      loadPayments();

      // Open receipt immediately for printing
      const receipt = await api.fees.getReceipt(res.receiptNumber);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      setModalError(err.message || "Failed to record manual payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPaymentTarget || !refundReason.trim()) return;

    setIsRefunding(true);
    try {
      await api.fees.payments.refund(refundPaymentTarget.id, {
        refundReason: refundReason.trim(),
      });
      setRefundPaymentTarget(null);
      setRefundReason("");
      loadPayments();
    } catch (err: any) {
      alert(err.message || "Failed to process payment reversal.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePrintReceipt = async (receiptNumber: string) => {
    try {
      const receipt = await api.fees.getReceipt(receiptNumber);
      setSelectedReceipt(receipt);
    } catch (err) {
      console.error("Unable to load receipt:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-emerald-600" />
            Manual Collections & Printable Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record money received via Cash, Bank Transfer, Cheque, or UPI. Generate official printable receipts.
          </p>
        </div>

        <Button
          onClick={handleOpenRecordModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Record Manual Payment
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt #, student name, admission #, or transaction ref..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Mode:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Modes</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
              <option value="DEMAND_DRAFT">Demand Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="SUCCESS">Success / Posted</option>
              <option value="REFUNDED">Refunded / Reversed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mb-2"></div>
            <p>Loading fee collections...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No payment receipts found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click 'Record Manual Payment' to log collections confirmed at the cash counter or bank ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Receipt No</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Payment Mode</th>
                  <th className="px-4 py-3.5">Reference / Cheque</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.receiptNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-900">{p.student?.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {p.student?.admissionNumber} • {p.student?.gradeLevel}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {p.paymentMethod?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {p.transactionReference || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
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
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintReceipt(p.receiptNumber)}
                          className="text-xs h-7 px-2 text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          Receipt
                        </Button>

                        {p.status === "SUCCESS" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRefundPaymentTarget(p);
                              setRefundReason("");
                            }}
                            className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Refund
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Manual Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                Record Offline Manual Payment
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Student Fee Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={recordForm.studentFeePlanId}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, studentFeePlanId: e.target.value })
                  }
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student with Dues --</option>
                  {studentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.student?.fullName} ({p.student?.admissionNumber}) • Due: ₹{Number(p.balanceAmount).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlan && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Dues</span>
                    <span className="font-bold text-rose-600 text-sm">
                      ₹{currentBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fee Plan</span>
                    <span className="font-semibold text-slate-800">{selectedPlan.feePlan?.name}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 25000"
                    value={recordForm.amount}
                    onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                    className="text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recordForm.paymentMethod}
                    onChange={(e) => setRecordForm({ ...recordForm, paymentMethod: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Reference / Cheque No
                  </label>
                  <Input
                    placeholder="Cheque No, UTR, Deposit Slip"
                    value={recordForm.transactionReference}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, transactionReference: e.target.value })
                    }
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Date Received
                  </label>
                  <Input
                    type="date"
                    value={recordForm.paymentDate}
                    onChange={(e) => setRecordForm({ ...recordForm, paymentDate: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Accounting Remarks (Optional)
                </label>
                <Input
                  placeholder="e.g. Term 1 partial cash receipt at counter"
                  value={recordForm.remarks}
                  onChange={(e) => setRecordForm({ ...recordForm, remarks: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {isSubmitting ? "Posting..." : "Confirm & Issue Receipt"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audited Refund / Reversal Modal */}
      {refundPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Audited Payment Reversal / Refund
              </h3>
              <button
                onClick={() => setRefundPaymentTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-bold">Accounting Rule Notice:</p>
              <p>
                Posted payment #{refundPaymentTarget.receiptNumber} (₹{Number(refundPaymentTarget.amount).toLocaleString("en-IN")}) will be marked as REFUNDED.
                The student's fee plan balance will be restored automatically. The audit record is permanently preserved.
              </p>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Reversal <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Cheque returned unpaid / Entry error"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundPaymentTarget(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRefunding}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  {isRefunding ? "Processing..." : "Authorize Reversal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-600 p-1"
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
                {selectedReceipt.school?.city}, {selectedReceipt.school?.state} • Affiliation:{" "}
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
                  <span className="text-slate-400 block text-[11px]">Date</span>
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
              <span className="text-[11px] text-slate-400">Cashier Signature Required</span>
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
