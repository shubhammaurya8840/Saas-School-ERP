"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  PlusCircle,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  Receipt,
  GraduationCap,
  Percent,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/services/api";

const GRADE_LEVELS = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const CONCESSION_TYPES = [
  { value: "", label: "No Concession (Standard Fee)" },
  { value: "SIBLING_CONCESSION", label: "Sibling Concession (Rule 5)" },
  { value: "MERIT_SCHOLARSHIP", label: "Merit Scholarship (Academic Excellence)" },
  { value: "STAFF_CHILD", label: "Staff Child Subsidy" },
  { value: "EWS", label: "EWS / Need-Based Financial Aid" },
  { value: "SPECIAL_DISCOUNT", label: "Special Discretionary Concession" },
];

export default function FeeInvoicesPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    studentId: "",
    feePlanId: "",
    concessionType: "",
    concessionAmount: "",
  });

  // Ledger Modal
  const [selectedLedger, setSelectedLedger] = useState<{
    student: any;
    feePlans: any[];
  } | null>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  const loadDues = async () => {
    setIsLoading(true);
    try {
      const res = await api.fees.getDues({
        search: searchQuery.trim() || undefined,
        gradeLevel: gradeFilter !== "all" ? gradeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setRecords(res.records || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.warn("Unable to load fee dues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [studRes, plansRes] = await Promise.all([
        api.students.list({ limit: 100 }),
        api.fees.plans.list(),
      ]);
      setStudentsList(studRes.students || []);
      setPlansList(plansRes || []);
    } catch (err) {
      console.warn("Unable to load assign dependencies:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDues();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, gradeFilter, statusFilter]);

  const handleOpenAssignModal = () => {
    setAssignForm({
      studentId: "",
      feePlanId: "",
      concessionType: "",
      concessionAmount: "",
    });
    setModalError("");
    loadDependencies();
    setIsAssignModalOpen(true);
  };

  const selectedPlan = plansList.find((p) => p.id === assignForm.feePlanId);
  const grossAmount = selectedPlan ? Number(selectedPlan.totalAmount) : 0;
  const concessionVal = parseFloat(assignForm.concessionAmount) || 0;
  const netAmount = Math.max(0, grossAmount - concessionVal);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!assignForm.studentId || !assignForm.feePlanId) {
      setModalError("Please select both a student and a fee plan.");
      return;
    }

    if (concessionVal > grossAmount) {
      setModalError(`Concession cannot exceed gross fee of ₹${grossAmount}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.fees.assign({
        studentId: assignForm.studentId,
        feePlanId: assignForm.feePlanId,
        concessionType: assignForm.concessionType || undefined,
        concessionAmount: concessionVal > 0 ? concessionVal : undefined,
      });
      setIsAssignModalOpen(false);
      loadDues();
    } catch (err: any) {
      setModalError(err.message || "Failed to assign fee plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewLedger = async (studentId: string) => {
    setIsLedgerLoading(true);
    try {
      const res = await api.fees.getStudentLedger(studentId);
      setSelectedLedger(res);
    } catch (err: any) {
      alert(err.message || "Failed to load student ledger.");
    } finally {
      setIsLedgerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-emerald-600" />
            Student Fee Invoices & Dues Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign plans with sibling or merit concessions, track outstanding balances, and inspect student ledgers.
          </p>
        </div>

        <Button
          onClick={handleOpenAssignModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Assign Fee Plan to Student
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or admission number..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Grades</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
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
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mb-2"></div>
            <p>Loading student fee ledgers...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No student fee plans found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click 'Assign Fee Plan to Student' to assign a fee plan to an enrolled student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Admission No</th>
                  <th className="px-4 py-3.5">Student Details</th>
                  <th className="px-4 py-3.5">Fee Plan</th>
                  <th className="px-4 py-3.5">Gross</th>
                  <th className="px-4 py-3.5">Concession / Aid</th>
                  <th className="px-4 py-3.5">Net Fee</th>
                  <th className="px-4 py-3.5">Paid</th>
                  <th className="px-4 py-3.5">Outstanding Dues</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const gross = Number(r.grossAmount);
                  const conc = Number(r.concessionAmount);
                  const net = Number(r.netAmount);
                  const paid = Number(r.paidAmount);
                  const bal = Number(r.balanceAmount);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {r.student?.admissionNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-semibold text-slate-900">{r.student?.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            {r.student?.gradeLevel} {r.student?.section ? `• Sec ${r.student?.section}` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-800">
                        {r.feePlan?.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        ₹{gross.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        {conc > 0 ? (
                          <div>
                            <span className="text-xs font-bold text-indigo-700 block">
                              -₹{conc.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {r.concessionType?.replace("_", " ") || "Concession"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ₹{net.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-emerald-700">
                        ₹{paid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-bold ${
                            bal > 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          ₹{bal.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            r.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "PARTIALLY_PAID"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLedger(r.studentId)}
                          className="text-xs h-7 px-2.5 text-slate-700 hover:text-emerald-700 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="h-3 w-3" />
                          Ledger
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Fee Plan Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Assign Fee Plan & Concessions
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
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

            <form onSubmit={handleAssignSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Enrolled Student <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student --</option>
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.admissionNumber}) • {s.gradeLevel} {s.section ? `Sec ${s.section}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Fee Structure Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignForm.feePlanId}
                  onChange={(e) => setAssignForm({ ...assignForm, feePlanId: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Fee Plan --</option>
                  {plansList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{Number(p.totalAmount).toLocaleString("en-IN")}) • {p.applicableGrade || "All Grades"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Concession / Scholarship Type
                  </label>
                  <select
                    value={assignForm.concessionType}
                    onChange={(e) => setAssignForm({ ...assignForm, concessionType: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800"
                  >
                    {CONCESSION_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Concession Amount (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={assignForm.concessionAmount}
                    onChange={(e) => setAssignForm({ ...assignForm, concessionAmount: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Live Fee Calculation Preview */}
              {selectedPlan && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Fee Package:</span>
                    <span>₹{grossAmount.toLocaleString("en-IN")}</span>
                  </div>
                  {concessionVal > 0 && (
                    <div className="flex justify-between text-indigo-700 font-semibold">
                      <span>Concession Discount:</span>
                      <span>-₹{concessionVal.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                    <span>Net Student Fee:</span>
                    <span className="text-emerald-700">₹{netAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(false)}
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
                  {isSubmitting ? "Assigning..." : "Confirm & Assign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Ledger Drawer / Modal */}
      {selectedLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Student Fee Ledger: {selectedLedger.student?.fullName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedLedger.student?.admissionNumber} • {selectedLedger.student?.gradeLevel}
                </p>
              </div>
              <button
                onClick={() => setSelectedLedger(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedLedger.feePlans.map((plan: any) => (
              <div key={plan.id} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{plan.feePlan?.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Academic Year: {plan.academicYear}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      plan.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gross Fee</span>
                    <span className="font-bold text-slate-800">
                      ₹{Number(plan.grossAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Concession</span>
                    <span className="font-bold text-indigo-700">
                      -₹{Number(plan.concessionAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Paid</span>
                    <span className="font-bold text-emerald-700">
                      ₹{Number(plan.paidAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Balance Due</span>
                    <span className="font-bold text-rose-600">
                      ₹{Number(plan.balanceAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Payments History */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recorded Payments ({plan.payments?.length || 0}):
                  </span>
                  {plan.payments?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
                  ) : (
                    plan.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800">{p.receiptNumber}</span>
                          <span className="text-slate-400 ml-2">
                            {new Date(p.paymentDate).toLocaleDateString("en-IN")} via {p.paymentMethod}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={() => setSelectedLedger(null)}
                className="bg-slate-800 text-white text-xs font-semibold"
              >
                Close Ledger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
