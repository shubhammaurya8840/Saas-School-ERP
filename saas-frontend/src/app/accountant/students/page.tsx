"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  Search,
  PlusCircle,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  X,
  Filter,
  Lock,
  Unlock,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/services/api";

const GRADE_LEVELS = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const JUNIOR_GRADES = new Set([
  "NURSERY",
  "LKG",
  "UKG",
  "PRE-K",
  "CLASS 1",
  "CLASS 2",
  "CLASS 3",
  "CLASS 4",
]);

export default function AccountantStudentsPage() {
  const [activeTab, setActiveTab] = useState<"students" | "parents">("students");
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [admissionSuccess, setAdmissionSuccess] = useState<{
    admissionNumber: string;
    studentName: string;
    parentName: string;
    parentEmail: string;
    portalAccess: { parentPortal: boolean; studentPortal: boolean };
    parentInvitationUrl?: string;
  } | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: "",
    gradeLevel: "Class 5",
    section: "A",
    rollNumber: "",
    academicYear: "2026-2027",
    dateOfBirth: "",
    gender: "MALE",
    address: "",
    admissionNumber: "",
    // Parent info
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    parentRelationship: "Father",
    // Student portal login (Class 5+ only)
    enableStudentPortalLogin: false,
    studentEmail: "",
    studentPassword: "",
  });

  const isJuniorGradeSelected = (grade: string) => {
    return JUNIOR_GRADES.has(grade.trim().toUpperCase());
  };

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.students.list({
        search: searchQuery.trim() || undefined,
        gradeLevel: gradeFilter !== "all" ? gradeFilter : undefined,
        section: sectionFilter !== "all" ? sectionFilter : undefined,
      });
      setStudents(res.students || []);
      setTotalStudents(res.total || 0);
    } catch (err) {
      console.warn("Unable to load live student records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParents = async () => {
    try {
      const res = await api.students.getParents({
        search: searchQuery.trim() || undefined,
      });
      setParents(res || []);
    } catch (err) {
      console.warn("Unable to load parents overview:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "students") {
        loadStudents();
      } else {
        loadParents();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, gradeFilter, sectionFilter, activeTab]);

  const handleOpenModal = () => {
    setFormData({
      fullName: "",
      gradeLevel: "Class 5",
      section: "A",
      rollNumber: "",
      academicYear: "2026-2027",
      dateOfBirth: "",
      gender: "MALE",
      address: "",
      admissionNumber: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      parentRelationship: "Father",
      enableStudentPortalLogin: false,
      studentEmail: "",
      studentPassword: "",
    });
    setFormError("");
    setAdmissionSuccess(null);
    setIsModalOpen(true);
  };

  const handleGradeChange = (newGrade: string) => {
    const isJunior = isJuniorGradeSelected(newGrade);
    setFormData((prev) => ({
      ...prev,
      gradeLevel: newGrade,
      // If junior, automatically turn off and clear student login
      enableStudentPortalLogin: isJunior ? false : prev.enableStudentPortalLogin,
      studentEmail: isJunior ? "" : prev.studentEmail,
      studentPassword: isJunior ? "" : prev.studentPassword,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      if (!formData.fullName.trim()) {
        throw new Error("Student full name is required.");
      }
      if (!formData.parentName.trim() || !formData.parentEmail.trim()) {
        throw new Error("Parent full name and valid email address are required.");
      }

      const isJunior = isJuniorGradeSelected(formData.gradeLevel);
      if (isJunior && formData.enableStudentPortalLogin) {
        throw new Error(
          "Rule 6 Policy Violation: Students from LKG through Class 4 can use Parent Portal only."
        );
      }

      if (formData.enableStudentPortalLogin && !formData.studentEmail.trim()) {
        throw new Error("Student email is required when student portal access is enabled.");
      }

      const payload: any = {
        fullName: formData.fullName.trim(),
        gradeLevel: formData.gradeLevel.trim(),
        section: formData.section.trim() || undefined,
        rollNumber: formData.rollNumber.trim() || undefined,
        academicYear: formData.academicYear.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        address: formData.address.trim() || undefined,
        admissionNumber: formData.admissionNumber.trim() || undefined,
        parentName: formData.parentName.trim(),
        parentEmail: formData.parentEmail.trim().toLowerCase(),
        parentPhone: formData.parentPhone.trim() || undefined,
        parentRelationship: formData.parentRelationship,
        enableStudentPortalLogin: formData.enableStudentPortalLogin,
      };

      if (formData.enableStudentPortalLogin) {
        payload.studentEmail = formData.studentEmail.trim().toLowerCase();
        if (formData.studentPassword) {
          payload.studentPassword = formData.studentPassword;
        }
      }

      const res = await api.students.create(payload);

      setAdmissionSuccess({
        admissionNumber: res.student.admissionNumber,
        studentName: res.student.fullName,
        parentName: res.parent.fullName,
        parentEmail: res.parent.email,
        portalAccess: res.portalAccess,
        parentInvitationUrl: res.parentInvitationUrl,
      });

      // Refresh listings
      loadStudents();
      loadParents();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message || "Failed to admit student. Please check inputs.");
      } else {
        setFormError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const juniorCount = students.filter((s) => isJuniorGradeSelected(s.gradeLevel)).length;
  const seniorCount = students.length - juniorCount;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            Student Admissions & Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register students, link multi-child parent accounts, and enforce portal access governance.
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          New Student Admission
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalStudents}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent Portal Only</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{juniorCount}</p>
            <span className="text-[11px] text-amber-600 font-medium">LKG – Class 4 Rule</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dual Portal Access</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{seniorCount}</p>
            <span className="text-[11px] text-blue-600 font-medium">Class 5 – 12 Eligible</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Unlock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Families</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{parents.length || "—"}</p>
            <span className="text-[11px] text-indigo-600 font-medium">Parent Accounts</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === "students"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Enrolled Students Directory ({totalStudents})
        </button>
        <button
          onClick={() => setActiveTab("parents")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === "parents"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Family & Multi-Child Linkages
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "students"
                ? "Search by student name, admission #, roll #, or parent name..."
                : "Search by parent name, email, or child name..."
            }
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        {activeTab === "students" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Grade:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Grades</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
              <span>Section:</span>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Students Directory Table */}
      {activeTab === "students" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mb-2"></div>
              <p>Loading live student records...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No student records found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || gradeFilter !== "all"
                  ? "Try adjusting your search criteria or grade filters."
                  : "No students admitted yet. Click 'New Student Admission' to register your first student."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Admission No</th>
                    <th className="px-4 py-3.5">Student Details</th>
                    <th className="px-4 py-3.5">Grade & Section</th>
                    <th className="px-4 py-3.5">Linked Parent / Family</th>
                    <th className="px-4 py-3.5">Portal Access Governance</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const isJunior = isJuniorGradeSelected(student.gradeLevel);
                    const primaryParent = student.parentLinks?.[0]?.parent;
                    const relationship = student.parentLinks?.[0]?.relationship || "Guardian";

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                            {student.admissionNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-semibold text-slate-900">{student.fullName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {student.gender} • Roll: {student.rollNumber || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {student.gradeLevel} {student.section ? `• Sec ${student.section}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {primaryParent ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                <Users className="h-3 w-3 text-indigo-500" />
                                {primaryParent.fullName}
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 font-normal">
                                  {relationship}
                                </span>
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{primaryParent.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No parent linked</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {isJunior ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Lock className="h-3 w-3 text-amber-600" />
                              Parent Portal Only (LKG-Class 4 Rule)
                            </span>
                          ) : student.hasStudentPortalAccess ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Unlock className="h-3 w-3 text-blue-600" />
                                Dual Access (Parent + Student)
                              </span>
                              {student.studentUser && (
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {student.studentUser.email}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Parent Portal Only (Class 5+)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Family & Multi-Child Overview */}
      {activeTab === "parents" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 flex items-start gap-3">
            <Users className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-950">Multi-Child Family Governance (Rule 5)</p>
              <p className="mt-0.5 text-indigo-800">
                A single parent account can be linked to multiple children across different classes.
                Parents log in once and toggle between their children's profiles seamlessly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parents.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No family linkages found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Admit students with parent email addresses to establish family linkages.
                </p>
              </div>
            ) : (
              parents.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">{p.fullName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {p.email}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {p.childrenCount} {p.childrenCount === 1 ? "Child" : "Children"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Linked Children:
                      </p>
                      <div className="space-y-1.5">
                        {p.children.map((child: any) => (
                          <div
                            key={child.studentId}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-slate-800">{child.fullName}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {child.admissionNumber} • {child.gradeLevel}
                              </p>
                            </div>
                            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                              {child.relationship}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Role: {p.role}</span>
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Parent Account
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Student Admission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">New Student Admission</h2>
                  <p className="text-xs text-slate-500">
                    Admit a student, link parents, and configure portal governance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {admissionSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-bold text-sm">Admission Successfully Completed!</h3>
                    </div>
                    <div className="mt-3 text-xs space-y-1.5 text-emerald-800">
                      <p>
                        <span className="font-semibold">Student Name:</span>{" "}
                        {admissionSuccess.studentName}
                      </p>
                      <p>
                        <span className="font-semibold">Admission Number:</span>{" "}
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-900">
                          {admissionSuccess.admissionNumber}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Linked Parent:</span>{" "}
                        {admissionSuccess.parentName} ({admissionSuccess.parentEmail})
                      </p>
                      <p>
                        <span className="font-semibold">Portal Access:</span>{" "}
                        {admissionSuccess.portalAccess.studentPortal
                          ? "Dual Access (Parent + Student)"
                          : "Parent Portal Only"}
                      </p>
                    </div>
                  </div>

                  {admissionSuccess.parentInvitationUrl && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Parent Account Setup Link:
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={admissionSuccess.parentInvitationUrl}
                          className="text-xs font-mono bg-white"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(admissionSuccess.parentInvitationUrl!);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="text-xs shrink-0"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Send this secure link to the parent so they can set their password.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={() => {
                        setAdmissionSuccess(null);
                        setIsModalOpen(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Done & Return to Directory
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Section 1: Student Information */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                      1. Student Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Student Full Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Aarav Sharma"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Grade Level <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.gradeLevel}
                          onChange={(e) => handleGradeChange(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Section
                        </label>
                        <Input
                          value={formData.section}
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                          placeholder="e.g. A, B, C"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Roll Number
                        </label>
                        <Input
                          value={formData.rollNumber}
                          onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                          placeholder="e.g. 15"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Date of Birth
                        </label>
                        <Input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Custom Admission No (Optional)
                        </label>
                        <Input
                          value={formData.admissionNumber}
                          onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                          placeholder="Auto-generates if blank"
                          className="text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Parent / Guardian Details */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      2. Parent / Guardian Linkage (Rule 5: Multi-Child)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-3">
                      If this parent's email already exists in the school, the student will automatically be linked to the existing parent profile.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Parent Full Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          value={formData.parentName}
                          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                          placeholder="e.g. Rajesh Sharma"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Parent Email Address <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          type="email"
                          value={formData.parentEmail}
                          onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                          placeholder="parent@example.com"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Parent Phone
                        </label>
                        <Input
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Relationship
                        </label>
                        <select
                          value={formData.parentRelationship}
                          onChange={(e) => setFormData({ ...formData, parentRelationship: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Legal Guardian</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Portal Access Governance (Rule 6) */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      3. Portal Access Governance (Rule 6)
                    </h3>

                    {isJuniorGradeSelected(formData.gradeLevel) ? (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                        <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs">Rule 6 Enforced: Parent Portal Only</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Students in {formData.gradeLevel} (LKG through Class 4) use the Parent Portal exclusively.
                            Direct student login credentials are not permitted for this grade level.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.enableStudentPortalLogin}
                              onChange={(e) =>
                                setFormData({ ...formData, enableStudentPortalLogin: e.target.checked })
                              }
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>Enable Student Portal Login (Class 5+ Permitted)</span>
                          </label>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                            Dual Access Allowed
                          </span>
                        </div>

                        {formData.enableStudentPortalLogin && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="text-xs font-medium text-slate-700 block mb-1">
                                Student Portal Email <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                type="email"
                                value={formData.studentEmail}
                                onChange={(e) =>
                                  setFormData({ ...formData, studentEmail: e.target.value })
                                }
                                placeholder="student@school.edu"
                                className="text-sm bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-700 block mb-1">
                                Initial Password (Optional)
                              </label>
                              <Input
                                type="password"
                                value={formData.studentPassword}
                                onChange={(e) =>
                                  setFormData({ ...formData, studentPassword: e.target.value })
                                }
                                placeholder="Leave blank to invite via token"
                                className="text-sm bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
                    >
                      {isSubmitting ? "Enrolling Student..." : "Admit Student"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
