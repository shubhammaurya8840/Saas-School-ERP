import React from "react";
import Link from "next/link";
import { Building2, ArrowRight, User, Calendar } from "lucide-react";
import { School } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface RecentSchoolsProps {
  schools: School[];
}

export function RecentSchools({ schools }: RecentSchoolsProps) {
  const getStatusBadge = (status: School["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="success" dot size="sm">
            Active
          </Badge>
        );
      case "trial":
        return (
          <Badge variant="warning" dot size="sm">
            Trial
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="danger" dot size="sm">
            Suspended
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Recent Tenant Registrations
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Latest provisioned school workspaces on the SaaS network
          </p>
        </div>
        <Link
          href="/schools"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {schools.slice(0, 5).map((school) => (
          <div
            key={school.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">
                {school.name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs text-slate-900">
                    {school.name}
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/50 px-1.5 py-0.2 rounded">
                    {school.schoolCode}
                  </span>
                  {getStatusBadge(school.status)}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    {school.primaryAdmin.name}
                  </span>
                  <span className="hidden sm:inline-flex">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {formatDate(school.createdAt)}
                  </span>
                  <span className="hidden sm:inline-flex">•</span>
                  <span className="capitalize text-slate-600">
                    {school.subscription.plan} Plan
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800">
                  {school.metrics.studentsCount} Students
                </div>
                <div className="text-[10px] text-slate-400">
                  {school.metrics.staffCount} Staff
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
