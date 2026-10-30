"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  PlusCircle,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Platform Overview";
    if (pathname === "/schools") return "School Tenants";
    if (pathname === "/schools/register") return "Register New School";
    return "Super Admin Console";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/dashboard"
            className="hover:text-blue-600 font-medium transition-colors"
          >
            SaaS Root
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-semibold text-slate-800">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right: Telemetry status & Quick Action */}
      <div className="flex items-center gap-3">
        {/* System Uptime Badge with low opacity */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <Activity className="h-3 w-3 animate-pulse text-emerald-600" />
          <span>99.98% SLA • Live</span>
        </div>

        {/* Register School CTA */}
        {pathname !== "/schools/register" && (
          <Link href="/schools/register">
            <Button size="sm" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8">
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Register School
            </Button>
          </Link>
        )}

        {/* Notifications Icon */}
        <button
          type="button"
          title="Audit Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
        </button>
      </div>
    </header>
  );
}
