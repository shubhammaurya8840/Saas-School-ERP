"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  PlusCircle,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/services/api";

const GRADE_OPTIONS = [
  "All Grades",
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

export default function FeeCategoriesPage() {
  const [activeTab, setActiveTab] = useState<"heads" | "plans">("heads");
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [feePlans, setFeePlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isHeadModalOpen, setIsHeadModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Head Form
  const [headForm, setHeadForm] = useState({
    name: "",
    code: "",
    description: "",
    isRecurring: true,
  });

  // Plan Form
  const [planForm, setPlanForm] = useState<{
    name: string;
    academicYear: string;
    applicableGrade: string;
    description: string;
    items: Array<{ feeHeadId: string; amount: string }>;
    installments: Array<{ title: string; dueDate: string; amount: string }>;
  }>({
    name: "",
    academicYear: "2026-2027",
    applicableGrade: "Class 8",
    description: "",
    items: [{ feeHeadId: "", amount: "" }],
    installments: [
      { title: "Term 1 Installment", dueDate: "2026-08-10", amount: "" },
      { title: "Term 2 Installment", dueDate: "2026-11-15", amount: "" },
    ],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headsRes, plansRes] = await Promise.all([
        api.fees.heads.list(),
        api.fees.plans.list(),
      ]);
      setFeeHeads(headsRes || []);
      setFeePlans(plansRes || []);
    } catch (err) {
      console.warn("Unable to load fee categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHead = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setIsSubmitting(true);
    try {
      await api.fees.heads.create({
        name: headForm.name.trim(),
        code: headForm.code.trim().toUpperCase(),
        description: headForm.description.trim() || undefined,
        isRecurring: headForm.isRecurring,
      });
      setIsHeadModalOpen(false);
      setHeadForm({ name: "", code: "", description: "", isRecurring: true });
      loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create fee head.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHead = async (id: string) => {
    if (!confirm("Are you sure you want to remove this fee head?")) return;
    try {
      await api.fees.heads.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Cannot delete fee head in active use.");
    }
  };

  // Calculations for Plan modal
  const planTotal = planForm.items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const installmentTotal = planForm.installments.reduce(
    (sum, inst) => sum + (parseFloat(inst.amount) || 0),
    0
  );

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (planForm.items.some((i) => !i.feeHeadId || !i.amount || parseFloat(i.amount) <= 0)) {
      setModalError("Please select a fee head and enter a valid amount for all items.");
      return;
    }

    if (
      planForm.installments.length > 0 &&
      Math.abs(planTotal - installmentTotal) > 0.05
    ) {
      setModalError(
        `Installment total (₹${installmentTotal}) must equal the items total (₹${planTotal}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.fees.plans.create({
        name: planForm.name.trim(),
        academicYear: planForm.academicYear.trim(),
        applicableGrade:
          planForm.applicableGrade === "All Grades"
            ? undefined
            : planForm.applicableGrade,
        description: planForm.description.trim() || undefined,
        items: planForm.items.map((i) => ({
          feeHeadId: i.feeHeadId,
          amount: parseFloat(i.amount),
        })),
        installments: planForm.installments.map((inst) => ({
          title: inst.title.trim(),
          dueDate: new Date(inst.dueDate).toISOString(),
          amount: parseFloat(inst.amount),
        })),
      });

      setIsPlanModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create fee plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Fee Categories & Structures
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure fee heads, grade templates, and installment due date schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "heads" ? (
            <Button
              onClick={() => {
                setModalError("");
                setIsHeadModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              New Fee Head
            </Button>
          ) : (
            <Button
              onClick={() => {
                setModalError("");
                setIsPlanModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Create Fee Plan
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab("heads")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "heads"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          Fee Heads & Categories ({feeHeads.length})
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "plans"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Fee Plans & Installments ({feePlans.length})
        </button>
      </div>

      {/* Tab 1: Fee Heads */}
      {activeTab === "heads" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeHeads.map((head) => (
              <div
                key={head.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {head.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        head.isRecurring
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {head.isRecurring ? "Recurring" : "One-Time"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 mt-2.5 text-sm">{head.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {head.description || "Standard curriculum fee category"}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Added: {new Date(head.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleDeleteHead(head.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {feeHeads.length === 0 && !isLoading && (
              <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200">
                <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No fee heads configured</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click 'New Fee Head' to add categories like Tuition Fee, Lab Fee, or Transportation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Fee Plans */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feePlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        {plan.applicableGrade || "All Grades"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {plan.academicYear}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{plan.name}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Package</span>
                    <span className="text-base font-bold text-emerald-700">
                      ₹{Number(plan.totalAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Head Breakdown:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {plan.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex justify-between"
                      >
                        <span className="text-slate-700 font-medium">{item.feeHead?.name}</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Installments */}
                {plan.installments && plan.installments.length > 0 && (
                  <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Scheduled Installments:
                    </span>
                    <div className="space-y-1">
                      {plan.installments.map((inst: any) => (
                        <div
                          key={inst.id}
                          className="flex justify-between py-1 text-slate-600 border-b border-slate-50"
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {inst.title}
                            <span className="text-[10px] text-slate-400">
                              (Due: {new Date(inst.dueDate).toLocaleDateString("en-IN")})
                            </span>
                          </span>
                          <span className="font-bold text-slate-800">
                            ₹{Number(inst.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {feePlans.length === 0 && !isLoading && (
              <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No fee plans configured</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click 'Create Fee Plan' to define grade-wise fee structures and installment due dates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Fee Head Modal */}
      {isHeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                Add Fee Head Category
              </h3>
              <button
                onClick={() => setIsHeadModalOpen(false)}
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

            <form onSubmit={handleCreateHead} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Tuition Fee, Transport, Library"
                  value={headForm.name}
                  onChange={(e) => setHeadForm({ ...headForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Short Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. TUI, TRN, LAB"
                  value={headForm.code}
                  onChange={(e) => setHeadForm({ ...headForm, code: e.target.value.toUpperCase() })}
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description (Optional)
                </label>
                <Input
                  placeholder="Brief note on what this head covers"
                  value={headForm.description}
                  onChange={(e) => setHeadForm({ ...headForm, description: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurringCheck"
                  checked={headForm.isRecurring}
                  onChange={(e) => setHeadForm({ ...headForm, isRecurring: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="recurringCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Recurring fee (charged per term/year)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHeadModalOpen(false)}
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
                  {isSubmitting ? "Saving..." : "Save Fee Head"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Fee Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Configure New Fee Plan Structure
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
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

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Class 8 Comprehensive Fee Plan 2026-2027"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Applicable Grade
                  </label>
                  <select
                    value={planForm.applicableGrade}
                    onChange={(e) => setPlanForm({ ...planForm, applicableGrade: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Fee Heads Included:
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPlanForm({
                        ...planForm,
                        items: [...planForm.items, { feeHeadId: "", amount: "" }],
                      })
                    }
                    className="text-[11px] h-6 px-2 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {planForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        required
                        value={item.feeHeadId}
                        onChange={(e) => {
                          const newItems = [...planForm.items];
                          newItems[idx].feeHeadId = e.target.value;
                          setPlanForm({ ...planForm, items: newItems });
                        }}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                      >
                        <option value="">-- Select Fee Head --</option>
                        {feeHeads.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.code})
                          </option>
                        ))}
                      </select>

                      <Input
                        required
                        type="number"
                        min="0"
                        placeholder="Amount (₹)"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...planForm.items];
                          newItems[idx].amount = e.target.value;
                          setPlanForm({ ...planForm, items: newItems });
                        }}
                        className="w-32 text-xs"
                      />

                      {planForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = planForm.items.filter((_, i) => i !== idx);
                            setPlanForm({ ...planForm, items: newItems });
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1 text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span>Total Plan Amount:</span>
                  <span className="text-emerald-700 text-sm">₹{planTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Installments Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Installment Due Dates:
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPlanForm({
                        ...planForm,
                        installments: [
                          ...planForm.installments,
                          { title: `Term ${planForm.installments.length + 1}`, dueDate: "", amount: "" },
                        ],
                      })
                    }
                    className="text-[11px] h-6 px-2 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Term
                  </Button>
                </div>

                <div className="space-y-2">
                  {planForm.installments.map((inst, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        required
                        placeholder="e.g. Term 1"
                        value={inst.title}
                        onChange={(e) => {
                          const newInst = [...planForm.installments];
                          newInst[idx].title = e.target.value;
                          setPlanForm({ ...planForm, installments: newInst });
                        }}
                        className="col-span-5 text-xs"
                      />

                      <Input
                        required
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) => {
                          const newInst = [...planForm.installments];
                          newInst[idx].dueDate = e.target.value;
                          setPlanForm({ ...planForm, installments: newInst });
                        }}
                        className="col-span-4 text-xs"
                      />

                      <Input
                        required
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={inst.amount}
                        onChange={(e) => {
                          const newInst = [...planForm.installments];
                          newInst[idx].amount = e.target.value;
                          setPlanForm({ ...planForm, installments: newInst });
                        }}
                        className="col-span-2 text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const newInst = planForm.installments.filter((_, i) => i !== idx);
                          setPlanForm({ ...planForm, installments: newInst });
                        }}
                        className="col-span-1 text-slate-400 hover:text-rose-500 p-1 flex justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1 text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span>Total Installments:</span>
                  <span
                    className={`text-sm ${
                      Math.abs(planTotal - installmentTotal) <= 0.05
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    ₹{installmentTotal.toLocaleString("en-IN")}{" "}
                    {Math.abs(planTotal - installmentTotal) > 0.05 && `(Difference: ₹${planTotal - installmentTotal})`}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlanModalOpen(false)}
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
                  {isSubmitting ? "Creating Plan..." : "Publish Fee Plan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
