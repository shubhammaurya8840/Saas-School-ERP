"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/services/api";

export default function SchoolAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdResult, setCreatedResult] = useState<{
    employeeId: string;
    fullName: string;
    email: string;
    role: string;
    invitationUrl?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "TEACHER",
    department: "Mathematics",
    designation: "Senior Educator",
    phone: "",
    employeeId: "",
    password: "",
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.users.list({
        role: roleFilter !== "all" ? roleFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setUsers(res.users || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.warn("Unable to load live staff members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadUsers();
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, roleFilter]);

  const handleOpenModal = () => {
    setFormData({
      fullName: "",
      email: "",
      role: "TEACHER",
      department: "Mathematics",
      designation: "Senior Educator",
      phone: "",
      employeeId: "",
      password: "",
    });
    setFormError("");
    setCreatedResult(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await api.users.create({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        department: formData.department.trim() || undefined,
        designation: formData.designation.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        employeeId: formData.employeeId.trim() || undefined,
        password: formData.password.trim() || undefined,
      });

      setCreatedResult({
        employeeId: res.user.employeeId,
        fullName: res.user.fullName,
        email: res.user.email,
        role: res.user.role,
        invitationUrl: res.invitation?.invitationUrl,
      });

      // Reload directory list
      loadUsers();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message || "Failed to register user.");
      } else {
        setFormError("Network error. Please verify backend is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member '${name}'?`)) return;
    try {
      await api.users.delete(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Could not delete user.");
    }
  };

  const copyInvitation = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>School Tenant Staff & Faculty Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Staff & User Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Register teachers, administrative staff, and accountants with automated employee IDs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={handleOpenModal}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, employee ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles ({totalCount})</option>
            <option value="TEACHER">Teachers</option>
            <option value="ACCOUNTANT">Accountants</option>
            <option value="STAFF">Administrative Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Registered Faculty & Staff
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {users.length} {users.length === 1 ? "member" : "members"} displayed
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading staff records...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              No staff members found matching your search.
            </p>
            <Button size="sm" onClick={handleOpenModal} variant="outline" className="text-xs">
              Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                        {u.employeeId || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{u.fullName}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === "TEACHER"
                            ? "bg-amber-50 text-amber-800 border border-amber-200/70"
                            : u.role === "ACCOUNTANT"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                            : "bg-blue-50 text-blue-800 border border-blue-200/70"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {u.department || "General"}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {u.designation || "Staff Member"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        title="Remove User"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Register Staff / Teacher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign role, department, and generate unique employee ID.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdResult ? (
              <div className="space-y-5 text-center py-4">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Staff Member Enrolled!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Employee ID: <strong className="text-indigo-700 font-mono">{createdResult.employeeId}</strong>
                  </p>
                </div>

                {createdResult.invitationUrl && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Single-Use Password Setup URL
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdResult.invitationUrl}
                        className="w-full font-mono text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyInvitation(createdResult.invitationUrl!)}
                        variant="outline"
                        className="shrink-0 text-xs h-8"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Done & Return to Directory
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Prof. David Miller"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Email Address"
                      type="email"
                      required
                      placeholder="david.miller@school.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 tracking-tight">
                      Staff Role <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="TEACHER">Teacher / Faculty</option>
                      <option value="ACCOUNTANT">Accountant / Bursar</option>
                      <option value="STAFF">Administrative Staff</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Department"
                      placeholder="e.g. Mathematics / Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <Input
                      label="Designation"
                      placeholder="e.g. Senior Faculty"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Phone Number (Optional)"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Input
                      label="Employee ID (Leave blank to auto-generate)"
                      placeholder="Auto-generated e.g. TCH-0001"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <Input
                    label="Direct Password (Optional; creates invitation link if blank)"
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    helperText="If blank, a secure single-use invitation URL will be generated."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    Register Staff Member
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
