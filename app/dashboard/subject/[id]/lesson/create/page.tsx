"use client";

import React, { useState } from "react";
import Header from "../../../../../../components/views/Header";
import { useLms } from "../../../../../../context/LmsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  GraduationCap,
  Calendar,
  MapPin,
  Info,
  Lightbulb,
  FileCheck,
} from "lucide-react";
import { Lesson } from "../../../../../../types/subject";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CreateLessonPage({ params }: PageProps) {
  const { id } = React.use(params);
  const { subjects, currentUser, updateSubject } = useLms();
  const router = useRouter();

  // Find the subject
  const subject = subjects.find((s) => s.id === id);

  // Form states
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [openDate, setOpenDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [closeDate, setCloseDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  });
  const [closeType, setCloseType] = useState<"restrict" | "open">("open");

  // UI States
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected module id once modules are loaded
  React.useEffect(() => {
    if (subject && subject.modules && subject.modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(subject.modules[0].id);
    }
  }, [subject, selectedModuleId]);

  const isOwner = subject && currentUser && subject.createdBy === currentUser.id;

  if (!subject) {
    return (
      <div className="flex flex-col gap-6 text-left animate-in fade-in duration-300">
        <Header />
        <div className="w-full h-64 flex flex-col items-center justify-center border border-dashed border-[#E5E1D8] rounded-3xl p-6 bg-white/40 select-none">
          <span className="text-[14px] text-zinc-400 font-semibold">Subject not found.</span>
          <Link
            href="/dashboard"
            className="mt-4 px-5 py-2.5 bg-[#121212] text-white font-bold rounded-full text-[12px] hover:bg-zinc-800 transition-all shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col gap-6 text-left animate-in fade-in duration-300">
        <Header />
        <div className="w-full h-64 flex flex-col items-center justify-center border border-dashed border-red-200 rounded-3xl p-6 bg-red-50/20 select-none">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <span className="text-[14px] text-red-600 font-bold">Access Denied.</span>
          <span className="text-[12px] text-zinc-500 font-medium mt-1">
            Only the subject creator has permissions to create lessons.
          </span>
          <Link
            href={`/dashboard/subject/${subject.id}`}
            className="mt-4 px-5 py-2.5 bg-[#121212] text-white font-bold rounded-full text-[12px] hover:bg-zinc-800 transition-all shadow-sm"
          >
            Go back to Subject
          </Link>
        </div>
      </div>
    );
  }

  // Handle case where no modules exist
  if (!subject.modules || subject.modules.length === 0) {
    return (
      <div className="flex flex-col gap-6 text-left animate-in fade-in duration-300">
        <Header />
        <div className="flex-1 pr-1 pb-4 flex flex-col gap-6 select-none max-w-3xl w-full">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/subject/${subject.id}`}
              className="w-10 h-10 rounded-full border border-[#E5E1D8] flex items-center justify-center text-zinc-600 hover:bg-white transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight">
                Create New Lesson
              </h1>
            </div>
          </div>

          <div className="w-full border border-dashed border-amber-300 rounded-3xl p-8 bg-amber-50/30 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
            <span className="text-[15px] text-zinc-800 font-bold">No Modules Found</span>
            <span className="text-[12px] text-zinc-500 font-medium max-w-md mt-1 mb-5">
              Before adding a lesson, you must create at least one course module to house it.
            </span>
            <Link
              href={`/dashboard/subject/${subject.id}/module/create`}
              className="px-6 py-2.5 bg-[#f25c88] text-white font-bold rounded-full text-[12px] shadow-md hover:bg-[#d84b72] transition-all"
            >
              Create a Module first
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFields({});

    const errors: { [key: string]: string } = {};
    if (!selectedModuleId) {
      errors.moduleId = "Please select a target module.";
    }
    if (!title.trim()) {
      errors.title = "Lesson title is required.";
    }
    if (openDate && closeDate && openDate > closeDate) {
      errors.dates = "Open date cannot be later than close date.";
    }

    if (Object.keys(errors).length > 0) {
      setErrorFields(errors);
      return;
    }

    setIsSaving(true);

    const now = new Date().toISOString();
    const newId = typeof window !== "undefined" && window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : `l_${Math.random().toString(36).substring(2, 9)}`;

    const newLesson: Lesson = {
      id: newId,
      title: title.trim(),
      desc: desc.trim(),
      openDate: new Date(openDate).toISOString(),
      closeDate: new Date(closeDate).toISOString(),
      closeType,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const updatedModules = subject.modules.map((mod) => {
      if (mod.id === selectedModuleId) {
        return {
          ...mod,
          lessons: [...(mod.lessons || []), newLesson],
        };
      }
      return mod;
    });

    const updatedSubject = {
      ...subject,
      modules: updatedModules,
    };

    setTimeout(() => {
      updateSubject(updatedSubject);
      setIsSaving(false);
      setSuccessMessage("Lesson created successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        router.push(`/dashboard/subject/${subject.id}`);
      }, 1000);
    }, 600);
  };

  return (
    <>
      <Header />

      {/* Main Wrapper covering full width */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4 flex flex-col gap-6 text-left select-none w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Navigation back */}
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/subject/${subject.id}`}
            className="w-10 h-10 rounded-full border border-[#E5E1D8] flex items-center justify-center text-zinc-600 hover:bg-white hover:border-zinc-400 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight">
              Create New Lesson
            </h1>
            <p className="text-[12px] text-zinc-500 font-medium">
              Create and structure learning content inside a designated module.
            </p>
          </div>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          {/* Column 1: Subject Info Context Card */}
          <div className="bg-white/40 border border-[#E5E1D8]/60 p-6 rounded-3xl flex flex-col gap-5 shadow-sm">
            <div className="flex flex-col gap-1 border-b border-[#E5E1D8]/40 pb-3">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                Target Subject
              </span>
              <span
                className="inline-block text-[9px] font-bold px-3 py-1 rounded-full w-fit mb-2"
                style={
                  subject.color && subject.color.startsWith("#")
                    ? {
                        backgroundColor: `${subject.color}15`,
                        color: subject.color,
                        border: `1px solid ${subject.color}30`,
                      }
                    : {
                        backgroundColor: "#FAF7F2",
                        color: "#121212",
                        border: "1px solid #E5E1D8",
                      }
                }
              >
                {subject.room || "Room Online"}
              </span>
              <h2 className="text-[18px] font-black text-[#121212] tracking-tight leading-tight">
                {subject.name}
              </h2>
              <div className="flex items-center gap-1.5 text-zinc-500 font-semibold text-[11px] mt-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Lecturers: {subject.lecturers.map((l) => l.name).join(", ")}</span>
              </div>
            </div>

            {subject.description && (
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium bg-[#FAF7F2]/50 p-3.5 border border-[#E5E1D8]/30 rounded-2xl">
                {subject.description}
              </p>
            )}

            {/* Current Modules list */}
            {subject.modules && subject.modules.length > 0 && (
              <div className="flex flex-col gap-2 pt-1 border-t border-[#E5E1D8]/40 mt-1">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider mb-0.5">
                  Current Modules ({subject.modules.length})
                </span>
                <div className="flex flex-col gap-1">
                  {subject.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex justify-between items-center text-[10.5px] font-semibold text-zinc-700 bg-white/40 px-3 py-1.5 border border-[#E5E1D8]/20 rounded-xl"
                    >
                      <span className="truncate pr-2">{mod.title}</span>
                      <span className="text-zinc-400 text-[9px] flex-shrink-0">
                        {mod.lessons ? mod.lessons.length : 0} lessons
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Lesson Details Form */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2 pb-2 border-b border-zinc-100">
              <BookOpen className="w-4 h-4 text-[#f25c88]" />
              Lesson Details
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Target Module Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Select Target Module *</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200"
                >
                  {subject.modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </select>
                {errorFields.moduleId && (
                  <span className="text-[11px] text-red-500 font-bold">{errorFields.moduleId}</span>
                )}
              </div>

              {/* Lesson Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Lesson Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Lesson 1.1: Velocity and Acceleration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200 ${
                    errorFields.title ? "border-red-400" : "border-[#E5E1D8]"
                  }`}
                />
                {errorFields.title && (
                  <span className="text-[11px] text-red-500 font-bold">{errorFields.title}</span>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Lesson Description</label>
                <textarea
                  placeholder="Core topics covered, learning outcomes, or reading assignments..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200 resize-none"
                />
              </div>

              {/* Date Segment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-zinc-600">Open Date</label>
                  <input
                    type="date"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-zinc-600">Close Date</label>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200"
                  />
                </div>
              </div>
              {errorFields.dates && (
                <span className="text-[11px] text-red-500 font-bold">{errorFields.dates}</span>
              )}

              {/* Access Restriction Toggle */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-[12px] font-bold text-zinc-600">Submission Restriction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCloseType("open")}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      closeType === "open"
                        ? "border-[#f25c88] bg-[#f25c88]/5 text-zinc-950 font-bold"
                        : "border-[#E5E1D8] bg-[#FAF9F5] text-zinc-500 font-semibold"
                    }`}
                  >
                    <Unlock className="w-4.5 h-4.5" />
                    <div className="flex flex-col items-center">
                      <span className="text-[11px]">Open Submission</span>
                      <span className="text-[8.5px] text-zinc-400 font-semibold mt-0.5 text-center leading-tight">Allows late uploads</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCloseType("restrict")}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      closeType === "restrict"
                        ? "border-[#f25c88] bg-[#f25c88]/5 text-zinc-950 font-bold"
                        : "border-[#E5E1D8] bg-[#FAF9F5] text-zinc-500 font-semibold"
                    }`}
                  >
                    <Lock className="w-4.5 h-4.5" />
                    <div className="flex flex-col items-center">
                      <span className="text-[11px]">Restricted</span>
                      <span className="text-[8.5px] text-zinc-400 font-semibold mt-0.5 text-center leading-tight">Locks after close date</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-zinc-100 mt-2">
                <Link
                  href={`/dashboard/subject/${subject.id}`}
                  className="px-6 py-2.5 border border-[#E5E1D8] text-zinc-700 font-bold rounded-full text-[12px] hover:bg-[#FAF9F5] transition-all cursor-pointer"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-[#121212] text-white hover:bg-zinc-800 font-bold rounded-full text-[12px] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Create Lesson
                </button>
              </div>
            </form>
          </div>

          {/* Column 3: Guidelines Card */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2 pb-2 border-b border-zinc-100">
              <Info className="w-4 h-4 text-[#f25c88]" />
              Lesson Guidelines
            </h3>

            <div className="flex flex-col gap-4 text-[12px] text-zinc-600 font-medium">
              <div className="flex gap-2.5 items-start bg-[#f25c88]/5 p-3 rounded-2xl border border-[#f25c88]/10 text-zinc-800">
                <Lightbulb className="w-4 h-4 text-[#f25c88] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-[12px] block text-[#f25c88] mb-0.5">Lesson Placement</span>
                  Lessons must reside inside a module segment. They act as actual lecture dates containing materials, notes, and file upload dropzones.
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-zinc-950">Locking Policy</span>
                  By enabling *Restricted Submission*, the submission slot locks down automatically on the close date, rejecting any late files from students.
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-zinc-950">Submissions</span>
                  Students can submit their assignments directly within the lesson row in the main syllabus detail view.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
