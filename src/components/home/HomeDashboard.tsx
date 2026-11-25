"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Bot,
  Calculator,
  CheckCircle2,
  CloudUpload,
  Compass,
  GitCompare,
  Globe2,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { Button, Card } from "../ui/primitives";

const PLATFORM_TOOLS = [
  {
    href: "/explore",
    icon: Compass,
    color: "text-indigo-400 bg-indigo-500/12",
    title: "Explore & Filter Countries",
    description:
      "Search across Bachelor's, Master's, PhD, and Diplomas using BDT budget caps, living standards, and visa rules.",
    cta: "Open Explorer",
  },
  {
    href: "/explore",
    icon: BookOpen,
    color: "text-sky-400 bg-sky-500/12",
    title: "Deep Country Dossiers",
    description:
      "Inspect real universities, realistic scholarship odds, embassy backlogs, housing warnings, and personal notes.",
    cta: "Browse Dossiers",
  },
  {
    href: "/compare",
    icon: GitCompare,
    color: "text-emerald-400 bg-emerald-500/12",
    title: "Side-by-Side Comparison",
    description:
      "Place up to 4 countries or universities next to each other with dual-currency costs and export CSV or PDF.",
    cta: "Compare Options",
  },
  {
    href: "/finances",
    icon: Calculator,
    color: "text-amber-400 bg-amber-500/12",
    title: "Financial & Solvency Hub",
    description:
      "Plan pre-departure BDT costs, track 90/180-day bank statement seasoning, and simulate part-time survival.",
    cta: "Plan Budget",
  },
  {
    href: "/journey",
    icon: ListChecks,
    color: "text-violet-400 bg-violet-500/12",
    title: "Application Roadmaps",
    description:
      "Generate a 5-phase checklist for any country covering IELTS, MoFA/Apostille, portals, VFS, and departure.",
    cta: "View Roadmaps",
  },
  {
    href: "/advisor",
    icon: Bot,
    color: "text-rose-400 bg-rose-500/12",
    title: "AI Study Abroad Advisor",
    description:
      "Ask questions anytime. Get grounded answers in local currency + BDT with one-click actions.",
    cta: "Chat with AI",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Set Your Reality",
    detail: "Filter by degree level, BDT budget, and frugal or comfortable lifestyle in Explore.",
  },
  {
    step: "02",
    title: "Check Ground Truth",
    detail: "Read candid housing, job market, and Dhaka embassy warnings inside each country dossier.",
  },
  {
    step: "03",
    title: "Stress-Test Finances",
    detail: "Map upfront fees, proof-of-funds seasoning, and part-time survival in the Financial Hub.",
  },
  {
    step: "04",
    title: "Track Every Milestone",
    detail: "Start a tailored 5-phase roadmap—saved in cookies automatically or synced to your account.",
  },
];

export function HomeDashboard() {
  const { countries } = useCurrency();
  const { isGuest, user, setAuthModalOpen, setAdvisorOpen } = useWorkspace();

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Animated Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/70 px-6 py-14 sm:px-12 sm:py-20 text-center">
        {/* Subtle animated ambient orbs */}
        <motion.div
          animate={{ x: [0, 24, 0], y: [0, -16, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -24, 0], y: [0, 18, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-400"
          >
            <Sparkles className="h-3.5 w-3.5" />
            All-in-One Study Abroad Operating System • Universal BDT Support
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="font-display text-3xl font-bold tracking-tight sm:text-5xl leading-[1.12]"
          >
            Plan your entire study abroad journey —{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              calmly, in one place.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            BideshJabo helps international &amp; Bangladeshi students research Bachelor&apos;s,
            Master&apos;s, PhD, and Diploma pathways across {countries.length} countries—combining
            live BDT currency equivalents, honest embassy reality checks, financial planning, and
            AI guidance without the clutter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link href="/explore">
              <Button size="lg" className="px-6">
                <Compass className="h-4 w-4" />
                Explore Destinations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="px-6"
              onClick={() => setAdvisorOpen(true)}
            >
              <Bot className="h-4 w-4 text-indigo-400" />
              Ask AI Advisor
            </Button>
            <a
              href="#platform-tour"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              See what you can do <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Dual Currency (Local + BDT)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Honest Embassy &amp; Housing Checks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Clean Guest Mode — Saved in Your Browser
            </span>
          </motion.div>
        </div>
      </section>

      {/* 2. Platform Tour: What You Can Do Where */}
      <section id="platform-tour" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Everything organized into 6 clear workspaces
          </h2>
          <p className="text-sm text-muted-foreground">
            Start anywhere you like—each section focuses on one job so you never feel lost.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_TOOLS.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link href={tool.href} className="block h-full group">
                  <Card className="flex h-full flex-col justify-between p-6 transition hover:border-indigo-500/40">
                    <div className="space-y-3">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tool.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-base font-bold group-hover:text-indigo-400 transition">
                        {tool.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                    <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                      {tool.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. How It Works — 4-Step Flow */}
      <section className="rounded-3xl border border-border/80 bg-card/50 p-6 sm:p-10 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              How BideshJabo works
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              A simple 4-step path from early curiosity to boarding your flight.
            </p>
          </div>
          <Link href="/explore">
            <Button size="sm" variant="outline">
              Begin Step 01 <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: idx * 0.06 }}
              className="rounded-2xl border border-border/70 bg-background/70 p-5 space-y-2"
            >
              <div className="font-mono text-xs font-bold text-indigo-400">
                STEP {item.step}
              </div>
              <h3 className="font-display text-sm font-bold">{item.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Clean Destinations Directory Preview */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              Explore Destinations
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Click any country to inspect universities, visas, living budgets, and PR rules.
            </p>
          </div>
          <Link href="/explore">
            <Button size="sm" variant="secondary">
              Filter by Budget &amp; Degree <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              whileHover={{ y: -2 }}
            >
              <Link href={`/countries/${c.slug}`} className="block h-full group">
                <Card className="p-4 h-full flex flex-col justify-between gap-2 hover:border-indigo-500/40 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flagEmoji}</span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold group-hover:text-indigo-400 transition truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.region} • {c.universities?.length || 0} Unis
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {c.tagline}
                  </p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Clean Guest Cookies vs Account Sync Callout */}
      <section>
        <Card className="p-6 sm:p-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-indigo-500/25 bg-gradient-to-r from-indigo-500/5 via-card to-emerald-500/5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              {isGuest ? (
                <>
                  <Globe2 className="h-3.5 w-3.5" /> Clean Guest Workspace
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Signed In as {user?.name}
                </>
              )}
            </div>
            <h3 className="font-display text-lg font-bold">
              {isGuest
                ? "Start fresh — your own choices save automatically."
                : "Your research, notes, and roadmaps are synced to your account."}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isGuest
                ? "Nothing is pre-filled or forced on your workspace. Shortlists, budget plans, and checklists you create are saved locally in your browser cookies & storage—and sync seamlessly if you create an account later."
                : "Everything you shortlist, budget, or check off is backed up in the database so you can return anytime from any device."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isGuest ? (
              <>
                <Button onClick={() => setAuthModalOpen(true)}>
                  <CloudUpload className="h-4 w-4" /> Create Free Account
                </Button>
                <Link href="/explore">
                  <Button variant="outline">Continue as Guest</Button>
                </Link>
              </>
            ) : (
              <Link href="/journey">
                <Button>
                  Open My Roadmaps <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
