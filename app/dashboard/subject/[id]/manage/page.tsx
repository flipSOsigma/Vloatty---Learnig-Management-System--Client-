"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../../../components/views/Header";
import { useLms } from "../../../../../context/LmsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
  Clock,
  Settings,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FormLecturer {
  email: string;
  name: string;
}

interface FormSchedule {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

const facultyMock: { [email: string]: string } = {
  "olivia@vloatty.edu": "Dr. Olivia",
  "feynman@vloatty.edu": "Prof. Richard Feynman",
  "curie@vloatty.edu": "Dr. Marie Curie",
  "pasteur@vloatty.edu": "Dr. Louis Pasteur",
  "shakespeare@vloatty.edu": "Prof. William Shakespeare",
  "herodotus@vloatty.edu": "Prof. Herodotus",
  "galileo@vloatty.edu": "Prof. Galileo Galilei",
  "turing@vloatty.edu": "Dr. Alan Turing",
};

export default function ManageSubjectPage({ params }: PageProps) {
  const { id } = React.use(params);
  const { subjects, currentUser, updateSubject } = useLms();
  const router = useRouter();

  // Find the subject
  const subject = subjects.find((s) => s.id === id);

  // Form states: Edit Subject Details
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [subjectRoom, setSubjectRoom] = useState("");
  const [subjectColor, setSubjectColor] = useState("#f25c88");
  const [subjectLecturers, setSubjectLecturers] = useState<FormLecturer[]>([]);
  const [subjectSchedules, setSubjectSchedules] = useState<FormSchedule[]>([]);

  // UI States
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form details when subject is loaded
  useEffect(() => {
    if (subject) {
      setSubjectName(subject.name);
      setSubjectDesc(subject.description || "");
      setSubjectRoom(subject.room || "");
      setSubjectColor(subject.color && subject.color.startsWith("#") ? subject.color : "#f25c88");
      setSubjectLecturers(subject.lecturers.map((l) => ({ email: l.email || "", name: l.name })));
      setSubjectSchedules(
        subject.schedules ? subject.schedules.map((s) => ({ ...s, room: s.room || "" })) : []
      );
    }
  }, [subject]);

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
            Only the subject creator has permissions to manage course materials.
          </span>
          <Link
            href="/dashboard"
            className="mt-4 px-5 py-2.5 bg-[#121212] text-white font-bold rounded-full text-[12px] hover:bg-zinc-800 transition-all shadow-sm"
          >
            Go back
          </Link>
        </div>
      </div>
    );
  }

  // Lecturer Change Handlers
  const handleLecturerEmailChange = (index: number, emailValue: string) => {
    setSubjectLecturers((prev) => {
      const copy = [...prev];
      copy[index].email = emailValue;

      const cleanEmail = emailValue.trim().toLowerCase();
      if (facultyMock[cleanEmail]) {
        copy[index].name = facultyMock[cleanEmail];
      } else if (cleanEmail.includes("@")) {
        const partBeforeAt = cleanEmail.split("@")[0];
        const resolvedName = partBeforeAt
          .split(".")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        copy[index].name = resolvedName;
      } else {
        copy[index].name = "";
      }
      return copy;
    });
  };

  const handleLecturerNameChange = (index: number, nameValue: string) => {
    setSubjectLecturers((prev) => {
      const copy = [...prev];
      copy[index].name = nameValue;
      return copy;
    });
  };

  // Schedule Change Handlers
  const handleScheduleChange = (index: number, field: keyof FormSchedule, value: string) => {
    setSubjectSchedules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle Save Details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFields({});

    const errors: { [key: string]: string } = {};
    if (!subjectName.trim()) {
      errors.subjectName = "Subject name is required.";
    }

    const validLecturers = subjectLecturers.filter((l) => l.email.trim() !== "" && l.name.trim() !== "");
    if (validLecturers.length === 0) {
      errors.subjectLecturers = "At least one lecturer with email and display name is required.";
    }

    subjectSchedules.forEach((sch, idx) => {
      if (!sch.startTime || !sch.endTime) {
        errors.subjectSchedules = "All schedule rows must have start and end times.";
      } else if (sch.startTime >= sch.endTime) {
        errors.subjectSchedules = "Start time must be earlier than end time.";
      }
    });

    if (Object.keys(errors).length > 0) {
      setErrorFields(errors);
      return;
    }

    setIsSaving(true);

    const mappedLecturers = validLecturers.map((l) => {
      const existing = subject.lecturers.find((ol) => ol.email === l.email);
      return {
        userId: existing ? existing.userId : `u_lecturer_${Math.random().toString(36).substring(2, 7)}`,
        name: l.name.trim(),
        email: l.email.trim(),
      };
    });

    const mappedSchedules = subjectSchedules.map((sch) => ({
      day: sch.day,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room.trim() || subjectRoom.trim() || "Online Classroom",
    }));

    const updatedSubject = {
      ...subject,
      name: subjectName.trim(),
      description: subjectDesc.trim(),
      room: subjectRoom.trim() || "Online Classroom",
      color: subjectColor,
      lecturers: mappedLecturers,
      schedules: mappedSchedules,
    };

    setTimeout(() => {
      updateSubject(updatedSubject);
      setIsSaving(false);
      setSuccessMessage("Subject details updated successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        router.push(`/dashboard/subject/${subject.id}`);
      }, 1000);
    }, 600);
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
              Edit Subject Details
            </h1>
            <p className="text-[12px] text-zinc-500 font-medium">
              Update course parameters, classroom, theme colors, lecturers, and class schedules.
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

        <form onSubmit={handleSaveDetails} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          {/* Column 1: Basic Parameters */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5 w-full">
            <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2 pb-2 border-b border-zinc-100">
              <Settings className="w-4 h-4 text-[#f25c88]" />
              Basic Parameters
            </h3>

            <div className="flex flex-col gap-4.5">
              {/* Subject Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Subject Name *</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200 ${
                    errorFields.subjectName ? "border-red-400" : "border-[#E5E1D8]"
                  }`}
                />
                {errorFields.subjectName && (
                  <span className="text-[11px] text-red-500 font-bold">{errorFields.subjectName}</span>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Course Description</label>
                <textarea
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200 resize-none"
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Default Classroom Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={subjectRoom}
                    onChange={(e) => setSubjectRoom(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200"
                  />
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                </div>
              </div>

              {/* Theme Color */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-zinc-600">Theme Color (Wheel Picker)</label>
                <div className="flex items-center gap-3 bg-[#FAF9F5] border border-[#EBE8E0] p-3 rounded-2xl">
                  <input
                    type="color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-[#E5E1D8] cursor-pointer overflow-hidden p-0 bg-transparent flex-shrink-0"
                  />
                  <div className="flex flex-col select-none min-w-0">
                    <span className="text-[12.5px] font-extrabold text-zinc-800 uppercase tracking-wider">{subjectColor}</span>
                    <span className="text-[9px] text-zinc-400 font-bold leading-tight">Click block to pick color</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Lecturers List */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5 w-full">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#f25c88]" />
                Lecturers *
              </h3>
              <button
                type="button"
                onClick={() => setSubjectLecturers((prev) => [...prev, { email: "", name: "" }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D8] hover:bg-[#FAF9F5] hover:border-zinc-400 text-[11px] font-bold text-zinc-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lecturer
              </button>
            </div>

            {errorFields.subjectLecturers && (
              <span className="text-[11px] text-red-500 font-bold">{errorFields.subjectLecturers}</span>
            )}

            <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
              {subjectLecturers.map((lecturer, idx) => {
                const initials = lecturer.name
                  ? lecturer.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
                  : "?";

                return (
                  <div key={idx} className="flex flex-col gap-2.5 border border-[#EBE8E0] p-4.5 rounded-2xl bg-[#FAF9F5] hover:bg-[#FAF9F5]/80 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f25c88]/10 border border-[#f25c88]/15 text-[#f25c88] text-[11px] font-black flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider leading-none">Lecturer #{idx + 1}</label>
                      </div>
                      {subjectLecturers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSubjectLecturers((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500">Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. olivia@vloatty.edu"
                          value={lecturer.email}
                          onChange={(e) => handleLecturerEmailChange(idx, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#f25c88] transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500">Display Name</label>
                        <input
                          type="text"
                          placeholder="Resolved name or write custom"
                          value={lecturer.name}
                          onChange={(e) => handleLecturerNameChange(idx, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#f25c88] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Schedules List */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5 w-full">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#f25c88]" />
                Schedules
              </h3>
              <button
                type="button"
                onClick={() => setSubjectSchedules((prev) => [...prev, { day: "Monday", startTime: "09:00", endTime: "10:40", room: "" }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D8] hover:bg-[#FAF9F5] hover:border-zinc-400 text-[11px] font-bold text-zinc-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Time
              </button>
            </div>

            {errorFields.subjectSchedules && (
              <span className="text-[11px] text-red-500 font-bold">{errorFields.subjectSchedules}</span>
            )}

            <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
              {subjectSchedules.map((schedule, idx) => (
                <div key={idx} className="flex flex-col gap-2.5 bg-[#FAF9F5] hover:bg-[#FAF9F5]/80 p-4.5 rounded-2xl border border-[#E5E1D8] transition-all">
                  <div className="flex items-center justify-between border-b border-[#E5E1D8]/40 pb-1.5">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Schedule Row #{idx + 1}</span>
                    {subjectSchedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSubjectSchedules((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Day Select */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" /> Day of Week
                      </label>
                      <select
                        value={schedule.day}
                        onChange={(e) => handleScheduleChange(idx, "day", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#f25c88] transition-all"
                      >
                        {daysOfWeek.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" /> Start
                        </label>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => handleScheduleChange(idx, "startTime", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f25c88] transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" /> End
                        </label>
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => handleScheduleChange(idx, "endTime", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f25c88] transition-all"
                        />
                      </div>
                    </div>

                    {/* Room Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" /> Classroom Location
                      </label>
                      <input
                        type="text"
                        placeholder="Inherit default location"
                        value={schedule.room}
                        onChange={(e) => handleScheduleChange(idx, "room", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f25c88] transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="lg:col-span-3 flex items-center gap-3 justify-end pt-4 border-t border-[#E5E1D8]/40 mt-2">
            <Link
              href={`/dashboard/subject/${subject.id}`}
              className="px-6 py-2.5 border border-[#E5E1D8] text-zinc-700 hover:text-[#121212] hover:border-zinc-400 font-bold rounded-full text-[12px] bg-white hover:bg-[#FAF9F5] transition-all cursor-pointer active:scale-[0.98]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-2.5 bg-[#121212] hover:bg-zinc-800 text-white font-bold rounded-full text-[12px] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
            >
              {isSaving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Details
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
