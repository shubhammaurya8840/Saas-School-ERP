"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layers,
  LogOut,
  Building2,
  ShieldCheck,
  Bell,
  Menu,
  ChevronDown,
  User,
  GraduationCap,
  Briefcase,
  DollarSign,
  BookOpen,
  Users,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiUser } from "@/services/api";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface PanelLayoutProps {
  role:
    | "SUPER_ADMIN"
    | "SCHOOL_ADMIN"
    | "ACCOUNTANT"
    | "TEACHER"
    | "PARENT"
    | "STUDENT"
    | "LIBRARIAN";
  roleTitle: string;
  roleSubtitle: string;
  badgeText: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

const ALL_PANELS = [
  { role: "SUPER_ADMIN", name: "Super Admin", href: "/super-admin", icon: ShieldCheck, color: "text-blue-600 bg-blue-50" },
  { role: "SCHOOL_ADMIN", name: "School Admin", href: "/school-admin", icon: Building2, color: "text-indigo-600 bg-indigo-50" },
  { role: "ACCOUNTANT", name: "Accountant", href: "/accountant", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
  { role: "TEACHER", name: "Teacher", href: "/teacher", icon: Briefcase, color: "text-amber-600 bg-amber-50" },
  { role: "PARENT", name: "Parent", href: "/parent", icon: Users, color: "text-purple-600 bg-purple-50" },
  { role: "STUDENT", name: "Student", href: "/student", icon: GraduationCap, color: "text-sky-600 bg-sky-50" },
  { role: "LIBRARIAN", name: "Library", href: "/library", icon: BookOpen, color: "text-rose-600 bg-rose-50" },
];

export function PanelLayout({
  role,
  roleTitle,
  roleSubtitle,
  badgeText,
  navItems,
  children,
}: PanelLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelMenuOpen, setPanelMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const session = api.getSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    router.push("/login");
  };

  const currentPanel = ALL_PANELS.find((p) => p.role === role) || ALL_PANELS[0];
  const CurrentIcon = currentPanel.icon;

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-70 flex-col bg-white border-r border-slate-200/90 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static shadow-2xs",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 bg-white">
          <Link
            href="/super-admin"
            className="flex items-center gap-2.5 group transition-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm shadow-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                School ERP SaaS
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                {badgeText}
              </span>
            </div>
          </Link>
        </div>

        {/* Panel Switcher Dropdown */}
        <div className="p-3 border-b border-slate-100 relative">
          <button
            type="button"
            onClick={() => setPanelMenuOpen(!panelMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn("p-1.5 rounded-lg shrink-0", currentPanel.color)}>
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentPanel.name} Panel
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Switch Active Portal
                </div>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", panelMenuOpen && "rotate-180")} />
          </button>

          {/* Quick Switch Menu */}
          {panelMenuOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Unified ERP Roles
              </div>
              {ALL_PANELS.map((p) => {
                const Icon = p.icon;
                const isSelected = p.role === role;
                return (
                  <Link
                    key={p.role}
                    href={p.href}
                    onClick={() => {
                      setPanelMenuOpen(false);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-blue-600" : "text-slate-400")} />
                      <span>{p.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold">
                        Active
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {roleTitle}
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
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
                          isActive
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-700"
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
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tenant Scoping Note */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-Tenant Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Role permissions and tenant scoping enforced on both API and PostgreSQL levels.
            </p>
          </div>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {currentUser ? currentUser.fullName.slice(0, 2).toUpperCase() : "SA"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {currentUser ? currentUser.fullName : "Alex Sterling"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentUser ? currentUser.email : "alex.sterling@edusaas.io"}
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

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-sm font-bold text-slate-900">{roleTitle}</h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">{roleSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>{badgeText}</span>
            </span>

            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
