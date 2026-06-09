"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LmsEvent, CalendarViewType, LmsState, Subject } from "../types/lms";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  premiumStatus: "free" | "premium" | "professional";
  institution: string;
  avatar: string;
}

interface LmsContextType extends LmsState {
  subjects: Subject[];
  currentUser: UserProfile | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setSelectedView: (view: CalendarViewType) => void;
  setActiveDayIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  toggleCategory: (category: string) => void;
  addEvent: (event: Omit<LmsEvent, "id" | "createdAt" | "updatedAt" | "deletedAt">) => void;
  deleteEvent: (id: string) => void;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  selectedEvent: LmsEvent | null;
  setSelectedEvent: (event: LmsEvent | null) => void;
  addSubject: (subject: Omit<Subject, "id" | "createdAt" | "updatedAt" | "deletedAt">) => void;
  deleteSubject: (id: string) => void;
  updateSubject: (subject: Subject) => void;
}

const LmsContext = createContext<LmsContextType | undefined>(undefined);

export const LmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<LmsEvent[]>([]);
  const [selectedView, setSelectedView] = useState<CalendarViewType>("week");
  const [activeDayIndex, setActiveDayIndex] = useState<number>(3); // default Thursday (THU 14/05)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("07:21");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<LmsEvent | null>(null);

  // Fetch subjects from JSON static file on mount
  useEffect(() => {
    fetch(`/data/subjects.json?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data: Subject[]) => {
        setSubjects(data);

        // Derive calendar events from loaded subject schedules
        const dayMap: { [key: string]: number } = {
          "Monday": 0,
          "Tuesday": 1,
          "Wednesday": 2,
          "Thursday": 3,
          "Friday": 4,
          "Saturday": 5,
          "Sunday": 6
        };

        const loadedEvents: LmsEvent[] = [];
        data.forEach((subj) => {
          if (subj.schedules) {
            subj.schedules.forEach((sch, idx) => {
              loadedEvents.push({
                id: `${subj.id}-${sch.day}-${idx}`,
                title: subj.name,
                subtitle: sch.room || subj.room || "",
                timeStart: sch.startTime,
                timeEnd: sch.endTime,
                dayIndex: dayMap[sch.day] !== undefined ? dayMap[sch.day] : 0,
                color: subj.color || "cream",
                subjectId: subj.id,
                createdAt: subj.createdAt,
                updatedAt: subj.updatedAt,
                deletedAt: null
              });
            });
          }
        });
        setEvents(loadedEvents);
      })
      .catch((err) => {
        console.error("Error fetching subjects data:", err);
      });
  }, []);

  // Fetch current user details on mount
  useEffect(() => {
    fetch(`/data/user.json?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user.json");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error("Error fetching user data in LMS Context:", err));
  }, []);

  // Sync with real date and time once mounted on the client to avoid SSR hydration mismatch
  useEffect(() => {
    const updateRealTimeAndDay = () => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setCurrentTime(currentHourMin);

      const day = now.getDay();
      const todayIndex = day === 0 ? 6 : day - 1; // Sunday is 6, Monday is 0...
      setActiveDayIndex(todayIndex);
    };

    updateRealTimeAndDay();
    const timer = setInterval(updateRealTimeAndDay, 30000);

    return () => clearInterval(timer);
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const addEvent = (eventData: Omit<LmsEvent, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    const now = new Date().toISOString();
    const newEvent: LmsEvent = {
      ...eventData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const deleteEvent = (id: string) => {
    // Soft deletion: update deletedAt instead of removing
    const now = new Date().toISOString();
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, deletedAt: now } : e))
    );
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
    }
  };

  const addSubject = (subjectData: Omit<Subject, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    const now = new Date().toISOString();
    const newId = typeof window !== "undefined" && window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Math.random().toString(36).substring(2, 9);

    const newSubject: Subject = {
      ...subjectData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    setSubjects((prev) => [...prev, newSubject]);

    // Derive calendar events from new schedules
    if (newSubject.schedules) {
      const dayMap: { [key: string]: number } = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
      };

      const newEvents: LmsEvent[] = newSubject.schedules.map((sch, idx) => ({
        id: `${newSubject.id}-${sch.day}-${idx}`,
        title: newSubject.name,
        subtitle: newSubject.room || "",
        timeStart: sch.startTime,
        timeEnd: sch.endTime,
        dayIndex: dayMap[sch.day] !== undefined ? dayMap[sch.day] : 0,
        color: newSubject.color || "cream",
        subjectId: newSubject.id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }));

      setEvents((prev) => [...prev, ...newEvents]);
    }
  };

  const deleteSubject = (id: string) => {
    // Soft deletion: update deletedAt instead of removing
    const now = new Date().toISOString();
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, deletedAt: now } : s))
    );
    setEvents((prev) =>
      prev.map((e) => (e.subjectId === id ? { ...e, deletedAt: now } : e))
    );
  };

  const updateSubject = (updatedSubject: Subject) => {
    const now = new Date().toISOString();
    setSubjects((prev) =>
      prev.map((s) => (s.id === updatedSubject.id ? { ...updatedSubject, updatedAt: now } : s))
    );
  };

  // Expose active (non-soft-deleted) items only
  const activeSubjects = subjects.filter((s) => !s.deletedAt);
  const activeEvents = events.filter((e) => {
    if (e.deletedAt) return false;
    if (e.subjectId) {
      return activeSubjects.some((s) => s.id === e.subjectId);
    }
    return true;
  });

  return (
    <LmsContext.Provider
      value={{
        subjects: activeSubjects,
        currentUser,
        setCurrentUser,
        events: activeEvents,
        selectedView,
        activeDayIndex,
        searchQuery,
        selectedCategories,
        currentTime,
        showAddModal,
        setShowAddModal,
        selectedEvent,
        setSelectedEvent,
        setSelectedView,
        setActiveDayIndex,
        setSearchQuery,
        toggleCategory,
        addEvent,
        deleteEvent,
        addSubject,
        deleteSubject,
        updateSubject,
      }}
    >
      {children}
    </LmsContext.Provider>
  );
};

export const useLms = () => {
  const context = useContext(LmsContext);
  if (!context) {
    throw new Error("useLms must be used within a LmsProvider");
  }
  return context;
};
