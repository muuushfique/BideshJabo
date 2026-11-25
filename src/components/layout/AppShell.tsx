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
  { href: "/", label: "Command Center", icon: Home },
  { href: "/explore", label: "Explore Countries", icon: Compass },
  { href: "/compare", label: "Compare Matrix", icon: GitCompare },
  { href: "/finances", label: "Finances & Solvency", icon: Calculator },
  { href: "/journey", label: "Journey Roadmaps", icon: ListChecks },
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
    shortlistCountries,
    toastMessage,
  } = useWorkspace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [{ label: "BideshJabo", href: "/" }];
    if (parts.length === 0) {
      crumbs.push({ label: "Command Center", href: "/" });
      return crumbs;
    }

    if (parts[0] === "explore") crumbs.push({ label: "Explore", href: "/explore" });
    else if (parts[0] === "compare") crumbs.push({ label: "Compare Matrix", href: "/compare" });
    else if (parts[0] === "finances") crumbs.push({ label: "Financial Hub", href: "/finances" });
    else if (parts[0] === "journey") crumbs.push({ label: "Journey Roadmaps", href: "/journey" });
    else if (parts[0] === "advisor") crumbs.push({ label: "AI Advisor", href: "/advisor" });
    else if (parts[0] === "admin") crumbs.push({ label: "Admin Panel", href: "/admin" });
    else if (parts[0] === "countries") {
      crumbs.push({ label: "Explore", href: "/explore" });
      if (parts[1]) {
        const c = countries.find((item) => item.slug === parts[1]);
        if (c) {
          crumbs.push({ label: c.region, href: `/explore?region=${encodeURIComponent(c.region)}` });
          crumbs.push({ label: `${c.flagEmoji} ${c.name}`, href: `/countries/${c.slug}` });
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
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card/60 backdrop-blur-xl z-30">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-sm">
              <Globe2 className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight">BideshJabo</div>
              <div className="text-[10px] text-muted-foreground">Study Abroad OS</div>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-muted-foreground transition hover:border-indigo-500/40 hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" /> Quick Jump...
            </span>
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/12 text-primary border border-primary/25"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground border border-transparent"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.href === "/compare" && compareCountries.length > 0 && (
                  <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] text-indigo-400">
                    {compareCountries.length}
                  </span>
                )}
                {item.href === "/journey" && journeys.length > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                    {journeys.length}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-border">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Shortlisted ({shortlistCountries.length})
            </div>
            <div className="space-y-1">
              {shortlistCountries.slice(0, 5).map((slug) => {
                const c = countries.find((item) => item.slug === slug);
                if (!c) return null;
                return (
                  <Link
                    key={slug}
                    href={`/countries/${slug}`}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.flagEmoji}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="font-mono text-[10px]">{c.currencyCode}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
              pathname.startsWith("/admin")
                ? "bg-rose-500/15 text-rose-400"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Console
          </Link>

          {isGuest ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20"
            >
              <span>Guest Mode • Sync Account</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-semibold truncate">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{user?.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href + idx}>
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                  <Link
                    href={crumb.href}
                    className={cn(
                      "truncate transition hover:text-foreground",
                      idx === breadcrumbs.length - 1
                        ? "font-medium text-foreground"
                        : ""
                    )}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              className="flex sm:hidden items-center justify-center rounded-lg border border-border p-2 text-muted-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* BDT Format Toggle */}
            <button
              onClick={toggleFormatMode}
              title="Switch BDT Display (Compact Lakh/Crore vs Exact)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-medium transition hover:border-emerald-500/40"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>BDT: {formatMode === "compact" ? "13.0L" : "1,300,000"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Toggle dark/light mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Floating AI Advisor Trigger */}
            <button
              onClick={() => setAdvisorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

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
              className="relative z-10 flex w-72 flex-col border-r border-border bg-card p-4"
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
              <div className="border-t border-border pt-3">
                {isGuest ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Sign In / Sync Guest Data
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
            className="fixed bottom-5 right-5 z-50 rounded-xl border border-indigo-500/30 bg-card/95 px-4 py-2.5 text-xs font-medium text-foreground shadow-xl backdrop-blur-md"
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
