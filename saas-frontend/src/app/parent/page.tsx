"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  CalendarCheck,
  Award,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  rollNo: string;
  admissionNumber: string;
  relationship?: string;
  hasStudentPortal?: boolean;
}

const DEFAULT_CHILDREN: ChildProfile[] = [
  {
    id: "demo-1",
    name: "Aarav Sharma",
    grade: "Class 8-A",
    rollNo: "08-A-24",
    admissionNumber: "SCH-ADM-2026-0001",
    relationship: "Father",
    hasStudentPortal: true,
  },
  {
    id: "demo-2",
    name: "Meera Sharma",
    grade: "Class 3-C",
    rollNo: "03-C-12",
    admissionNumber: "SCH-ADM-2026-0002",
    relationship: "Father",
    hasStudentPortal: false,
  },
];

export default function ParentPage() {
  const [children, setChildren] = useState<ChildProfile[]>(DEFAULT_CHILDREN);
  const [selectedChild, setSelectedChild] = useState<ChildProfile>(DEFAULT_CHILDREN[0]);
  const [parentName, setParentName] = useState<string>("Parent Portal");
  const [schoolName, setSchoolName] = useState<string>("Oakridge International School");
  const [feeMap, setFeeMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, parentFees] = await Promise.allSettled([
          api.auth.getProfile(),
          api.fees.getParentChildren(),
        ]);

        if (profile.status === "fulfilled" && profile.value) {
          const user = profile.value;
          if (user.fullName) setParentName(user.fullName);
          if (user.school?.name) setSchoolName(user.school.name);

          if (user.parentLinks && user.parentLinks.length > 0) {
            const realChildren: ChildProfile[] = user.parentLinks.map((pl: any) => ({
              id: pl.student.id,
              name: pl.student.fullName,
              grade: `${pl.student.gradeLevel}${pl.student.section ? `-${pl.student.section}` : ""}`,
              rollNo: pl.student.rollNumber || "N/A",
              admissionNumber: pl.student.admissionNumber,
              relationship: pl.relationship || "Guardian",
              hasStudentPortal: pl.student.hasStudentPortalAccess,
            }));
            setChildren(realChildren);
            setSelectedChild(realChildren[0]);
          }
        }

        if (parentFees.status === "fulfilled" && Array.isArray(parentFees.value)) {
          const map: Record<string, any> = {};
          parentFees.value.forEach((cf: any) => {
            map[cf.studentId] = cf.activeFeePlan;
          });
          setFeeMap(map);
        }
      } catch (err) {
        console.warn("Unable to fetch live parent portal data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentPlan = feeMap[selectedChild?.id];

  return (
    <div className="space-y-6">
      {/* Child Selector Pill & Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Viewing Child Profile:
            </span>
            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-0.5 text-xs font-bold text-purple-700">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
              <span>{selectedChild?.name}</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Family Academic Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {selectedChild?.grade} • Adm No:{" "}
            <span className="font-mono font-semibold">{selectedChild?.admissionNumber}</span> •{" "}
            {schoolName}
          </p>
        </div>

        {/* Switch child buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            Children ({children.length}):
          </span>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChild(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedChild?.id === c.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {c.name}
              <span className="text-[10px] opacity-80">({c.grade})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Governance Banner (Rule 6) */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          {selectedChild?.hasStudentPortal ? (
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Unlock className="h-4 w-4" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-800">
              {selectedChild?.name} • Portal Access Governance
            </p>
            <p className="text-[11px] text-slate-500">
              {selectedChild?.hasStudentPortal
                ? "Eligible for independent student login credentials (Class 5+ standard)."
                : "Parent Portal access only (LKG through Class 4 policy). Direct student login is restricted."}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
            selectedChild?.hasStudentPortal
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {selectedChild?.hasStudentPortal ? "Dual Access Active" : "Parent Only"}
        </span>
      </div>

      {/* KPI Cards: Attendance, Fees, Rank */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Overall Attendance
          </span>
          <div className="text-2xl font-bold text-emerald-600">96.2%</div>
          <p className="text-[11px] text-slate-500 font-medium">Present 76 of 79 school days</p>
        </div>

        {/* Live Term Fee Status Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Fee Balance Status
          </span>
          {currentPlan ? (
            <>
              <div
                className={`text-2xl font-bold ${
                  currentPlan.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {currentPlan.balanceAmount > 0
                  ? `₹${currentPlan.balanceAmount.toLocaleString("en-IN")} Due`
                  : "Fully Cleared"}
              </div>
              <p
                className={`text-[11px] font-semibold ${
                  currentPlan.balanceAmount > 0 ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                Status: {currentPlan.status.replace("_", " ")}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-slate-700">₹0 Due</div>
              <p className="text-[11px] text-slate-500 font-medium">No active plan assigned</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Academic Performance
          </span>
          <div className="text-2xl font-bold text-blue-600">9.4 / 10</div>
          <p className="text-[11px] text-blue-700 font-medium">Class Rank: 3rd in Section A</p>
        </div>
      </div>

      {/* Fee Payment Card & Grades Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Payment Card (Connected to Live Plan & Manual Policy) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Tuition Fee Schedule & Ledger
              </h2>
            </div>
            {currentPlan ? (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  currentPlan.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : currentPlan.status === "PARTIALLY_PAID"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {currentPlan.status.replace("_", " ")}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">No Plan</span>
            )}
          </div>

          {currentPlan ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Fee Structure:</span>
                <span className="font-bold text-slate-800">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Gross Billed Amount:</span>
                <span className="font-semibold text-slate-700">
                  ₹{currentPlan.grossAmount.toLocaleString("en-IN")}
                </span>
              </div>
              {currentPlan.concessionAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-emerald-700 font-medium">
                    Concession ({currentPlan.concessionType?.replace("_", " ") || "Special"}):
                  </span>
                  <span className="font-bold text-emerald-700">
                    -₹{currentPlan.concessionAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Net Fee Payable:</span>
                <span className="font-bold text-slate-900">
                  ₹{currentPlan.netAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Total Confirmed Paid:</span>
                <span className="font-bold text-emerald-600">
                  ₹{currentPlan.paidAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Outstanding Due:</span>
                <span
                  className={`font-extrabold ${
                    currentPlan.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  ₹{currentPlan.balanceAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No active fee plan is linked to this student profile yet.
            </div>
          )}

          {/* Institutional Manual Payment Advisory */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Building className="h-3.5 w-3.5 text-purple-600" />
              <span>Accounts Desk Payment Collection</span>
            </div>
            <p>
              Payments are received in-person via Cash, Cheque, Bank Transfer, or Accounts Desk UPI
              QR. Official receipts are issued immediately by the Accounts Office.
            </p>
          </div>

          <Link href="/parent/fees" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer">
              <span>View Full Fee Ledger & Receipts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Academic Marks Snapshot */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Recent Exam Scores (Mid-Term 1)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Published</span>
          </div>

          <div className="space-y-3">
            {[
              {
                subject: "Mathematics",
                score: "96 / 100",
                grade: "A+",
                remarks: "Outstanding analytical skill",
              },
              {
                subject: "Science (Physics/Chem)",
                score: "91 / 100",
                grade: "A",
                remarks: "Great lab experiment report",
              },
              {
                subject: "English Literature",
                score: "88 / 100",
                grade: "A-",
                remarks: "Good grammar and vocabulary",
              },
              {
                subject: "Social Sciences",
                score: "94 / 100",
                grade: "A+",
                remarks: "Exemplary project work",
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{s.subject}</span>
                  <span className="text-[10px] text-slate-500">{s.remarks}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{s.score}</span>
                  <span className="text-[10px] font-bold text-emerald-700">{s.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
