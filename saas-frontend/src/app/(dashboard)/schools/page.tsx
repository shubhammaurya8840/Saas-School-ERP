"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  PlusCircle,
  SlidersHorizontal,
  Eye,
  Power,
  Layers,
  LayoutGrid,
  List,
} from "lucide-react";
import { School, SchoolStatus, ModuleKey, SubscriptionPlan } from "@/types";
import { MOCK_SCHOOLS } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/schools/status-badge";
import { ModulesModal } from "@/components/schools/modules-modal";
import { SchoolDetailsModal } from "@/components/schools/school-details-modal";
import { formatDate } from "@/lib/utils";
import { DEFAULT_MODULE_SELECTION } from "@/data/modules";
import { api } from "@/services/api";

export default function SchoolsListPage() {
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal states
  const [selectedSchoolForModules, setSelectedSchoolForModules] = useState<School | null>(null);
  const [selectedSchoolForDetails, setSelectedSchoolForDetails] = useState<School | null>(null);

  // Fetch real schools from backend
  useEffect(() => {
    let isMounted = true;
    api.schools.list()
      .then((res) => {
        if (!isMounted || !res || !res.schools || res.schools.length === 0) return;
        const mapped: School[] = res.schools.map((s: any) => ({
          id: s.id,
          schoolCode: s.schoolCode,
          name: s.name,
          legalName: s.legalName || s.name,
          slug: s.slug,
          board: s.board || "CBSE",
          academicYear: s.academicYear || "2026-2027",
          status: (s.status?.toLowerCase() as SchoolStatus) || "active",
          city: s.city || "Bengaluru",
          state: s.state || "Karnataka",
          country: s.country || "India",
          timezone: "Asia/Kolkata",
          currency: "INR",
          createdAt: s.createdAt,
          updatedAt: s.createdAt,
          primaryAdmin: {
            name: s.primaryAdmin?.name || "School Administrator",
            email: s.primaryAdmin?.email || `admin@${s.slug}.org`,
            phone: s.primaryAdmin?.phone || "+91 98765 43210",
            status: "active",
          },
          subscription: {
            plan: (s.plan?.toLowerCase() as SubscriptionPlan) || "growth",
            status: "active",
            renewalDate: "2027-03-31",
            maxStudents: s.quotas?.maxStudents || 2500,
            maxStaff: s.quotas?.maxStaff || 150,
            storageLimitMb: s.quotas?.storageLimitMb || 15000,
          },
          modules: { ...DEFAULT_MODULE_SELECTION },
          uploadSettings: s.uploadSettings || {
            allowStudentUploads: true,
            allowParentUploads: true,
            allowStaffUploads: true,
          },
          metrics: {
            studentsCount: 450,
            staffCount: 32,
            storageUsedMb: 2100,
          },
        }));
        setSchools(mapped);
      })
      .catch((err) => {
        console.warn("Using fallback local schools data:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered schools calculation
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSearch =
        searchQuery === "" ||
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.primaryAdmin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || school.status === statusFilter;

      const matchesPlan =
        planFilter === "all" || school.subscription.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [schools, searchQuery, statusFilter, planFilter]);

  const handleSaveModules = (schoolId: string, updatedModules: Record<ModuleKey, boolean>) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, modules: updatedModules } : s))
    );
    api.schools.updateModules(schoolId, updatedModules).catch(console.error);
  };

  const handleToggleStatus = (schoolId: string) => {
    const target = schools.find((s) => s.id === schoolId);
    if (!target) return;
    const nextStatus: SchoolStatus =
      target.status === "active" ? "suspended" : "active";

    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, status: nextStatus } : s))
    );
    setSelectedSchoolForDetails((prev) =>
      prev && prev.id === schoolId ? { ...prev, status: nextStatus } : prev
    );

    api.schools.updateStatus(schoolId, nextStatus.toUpperCase()).catch(console.error);
  };

  const statusCounts = {
    all: schools.length,
    active: schools.filter((s) => s.status === "active").length,
    trial: schools.filter((s) => s.status === "trial").length,
    suspended: schools.filter((s) => s.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            School Tenants Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage registered schools, workspace status, module entitlements, and tenant quotas.
          </p>
        </div>

        <Link href="/schools/register">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Register New School
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar with low-opacity surfaces */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        {/* Status Filter Tabs & View Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Tenants", count: statusCounts.all },
              { id: "active", label: "Active", count: statusCounts.active },
              { id: "trial", label: "Free Trial", count: statusCounts.trial },
              { id: "suspended", label: "Suspended", count: statusCounts.suspended },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  statusFilter === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                viewMode === "table"
                  ? "bg-slate-100 border-slate-300 text-slate-900 font-bold shadow-2xs"
                  : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-100 border-slate-300 text-slate-900 font-bold shadow-2xs"
                  : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Input & Plan Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by school name, code (SCH-XXXX), admin email, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4 text-slate-400" />}
            />
          </div>

          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs transition-colors hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
            >
              <option value="all">All Subscription Plans</option>
              <option value="starter">Starter Plan</option>
              <option value="growth">Growth Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content View: Table or Grid */}
      {filteredSchools.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No school tenants found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            No schools match your search query or selected filter criteria. Try adjusting your search term.
          </p>
          <div className="mt-5 flex justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPlanFilter("all");
              }}
            >
              Clear Filters
            </Button>
            <Link href="/schools/register">
              <Button size="sm">
                Register New School
              </Button>
            </Link>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">School Code & Name</th>
                  <th className="px-5 py-3.5">Primary Administrator</th>
                  <th className="px-5 py-3.5">Subscription Plan</th>
                  <th className="px-5 py-3.5">Aggregate Counts</th>
                  <th className="px-5 py-3.5">Modules</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((school) => {
                  const activeModulesCount = Object.values(school.modules).filter(
                    Boolean
                  ).length;

                  return (
                    <tr
                      key={school.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Code & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {school.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {school.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50/80 px-1.5 py-0.2 rounded border border-blue-100">
                                {school.schoolCode}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-slate-400">
                                {school.city}, {school.board}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Admin Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 text-xs">
                          {school.primaryAdmin.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {school.primaryAdmin.email}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <span className="capitalize font-semibold text-slate-700 text-xs">
                          {school.subscription.plan}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Renews {formatDate(school.subscription.renewalDate)}
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 text-xs">
                          {school.metrics.studentsCount} Students
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {school.metrics.staffCount} Staff
                        </div>
                      </td>

                      {/* Modules Count Pill */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSchoolForModules(school)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-slate-200/70 text-slate-700 transition-colors cursor-pointer"
                        >
                          <Layers className="h-3 w-3 text-blue-600" />
                          <span>{activeModulesCount}/14 Active</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={school.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Configure Modules"
                            onClick={() => setSelectedSchoolForModules(school)}
                            className="h-7 px-2"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View School Details"
                            onClick={() => setSelectedSchoolForDetails(school)}
                            className="h-7 px-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={
                              school.status === "active"
                                ? "Suspend School Workspace"
                                : "Reactivate School Workspace"
                            }
                            onClick={() => handleToggleStatus(school.id)}
                            className={`h-7 px-2 ${
                              school.status === "active"
                                ? "text-slate-400 hover:text-rose-600"
                                : "text-emerald-600 hover:text-emerald-700"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((school) => {
            const activeModulesCount = Object.values(school.modules).filter(
              Boolean
            ).length;

            return (
              <div
                key={school.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {school.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-slate-900 line-clamp-1">
                          {school.name}
                        </h3>
                        <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50/80 px-1.5 py-0.2 rounded border border-blue-100">
                          {school.schoolCode}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={school.status} size="sm" />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Admin:</span>
                      <span className="font-medium text-slate-800">
                        {school.primaryAdmin.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Plan & Board:</span>
                      <span className="capitalize font-medium text-slate-700">
                        {school.subscription.plan} • {school.board}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Students & Staff:</span>
                      <span className="font-semibold text-slate-800">
                        {school.metrics.studentsCount} / {school.metrics.staffCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSchoolForModules(school)}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>{activeModulesCount}/14 Modules</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSchoolForDetails(school)}
                      className="text-xs h-7 px-2"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modules Configuration Modal */}
      <ModulesModal
        school={selectedSchoolForModules}
        isOpen={Boolean(selectedSchoolForModules)}
        onClose={() => setSelectedSchoolForModules(null)}
        onSave={handleSaveModules}
      />

      {/* School Full Details Modal */}
      <SchoolDetailsModal
        school={selectedSchoolForDetails}
        isOpen={Boolean(selectedSchoolForDetails)}
        onClose={() => setSelectedSchoolForDetails(null)}
        onToggleStatus={handleToggleStatus}
        onOpenModulesModal={(school) => {
          setSelectedSchoolForDetails(null);
          setSelectedSchoolForModules(school);
        }}
      />
    </div>
  );
}
