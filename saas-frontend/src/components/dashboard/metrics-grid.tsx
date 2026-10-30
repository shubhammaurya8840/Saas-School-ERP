import React from "react";
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { SuperAdminMetrics } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface MetricsGridProps {
  metrics: SuperAdminMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const cards = [
    {
      title: "Registered School Tenants",
      value: metrics.totalSchools,
      formatted: formatNumber(metrics.totalSchools),
      subtext: `${metrics.activeSchools} active • ${metrics.trialSchools} trial • ${metrics.suspendedSchools} suspended`,
      change: "+4 this month",
      icon: Building2,
      iconBg: "bg-blue-50/80 text-blue-600 border border-blue-100",
    },
    {
      title: "Total Aggregate Students",
      value: metrics.totalStudents,
      formatted: formatNumber(metrics.totalStudents),
      subtext: "Across all active school workspaces",
      change: "+12.4% vs last term",
      icon: GraduationCap,
      iconBg: "bg-emerald-50/80 text-emerald-600 border border-emerald-100",
    },
    {
      title: "Total Staff & Faculty",
      value: metrics.totalStaff,
      formatted: formatNumber(metrics.totalStaff),
      subtext: "Teachers, accountants & administrators",
      change: "+8.1% vs last term",
      icon: Users,
      iconBg: "bg-purple-50/80 text-purple-600 border border-purple-100",
    },
    {
      title: "Monthly Recurring Revenue",
      value: metrics.mrr,
      formatted: formatCurrency(metrics.mrr),
      subtext: "Standard & Enterprise plans",
      change: "+18.2% annual",
      icon: TrendingUp,
      iconBg: "bg-amber-50/80 text-amber-600 border border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {card.formatted}
                </h3>
              </div>
              <div className={`rounded-xl p-3 shadow-2xs ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500 font-medium truncate max-w-[160px]">
                {card.subtext}
              </span>
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg shrink-0">
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
