"use client";

import React from "react";
import Header from "../../components/views/Header";
import SubjectCard from "../../components/ui/SubjectCard";
import EventModal from "../../components/views/EventModal";
import { useLms } from "../../context/LmsContext";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { subjects, searchQuery, currentUser } = useLms();

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.lecturers.some((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Split subjects by creator ID
  const createdSubjects = filteredSubjects.filter(
    (subject) => subject.createdBy === currentUser?.id
  );
  
  const otherSubjects = filteredSubjects.filter(
    (subject) => subject.createdBy !== currentUser?.id
  );

  return (
    <>
      {/* Header Panel */}
      <Header />

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-6 text-left select-none">
        
        {/* Section 1: Created by Me */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-extrabold text-[#121212] tracking-tight">
                Classes Created by Me
              </h2>
              <span className="bg-[#f25c88]/10 text-[#f25c88] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                {createdSubjects.length}
              </span>
            </div>
            <Link
              href="/dashboard/subject/create"
              className="flex items-center gap-1 px-4 py-2 bg-[#121212] text-white hover:bg-zinc-800 text-[11px] font-extrabold rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Class
            </Link>
          </div>

          {createdSubjects.length === 0 ? (
            <div className="w-full h-32 flex flex-col items-center justify-center border border-dashed border-[#E5E1D8] rounded-3xl p-6 bg-white/40">
              <span className="text-[12px] text-zinc-400 font-semibold">You haven't created any subjects yet.</span>
              <Link href="/dashboard/subject/create" className="text-[11px] text-[#f25c88] font-bold mt-1.5 hover:underline">
                Create one now &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {createdSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: General/Enrolled Subjects */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-extrabold text-[#121212] tracking-tight">
              Enrolled Courses & Subjects
            </h2>
            <span className="bg-[#FAF7F2] border border-[#E5E1D8] text-zinc-600 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {otherSubjects.length}
            </span>
          </div>

          {otherSubjects.length === 0 ? (
            <div className="w-full h-32 flex flex-col items-center justify-center border border-dashed border-[#E5E1D8] rounded-3xl p-6 bg-white/40">
              <span className="text-[12px] text-zinc-400 font-semibold">No other enrolled subjects match.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {otherSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Interactive Modal */}
      <EventModal />
    </>
  );
}
