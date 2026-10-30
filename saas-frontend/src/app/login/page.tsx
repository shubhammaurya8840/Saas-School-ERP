"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  School,
  Wallet,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/services/api";

interface DemoAccount {
  role: string;
  label: string;
  email: string;
  pass: string;
  icon: any;
  destination: string;
  color: string;
  bgLight: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    email: "alex.sterling@edusaas.io",
    pass: "SuperAdmin@2026",
    icon: ShieldCheck,
    destination: "/super-admin",
    color: "text-purple-700 border-purple-300",
    bgLight: "bg-purple-50",
  },
  {
    role: "SCHOOL_ADMIN",
    label: "School Admin",
    email: "admin@apex.edu",
    pass: "Admin@12345",
    icon: School,
    destination: "/school-admin",
    color: "text-blue-700 border-blue-300",
    bgLight: "bg-blue-50",
  },
  {
    role: "ACCOUNTANT",
    label: "Accountant",
    email: "accountant@apex.edu",
    pass: "Admin@12345",
    icon: Wallet,
    destination: "/accountant",
    color: "text-emerald-700 border-emerald-300",
    bgLight: "bg-emerald-50",
  },
  {
    role: "TEACHER",
    label: "Teacher",
    email: "teacher@apex.edu",
    pass: "Admin@12345",
    icon: GraduationCap,
    destination: "/teacher",
    color: "text-amber-700 border-amber-300",
    bgLight: "bg-amber-50",
  },
  {
    role: "LIBRARIAN",
    label: "Librarian",
    email: "librarian@apex.edu",
    pass: "Admin@12345",
    icon: BookOpen,
    destination: "/library",
    color: "text-indigo-700 border-indigo-300",
    bgLight: "bg-indigo-50",
  },
  {
    role: "PARENT",
    label: "Parent",
    email: "parent@apex.edu",
    pass: "Admin@12345",
    icon: Users,
    destination: "/parent",
    color: "text-rose-700 border-rose-300",
    bgLight: "bg-rose-50",
  },
  {
    role: "STUDENT",
    label: "Student",
    email: "student@apex.edu",
    pass: "Admin@12345",
    icon: UserCheck,
    destination: "/student",
    color: "text-cyan-700 border-cyan-300",
    bgLight: "bg-cyan-50",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("SUPER_ADMIN");
  const [email, setEmail] = useState("alex.sterling@edusaas.io");
  const [password, setPassword] = useState("SuperAdmin@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getRedirectForRole = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "/super-admin";
      case "SCHOOL_ADMIN":
        return "/school-admin";
      case "ACCOUNTANT":
        return "/accountant";
      case "TEACHER":
        return "/teacher";
      case "PARENT":
        return "/parent";
      case "STUDENT":
        return "/student";
      case "LIBRARIAN":
        return "/library";
      default:
        return "/super-admin";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const session = await api.auth.login({
        email: email.trim(),
        password,
      });

      const destination = getRedirectForRole(session.user.role);
      router.push(destination);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || "Invalid email or password.");
      } else {
        setErrorMessage(
          "Unable to connect to authentication server. Please verify backend is running on port 4000."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoRole = (account: DemoAccount) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.pass);
    setErrorMessage("");
  };

  const currentRoleConfig = DEMO_ACCOUNTS.find((a) => a.role === selectedRole);

  return (
    <div className="flex min-h-screen liquid-bg-mesh font-sans text-slate-900 relative items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Decorative ambient liquid blobs */}
      <div className="absolute top-1/6 left-1/4 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/4 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-100/20 blur-3xl pointer-events-none" />

      {/* Main Fluid Glass Container */}
      <div className="relative z-10 w-full max-w-xl">
        <div className="fluid-card glass-panel p-6 sm:p-8 md:p-10 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25">
              <Layers className="h-7 w-7" />
            </div>
            <h1 className="heading-liquid-xl">
              School ERP SaaS
            </h1>
            <p className="subheading-liquid">
              Multi-Tenant Institutional Operating System • All 7 Roles
            </p>
          </div>

          {/* Quick Role Switcher for 1-Click Manual Testing */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                1-Click Demo Credentials
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Target: {currentRoleConfig?.destination}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole === acc.role;
                const IconComponent = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => selectDemoRole(acc)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-blue-300" : "text-slate-500"}`} />
                    <span className="truncate">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 font-semibold shadow-xs">
              {errorMessage}
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                label="Official Email Address"
                type="email"
                required
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 tracking-tight">
                Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                <span>Remember session</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset instructions sent to registered official email.");
                }}
                className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20 mt-2 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <span>Sign In as {currentRoleConfig?.label || "User"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Privacy & Security Footer */}
          <div className="border-t border-slate-200/80 pt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Multi-Tenant Architecture • Role-Based Access Isolation Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
