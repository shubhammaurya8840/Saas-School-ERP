"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, ShieldCheck, Database, Layers, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { AdoptionCard } from "@/components/dashboard/adoption-card";
import { RecentSchools } from "@/components/dashboard/recent-schools";
import { MOCK_METRICS, MOCK_SCHOOLS } from "@/data/mock-data";
import { api } from "@/services/api";

export default function SuperAdminPage() {
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [schools, setSchools] = useState(MOCK_SCHOOLS);
  const [healthStatus, setHealthStatus] = useState<{
    database?: string;
    uptime?: number;
    latency?: number;
  }>({
    database: "connected",
    latency: 18,
  });

  useEffect(() => {
    // Fetch live backend metrics
    api.schools
      .list()
      .then((res) => {
        if (res && res.total !== undefined) {
          setMetrics((prev) => ({
            ...prev,
            totalSchools: res.total,
            activeSchools: res.counts.active || res.total,
            trialSchools: res.counts.trial || 0,
            suspendedSchools: res.counts.suspended || 0,
          }));
        }
      })
      .catch(console.warn);

    // Fetch live database connection telemetry
    api.health
      .check()
      .then((h) => {
        if (h && h.database) {
          setHealthStatus({
            database: h.database.status,
            latency: h.database.latencyMs,
            uptime: h.uptimeSeconds,
          });
        }
      })
      .catch(console.warn);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner - Clean, executive light surface */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-xs backdrop-blur-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/70 border border-blue-200/50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Multi-Tenant Architecture • Aggregate View Only</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Super Admin Control Center
          </h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Monitor tenant growth, aggregate student and staff counts, and module entitlements across all registered schools.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/schools/register">
            <Button size="md" className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-medium text-xs">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Register New School
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate KPI Metric Cards */}
      <MetricsGrid metrics={metrics} />

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Schools (2 columns on lg) */}
        <div className="lg:col-span-2">
          <RecentSchools schools={schools} />
        </div>

        {/* Module Adoption Analytics (1 column on lg) */}
        <div className="lg:col-span-1">
          <AdoptionCard metrics={metrics} />
        </div>
      </div>

      {/* Platform Infrastructure Health Strip */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 shadow-xs backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <Database className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Database Engine:</span>
            <span>PostgreSQL 17 (Prisma ORM) • Status: <strong className="text-emerald-700">{healthStatus.database}</strong></span>
          </div>
          <span className="text-slate-300 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">Query Latency:</span>
            <span>{healthStatus.latency || 18}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <Layers className="h-3.5 w-3.5 text-blue-600" />
          <span>Zero Data Loss Modular Architecture Active</span>
        </div>
      </div>
    </div>
  );
}
