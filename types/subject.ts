export interface Lesson {
  id: string;
  title: string;
  desc: string;
  homeworkFile?: string;
  openDate: string; // ISO String
  closeDate: string; // ISO String
  closeType: "restrict" | "open";
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  deletedAt: string | null; // ISO String or null
}

export interface Module {
  id: string;
  title: string;
  desc: string;
  date: string; // ISO String
  lessons: Lesson[];
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  deletedAt: string | null; // ISO String or null
}

export interface SubjectSchedule {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
}


export interface SubjectLecturer {
  userId: string;
  name: string;
  email?: string;
}

export interface Subject {
  id: string;
  name: string;
  lecturers: SubjectLecturer[];
  room?: string;
  color?: string;
  description?: string;
  modules: Module[];
  schedules?: SubjectSchedule[];
  createdBy: string;
  deletedBy: string | null;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  deletedAt: string | null; // ISO String or null
}

