"use client";

import React from "react";
import { School } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/schools/status-badge";
import { AVAILABLE_MODULES } from "@/data/modules";
import {
  User,
  Mail,
  Phone,
  HardDrive,
  Users,
  GraduationCap,
  Calendar,
  Globe,
  Upload,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SchoolDetailsModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (schoolId: string) => void;
  onOpenModulesModal: (school: School) => void;
}

export function SchoolDetailsModal({
  school,
  isOpen,
  onClose,
  onToggleStatus,
  onOpenModulesModal,
}: SchoolDetailsModalProps) {
  if (!school) return null;

  const enabledModules = AVAILABLE_MODULES.filter((m) => school.modules[m.key]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={school.name}
      description={`School Tenant Overview • Registration Code: ${school.schoolCode}`}
    >
      <div className="space-y-5">
        {/* Top Info Banner with low opacity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {school.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {school.schoolCode}
                </span>
                <StatusBadge status={school.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                <span>{school.slug}.edusaas.io</span>
                <span>•</span>
                <span>{school.city}, {school.state}</span>
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <Button
              variant={school.status === "active" ? "danger" : "success"}
              size="sm"
              onClick={() => onToggleStatus(school.id)}
              className="text-xs h-7"
            >
              {school.status === "active" ? "Suspend Workspace" : "Reactivate Workspace"}
            </Button>
          </div>
        </div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Primary Admin */}
          <div className="rounded-xl border border-slate-200/80 p-3.5 space-y-1.5 bg-white">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Primary Administrator
            </h4>
            <div className="space-y-1 text-slate-600">
              <p className="font-medium text-slate-800">{school.primaryAdmin.name}</p>
              <p className="flex items-center gap-1.5 text-[11px]">
                <Mail className="h-3 w-3 text-slate-400" />
                {school.primaryAdmin.email}
              </p>
              {school.primaryAdmin.phone && (
                <p className="flex items-center gap-1.5 text-[11px]">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {school.primaryAdmin.phone}
                </p>
              )}
              <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Auth: {school.primaryAdmin.status === "active" ? "Password Verified" : "Invite Pending"}
              </span>
            </div>
          </div>

          {/* Subscription & Limits */}
          <div className="rounded-xl border border-slate-200/80 p-3.5 space-y-1.5 bg-white">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              Plan & Quotas
            </h4>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <p className="font-medium text-slate-800 capitalize text-xs">
                {school.subscription.plan} Tier • Renews {formatDate(school.subscription.renewalDate)}
              </p>
              <p className="flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3 text-slate-400" />
                Student Quota: {school.metrics.studentsCount} / {school.subscription.maxStudents}
              </p>
              <p className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-slate-400" />
                Staff Quota: {school.metrics.staffCount} / {school.subscription.maxStaff}
              </p>
              <p className="flex items-center gap-1.5">
                <HardDrive className="h-3 w-3 text-slate-400" />
                Storage Limit: {school.subscription.storageLimitMb / 1000} GB
              </p>
            </div>
          </div>
        </div>

        {/* Upload Permissions Card (PRD Section 2) */}
        <div className="rounded-xl border border-slate-200/80 p-3.5 space-y-2 bg-white">
          <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-emerald-600" />
            School Upload Policies (PRD Section 2)
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-50/80">
              <span className="text-[10px] text-slate-400 block">Student Uploads</span>
              <span className={`font-semibold text-xs ${school.uploadSettings.allowStudentUploads ? "text-emerald-600" : "text-rose-500"}`}>
                {school.uploadSettings.allowStudentUploads ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/80">
              <span className="text-[10px] text-slate-400 block">Parent Uploads</span>
              <span className={`font-semibold text-xs ${school.uploadSettings.allowParentUploads ? "text-emerald-600" : "text-rose-500"}`}>
                {school.uploadSettings.allowParentUploads ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/80">
              <span className="text-[10px] text-slate-400 block">Staff Uploads</span>
              <span className={`font-semibold text-xs ${school.uploadSettings.allowStaffUploads ? "text-emerald-600" : "text-rose-500"}`}>
                {school.uploadSettings.allowStaffUploads ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Enabled Modules Badges */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-900">
              Enabled Modules ({enabledModules.length} Active)
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenModulesModal(school)}
              className="text-xs h-6 px-2"
            >
              Configure Modules
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {enabledModules.map((mod) => (
              <span
                key={mod.key}
                className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200/60"
              >
                {mod.name}
              </span>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
