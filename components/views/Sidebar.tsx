"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  BookOpen,
  FileText,
  LogOut,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useLms } from "../../context/LmsContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync state with localStorage on client mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_state");
    // 1 is open (default), 0 is minimized
    if (saved === "0") {
      setIsMinimized(true);
    }
  }, []);

  const handleToggle = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_state", next ? "0" : "1");
      return next;
    });
  };

  const generalItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
    { name: "Create Subject", icon: Plus, href: "/dashboard/subject/create" },
    { name: "Statistics & reports", icon: BarChart3, href: "#" },
    { name: "Education", icon: BookOpen, href: "#" },
    { name: "My articles", icon: FileText, href: "#" },
  ];

  return (
    <aside
      className={`bg-[#121212] text-zinc-400 p-6 flex flex-col justify-between rounded-3xl m-4 mr-0 select-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isMinimized ? "w-[88px] px-4" : "w-[260px] px-6"
      }`}
    >
      <div className="flex flex-col gap-8">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between mt-2 px-1.5 gap-2 w-full">
          <div
            className={`flex items-center gap-2 transition-all duration-300 ${
              isMinimized ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            }`}
          >
            <span className="text-white text-3xl font-semibold tracking-tight font-sans">
              Vloatty
            </span>
          </div>
          <button
            onClick={handleToggle}
            className="w-6 h-6 rounded-full bg-[#f25c88] flex items-center justify-center text-white hover:bg-[#d84b72] transition-colors shadow-sm cursor-pointer flex-shrink-0"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-300 ${
                isMinimized ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* General Nav */}
        <div className="flex flex-col gap-2">
          <span
            className={`text-[11px] font-semibold text-zinc-600 tracking-wider uppercase px-3 transition-all duration-300 ${
              isMinimized ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            }`}
          >
            General
          </span>
          <nav className="flex flex-col gap-1 mt-1">
            {generalItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href !== "#" &&
                (pathname === item.href || (item.href === "/dashboard" && pathname === "/"));
              
              const content = (
                <>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                      isActive ? "text-[#f25c88]" : "text-zinc-500"
                    }`}
                  />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                      isMinimized
                        ? "opacity-0 w-0 pointer-events-none"
                        : "opacity-100 w-auto"
                    }`}
                  >
                    {item.name}
                  </span>
                </>
              );

              const buttonClass = `w-full flex items-center rounded-xl text-[14px] font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "text-[#f25c88] bg-white/[0.03] shadow-sm relative before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-[3px] before:bg-[#f25c88] before:rounded-r-md"
                  : "hover:text-zinc-200 hover:bg-white/[0.01]"
              } ${isMinimized ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}`;

              if (item.href === "#") {
                return (
                  <button key={item.name} className={buttonClass}>
                    {content}
                  </button>
                );
              }

              return (
                <Link key={item.name} href={item.href} className={buttonClass}>
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Log Out at bottom */}
      <div className="mt-auto pt-6 border-t border-zinc-800/50">
        <button
          className={`w-full flex items-center rounded-xl text-[14px] font-medium hover:text-red-400 hover:bg-red-500/[0.02] transition-all duration-200 cursor-pointer text-zinc-500 ${
            isMinimized ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span
            className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
              isMinimized ? "opacity-0 w-0 pointer-events-none" : "opacity-100 w-auto"
            }`}
          >
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}
