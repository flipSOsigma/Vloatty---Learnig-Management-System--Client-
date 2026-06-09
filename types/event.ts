import { Subject } from "./subject";

export interface LmsEvent {
  id: string;
  title: string;
  subtitle?: string; // e.g. "West camp, Room 312"
  timeStart: string; // "07:00"
  timeEnd: string; // "07:30"
  dayIndex: number; // 0 for Monday, 1 for Tuesday, etc. (0 to 6)
  color: string;
  tag?: {
    text: string;
    type: "pink" | "blue";
  };
  link?: {
    text: string;
    url: string;
  };
  participants?: {
    initials: string[];
    count: number; // total count, including initials list
  };
  status?: "in-progress" | "joinable" | "normal";
  description?: string;
  image?: string; // URL or local path
  subjectId?: string; // Link to the specific academic Subject
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  deletedAt: string | null; // ISO String or null
}
