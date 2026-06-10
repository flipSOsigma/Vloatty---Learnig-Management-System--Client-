import React from "react";
import Sidebar from "../../components/views/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen bg-[#FAF7F2] overflow-hidden">
      {/* Shared Sidebar */}
      <Sidebar />

      {/* Shared Main Content Panel container */}
      <main className="flex-1 flex flex-col p-4 pl-0 h-full min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#FAF7F2] rounded-3xl  px-6 gap-6 h-full overflow-hidden border border-[#EFECE6]/20">
          {children}
        </div>
      </main>
    </div>
  );
}
