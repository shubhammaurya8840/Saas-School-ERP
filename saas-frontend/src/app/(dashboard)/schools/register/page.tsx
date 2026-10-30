"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Upload,
  Key,
  Copy,
  Info,
  Globe,
  Sliders,
  Check,
  Calendar,
  MapPin,
  Compass,
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  CreditCard,
  CheckCheck,
  Layers,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AVAILABLE_MODULES, DEFAULT_MODULE_SELECTION } from "@/data/modules";
import { ModuleKey, SubscriptionPlan, UploadSettings } from "@/types";
import { generateSchoolCode } from "@/lib/utils";
import { api, ApiError } from "@/services/api";

export default function RegisterSchoolPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    slug: "",
    board: "CBSE",
    academicYear: "", // Optional as per PRD Rule 2
    city: "",
    state: "",
    country: "India",
    timezone: "Asia/Kolkata",
    currency: "INR",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminDesignation: "Principal / Director",
    plan: "growth" as SubscriptionPlan,
    maxStudents: 2500,
    maxStaff: 150,
    storageLimitMb: 15000,
    modules: { ...DEFAULT_MODULE_SELECTION },
    uploadSettings: {
      allowStudentUploads: true,
      allowParentUploads: true,
      allowStaffUploads: true,
    } as UploadSettings,
  });

  const [registrationResult, setRegistrationResult] = useState<{
    schoolCode: string;
    schoolName: string;
    slug: string;
    adminEmail: string;
    invitationUrl: string;
  } | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setFormData((prev) => ({
      ...prev,
      name: val,
      slug:
        prev.slug === "" ||
        prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          ? generatedSlug
          : prev.slug,
    }));
  };

  const handleModuleToggle = (key: ModuleKey) => {
    setFormData((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: !prev.modules[key],
      },
    }));
  };

  const handleUploadSettingToggle = (key: keyof UploadSettings) => {
    setFormData((prev) => ({
      ...prev,
      uploadSettings: {
        ...prev.uploadSettings,
        [key]: !prev.uploadSettings[key],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.schools.register({
        name: formData.name.trim(),
        legalName: formData.legalName?.trim() || undefined,
        slug: formData.slug.trim(),
        board: formData.board,
        academicYear: formData.academicYear?.trim() || undefined,
        email: formData.adminEmail.trim(),
        phone: formData.adminPhone.trim() || "+91 98765 43210",
        city: formData.city.trim() || "Bengaluru",
        state: formData.state.trim() || "Karnataka",
        country: formData.country,
        timezone: formData.timezone,
        currency: formData.currency,
        plan: formData.plan.toUpperCase(),
        maxStudents: formData.maxStudents,
        maxStaff: formData.maxStaff,
        storageLimitMb: formData.storageLimitMb,
        adminName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPhone: formData.adminPhone?.trim() || undefined,
        adminDesignation: formData.adminDesignation?.trim() || undefined,
        modules: formData.modules,
        uploadSettings: formData.uploadSettings,
      });

      setRegistrationResult({
        schoolCode: res.school.schoolCode,
        schoolName: res.school.name,
        slug: res.school.slug,
        adminEmail: res.admin.email,
        invitationUrl: res.invitation.invitationUrl,
      });

      setCurrentStep(6);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setSubmitError(err.message || "Failed to register school. Please verify all fields.");
      } else {
        setSubmitError(err.message || "Network error. Please ensure backend is reachable.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const steps = [
    { num: 1, title: "School Details", sub: "Branding & Workspace URL", icon: Building2 },
    { num: 2, title: "Administrator", sub: "Zero-Knowledge Invite", icon: User },
    { num: 3, title: "Plan & Quotas", sub: "Subscription & Limits", icon: CreditCard },
    { num: 4, title: "Modules & Uploads", sub: "Features & Security", icon: Sliders },
    { num: 5, title: "Review & Commit", sub: "Atomic Provisioning", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1.5 tracking-wider uppercase">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span>Tenant Provisioning Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Register New School Tenant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Provision an isolated multi-tenant school workspace with automated registration code and dedicated database scope.
          </p>
        </div>

        <Link href="/schools">
          <Button variant="outline" size="sm" className="text-xs shrink-0 shadow-2xs font-semibold">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Schools Directory
          </Button>
        </Link>
      </div>

      {/* PRD Rule Callout: Executive Architecture Banner */}
      <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-5 shadow-xs border-l-4 border-l-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  PRD Section 2: Automated Registration Number & Multi-Tenant Rule
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Automated
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                The unique School Code (e.g. <strong className="font-mono text-blue-700 font-bold bg-white/90 px-1.5 py-0.5 rounded border border-blue-200">SCH-XXXX</strong>)
                is generated automatically upon atomic commit; it is never entered by users.
                Academic session is optional at registration and can be configured later by the School Admin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Zero Partial Writes
            </span>
          </div>
        </div>
      </div>

      {/* Modern Stepper Header */}
      {currentStep <= 5 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
          {/* Top Progress Track */}
          <div className="mb-4 hidden sm:block">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span className="text-slate-800 font-bold">
                Step {currentStep} of 5: {steps[currentStep - 1].title}
              </span>
              <span className="font-mono text-blue-600 font-bold">
                {currentStep * 20}% Completed
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${currentStep * 20}%` }}
              />
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {steps.map((s) => {
              const isActive = currentStep === s.num;
              const isPassed = currentStep > s.num;
              const StepIcon = s.icon;

              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200 border ${
                    isActive
                      ? "bg-blue-50/80 border-blue-200 ring-2 ring-blue-500/10 shadow-xs"
                      : isPassed
                      ? "bg-slate-50 border-slate-200/80"
                      : "bg-white border-transparent opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30"
                        : isPassed
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {isPassed ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isActive
                          ? "text-blue-900"
                          : isPassed
                          ? "text-slate-800"
                          : "text-slate-500"
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                      {s.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================= */}
        {/* STEP 1: SCHOOL IDENTITY & LOCATION                        */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-7">
            {/* Step header */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Step 1 of 5 • Institution Setup
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                School Identity & Location
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Enter the primary institution name, legal trust affiliation, and tenant workspace URL identifier.
              </p>
            </div>

            {/* Sub-Card 1: Institution Branding & Workspace URL */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Branding & Workspace URL
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Input
                    label="School Name"
                    required
                    icon={<Building2 className="h-4 w-4" />}
                    placeholder="e.g. Greenwood International Academy"
                    value={formData.name}
                    onChange={handleNameChange}
                    helperText="Official school name displayed across student reports, fee receipts, and portal headers."
                  />
                </div>

                <div>
                  <Input
                    label="Legal Entity / Trust Name"
                    icon={<Briefcase className="h-4 w-4" />}
                    placeholder="e.g. Greenwood Educational Trust Ltd"
                    value={formData.legalName}
                    onChange={(e) =>
                      setFormData({ ...formData, legalName: e.target.value })
                    }
                    helperText="Registered society or trust entity used for billing and tax invoices."
                  />
                </div>

                <div>
                  <Input
                    label="Tenant Workspace Slug"
                    required
                    icon={<Globe className="h-4 w-4" />}
                    placeholder="e.g. greenwood-academy"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    badge={
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                        Subdomain
                      </span>
                    }
                    helperText={
                      formData.slug ? (
                        <span className="font-mono text-blue-700 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-600" /> https://{formData.slug}.edusaas.io
                        </span>
                      ) : (
                        "Accessible URL for teachers, students, and parent portals."
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sub-Card 2: Academic Board & Physical Location */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60">
                <Award className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Affiliation Board & Campus Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 tracking-tight">
                    Affiliated Education Board <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Award className="h-4 w-4" />
                    </div>
                    <select
                      value={formData.board}
                      onChange={(e) =>
                        setFormData({ ...formData, board: e.target.value })
                      }
                      style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
                      className="block w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs transition-all duration-200 hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
                    >
                      <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                      <option value="ICSE">ICSE / CISCE (Indian Certificate)</option>
                      <option value="State Board">State Secondary Board</option>
                      <option value="IB / Cambridge">IB / Cambridge International (IGCSE)</option>
                      <option value="Other">Other / Independent Curriculum</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Defines default grade scales and examination schemes.
                  </p>
                </div>

                <div>
                  <Input
                    label="Academic Session (Optional)"
                    icon={<Calendar className="h-4 w-4" />}
                    placeholder="e.g. 2026-2027"
                    value={formData.academicYear}
                    onChange={(e) =>
                      setFormData({ ...formData, academicYear: e.target.value })
                    }
                    badge={
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Optional (PRD Rule)
                      </span>
                    }
                    helperText="Optional at registration. Can be configured later in School Settings."
                  />
                </div>

                <div>
                  <Input
                    label="City"
                    required
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Input
                    label="State / Province"
                    required
                    icon={<Compass className="h-4 w-4" />}
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-3">
              <span className="text-xs text-slate-500 font-medium">
                Fields marked with <span className="text-rose-500 font-bold">*</span> are required
              </span>
              <Button
                type="button"
                size="md"
                onClick={() => setCurrentStep(2)}
                disabled={!formData.name || !formData.city || !formData.state}
                className="px-6 font-bold"
              >
                <span>Continue to Administrator</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: ADMINISTRATOR SETUP                               */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 2 of 5 • Primary Administrator
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                Primary School Administrator
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Set up the principal or head administrator who will manage this school tenant workspace.
              </p>
            </div>

            {/* Zero-Knowledge Security Notice */}
            <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white p-4.5 text-xs text-emerald-950 flex items-start gap-3.5 shadow-2xs border-l-4 border-l-emerald-600">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/25">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-emerald-950">
                    PRD Section 6: Zero-Knowledge Password Security Architecture
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full uppercase tracking-wider">
                    Secure
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-normal">
                  Passwords are never visible to SaaS administrators or stored in plaintext. The system generates
                  a secure single-use token and sends an invitation URL directly to the administrator to set their private password.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Input
                  label="Administrator Full Name"
                  required
                  icon={<User className="h-4 w-4" />}
                  placeholder="e.g. Dr. Alok Verma"
                  value={formData.adminName}
                  onChange={(e) =>
                    setFormData({ ...formData, adminName: e.target.value })
                  }
                  helperText="Primary administrative contact and principal for this institution."
                />
              </div>

              <div>
                <Input
                  label="Official Email Address (Login ID)"
                  type="email"
                  required
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="e.g. principal@greenwood.edu"
                  value={formData.adminEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, adminEmail: e.target.value })
                  }
                  badge={
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Invitation Target
                    </span>
                  }
                  helperText="The single-use activation invitation token will be dispatched to this email."
                />
              </div>

              <div>
                <Input
                  label="Contact Phone Number"
                  type="tel"
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="e.g. +91 98765 43210"
                  value={formData.adminPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, adminPhone: e.target.value })
                  }
                  helperText="Used for two-factor authentication and urgent tenant verification."
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Designation / Role"
                  icon={<Briefcase className="h-4 w-4" />}
                  value={formData.adminDesignation}
                  onChange={(e) =>
                    setFormData({ ...formData, adminDesignation: e.target.value })
                  }
                  helperText="Official administrative title at the school."
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                size="md"
                onClick={() => setCurrentStep(3)}
                disabled={!formData.adminName || !formData.adminEmail}
                className="px-6 font-bold"
              >
                <span>Continue to Subscription</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SUBSCRIPTION & QUOTAS                             */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 3 of 5 • Subscription & Capacity
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                Subscription Plan & Resource Limits
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Choose a pricing plan and enforce strict multi-tenant quotas for student enrollment, faculty, and file storage.
              </p>
            </div>

            {/* Plan Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: "starter" as SubscriptionPlan,
                  name: "Starter Tier",
                  price: "$199",
                  period: "per month",
                  students: "Up to 1,000 Students",
                  staff: "Up to 75 Staff",
                  storage: "5 GB Cloud Storage",
                  badge: "Small Schools",
                },
                {
                  id: "growth" as SubscriptionPlan,
                  name: "Growth Tier",
                  price: "$399",
                  period: "per month",
                  students: "Up to 2,500 Students",
                  staff: "Up to 150 Staff",
                  storage: "15 GB Cloud Storage",
                  popular: true,
                  badge: "Most Popular",
                },
                {
                  id: "enterprise" as SubscriptionPlan,
                  name: "Enterprise Tier",
                  price: "$799",
                  period: "per month",
                  students: "Unlimited Students",
                  staff: "Unlimited Staff",
                  storage: "50 GB Cloud Storage",
                  badge: "Multi-Campus",
                },
              ].map((tier) => {
                const isSelected = formData.plan === tier.id;

                return (
                  <div
                    key={tier.id}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        plan: tier.id,
                        maxStudents:
                          tier.id === "starter"
                            ? 1000
                            : tier.id === "growth"
                            ? 2500
                            : 5000,
                        maxStaff:
                          tier.id === "starter"
                            ? 75
                            : tier.id === "growth"
                            ? 150
                            : 300,
                        storageLimitMb:
                          tier.id === "starter"
                            ? 5000
                            : tier.id === "growth"
                            ? 15000
                            : 50000,
                      })
                    }
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none bg-white flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 shadow-sm shadow-blue-500/15 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            tier.popular
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tier.badge}
                        </span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900">
                        {tier.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">
                          {tier.price}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {tier.period}
                        </span>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3">
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{tier.students}</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{tier.staff}</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{tier.storage}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quota Fine-Tuning */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Custom Resource Quota Limits (Enforced by Row-Level Rules)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Max Students Cap"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStudents: parseInt(e.target.value) || 0,
                      })
                    }
                    helperText="Prevents admissions exceeding plan."
                  />
                </div>
                <div>
                  <Input
                    label="Max Staff Cap"
                    type="number"
                    value={formData.maxStaff}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStaff: parseInt(e.target.value) || 0,
                      })
                    }
                    helperText="Limits staff and teacher profiles."
                  />
                </div>
                <div>
                  <Input
                    label="Storage Limit (MB)"
                    type="number"
                    value={formData.storageLimitMb}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageLimitMb: parseInt(e.target.value) || 0,
                      })
                    }
                    helperText={`${(formData.storageLimitMb / 1024).toFixed(1)} GB file storage.`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                size="md"
                onClick={() => setCurrentStep(4)}
                className="px-6 font-bold"
              >
                <span>Continue to Modules</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: MODULES & UPLOAD POLICIES                         */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 4 of 5 • Modules & Security Policies
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                Enabled Modules & Upload Permissions
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Select active modules and configure fine-grained role-based document upload permissions.
              </p>
            </div>

            {/* Upload Policies (PRD Section 2) */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      PRD Section 2: Independent Upload Permission Toggles
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">
                      Control who can upload documents & KYC files. Photos are optional unless configured.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors">
                  <Switch
                    label="Student Uploads"
                    description="Permit student homework, assignments, and KYC document uploads"
                    checked={formData.uploadSettings.allowStudentUploads}
                    onCheckedChange={() =>
                      handleUploadSettingToggle("allowStudentUploads")
                    }
                  />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors">
                  <Switch
                    label="Parent Uploads"
                    description="Permit parent identity proofs, signature cards, and fee receipt uploads"
                    checked={formData.uploadSettings.allowParentUploads}
                    onCheckedChange={() =>
                      handleUploadSettingToggle("allowParentUploads")
                    }
                  />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors">
                  <Switch
                    label="Staff Uploads"
                    description="Permit teacher certificates, lesson plans, and exam question paper uploads"
                    checked={formData.uploadSettings.allowStaffUploads}
                    onCheckedChange={() =>
                      handleUploadSettingToggle("allowStaffUploads")
                    }
                  />
                </div>
              </div>
            </div>

            {/* 14 Modules Selection Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    SaaS Module Entitlements
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    {Object.values(formData.modules).filter(Boolean).length} of 14 modules currently enabled
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Zero Data Loss Architecture Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = Boolean(formData.modules[mod.key]);

                  return (
                    <div
                      key={mod.key}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 shadow-2xs ${
                        isChecked
                          ? "border-blue-200 bg-blue-50/30 hover:border-blue-300"
                          : "border-slate-200 bg-white hover:border-slate-300 opacity-80"
                      }`}
                    >
                      <div className="pr-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {mod.name}
                          </span>
                          {mod.key === "student_portal" && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                              Class 5+
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-normal">
                          {mod.description}
                        </p>
                      </div>

                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => handleModuleToggle(mod.key)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                size="md"
                onClick={() => setCurrentStep(5)}
                className="px-6 font-bold"
              >
                <span>Review & Commit</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: REVIEW & ATOMIC COMMIT                            */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 5 of 5 • Final Review
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                Review & Provision Tenant Workspace
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Please verify configuration. When committed, the backend will execute an atomic multi-tenant provisioning transaction.
              </p>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200/80 p-5 space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Institution Identity
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-blue-600 hover:underline text-[11px] font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <p className="font-bold text-sm text-slate-900">
                    {formData.name}
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-blue-700 font-semibold">
                    <Globe className="h-3.5 w-3.5" /> https://{formData.slug || "school"}.edusaas.io
                  </p>
                  <p>
                    <strong className="text-slate-800">Affiliation:</strong> {formData.board}
                  </p>
                  <p>
                    <strong className="text-slate-800">Location:</strong> {formData.city}, {formData.state}
                  </p>
                  <p>
                    <strong className="text-slate-800">Academic Session:</strong>{" "}
                    {formData.academicYear || "Omitted (Optional at setup)"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-5 space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Primary Administrator
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-blue-600 hover:underline text-[11px] font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <p className="font-bold text-sm text-slate-900">
                    {formData.adminName}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-800">Role:</strong> {formData.adminDesignation}
                  </p>
                  <p>
                    <strong className="text-slate-800">Email:</strong> {formData.adminEmail}
                  </p>
                  <p>
                    <strong className="text-slate-800">Phone:</strong> {formData.adminPhone || "Not provided"}
                  </p>
                  <p className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <CheckCheck className="h-3.5 w-3.5" /> Zero-Knowledge Setup Invitation Link will be generated
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-5 space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Subscription & Limits
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-blue-600 hover:underline text-[11px] font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <p className="font-bold text-sm text-blue-700 uppercase">
                    {formData.plan} Tier
                  </p>
                  <p>
                    <strong className="text-slate-800">Student Cap:</strong> {formData.maxStudents.toLocaleString()}
                  </p>
                  <p>
                    <strong className="text-slate-800">Faculty Cap:</strong> {formData.maxStaff.toLocaleString()}
                  </p>
                  <p>
                    <strong className="text-slate-800">Storage Quota:</strong> {(formData.storageLimitMb / 1024).toFixed(1)} GB
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-5 space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Module & Upload Entitlements
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-blue-600 hover:underline text-[11px] font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900">
                    {Object.values(formData.modules).filter(Boolean).length} of 14 Modules Enabled
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(formData.modules)
                      .filter(([, v]) => v)
                      .slice(0, 5)
                      .map(([k]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {k.replace(/_/g, " ")}
                        </span>
                      ))}
                    {Object.values(formData.modules).filter(Boolean).length > 5 && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        +{Object.values(formData.modules).filter(Boolean).length - 5} more
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Uploads: Student {formData.uploadSettings.allowStudentUploads ? "✓" : "✗"} • Parent {formData.uploadSettings.allowParentUploads ? "✓" : "✗"} • Staff {formData.uploadSettings.allowStaffUploads ? "✓" : "✗"}
                  </p>
                </div>
              </div>
            </div>

            {/* Atomic Commitment Guarantee */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4.5 text-xs text-blue-950 flex items-start gap-3.5 border-l-4 border-l-blue-600">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-xs sm:text-sm text-blue-950 block">
                  All-or-Nothing Atomic Transaction (PRD Section 5 Guarantee)
                </span>
                <p className="text-xs text-blue-800 leading-relaxed font-normal">
                  The system commits the school tenant, database scoping, admin record, quota counters, and module permissions
                  inside a single database transaction. If any constraint fails, the entire transaction rolls back cleanly with zero partial writes.
                </p>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 font-semibold flex items-center gap-2.5">
                <span className="text-base">⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(4)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                size="md"
                isLoading={isSubmitting}
                className="px-7 font-bold text-sm shadow-md"
              >
                <span>Commit & Provision School</span>
                <Sparkles className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: REGISTRATION SUCCESS CONFIRMATION                 */}
        {/* ========================================================= */}
        {currentStep === 6 && registrationResult && (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 text-center shadow-lg shadow-emerald-500/5 space-y-7">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
                Workspace Live & Provisioned
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-2">
                {registrationResult.schoolName} Registered Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-normal">
                Multi-tenant database schema isolated, modules active, and administrator setup invitation generated.
              </p>
            </div>

            {/* Generated School Code Box */}
            <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50/80 to-indigo-50/40 p-6 shadow-xs">
              <span className="text-[11px] font-bold text-blue-700 tracking-wider uppercase block">
                System Auto-Generated School Code (PRD Rule 2)
              </span>
              <div className="mt-2 text-4xl font-mono font-black text-blue-700 tracking-wider">
                {registrationResult.schoolCode}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Mandatory tenant code for staff, teachers, and parents to access this school's portal.
              </p>
            </div>

            {/* Invitation Link Box */}
            <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 p-5 text-left text-xs bg-slate-50/80 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">
                  Administrator Setup Invitation URL
                </span>
              </div>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Dispatched to <strong className="text-slate-900">{registrationResult.adminEmail}</strong>. Valid for 72 hours.
                You can also copy the direct single-use setup link below:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={registrationResult.invitationUrl}
                  style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-slate-800 select-all shadow-2xs font-medium focus:outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => copyToClipboard(registrationResult.invitationUrl)}
                  className="shrink-0 h-10 px-4 text-xs font-bold"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-300" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link href="/schools">
                <Button size="md" className="px-6 font-bold shadow-md">
                  View in Schools Directory
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setRegistrationResult(null);
                  setCurrentStep(1);
                  setFormData({
                    name: "",
                    legalName: "",
                    slug: "",
                    board: "CBSE",
                    academicYear: "",
                    city: "",
                    state: "",
                    country: "India",
                    timezone: "Asia/Kolkata",
                    currency: "INR",
                    adminName: "",
                    adminEmail: "",
                    adminPhone: "",
                    adminDesignation: "Principal / Director",
                    plan: "growth",
                    maxStudents: 2500,
                    maxStaff: 150,
                    storageLimitMb: 15000,
                    modules: { ...DEFAULT_MODULE_SELECTION },
                    uploadSettings: {
                      allowStudentUploads: true,
                      allowParentUploads: true,
                      allowStaffUploads: true,
                    },
                  });
                }}
                className="font-semibold"
              >
                Register Another School
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
