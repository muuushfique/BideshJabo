"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Calculator,
  ChevronRight,
  Compass,
  GitCompare,
  Globe2,
  Home,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdvisorDrawer } from "../advisor/AdvisorDrawer";
import { useCurrency } from "../providers/CurrencyProvider";
import { useTheme } from "../providers/ThemeProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { AuthModal } from "./AuthModal";
import { CommandPalette } from "./CommandPalette";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/finances", label: "Finances", icon: Calculator },
  { href: "/journey", label: "Roadmaps", icon: ListChecks },
  { href: "/advisor", label: "AI Advisor", icon: Bot },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { formatMode, toggleFormatMode, countries } = useCurrency();
  const {
    user,
    isGuest,
    logout,
    setAdvisorOpen,
    setAuthModalOpen,
    setCommandOpen,
    journeys,
    compareCountries,
    toastMessage,
  } = useWorkspace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showBreadcrumbs =
    pathname.startsWith("/countries/") || pathname.startsWith("/admin");

  const breadcrumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [
      { label: "Home", href: "/" },
    ];
    if (parts[0] === "admin") {
      crumbs.push({ label: "Admin Console", href: "/admin" });
    } else if (parts[0] === "countries") {
      crumbs.push({ label: "Explore", href: "/explore" });
      if (parts[1]) {
        const c = countries.find((item) => item.slug === parts[1]);
        if (c) {
          crumbs.push({
            label: `${c.flagEmoji} ${c.name}`,
            href: `/countries/${c.slug}`,
          });
        } else {
          crumbs.push({ label: parts[1], href: `/countries/${parts[1]}` });
        }
      }
    }
    return crumbs;
  }, [pathname, countries]);

  if (pathname === "/admin/login") {
    return (
      <>
        {children}
        <CommandPalette />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Standard Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-sm">
                <Globe2 className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                BideshJabo
              </span>
            </Link>
          </div>

          {/* Center: Clean Horizontal Nav */}
          <nav className="hidden lg:flex items-center gap-1 rounded-xl border border-border/70 bg-card/60 p-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              const badgeCount =
                item.href === "/compare"
                  ? compareCountries.length
                  : item.href === "/journey"
                  ? journeys.length
                  : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="top-nav-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-secondary shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="relative z-10 rounded-full bg-indigo-500/20 px-1.5 py-0.2 font-mono text-[10px] text-indigo-400">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Utilities & Account */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              title="Quick Search (Cmd/Ctrl + K)"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-indigo-500/40 hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleFormatMode}
              title="Toggle BDT Display (Compact Lakh/Crore vs Exact)"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-2.5 py-1.5 font-mono text-xs font-medium transition hover:border-emerald-500/40"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>BDT: {formatMode === "compact" ? "Compact" : "Exact"}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="rounded-lg border border-border bg-card/70 p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Toggle dark or light theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {isGuest ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline max-w-[110px] truncate text-xs font-medium">
                  {user?.name}
                </span>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contextual Breadcrumbs only on deep/nested pages */}
        {showBreadcrumbs && (
          <div className="border-t border-border/60 bg-card/30">
            <nav className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground sm:px-6 lg:px-8">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href + idx}>
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                  <Link
                    href={crumb.href}
                    className={cn(
                      "transition hover:text-foreground",
                      idx === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""
                    )}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-border/70 bg-card/30 no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-foreground">BideshJabo</span>
            <span>• Study Abroad Research, Solvency &amp; Advisory OS</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/explore" className="hover:text-foreground">Explore</Link>
            <Link href="/compare" className="hover:text-foreground">Compare</Link>
            <Link href="/finances" className="hover:text-foreground">Finances</Link>
            <Link href="/journey" className="hover:text-foreground">Roadmaps</Link>
            <Link href="/advisor" className="hover:text-foreground">AI Advisor</Link>
            <Link href="/admin" className="inline-flex items-center gap-1 hover:text-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Ask AI Pill (hidden on /advisor & /admin) */}
      {!pathname.startsWith("/advisor") && !pathname.startsWith("/admin") && (
        <button
          onClick={() => setAdvisorOpen(true)}
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-indigo-500 active:scale-95 no-print"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI Advisor
        </button>
      )}

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="relative z-10 flex w-72 flex-col border-r border-border bg-card p-5"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-display font-bold">
                  <Globe2 className="h-5 w-5 text-indigo-400" /> BideshJabo
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-4 flex-1 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  <ShieldCheck className="h-4 w-4" /> Admin Console
                </Link>
              </nav>
              <div className="border-t border-border pt-3 space-y-2">
                <button
                  onClick={toggleFormatMode}
                  className="w-full rounded-xl border border-border py-2 font-mono text-xs"
                >
                  BDT Mode: {formatMode === "compact" ? "Compact (13.0L)" : "Exact"}
                </button>
                {isGuest ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Sign In / Save Progress
                  </button>
                ) : (
                  <button
                    onClick={logout}
                    className="w-full rounded-xl border border-border py-2 text-xs font-medium"
                  >
                    Sign Out ({user?.name})
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-16 right-5 z-50 rounded-xl border border-indigo-500/30 bg-card/95 px-4 py-2.5 text-xs font-medium text-foreground shadow-xl backdrop-blur-md"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <CommandPalette />
      <AuthModal />
      <AdvisorDrawer />
    </div>
  );
}
