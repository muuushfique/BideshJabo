import type {
  CurrencyFormatMode,
  GuestWorkspaceState,
  LifestyleTierKey,
} from "./types";

export const GUEST_STORAGE_KEY = "bideshjabo_guest_v2";
export const GUEST_COOKIE_NAME = "bideshjabo_guest_prefs";

export interface GuestCookiePrefs {
  formatMode?: CurrencyFormatMode;
  lifestyleTier?: LifestyleTierKey;
  shortlistCountries?: string[];
  compareCountries?: string[];
  targetCountrySlug?: string;
}

export function readGuestCookie(): GuestCookiePrefs {
  if (typeof document === "undefined") return {};
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${GUEST_COOKIE_NAME}=`));
    if (!match) return {};
    const raw = decodeURIComponent(match.split("=").slice(1).join("="));
    return JSON.parse(raw) as GuestCookiePrefs;
  } catch {
    return {};
  }
}

export function writeGuestCookie(patch: Partial<GuestCookiePrefs>) {
  if (typeof document === "undefined") return;
  try {
    const current = readGuestCookie();
    const merged: GuestCookiePrefs = { ...current, ...patch };
    const encoded = encodeURIComponent(JSON.stringify(merged));
    document.cookie = `${GUEST_COOKIE_NAME}=${encoded}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {
    // ignore cookie write errors
  }
}

export function readGuestWorkspace(fallback: GuestWorkspaceState): GuestWorkspaceState {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) {
      const cookiePrefs = readGuestCookie();
      return {
        ...fallback,
        shortlistCountries: cookiePrefs.shortlistCountries ?? [],
        compareCountries: cookiePrefs.compareCountries ?? [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<GuestWorkspaceState>;
    return {
      ...fallback,
      ...parsed,
      studentProfile: {
        ...fallback.studentProfile,
        ...(parsed.studentProfile || {}),
      },
      financialPlan: parsed.financialPlan?.items
        ? parsed.financialPlan
        : fallback.financialPlan,
    };
  } catch {
    return fallback;
  }
}

export function writeGuestWorkspace(state: GuestWorkspaceState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
    writeGuestCookie({
      shortlistCountries: state.shortlistCountries.slice(0, 12),
      compareCountries: state.compareCountries.slice(0, 4),
      targetCountrySlug: state.financialPlan.targetCountrySlug || undefined,
    });
  } catch {
    // ignore storage quota errors
  }
}

export function clearGuestStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    document.cookie = `${GUEST_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // ignore
  }
}
