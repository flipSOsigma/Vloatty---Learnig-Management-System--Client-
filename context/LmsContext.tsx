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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  // Fetch subjects from the backend API on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/subjects`, { cache: "no-store" })
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

  // Fetch current user details on mount from the backend API
  useEffect(() => {
    // Check if token is in localStorage, if not load default mock JWT from user.json
    let currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    const fetchUser = (tokenToUse: string | null) => {
      fetch(`${API_BASE_URL}/users/c9c15c47-469a-412f-8431-21568eaf35d4`, {
        cache: "no-store",
        headers: tokenToUse ? { "Authorization": `Bearer ${tokenToUse}` } : {}
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user profile from server");
          return res.json();
        })
        .then((data) => {
          if (data) {
            setCurrentUser(data);
          }
        })
        .catch((err) => {
          console.error("Error fetching user data in LMS Context, falling back to local mock data:", err);
          // Graceful fallback to static JSON if server is down or user is not found
          fetch(`/data/user.json?t=${Date.now()}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((localData) => {
              if (localData.user) {
                setCurrentUser(localData.user);
              }
            })
            .catch((localErr) => console.error("Error fetching fallback user data:", localErr));
        });
    };

    if (currentToken) {
      fetchUser(currentToken);
    } else {
      fetch(`/data/user.json?t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((localData) => {
          if (localData.jwt?.accessToken) {
            localStorage.setItem("token", localData.jwt.accessToken);
            fetchUser(localData.jwt.accessToken);
          } else {
            fetchUser(null);
          }
        })
        .catch(() => fetchUser(null));
    }
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

  const addSubject = async (subjectData: Omit<Subject, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
    try {
      const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { "Authorization": `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify(subjectData),
      });

      if (!response.ok) {
        throw new Error("Failed to add subject on the server");
      }

      const newSubject: Subject = await response.json();
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
          createdAt: newSubject.createdAt,
          updatedAt: newSubject.updatedAt,
          deletedAt: null
        }));

        setEvents((prev) => [...prev, ...newEvents]);
      }
    } catch (err) {
      console.error("Error adding subject to server:", err);
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: "DELETE",
        headers: currentToken ? { "Authorization": `Bearer ${currentToken}` } : {}
      });

      if (!response.ok) {
        throw new Error("Failed to delete subject on the server");
      }

      const now = new Date().toISOString();
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, deletedAt: now } : s))
      );
      setEvents((prev) =>
        prev.map((e) => (e.subjectId === id ? { ...e, deletedAt: now } : e))
      );
    } catch (err) {
      console.error("Error deleting subject from server:", err);
    }
  };

  const updateSubject = async (updatedSubject: Subject) => {
    try {
      const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/subjects/${updatedSubject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { "Authorization": `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify(updatedSubject),
      });

      if (!response.ok) {
        throw new Error("Failed to update subject on the server");
      }

      const savedSubject: Subject = await response.json();
      setSubjects((prev) =>
        prev.map((s) => (s.id === savedSubject.id ? savedSubject : s))
      );

      // Re-derive calendar events for this subject
      setEvents((prev) => {
        const remainingEvents = prev.filter((e) => e.subjectId !== savedSubject.id);
        if (savedSubject.schedules) {
          const dayMap: { [key: string]: number } = {
            "Monday": 0,
            "Tuesday": 1,
            "Wednesday": 2,
            "Thursday": 3,
            "Friday": 4,
            "Saturday": 5,
            "Sunday": 6
          };

          const newEvents = savedSubject.schedules.map((sch, idx) => ({
            id: `${savedSubject.id}-${sch.day}-${idx}`,
            title: savedSubject.name,
            subtitle: sch.room || savedSubject.room || "",
            timeStart: sch.startTime,
            timeEnd: sch.endTime,
            dayIndex: dayMap[sch.day] !== undefined ? dayMap[sch.day] : 0,
            color: savedSubject.color || "cream",
            subjectId: savedSubject.id,
            createdAt: savedSubject.createdAt,
            updatedAt: savedSubject.updatedAt,
            deletedAt: null
          }));

          return [...remainingEvents, ...newEvents];
        }
        return remainingEvents;
      });
    } catch (err) {
      console.error("Error updating subject on server:", err);
    }
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
