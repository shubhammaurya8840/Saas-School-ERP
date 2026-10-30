import React from "react";
import { SuperAdminMetrics } from "@/types";
import { Layers, ShieldCheck, Info } from "lucide-react";

interface AdoptionCardProps {
  metrics: SuperAdminMetrics;
}

export function AdoptionCard({ metrics }: AdoptionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            Module Adoption Rates
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Active services across {metrics.totalSchools} school tenants
          </p>
        </div>
        <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
          Live Sync
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {metrics.moduleAdoption.map((mod) => (
          <div key={mod.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                {mod.name}
              </span>
              <span className="font-semibold text-slate-500 text-[11px]">
                {mod.count} ({mod.percentage}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  mod.percentage >= 90
                    ? "bg-blue-600"
                    : mod.percentage >= 60
                    ? "bg-indigo-500"
                    : mod.percentage >= 40
                    ? "bg-amber-500"
                    : "bg-slate-300"
                }`}
                style={{ width: `${mod.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-blue-50/40 p-3 text-[11px] text-slate-600 border border-blue-100/70 flex items-start gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Zero Data Loss:</strong> Disabling a module hides menus and stops API routes, but preserves 100% of stored records.
        </span>
      </div>
    </div>
  );
}
