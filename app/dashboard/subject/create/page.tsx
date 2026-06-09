"use client";

import React, { useState } from "react";
import Header from "../../../../components/views/Header";
import { useLms } from "../../../../context/LmsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  Check,
} from "lucide-react";

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

interface FormModule {
  title: string;
  desc: string;
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

export default function CreateSubjectPage() {
  const { addSubject, currentUser } = useLms();
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState("#f25c88"); // Hex color picker default

  const [lecturers, setLecturers] = useState<FormLecturer[]>([{ email: "", name: "" }]);
  const [schedules, setSchedules] = useState<FormSchedule[]>([
    { day: "Monday", startTime: "09:00", endTime: "10:40", room: "" },
  ]);
  const [modules, setModules] = useState<FormModule[]>([]);

  // Feedback states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Handlers: Lecturers
  const handleAddLecturer = () => {
    setLecturers((prev) => [...prev, { email: "", name: "" }]);
  };

  const handleRemoveLecturer = (index: number) => {
    if (lecturers.length === 1) return;
    setLecturers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLecturerEmailChange = (index: number, emailValue: string) => {
    setLecturers((prev) => {
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
    setLecturers((prev) => {
      const copy = [...prev];
      copy[index].name = nameValue;
      return copy;
    });
  };

  // Dynamic Handlers: Schedules
  const handleAddSchedule = () => {
    setSchedules((prev) => [
      ...prev,
      { day: "Monday", startTime: "09:00", endTime: "10:40", room: "" },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    if (schedules.length === 1) return;
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof FormSchedule,
    value: string
  ) => {
    setSchedules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Dynamic Handlers: Modules
  const handleAddModule = () => {
    setModules((prev) => [...prev, { title: "", desc: "" }]);
  };

  const handleRemoveModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModuleChange = (
    index: number,
    field: keyof FormModule,
    value: string
  ) => {
    setModules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Subject name is required.";
    }

    const validLecturers = lecturers.filter(
      (l) => l.email.trim() !== "" && l.name.trim() !== ""
    );
    if (validLecturers.length === 0) {
      newErrors.lecturers = "At least one contributor with email and resolved name is required.";
    }

    schedules.forEach((sch, idx) => {
      if (!sch.startTime || !sch.endTime) {
        newErrors.schedules = "All schedule rows must have start and end times.";
      } else if (sch.startTime >= sch.endTime) {
        newErrors.schedules = "Start time must be earlier than end time.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Map lecturers and generate mock user IDs
    const mappedLecturers = lecturers
      .filter((l) => l.email.trim() !== "" && l.name.trim() !== "")
      .map((l) => ({
        userId: `u_lecturer_${Math.random().toString(36).substring(2, 9)}`,
        name: l.name.trim(),
        email: l.email.trim(),
      }));

    // Map schedules and inject parent room if schedule room is left empty
    const mappedSchedules = schedules.map((sch) => ({
      day: sch.day,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room.trim() || room.trim() || "Online Classroom",
    }));

    // Map modules with initial templates
    const mappedModules = modules
      .filter((m) => m.title.trim() !== "")
      .map((m) => {
        const mId = typeof window !== "undefined" && window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : Math.random().toString(36).substring(2, 9);
        return {
          id: mId,
          title: m.title.trim(),
          desc: m.desc.trim(),
          date: new Date().toISOString(),
          lessons: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        };
      });

    // Add subject with creator metadata
    setTimeout(() => {
      addSubject({
        name: name.trim(),
        description: description.trim(),
        room: room.trim() || "Online Classroom",
        color,
        lecturers: mappedLecturers,
        schedules: mappedSchedules,
        modules: mappedModules,
        createdBy: currentUser?.id || "c9c15c47-469a-412f-8431-21568eaf35d4",
        deletedBy: null,
      });

      setIsSubmitting(false);
      router.push("/dashboard");
    }, 800);
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <>
      <Header />

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4 flex flex-col gap-6 text-left select-none max-w-4xl mx-auto w-full">
        {/* Navigation back */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full border border-[#E5E1D8] flex items-center justify-center text-zinc-600 hover:bg-white transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight">
              Create New Subject
            </h1>
            <p className="text-[12px] text-zinc-500 font-medium">
              Create a new educational course card, define schedules, and add modules.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Main Card Information */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#f25c88]" />
              Basic Information
            </h3>

            {/* Subject Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-zinc-600">Subject Name *</label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence & Neural Networks"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200 ${
                  errors.name ? "border-red-400 focus:ring-red-400/20 focus:border-red-400" : "border-[#E5E1D8]"
                }`}
              />
              {errors.name && (
                <span className="text-[11px] text-red-500 font-bold">{errors.name}</span>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-zinc-600">Course Description</label>
              <textarea
                placeholder="Write a brief overview of what this subject covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200 resize-none"
              />
            </div>

            {/* Room Location & Color selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-zinc-600">Default Classroom Location</label>
                <input
                  type="text"
                  placeholder="e.g. West Campus, Lab 402"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] text-[14px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88] transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-zinc-600">Theme Color (Color Wheel Picker)</label>
                <div className="flex items-center gap-3.5 bg-[#FAF9F5] border border-[#EBE8E0] p-3 rounded-2xl">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-[#E5E1D8] cursor-pointer overflow-hidden p-0 bg-transparent flex-shrink-0"
                  />
                  <div className="flex flex-col select-none">
                    <span className="text-[13px] font-bold text-zinc-800 uppercase tracking-wider">{color}</span>
                    <span className="text-[10px] text-zinc-400 font-bold">Click block to launch color wheel picker</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lecturers Section */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#f25c88]" />
                Lecturers (Add by Email) *
              </h3>
              <button
                type="button"
                onClick={handleAddLecturer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D8] hover:bg-[#FAF9F5] text-[11px] font-bold text-zinc-700 hover:border-zinc-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lecturer
              </button>
            </div>

            {errors.lecturers && (
              <span className="text-[11px] text-red-500 font-bold">{errors.lecturers}</span>
            )}

            <div className="flex flex-col gap-4">
              {lecturers.map((lecturer, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start border border-[#EBE8E0] p-4 rounded-2xl bg-[#FAF9F5] animate-in slide-in-from-top-2 duration-200">
                  {/* Email Box */}
                  <div className="md:col-span-6 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lecturer Email</label>
                    <input
                      type="email"
                      placeholder="e.g. olivia@vloatty.edu"
                      value={lecturer.email}
                      onChange={(e) => handleLecturerEmailChange(idx, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88]"
                    />
                  </div>

                  {/* Name Box (Derived / Editable) */}
                  <div className="md:col-span-5 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      placeholder="Will autocomplete or write custom"
                      value={lecturer.name}
                      onChange={(e) => handleLecturerNameChange(idx, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88]"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="md:col-span-1 flex justify-end pt-5 md:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveLecturer(idx)}
                      disabled={lecturers.length === 1}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                        lecturers.length === 1
                          ? "border-zinc-100 text-zinc-300 cursor-not-allowed"
                          : "border-[#E5E1D8] text-zinc-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedules Section */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#f25c88]" />
                Timetable Schedules
              </h3>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D8] hover:bg-[#FAF9F5] text-[11px] font-bold text-zinc-700 hover:border-zinc-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Schedule Slot
              </button>
            </div>

            {errors.schedules && (
              <span className="text-[11px] text-red-500 font-bold">{errors.schedules}</span>
            )}

            <div className="flex flex-col gap-4">
              {schedules.map((schedule, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border border-dashed border-[#E5E1D8] p-4 rounded-2xl bg-[#FAF9F5] animate-in slide-in-from-top-2 duration-200"
                >
                  {/* Day Selection */}
                  <div className="sm:col-span-3 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Day of Week</label>
                    <select
                      value={schedule.day}
                      onChange={(e) => handleScheduleChange(idx, "day", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88]"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Time */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Start Time</label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleScheduleChange(idx, "startTime", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-[#E5E1D8] bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20"
                    />
                  </div>

                  {/* End Time */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">End Time</label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => handleScheduleChange(idx, "endTime", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-[#E5E1D8] bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20"
                    />
                  </div>

                  {/* Classroom Setting (New Column!) */}
                  <div className="sm:col-span-4 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Classroom Location</label>
                    <input
                      type="text"
                      placeholder="Inherit parent room if empty"
                      value={schedule.room}
                      onChange={(e) => handleScheduleChange(idx, "room", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E5E1D8] bg-white text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(idx)}
                      disabled={schedules.length === 1}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                        schedules.length === 1
                          ? "border-zinc-100 text-zinc-300 cursor-not-allowed"
                          : "border-[#E5E1D8] text-zinc-500 hover:text-red-500 hover:border-red-200 hover:bg-red-5/50"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules Section */}
          <div className="bg-white border border-[#EBE8E0] rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-[14px] font-bold text-[#121212] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#f25c88]" />
                Course Modules (Optional)
              </h3>
              <button
                type="button"
                onClick={handleAddModule}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D8] hover:bg-[#FAF9F5] text-[11px] font-bold text-zinc-700 hover:border-zinc-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Module
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#E5E1D8] rounded-2xl bg-[#FAF9F5]">
                <p className="text-[12px] text-zinc-400 font-medium">No initial modules added. You can create them later.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {modules.map((mod, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 border border-[#EBE8E0] p-4 rounded-2xl bg-white relative animate-in slide-in-from-top-2 duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center border border-[#E5E1D8] text-zinc-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-col gap-1.5 w-11/12">
                      <label className="text-[11px] font-bold text-zinc-500">Module Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Module 1: Foundations of Artificial Intelligence"
                        value={mod.title}
                        onChange={(e) => handleModuleChange(idx, "title", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-[13px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-500">Module Summary</label>
                      <input
                        type="text"
                        placeholder="e.g. Learning key terminology, basic heuristics search, and histories."
                        value={mod.desc}
                        onChange={(e) => handleModuleChange(idx, "desc", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-[13px] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f25c88]/20 focus:border-[#f25c88]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-[#E5E1D8] text-zinc-700 font-bold rounded-full text-[13px] hover:bg-white hover:border-zinc-400 transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#121212] text-white font-bold rounded-full text-[13px] shadow-sm hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Subject
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
