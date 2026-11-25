"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_STUDENT_PROFILE } from "@/lib/serializers";
import type {
  AuthUserDTO,
  ChatMessage,
  CountryDTO,
  FinancialPlanDTO,
  GuestWorkspaceState,
  JourneyTaskDTO,
  StudentProfile,
  UserJourneyDTO,
} from "@/lib/types";
import { useCurrency } from "./CurrencyProvider";

const GUEST_STORAGE_KEY = "bideshjabo_guest_v1";

const DEFAULT_FINANCIAL_PLAN: FinancialPlanDTO = {
  id: "guest-plan",
  name: "Primary Study Abroad Plan",
  targetCountrySlug: "poland",
  totalBudgetBdt: 2200000,
  pofTargetBdt: 1150000,
  seasoningStart: new Date(Date.now() - 42 * 86400000).toISOString().slice(0, 10),
  seasoningDaysReq: 90,
  items: [
    { id: "fi-1", category: "UPFRONT", label: "IELTS Academic Test Fee", amount: 27500, currencyCode: "BDT", isPaid: true, notes: "British Council / IDP Dhaka" },
    { id: "fi-2", category: "UPFRONT", label: "University Application Fees (3 Unis)", amount: 255, currencyCode: "PLN", isPaid: false, notes: "85 PLN per public uni" },
    { id: "fi-3", category: "UPFRONT", label: "MoFA, Apostille & Sworn Translation", amount: 18000, currencyCode: "BDT", isPaid: false, notes: "Education Board + MoFA Dhaka" },
    { id: "fi-4", category: "UPFRONT", label: "First-Semester Tuition Deposit", amount: 8750, currencyCode: "PLN", isPaid: false, notes: "50% of annual tuition" },
    { id: "fi-5", category: "UPFRONT", label: "Student Health Insurance (1 Year)", amount: 650, currencyCode: "PLN", isPaid: false, notes: "Required for D-Visa" },
    { id: "fi-6", category: "UPFRONT", label: "VFS / Embassy Visa + New Delhi Travel", amount: 45000, currencyCode: "BDT", isPaid: false, notes: "Includes Indian visa & flight" },
    { id: "fi-7", category: "UPFRONT", label: "One-Way Flight + First Month Cash", amount: 145000, currencyCode: "BDT", isPaid: false, notes: "Qatar/Turkish student fare + initial cash" },
    { id: "pof-1", category: "POF_SOURCE", label: "Personal / Sponsor Liquid Savings", amount: 850000, currencyCode: "BDT", isPaid: true, notes: "Seasoned bank account" },
    { id: "pof-2", category: "POF_SOURCE", label: "Family FDR / Credit Card Limit", amount: 450000, currencyCode: "BDT", isPaid: true, notes: "Backing buffer" },
  ],
};

const DEFAULT_GUEST_STATE: GuestWorkspaceState = {
  shortlistCountries: ["poland", "germany"],
  shortlistUniversities: [],
  compareCountries: ["poland", "germany", "sweden"],
  compareUniversities: [],
  researchNotes: {},
  journeys: [],
  financialPlan: DEFAULT_FINANCIAL_PLAN,
  studentProfile: DEFAULT_STUDENT_PROFILE,
  chatMessages: [],
};

interface WorkspaceContextValue {
  user: AuthUserDTO | null;
  isGuest: boolean;
  shortlistCountries: string[];
  shortlistUniversities: string[];
  compareCountries: string[];
  compareUniversities: string[];
  researchNotes: Record<string, string>;
  journeys: UserJourneyDTO[];
  financialPlan: FinancialPlanDTO;
  studentProfile: StudentProfile;
  chatMessages: ChatMessage[];
  toggleShortlistCountry: (slug: string) => Promise<void>;
  toggleShortlistUniversity: (slug: string) => Promise<void>;
  toggleCompareCountry: (slug: string) => void;
  clearCompareCountries: () => void;
  toggleCompareUniversity: (slug: string) => void;
  clearCompareUniversities: () => void;
  saveResearchNote: (countrySlug: string, content: string) => Promise<void>;
  startJourney: (countrySlug: string, targetIntake?: string, degreeLevel?: string) => Promise<UserJourneyDTO | null>;
  updateJourney: (journey: UserJourneyDTO) => Promise<void>;
  deleteJourney: (journeyId: string) => Promise<void>;
  saveFinancialPlan: (plan: FinancialPlanDTO) => Promise<void>;
  saveStudentProfile: (profile: StudentProfile) => Promise<void>;
  saveChatMessages: (messages: ChatMessage[]) => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  advisorOpen: boolean;
  setAdvisorOpen: (v: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { countries } = useCurrency();
  const [user, setUser] = useState<AuthUserDTO | null>(null);
  const [state, setState] = useState<GuestWorkspaceState>(DEFAULT_GUEST_STATE);
  const [hydrated, setHydrated] = useState(false);

  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  }, []);

  const persistGuest = useCallback((next: GuestWorkspaceState) => {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }, []);

  const readGuest = useCallback((): GuestWorkspaceState => {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (!raw) return DEFAULT_GUEST_STATE;
      const parsed = JSON.parse(raw) as Partial<GuestWorkspaceState>;
      return {
        ...DEFAULT_GUEST_STATE,
        ...parsed,
        studentProfile: {
          ...DEFAULT_STUDENT_PROFILE,
          ...(parsed.studentProfile || {}),
        },
        financialPlan: parsed.financialPlan?.items
          ? parsed.financialPlan
          : DEFAULT_FINANCIAL_PLAN,
      };
    } catch {
      return DEFAULT_GUEST_STATE;
    }
  }, []);

  const loadWorkspaceFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.workspace) {
        const w = data.workspace;
        setUser(w.user);
        setState((prev) => ({
          ...prev,
          shortlistCountries: w.shortlistCountries ?? [],
          shortlistUniversities: w.shortlistUniversities ?? [],
          researchNotes: w.researchNotes ?? {},
          journeys: w.journeys ?? [],
          financialPlan: w.financialPlan ?? prev.financialPlan,
          studentProfile: w.user.studentProfile ?? DEFAULT_STUDENT_PROFILE,
          chatMessages: w.chatMessages ?? [],
        }));
      } else {
        setUser(null);
        setState(readGuest());
      }
    } catch {
      setState(readGuest());
    } finally {
      setHydrated(true);
    }
  }, [readGuest]);

  useEffect(() => {
    loadWorkspaceFromServer();
  }, [loadWorkspaceFromServer]);

  // Keep guest state persisted automatically
  useEffect(() => {
    if (hydrated && !user) {
      persistGuest(state);
    }
  }, [hydrated, user, state, persistGuest]);

  const toggleShortlistCountry = useCallback(
    async (slug: string) => {
      const exists = state.shortlistCountries.includes(slug);
      setState((prev) => ({
        ...prev,
        shortlistCountries: exists
          ? prev.shortlistCountries.filter((s) => s !== slug)
          : [...prev.shortlistCountries, slug],
      }));
      showToast(exists ? "Removed from shortlist" : "Saved to shortlist");
      if (user) {
        await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggleShortlist", itemType: "COUNTRY", slug }),
        });
      }
    },
    [state.shortlistCountries, user, showToast]
  );

  const toggleShortlistUniversity = useCallback(
    async (slug: string) => {
      const exists = state.shortlistUniversities.includes(slug);
      setState((prev) => ({
        ...prev,
        shortlistUniversities: exists
          ? prev.shortlistUniversities.filter((s) => s !== slug)
          : [...prev.shortlistUniversities, slug],
      }));
      showToast(exists ? "University removed from shortlist" : "University saved to shortlist");
      if (user) {
        await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggleShortlist", itemType: "UNIVERSITY", slug }),
        });
      }
    },
    [state.shortlistUniversities, user, showToast]
  );

  const toggleCompareCountry = useCallback(
    (slug: string) => {
      setState((prev) => {
        if (prev.compareCountries.includes(slug)) {
          return {
            ...prev,
            compareCountries: prev.compareCountries.filter((s) => s !== slug),
          };
        }
        if (prev.compareCountries.length >= 4) {
          showToast("Comparison matrix supports up to 4 countries at once");
          return prev;
        }
        return { ...prev, compareCountries: [...prev.compareCountries, slug] };
      });
    },
    [showToast]
  );

  const clearCompareCountries = useCallback(() => {
    setState((prev) => ({ ...prev, compareCountries: [] }));
  }, []);

  const toggleCompareUniversity = useCallback(
    (slug: string) => {
      setState((prev) => {
        if (prev.compareUniversities.includes(slug)) {
          return {
            ...prev,
            compareUniversities: prev.compareUniversities.filter((s) => s !== slug),
          };
        }
        if (prev.compareUniversities.length >= 4) {
          showToast("Comparison matrix supports up to 4 universities at once");
          return prev;
        }
        return { ...prev, compareUniversities: [...prev.compareUniversities, slug] };
      });
    },
    [showToast]
  );

  const clearCompareUniversities = useCallback(() => {
    setState((prev) => ({ ...prev, compareUniversities: [] }));
  }, []);

  const saveResearchNote = useCallback(
    async (countrySlug: string, content: string) => {
      setState((prev) => ({
        ...prev,
        researchNotes: { ...prev.researchNotes, [countrySlug]: content },
      }));
      if (user) {
        await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "saveNote", countrySlug, content }),
        });
      }
    },
    [user]
  );

  const startJourney = useCallback(
    async (countrySlug: string, targetIntake = "Fall 2027", degreeLevel = "Master's") => {
      const existing = state.journeys.find((j) => j.countrySlug === countrySlug);
      if (existing) {
        showToast(`${existing.countryName} journey is already active`);
        return existing;
      }

      if (user) {
        const res = await fetch("/api/journeys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countrySlug, targetIntake, degreeLevel }),
        });
        if (res.ok) {
          const data = await res.json();
          setState((prev) => ({
            ...prev,
            journeys: [data.journey, ...prev.journeys],
          }));
          showToast(`Started ${data.journey.countryName} roadmap!`);
          return data.journey as UserJourneyDTO;
        }
      }

      const country: CountryDTO | undefined = countries.find((c) => c.slug === countrySlug);
      if (!country) return null;

      const tasks: JourneyTaskDTO[] = country.journeyTemplates.map((t, idx) => ({
        id: `task-${country.slug}-${idx}-${Date.now()}`,
        phase: t.phase,
        title: t.title,
        description: t.description,
        isCompleted: false,
        priority: t.priority,
        dueDate: null,
        subtasks: (t.subtasks || []).map((st, sIdx) => ({
          id: `sub-${idx}-${sIdx}`,
          title: st,
          done: false,
        })),
        sortOrder: idx,
        isCustom: false,
      }));

      const guestJourney: UserJourneyDTO = {
        id: `journey-${country.slug}-${Date.now()}`,
        countryId: country.id,
        countrySlug: country.slug,
        countryName: country.name,
        countryFlag: country.flagEmoji,
        targetIntake,
        degreeLevel,
        tasks,
        updatedAt: new Date().toISOString(),
      };

      setState((prev) => ({ ...prev, journeys: [guestJourney, ...prev.journeys] }));
      showToast(`Started ${country.name} application roadmap!`);
      return guestJourney;
    },
    [state.journeys, user, countries, showToast]
  );

  const updateJourney = useCallback(
    async (journey: UserJourneyDTO) => {
      setState((prev) => ({
        ...prev,
        journeys: prev.journeys.map((j) => (j.id === journey.id ? journey : j)),
      }));
      if (user) {
        await fetch(`/api/journeys/${journey.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetIntake: journey.targetIntake,
            degreeLevel: journey.degreeLevel,
            tasks: journey.tasks,
          }),
        });
      }
    },
    [user]
  );

  const deleteJourney = useCallback(
    async (journeyId: string) => {
      setState((prev) => ({
        ...prev,
        journeys: prev.journeys.filter((j) => j.id !== journeyId),
      }));
      if (user) {
        await fetch(`/api/journeys/${journeyId}`, { method: "DELETE" });
      }
      showToast("Journey removed");
    },
    [user, showToast]
  );

  const saveFinancialPlan = useCallback(
    async (plan: FinancialPlanDTO) => {
      setState((prev) => ({ ...prev, financialPlan: plan }));
      if (user) {
        await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "saveFinancialPlan", financialPlan: plan }),
        });
      }
    },
    [user]
  );

  const saveStudentProfile = useCallback(
    async (profile: StudentProfile) => {
      setState((prev) => ({ ...prev, studentProfile: profile }));
      if (user) {
        await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "saveProfile", studentProfile: profile }),
        });
      }
    },
    [user]
  );

  const saveChatMessages = useCallback(
    async (messages: ChatMessage[]) => {
      setState((prev) => ({ ...prev, chatMessages: messages }));
      if (user) {
        await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "saveChatMessages", chatMessages: messages }),
        });
      }
    },
    [user]
  );

  const syncGuestAndReload = useCallback(async () => {
    const guest = readGuest();
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guest),
    });
    await loadWorkspaceFromServer();
  }, [readGuest, loadWorkspaceFromServer]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Login failed" };
      await syncGuestAndReload();
      showToast("Signed in & synced your guest workspace!");
      return { ok: true };
    },
    [syncGuestAndReload, showToast]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Registration failed" };
      await syncGuestAndReload();
      showToast("Account created & guest workspace synced!");
      return { ok: true };
    },
    [syncGuestAndReload, showToast]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setState(readGuest());
    showToast("Switched back to Guest Mode");
  }, [readGuest, showToast]);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        isGuest: !user,
        shortlistCountries: state.shortlistCountries,
        shortlistUniversities: state.shortlistUniversities,
        compareCountries: state.compareCountries,
        compareUniversities: state.compareUniversities,
        researchNotes: state.researchNotes,
        journeys: state.journeys,
        financialPlan: state.financialPlan,
        studentProfile: state.studentProfile,
        chatMessages: state.chatMessages,
        toggleShortlistCountry,
        toggleShortlistUniversity,
        toggleCompareCountry,
        clearCompareCountries,
        toggleCompareUniversity,
        clearCompareUniversities,
        saveResearchNote,
        startJourney,
        updateJourney,
        deleteJourney,
        saveFinancialPlan,
        saveStudentProfile,
        saveChatMessages,
        login,
        register,
        logout,
        advisorOpen,
        setAdvisorOpen,
        authModalOpen,
        setAuthModalOpen,
        commandOpen,
        setCommandOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
