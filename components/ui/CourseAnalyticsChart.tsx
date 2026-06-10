"use client";

import { useState } from "react";
import { LmsEvent } from "../../types/event";
import { useLms } from "../../context/LmsContext";

interface StudyActivityChartProps {
  events: LmsEvent[];
}

const daysOfWeekFull = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const daysOfWeekShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getEventHours = (event: LmsEvent) => {
  try {
    const [sh, sm] = event.timeStart.split(":").map(Number);
    const [eh, em] = event.timeEnd.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return Math.max(0, (endMins - startMins) / 60);
  } catch (e) {
    return 0;
  }
};

export default function StudyActivityChart({ events }: StudyActivityChartProps) {
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const { currentTime } = useLms();

  if (!events || events.length === 0) return null;

  // Calculate hours of lectures per day of the week
  const dailyHours = Array(7).fill(0);
  const dailyEventCounts = Array(7).fill(0);

  events.forEach((event) => {
    if (event.dayIndex >= 0 && event.dayIndex <= 6) {
      const hrs = getEventHours(event);
      dailyHours[event.dayIndex] += hrs;
      dailyEventCounts[event.dayIndex] += 1;
    }
  });

  const totalWeeklyHours = dailyHours.reduce((sum, h) => sum + h, 0);

  // Find max value to scale Y-axis
  const maxHours = Math.max(...dailyHours, 4);
  const yMax = Math.ceil(maxHours / 2) * 2; // Next multiple of 2

  const xStart = 45;
  const xEnd = 775;
  const yStart = 20;
  const yHeight = 220; // Taller vertical scale to increase line height
  const yBottom = yStart + yHeight; // 240

  // Generate SVG path coordinates
  const points = dailyHours.map((hours, i) => {
    const x = xStart + i * 121.6;
    const y = yBottom - (hours / yMax) * yHeight;
    return { x, y, hours, dayName: daysOfWeekFull[i], count: dailyEventCounts[i] };
  });

  // Generate smooth cubic bezier SVG path
  const getBezierPath = (pts: typeof points) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = getBezierPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${yBottom} L ${points[0].x} ${yBottom} Z`;

  // Get current day index and time fraction for continuous line positioning
  const today = new Date();
  const currentDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon, 6=Sun

  // Parse currentTime (e.g. "18:41") safely
  const timeString = currentTime || "00:00";
  const [sh, sm] = timeString.split(":").map(Number);
  const hour = isNaN(sh) ? 12 : sh;
  const minute = isNaN(sm) ? 0 : sm;
  const dayFraction = (hour * 60 + minute) / 1440;

  const currentX = xStart + (currentDayIdx + dayFraction) * 121.6;

  const isNearRightEdge = currentX > 710;
  const badgeX = isNearRightEdge ? currentX - 72 : currentX + 8;

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-3xl p-5 pt-6 shadow-[0_4px_20px_rgba(0,0,0,0.005)] select-none w-full animate-in fade-in slide-in-from-top-2 -mt-1 duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(242,92,136,0.04)] hover:scale-[1.005] transition-all duration-300">
      {/* Chart container */}
      <div className="relative w-full h-full flex items-end">
        {/* Tooltip Popup */}
        {hoveredDayIdx !== null && (() => {
          const p = points[hoveredDayIdx];
          const percentLeft = (p.x / 800) * 100;
          const percentTop = (p.y / 275) * 100;

          return (
            <div
              className="absolute z-20 bg-zinc-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-2xl shadow-xl flex flex-col gap-0.5 text-[11px] font-semibold -translate-x-1/2 -translate-y-[calc(100%+10px)] pointer-events-none transition-all duration-150 border border-zinc-800"
              style={{
                left: `${percentLeft}%`,
                top: `${percentTop}%`, // Centered dynamically relative to current point's Y as a percentage of container
              }}
            >
              <span className="font-extrabold text-[12.5px] text-zinc-100 border-b border-zinc-800 pb-1 mb-1">
                {p.dayName}
              </span>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-400">Class Hours:</span>
                <span className="font-bold text-zinc-100">{p.hours.toFixed(1)} hrs</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-400">Sessions:</span>
                <span className="font-bold text-[#f25c88]">{p.count} classes</span>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute left-1/2 bottom-[-4px] -translate-x-1/2 w-2.5 h-2.5 bg-zinc-900/95 rotate-45 border-r border-b border-zinc-800" />
            </div>
          );
        })()}

        <svg viewBox="0 0 800 275" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f25c88" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f25c88" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Area under the curve */}
          <path
            d={areaPath}
            fill="url(#chartAreaGradient)"
            className="pointer-events-none"
          />

          {/* Bottom Baseline */}
          <line
            x1={xStart}
            y1={yBottom}
            x2={xEnd}
            y2={yBottom}
            stroke="#E5E1D8"
            strokeWidth={1.5}
          />

          {/* Y-Axis Labels & Ticks */}
          <g className="pointer-events-none select-none">
            {/* Y-Axis Vertical Line */}
            <line
              x1={xStart}
              y1={yStart}
              x2={xStart}
              y2={yBottom}
              stroke="#E5E1D8"
              strokeWidth={1.5}
            />

            {/* Ticks */}
            <line x1={xStart - 5} y1={yBottom} x2={xStart} y2={yBottom} stroke="#E5E1D8" strokeWidth={1.5} />
            <line x1={xStart - 5} y1={yBottom - yHeight / 2} x2={xStart} y2={yBottom - yHeight / 2} stroke="#E5E1D8" strokeWidth={1.5} />
            <line x1={xStart - 5} y1={yStart} x2={xStart} y2={yStart} stroke="#E5E1D8" strokeWidth={1.5} />

            {/* Labels */}
            <text
              x={xStart - 12}
              y={yBottom}
              dy="0.35em"
              className="text-[11px] font-extrabold fill-zinc-400"
              textAnchor="end"
            >
              0h
            </text>
            <text
              x={xStart - 12}
              y={yBottom - yHeight / 2}
              dy="0.35em"
              className="text-[11px] font-extrabold fill-zinc-400"
              textAnchor="end"
            >
              {(yMax / 2).toFixed(0)}h
            </text>
            <text
              x={xStart - 12}
              y={yStart}
              dy="0.35em"
              className="text-[11px] font-extrabold fill-zinc-400"
              textAnchor="end"
            >
              {yMax.toFixed(0)}h
            </text>
          </g>

          {/* Vertical Time Indicator Line */}
          <line
            x1={currentX}
            y1={yStart}
            x2={currentX}
            y2={yBottom}
            stroke="#f25c88"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            className="opacity-40 pointer-events-none"
            pointerEvents="none"
          />

          {/* Connected Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#f25c88"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Interactive Day Points */}
          {points.map((p, i) => {
            const isHovered = hoveredDayIdx === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredDayIdx(i)}
                onMouseLeave={() => setHoveredDayIdx(null)}
                className="cursor-pointer"
              >
                {/* Large invisible catch rect for hover accessibility */}
                <rect
                  x={p.x - 30}
                  y={yStart}
                  width={60}
                  height={yHeight + 20}
                  fill="transparent"
                />

                {/* Main Circle Marker */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 4}
                  fill={isHovered ? "#f25c88" : "#ffffff"}
                  stroke="#f25c88"
                  strokeWidth={2.5}
                  className="transition-all duration-150 pointer-events-none"
                  pointerEvents="none"
                />

                {/* X-Axis Labels */}
                <text
                  x={p.x}
                  y={265}
                  className={`text-[12px] font-extrabold fill-zinc-400 transition-colors duration-150 pointer-events-none ${
                    isHovered ? "fill-zinc-800" : "fill-zinc-400"
                  }`}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {daysOfWeekShort[i]}
                </text>
              </g>
            );
          })}

          {/* Current Time Clock Badge */}
          <g transform={`translate(${badgeX}, 10)`} className="pointer-events-none" pointerEvents="none">
            {/* Pill background */}
            <rect
              x={0}
              y={0}
              width={64}
              height={20}
              rx={10}
              fill="#121212"
            />
            {/* Clock Icon */}
            <circle cx={13} cy={10} r={4.5} stroke="#ffffff" strokeWidth={1} fill="none" />
            <line x1={13} y1={10} x2={13} y2={7.5} stroke="#ffffff" strokeWidth={1} strokeLinecap="round" />
            <line x1={13} y1={10} x2={16} y2={10} stroke="#ffffff" strokeWidth={1} strokeLinecap="round" />
            {/* Clock Text */}
            <text
              x={40}
              y={13.5}
              fill="#ffffff"
              fontSize="10px"
              fontWeight="bold"
              textAnchor="middle"
              className="font-mono"
            >
              {timeString}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
