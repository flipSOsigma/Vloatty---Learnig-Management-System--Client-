"use client";

import React, { useState } from "react";
import Header from "../../../../components/views/Header";
import EventModal from "../../../../components/views/EventModal";
import { useLms } from "../../../../context/LmsContext";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  UploadCloud,
  FileCheck,
  X,
  Calendar,
  Plus,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return isoString;
  }
};

export default function SubjectDetailPage({ params }: PageProps) {
  // Unwrap dynamic routing param promise
  const { id } = React.use(params);
  const { subjects, currentUser } = useLms();

  // Simulated uploader states
  const [uploadedFiles, setUploadedFiles] = useState<{ [lessonId: string]: { name: string; size: string } }>({});
  const [uploadingProgress, setUploadingProgress] = useState<{ [lessonId: string]: number }>({});

  const selectedSubject = subjects.find((s) => s.id === id);

  const handleSimulatedUpload = (lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(1) + " KB";

    setUploadingProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setUploadingProgress((prev) => ({ ...prev, [lessonId]: progress }));
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploadedFiles((prev) => ({ ...prev, [lessonId]: { name: fileName, size: fileSize } }));
          setUploadingProgress((prev) => {
            const copy = { ...prev };
            delete copy[lessonId];
            return copy;
          });
        }, 200);
      }
    }, 150);
  };

  const handleRemoveFile = (lessonId: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy[lessonId];
      return copy;
    });
  };



  if (!selectedSubject) {
    return (
      <div className="flex flex-col gap-6 text-left animate-in fade-in duration-300">
        <Header />
        <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#E5E1D8] rounded-3xl p-6 bg-white/10 select-none">
          <span className="text-[14px] text-zinc-400 font-semibold">Subject not found.</span>
          <Link
            href="/dashboard"
            className="mt-4 px-5 py-2.5 bg-[#121212] text-white font-bold rounded-full text-[12px] shadow-sm hover:bg-zinc-800 transition-colors"
          >
            Go back to Dashboard
          </Link>
        </div>
      </div>
    );
  }



  return (
    <>
      {/* Header Panel */}
      <Header />

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4 flex flex-col gap-6 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Navigation Row */}
        <div className="flex items-center justify-between mt-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E1D8] rounded-full hover:bg-zinc-100 font-bold text-[12px] text-zinc-700 cursor-pointer transition-colors shadow-sm bg-white/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Subjects</span>
        </Link>

        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Syllabus Detail
        </span>
      </div>

      {/* Split Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        {/* Left Column: Summary Info */}
        <div className="lg:col-span-1 bg-white/40 border border-[#E5E1D8]/60 p-6 rounded-3xl flex flex-col gap-5 shadow-sm sticky top-0">
          <div className="flex flex-col gap-1">
            <span
              className={`inline-block text-[9px] font-bold px-3 py-1 rounded-full w-fit ${
                selectedSubject.color === "yellow"
                  ? "bg-amber-100 text-amber-800"
                  : selectedSubject.color === "blue"
                  ? "bg-blue-100 text-blue-800"
                  : !selectedSubject.color || selectedSubject.color.startsWith("#")
                  ? ""
                  : "bg-zinc-200 text-zinc-800"
              }`}
              style={
                selectedSubject.color && selectedSubject.color.startsWith("#")
                  ? {
                      backgroundColor: `${selectedSubject.color}15`,
                      color: selectedSubject.color,
                      border: `1px solid ${selectedSubject.color}30`
                    }
                  : {}
              }
            >
              {selectedSubject.room || "Room Online"}
            </span>
            <h2 className="text-2xl font-black text-[#121212] tracking-tight mt-2 leading-tight">
              {selectedSubject.name}
            </h2>
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold text-[13px] mt-1">
              <GraduationCap className="w-4 h-4" />
              <span>Lecturers: {selectedSubject.lecturers.map((l) => l.name).join(", ")}</span>
            </div>
          </div>

          {selectedSubject.description && (
            <p className="text-[12px] text-zinc-500 leading-relaxed font-medium bg-[#FAF7F2]/50 p-4 border border-[#E5E1D8]/30 rounded-2xl">
              {selectedSubject.description}
            </p>
          )}

          {/* Class Schedules */}
          {selectedSubject.schedules && selectedSubject.schedules.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E1D8]/40">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                Class Schedule
              </span>
              <div className="flex flex-col gap-1.5">
                {selectedSubject.schedules.map((sch, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-[12px] font-bold text-zinc-700 bg-[#FAF7F2]/50 px-3.5 py-2 border border-[#E5E1D8]/30 rounded-xl"
                  >
                    <span>{sch.day}</span>
                    <span className="text-zinc-500 text-[11px]">{sch.startTime} - {sch.endTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSubject && currentUser && selectedSubject.createdBy === currentUser.id && (
            <Link
              href={`/dashboard/subject/${selectedSubject.id}/manage`}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-[#f25c88] hover:bg-[#d84b72] text-white font-bold text-[12px] rounded-2xl transition-all cursor-pointer shadow-sm active:scale-[0.98] mt-2 text-center"
            >
              <span>Manage Subject</span>
            </Link>
          )}

        </div>

        {/* Right Column: Modules and Lessons list */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <h3 className="text-[17px] font-extrabold text-[#121212] tracking-tight">
              Course Modules & Lessons
            </h3>
            {selectedSubject && currentUser && selectedSubject.createdBy === currentUser.id && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/subject/${selectedSubject.id}/module/create`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E1D8] hover:bg-zinc-100 font-bold text-[11px] text-[#f25c88] cursor-pointer transition-colors shadow-sm bg-white/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Module</span>
                </Link>
                <Link
                  href={`/dashboard/subject/${selectedSubject.id}/lesson/create`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E1D8] hover:bg-zinc-100 font-bold text-[11px] text-[#f25c88] cursor-pointer transition-colors shadow-sm bg-white/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lesson</span>
                </Link>
              </div>
            )}
          </div>

          {selectedSubject.modules.length === 0 ? (
            <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-[#E5E1D8] rounded-3xl">
              <span className="text-[13px] text-zinc-400 font-semibold">No modules registered yet.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {selectedSubject.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white/40 border border-[#E5E1D8]/50 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#E5E1D8]/40 pb-3">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[16px] font-extrabold text-[#121212]">
                        {mod.title}
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 font-semibold leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#f25c88] bg-[#f25c88]/10 px-3 py-1 rounded-full w-fit">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(mod.date)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-2">
                    {mod.lessons.map((lesson) => {
                      const isUploading = uploadingProgress[lesson.id] !== undefined;
                      const progress = uploadingProgress[lesson.id] || 0;
                      const isUploaded = uploadedFiles[lesson.id] !== undefined;
                      const fileInfo = uploadedFiles[lesson.id];

                      return (
                        <div
                          key={lesson.id}
                          className="bg-[#FAF7F2]/60 border border-[#E5E1D8]/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-6"
                        >
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="p-1 bg-[#121212] rounded text-white text-[9px] font-bold uppercase tracking-wide">
                                Lesson
                              </span>
                              <h5 className="text-[13.5px] font-bold text-zinc-950">
                                {lesson.title}
                              </h5>
                            </div>
                            <p className="text-[11.5px] text-zinc-500 leading-relaxed font-medium">
                              {lesson.desc}
                            </p>
                          </div>

                          <div className="w-full md:w-[260px] flex flex-col gap-2">
                            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                              Homework Submission
                            </span>

                            {isUploading ? (
                              <div className="border border-[#E5E1D8] bg-white rounded-xl p-3 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                                  <span>Uploading file...</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-100">
                                  <div
                                    className="h-full bg-[#f25c88] rounded-full transition-all duration-150"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            ) : isUploaded && fileInfo ? (
                              <div className="border border-emerald-500/25 bg-emerald-500/[0.03] rounded-xl p-3 flex items-center justify-between gap-2 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-zinc-800 truncate">
                                      {fileInfo.name}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 font-semibold">
                                      {fileInfo.size} • Submitted
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(lesson.id)}
                                  className="p-1 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed border-[#E5E1D8] hover:border-zinc-400 bg-white/50 hover:bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleSimulatedUpload(lesson.id, e)}
                                />
                                <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                <div className="flex flex-col items-center">
                                  <span className="text-[11px] font-bold text-zinc-800">
                                    Click to upload PDF
                                  </span>
                                  <span className="text-[9px] text-zinc-400 mt-0.5">
                                    Max size: 10MB
                                  </span>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </div>

      <EventModal />
    </>
  );
}
