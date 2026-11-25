"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Bot,
  Calculator,
  Compass,
  GitCompare,
  GraduationCap,
  ListChecks,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { convertToBdt, formatBdt } from "@/lib/currency";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { DualCurrency } from "../ui/DualCurrency";
import { Badge, Button, Card, ProgressRing, visaBadgeVariant } from "../ui/primitives";

export function HomeDashboard() {
  const router = useRouter();
  const { countries, rates, rateMap, lifestyleTier, formatMode } = useCurrency();
  const {
    shortlistCountries,
    compareCountries,
    toggleShortlistCountry,
    toggleCompareCountry,
    journeys,
    financialPlan,
    studentProfile,
    setAdvisorOpen,
  } = useWorkspace();
  const [quickQuery, setQuickQuery] = useState("");

  const activeJourney = journeys[0];
  const journeyPercent = useMemo(() => {
    if (!activeJourney || activeJourney.tasks.length === 0) return 0;
    const done = activeJourney.tasks.filter((t) => t.isCompleted).length;
    return (done / activeJourney.tasks.length) * 100;
  }, [activeJourney]);

  const upfrontTotalBdt = useMemo(() => {
    return financialPlan.items
      .filter((i) => i.category === "UPFRONT")
      .reduce((acc, i) => acc + convertToBdt(i.amount, i.currencyCode, rateMap), 0);
  }, [financialPlan, rateMap]);

  const budgetReadyPct = useMemo(() => {
    if (upfrontTotalBdt <= 0) return 100;
    return Math.min(100, Math.round((financialPlan.totalBudgetBdt / upfrontTotalBdt) * 100));
  }, [financialPlan.totalBudgetBdt, upfrontTotalBdt]);

  const totalPrograms = useMemo(
    () =>
      countries.reduce(
        (acc, c) =>
          acc + (c.universities || []).reduce((ua, u) => ua + u.programs.length, 0),
        0
      ),
    [countries]
  );

  const featuredCountries = useMemo(
    () => countries.filter((c) => c.isFeatured).slice(0, 6),
    [countries]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/explore?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Command Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 sm:p-8 subtle-grid">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              All-in-One Study Abroad Operating System • Universal BDT Equivalents
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">
              Research, Budget &amp; Plan Your Global Degree Without Guessing.
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Explore {countries.length} curated destinations,{" "}
              {countries.reduce((a, c) => a + (c.universities?.length || 0), 0)} top universities,
              and {totalPrograms}+ programs across Bachelor&apos;s, Master&apos;s, PhD &amp; Diplomas—with
              honest Dhaka embassy reality checks and live BDT solvency math.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col gap-2 pt-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Search country, university, Blocked Account, CS, or budget..."
                  className="h-10 w-full rounded-xl border border-border bg-background/90 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg" className="h-10">
                <Compass className="h-4 w-4" />
                Explore Destinations
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-10"
                onClick={() => setAdvisorOpen(true)}
              >
                <Bot className="h-4 w-4 text-indigo-400" />
                Ask AI Advisor
              </Button>
            </form>
          </div>

          {/* Live Exchange Rate Mini-Ticker */}
          <Card className="w-full lg:w-80 bg-background/85 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Live BDT Reference Rates
              </span>
              <span className="font-mono text-[10px] uppercase">1 Unit → BDT</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {rates
                .filter((r) => ["EUR", "USD", "CAD", "SEK", "PLN", "KRW"].includes(r.code))
                .map((r) => (
                  <div
                    key={r.code}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-card/70 px-2.5 py-1.5"
                  >
                    <span className="font-mono text-xs font-semibold">{r.code}</span>
                    <span className="font-mono text-xs text-emerald-400">
                      ৳{r.rateToBdt < 1 ? r.rateToBdt.toFixed(3) : r.rateToBdt.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Bento Workspace Summary Row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Target Profile</span>
            <Badge variant="indigo">{studentProfile.degreeTarget}</Badge>
          </div>
          <div>
            <div className="font-display text-base font-semibold truncate">
              {studentProfile.major}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              CGPA {studentProfile.cgpa} • IELTS {studentProfile.ieltsScore} •{" "}
              {formatBdt(studentProfile.budgetBdt, formatMode)}
            </p>
          </div>
          <Link
            href="/advisor"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:underline"
          >
            Tailor AI recommendations <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Active Roadmap</div>
            {activeJourney ? (
              <>
                <div className="font-display text-base font-semibold">
                  {activeJourney.countryFlag} {activeJourney.countryName}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeJourney.tasks.filter((t) => t.isCompleted).length}/
                  {activeJourney.tasks.length} milestones done
                </p>
                <Link
                  href={`/journey?country=${activeJourney.countrySlug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:underline"
                >
                  Open checklist <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <>
                <div className="font-display text-base font-semibold">No Journey Yet</div>
                <p className="text-xs text-muted-foreground">
                  Pick a country dossier to generate a 5-phase roadmap.
                </p>
                <Link
                  href="/journey"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:underline"
                >
                  Start a roadmap <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
          <ProgressRing percentage={journeyPercent} size={62} />
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Budget Readiness ({financialPlan.targetCountrySlug.toUpperCase()})
            </span>
            <Calculator className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-foreground">
              {formatBdt(financialPlan.totalBudgetBdt, formatMode)}
            </div>
            <p className="text-xs text-muted-foreground">
              Covers {budgetReadyPct}% of planned upfront outflow (
              {formatBdt(upfrontTotalBdt, formatMode)})
            </p>
          </div>
          <Link
            href="/finances"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:underline"
          >
            Open Solvency &amp; Simulator <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Shortlist &amp; Compare
            </span>
            <GitCompare className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <div className="font-mono text-lg font-bold">{shortlistCountries.length}</div>
              <div className="text-[11px] text-muted-foreground">Saved</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold">{compareCountries.length}/4</div>
              <div className="text-[11px] text-muted-foreground">In Compare</div>
            </div>
          </div>
          <Link
            href="/compare"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:underline"
          >
            Launch Matrix &amp; Export PDF/CSV <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </section>

      {/* Featured Destinations Bento Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold">Featured Study Destinations</h2>
            <p className="text-xs text-muted-foreground">
              Showing monthly living costs for{" "}
              <span className="font-semibold capitalize text-foreground">{lifestyleTier}</span>{" "}
              tier with dual-currency BDT conversions.
            </p>
          </div>
          <Link href="/explore">
            <Button variant="outline" size="sm">
              Filter All {countries.length} Countries <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredCountries.map((country, idx) => {
            const living = country.livingCostTiers[lifestyleTier];
            const isSaved = shortlistCountries.includes(country.slug);
            const inCompare = compareCountries.includes(country.slug);

            return (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.04 }}
              >
                <Card className="flex h-full flex-col justify-between p-5 hover:border-indigo-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/countries/${country.slug}`}
                        className="group flex items-center gap-2.5"
                      >
                        <span className="text-2xl">{country.flagEmoji}</span>
                        <div>
                          <h3 className="font-display text-base font-bold group-hover:text-indigo-400 transition">
                            {country.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            {country.region} • {country.universities?.length || 0} Top Unis
                          </p>
                        </div>
                      </Link>
                      <Badge variant={visaBadgeVariant(country.visaPredictability)}>
                        {country.visaPredictability} Visa
                      </Badge>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {country.tagline}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/70 bg-background/60 p-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Avg Tuition / Yr
                        </div>
                        <DualCurrency
                          amount={country.tuitionAvgAnnual}
                          currencyCode={country.currencyCode}
                          size="sm"
                          zeroLabel="€0 Free"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Living ({lifestyleTier}) / Mo
                        </div>
                        <DualCurrency
                          amount={living.total}
                          currencyCode={country.currencyCode}
                          size="sm"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Proof of Funds
                        </div>
                        <DualCurrency
                          amount={country.proofOfFundsAmount}
                          currencyCode={country.currencyCode}
                          size="sm"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Stay-Back &amp; Work
                        </div>
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {country.stayBackMonths} mo • {country.workHoursCap}h/wk
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {country.proofOfFundsStyle}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleShortlistCountry(country.slug)}
                        className={`rounded-lg border p-1.5 transition ${
                          isSaved
                            ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-400"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                        title="Bookmark country"
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleCompareCountry(country.slug)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                          inCompare
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <GitCompare className="h-3 w-3" />
                        {inCompare ? "Added" : "Compare"}
                      </button>
                    </div>

                    <Link href={`/countries/${country.slug}`}>
                      <Button size="sm" variant="secondary">
                        Open Dossier <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick Action Footer Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/finances" className="group">
          <Card className="p-5 hover:border-emerald-500/40 transition">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h3 className="mt-2.5 font-display text-sm font-semibold group-hover:text-emerald-400">
              Upfront Outflow &amp; Solvency Tracker
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Simulate MoFA, tuition deposits, 90-day bank seasoning &amp; monthly part-time runway.
            </p>
          </Card>
        </Link>

        <Link href="/journey" className="group">
          <Card className="p-5 hover:border-indigo-500/40 transition">
            <ListChecks className="h-5 w-5 text-indigo-400" />
            <h3 className="mt-2.5 font-display text-sm font-semibold group-hover:text-indigo-400">
              Phase-by-Phase Country Roadmaps
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Track IELTS, MoFA/Apostille, university portals, VFS bookings &amp; pre-departure tasks.
            </p>
          </Card>
        </Link>

        <Link href="/explore" className="group">
          <Card className="p-5 hover:border-amber-500/40 transition">
            <GraduationCap className="h-5 w-5 text-amber-400" />
            <h3 className="mt-2.5 font-display text-sm font-semibold group-hover:text-amber-400">
              Multi-Criteria Discovery Engine
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Filter by BDT tuition budget, proof-of-funds style, language barrier &amp; PR path.
            </p>
          </Card>
        </Link>
      </section>
    </div>
  );
}
