"use client";

import React, { useState, useEffect } from "react";
import { School, ModuleKey } from "@/types";
import { AVAILABLE_MODULES } from "@/data/modules";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface ModulesModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (schoolId: string, updatedModules: Record<ModuleKey, boolean>) => void;
}

export function ModulesModal({
  school,
  isOpen,
  onClose,
  onSave,
}: ModulesModalProps) {
  const [modules, setModules] = useState<Record<ModuleKey, boolean>>({} as any);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  useEffect(() => {
    if (school) {
      setModules({ ...school.modules });
      setShowSavedFeedback(false);
    }
  }, [school]);

  if (!school) return null;

  const handleToggle = (key: ModuleKey) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(school.id, modules);
      setIsSaving(false);
      setShowSavedFeedback(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }, 350);
  };

  const activeCount = Object.values(modules).filter(Boolean).length;
  const totalCount = AVAILABLE_MODULES.length;

  const categories = [
    { id: "core", title: "Core & Financial Modules" },
    { id: "academic", title: "Academic & Scheduling" },
    { id: "portals", title: "User Portals" },
    { id: "operations", title: "Operations & Auxiliary Addons" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={`Module Entitlements: ${school.name}`}
      description={`Manage enabled services for tenant ${school.schoolCode}. Changes take effect immediately.`}
    >
      <div className="space-y-4">
        {/* Zero-Data-Loss Banner with low opacity */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200/70 bg-blue-50/60 p-3 text-xs text-blue-900">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">
              PRD Zero-Data-Loss Architecture
            </span>
            <p className="text-[11px] leading-relaxed text-blue-800">
              Disabling a module hides its navigation and restricts API access, but
              <strong> never deletes existing records</strong>. All transaction ledgers and files are safely preserved.
            </p>
          </div>
        </div>

        {/* Counter Header */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 pb-1">
          <span>Available Modules</span>
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
            {activeCount} of {totalCount} Active
          </span>
        </div>

        {/* Modules List by Category */}
        <div className="space-y-5">
          {categories.map((cat) => {
            const catModules = AVAILABLE_MODULES.filter(
              (m) => m.category === cat.id
            );
            if (catModules.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {cat.title}
                </h4>
                <div className="space-y-1.5">
                  {catModules.map((mod) => (
                    <div
                      key={mod.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-800">
                            {mod.name}
                          </span>
                          {mod.isCore && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              Core
                            </span>
                          )}
                          {mod.key === "student_portal" && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.2 rounded font-medium">
                              Class 5+ Only
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {mod.description}
                        </p>
                      </div>

                      <Switch
                        checked={Boolean(modules[mod.key])}
                        onCheckedChange={() => handleToggle(mod.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {showSavedFeedback && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Save Entitlements
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
