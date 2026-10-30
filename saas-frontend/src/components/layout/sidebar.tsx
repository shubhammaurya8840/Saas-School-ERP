"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  ShieldCheck,
  LogOut,
  Layers,
  Server,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_CURRENT_USER } from "@/data/mock-data";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      title: "Platform Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "Live",
    },
    {
      title: "School Tenants",
      href: "/schools",
      icon: Building2,
      badge: "28",
    },
    {
      title: "Register New School",
      href: "/schools/register",
      icon: PlusCircle,
      highlight: true,
    },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("saas_session");
    }
    router.push("/login");
  };

  return (
    <>
      {/* Mobile backdrop with soft opacity */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-70 flex-col bg-white border-r border-slate-200/90 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static shadow-2xs",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 bg-white">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-transform"
            onClick={onClose}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm shadow-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                EduSaaS Omniverse
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Super Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Core Platform
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-600 border border-blue-200/70 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide",
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.highlight && !isActive && (
                      <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* SaaS Multi-Tenant Privacy Callout */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Multi-Tenant Privacy Guard</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Super Admin view is limited to aggregate analytics. Student profiles, marks, and fees are strictly isolated inside tenant schemas.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 pt-1">
              <Server className="h-3.5 w-3.5 text-emerald-600" />
              <span>PostgreSQL RLS Active</span>
            </div>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                AS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {MOCK_CURRENT_USER.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {MOCK_CURRENT_USER.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
