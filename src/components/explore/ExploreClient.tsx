"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Filter,
  GitCompare,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { convertToBdt, formatBdt } from "@/lib/currency";
import type { LifestyleTierKey } from "@/lib/types";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { DualCurrency } from "../ui/DualCurrency";
import { Badge, Button, Card, visaBadgeVariant } from "../ui/primitives";

const DEGREE_OPTIONS = ["All", "Bachelor's", "Master's", "PhD", "Diploma"];
const FIELD_OPTIONS = [
  "All",
  "Computer Science & IT",
  "Engineering",
  "Business & Economics",
  "Healthcare",
  "Data Science",
  "Arts & Humanities",
];

const LIFESTYLE_LABELS: { key: LifestyleTierKey; title: string }[] = [
  { key: "frugal", title: "Frugal" },
  { key: "balanced", title: "Balanced" },
  { key: "comfortable", title: "Comfortable" },
];

export function ExploreClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialRegion = searchParams.get("region") || "All";

  const { countries, rateMap, lifestyleTier, setLifestyleTier, formatMode } = useCurrency();
  const {
    shortlistCountries,
    toggleShortlistCountry,
    compareCountries,
    toggleCompareCountry,
    clearCompareCountries,
  } = useWorkspace();

  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState(initialRegion);
  const [degreeLevel, setDegreeLevel] = useState("All");
  const [fieldOfStudy, setFieldOfStudy] = useState("All");
  const [maxTuitionBdt, setMaxTuitionBdt] = useState(5000000);
  const [maxPofBdt, setMaxPofBdt] = useState(3500000);
  const [maxLivingMonthlyBdt, setMaxLivingMonthlyBdt] = useState(350000);
  const [visaFilter, setVisaFilter] = useState("All");
  const [pofStyle, setPofStyle] = useState("All");
  const [partTimeFilter, setPartTimeFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [minStayBack, setMinStayBack] = useState(0);
  const [prDifficulty, setPrDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState<"cost" | "visa" | "stayback" | "tuition">("cost");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Tidy accordion sections
  const [openGroup, setOpenGroup] = useState<{
    academics: boolean;
    budget: boolean;
    rules: boolean;
  }>({ academics: true, budget: true, rules: false });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (region !== "All") count++;
    if (degreeLevel !== "All") count++;
    if (fieldOfStudy !== "All") count++;
    if (maxTuitionBdt < 5000000) count++;
    if (maxPofBdt < 3500000) count++;
    if (maxLivingMonthlyBdt < 350000) count++;
    if (visaFilter !== "All") count++;
    if (pofStyle !== "All") count++;
    if (partTimeFilter !== "All") count++;
    if (languageFilter !== "All") count++;
    if (minStayBack > 0) count++;
    if (prDifficulty !== "All") count++;
    return count;
  }, [
    region,
    degreeLevel,
    fieldOfStudy,
    maxTuitionBdt,
    maxPofBdt,
    maxLivingMonthlyBdt,
    visaFilter,
    pofStyle,
    partTimeFilter,
    languageFilter,
    minStayBack,
    prDifficulty,
  ]);

  const resetFilters = () => {
    setQuery("");
    setRegion("All");
    setDegreeLevel("All");
    setFieldOfStudy("All");
    setMaxTuitionBdt(5000000);
    setMaxPofBdt(3500000);
    setMaxLivingMonthlyBdt(350000);
    setVisaFilter("All");
    setPofStyle("All");
    setPartTimeFilter("All");
    setLanguageFilter("All");
    setMinStayBack(0);
    setPrDifficulty("All");
  };

  const filteredCountries = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = countries.filter((c) => {
      if (region !== "All" && c.region !== region) return false;
      if (degreeLevel !== "All" && !c.degreeLevels.includes(degreeLevel)) return false;
      if (fieldOfStudy !== "All" && !c.fieldsOfStudy.includes(fieldOfStudy)) return false;
      if (visaFilter !== "All" && c.visaPredictability !== visaFilter) return false;
      if (pofStyle !== "All" && c.proofOfFundsStyle !== pofStyle) return false;
      if (partTimeFilter !== "All" && c.partTimeSustain !== partTimeFilter) return false;
      if (languageFilter !== "All" && c.languageBarrier !== languageFilter) return false;
      if (c.stayBackMonths < minStayBack) return false;
      if (prDifficulty !== "All" && c.prDifficulty !== prDifficulty) return false;

      const tuitionBdt = convertToBdt(c.tuitionAvgAnnual, c.currencyCode, rateMap);
      const pofBdt = convertToBdt(c.proofOfFundsAmount, c.currencyCode, rateMap);
      const livingMonthlyBdt = convertToBdt(
        c.livingCostTiers[lifestyleTier].total,
        c.currencyCode,
        rateMap
      );

      if (tuitionBdt > maxTuitionBdt) return false;
      if (pofBdt > maxPofBdt) return false;
      if (livingMonthlyBdt > maxLivingMonthlyBdt) return false;

      if (q) {
        const uniMatch = (c.universities || []).some(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.city.toLowerCase().includes(q) ||
            u.programs.some((p) => p.name.toLowerCase().includes(q))
        );
        const hay = `${c.name} ${c.region} ${c.tagline} ${c.proofOfFundsStyle} ${c.currencyCode}`.toLowerCase();
        if (!hay.includes(q) && !uniMatch) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "stayback") return b.stayBackMonths - a.stayBackMonths;
      if (sortBy === "tuition") {
        return (
          convertToBdt(a.tuitionAvgAnnual, a.currencyCode, rateMap) -
          convertToBdt(b.tuitionAvgAnnual, b.currencyCode, rateMap)
        );
      }
      if (sortBy === "visa") {
        const rank = (v: string) => (v === "High" ? 3 : v === "Moderate" ? 2 : 1);
        return rank(b.visaPredictability) - rank(a.visaPredictability);
      }
      const costA =
        convertToBdt(a.tuitionAvgAnnual, a.currencyCode, rateMap) +
        convertToBdt(a.livingCostTiers[lifestyleTier].total * 12, a.currencyCode, rateMap);
      const costB =
        convertToBdt(b.tuitionAvgAnnual, b.currencyCode, rateMap) +
        convertToBdt(b.livingCostTiers[lifestyleTier].total * 12, b.currencyCode, rateMap);
      return costA - costB;
    });
  }, [
    countries,
    query,
    region,
    degreeLevel,
    fieldOfStudy,
    visaFilter,
    pofStyle,
    partTimeFilter,
    languageFilter,
    minStayBack,
    prDifficulty,
    maxTuitionBdt,
    maxPofBdt,
    maxLivingMonthlyBdt,
    lifestyleTier,
    rateMap,
    sortBy,
  ]);

  const filterPanel = (
    <Card className="p-4 space-y-3 h-fit">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-display text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] text-indigo-400">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Group 1: Academics & Region */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setOpenGroup((g) => ({ ...g, academics: !g.academics }))}
          className="flex w-full items-center justify-between py-1 text-xs font-semibold text-foreground"
        >
          <span>Academics &amp; Region</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
              openGroup.academics ? "rotate-180" : ""
            }`}
          />
        </button>
        {openGroup.academics && (
          <div className="mt-2.5 space-y-2.5">
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Degree Level</span>
              <select
                value={degreeLevel}
                onChange={(e) => setDegreeLevel(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Field of Study</span>
              <select
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Region</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="All">All Regions</option>
                <option value="Western Europe">Western Europe</option>
                <option value="Central Europe">Central Europe</option>
                <option value="Nordics">Nordics</option>
                <option value="East Asia">East Asia</option>
                <option value="North America">North America</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Group 2: Budget Caps */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setOpenGroup((g) => ({ ...g, budget: !g.budget }))}
          className="flex w-full items-center justify-between py-1 text-xs font-semibold text-foreground"
        >
          <span>Budget Caps (BDT)</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
              openGroup.budget ? "rotate-180" : ""
            }`}
          />
        </button>
        {openGroup.budget && (
          <div className="mt-2.5 space-y-3">
            <label className="block space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Max Tuition / Yr</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatBdt(maxTuitionBdt, formatMode)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5000000}
                step={100000}
                value={maxTuitionBdt}
                onChange={(e) => setMaxTuitionBdt(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Max Proof of Funds</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatBdt(maxPofBdt, formatMode)}
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={3500000}
                step={100000}
                value={maxPofBdt}
                onChange={(e) => setMaxPofBdt(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Max Living / Month</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatBdt(maxLivingMonthlyBdt, formatMode)}
                </span>
              </div>
              <input
                type="range"
                min={60000}
                max={350000}
                step={10000}
                value={maxLivingMonthlyBdt}
                onChange={(e) => setMaxLivingMonthlyBdt(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </label>
          </div>
        )}
      </div>

      {/* Group 3: Visa, Work & PR Rules */}
      <div>
        <button
          type="button"
          onClick={() => setOpenGroup((g) => ({ ...g, rules: !g.rules }))}
          className="flex w-full items-center justify-between py-1 text-xs font-semibold text-foreground"
        >
          <span>Visa, Work &amp; PR Rules</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
              openGroup.rules ? "rotate-180" : ""
            }`}
          />
        </button>
        {openGroup.rules && (
          <div className="mt-2.5 space-y-2.5">
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Visa Predictability</span>
              <select
                value={visaFilter}
                onChange={(e) => setVisaFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="All">Any</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Risky">Risky</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Proof of Funds Style</span>
              <select
                value={pofStyle}
                onChange={(e) => setPofStyle(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="All">Any Style</option>
                <option value="Standard Bank Statement">Standard Bank Statement</option>
                <option value="Blocked Account">Blocked Account (Sperrkonto)</option>
                <option value="Credit Card Limit">Credit Card Limit</option>
                <option value="Lab Funding Waiver">Lab Funding Waiver</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Part-Time Sustainability</span>
              <select
                value={partTimeFilter}
                onChange={(e) => setPartTimeFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="All">Any</option>
                <option value="Odd Jobs Cover Living">Odd Jobs Cover Living</option>
                <option value="Skilled Jobs Needed">Skilled Jobs Needed</option>
                <option value="Partial Only">Partial Only</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Language Barrier</span>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="All">Any</option>
                <option value="English-Friendly">English-Friendly</option>
                <option value="Bilingual Advantage">Bilingual Advantage</option>
                <option value="Local Language Required">Local Language Required</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Min Stay-Back Visa</span>
              <select
                value={minStayBack}
                onChange={(e) => setMinStayBack(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value={0}>Any Duration</option>
                <option value={12}>12+ Months</option>
                <option value={18}>18+ Months</option>
                <option value={24}>24+ Months</option>
                <option value={36}>36 Months (3 Years)</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">PR Pathway Difficulty</span>
              <select
                value={prDifficulty}
                onChange={(e) => setPrDifficulty(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="All">Any</option>
                <option value="Straightforward">Straightforward</option>
                <option value="Moderate">Moderate</option>
                <option value="Competitive">Competitive</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Lifestyle Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Explore Destinations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare tuition, living tiers, and visa rules in local currency and BDT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Living Tier:</span>
          <div className="flex items-center rounded-xl border border-border bg-card p-1">
            {LIFESTYLE_LABELS.map((tier) => {
              const active = lifestyleTier === tier.key;
              return (
                <button
                  key={tier.key}
                  onClick={() => setLifestyleTier(tier.key)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="explore-lifestyle-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-primary"
                    />
                  )}
                  <span className="relative z-10">{tier.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country, university (e.g. KAIST, RWTH, Waterloo), or program..."
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            className="lg:hidden"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          >
            <Filter className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-medium"
          >
            <option value="cost">Sort: Lowest 1st-Year Total</option>
            <option value="tuition">Sort: Lowest Tuition</option>
            <option value="visa">Sort: Highest Visa Predictability</option>
            <option value="stayback">Sort: Longest Stay-Back Visa</option>
          </select>
        </div>
      </div>

      {showFiltersMobile && <div className="lg:hidden">{filterPanel}</div>}

      <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
        <div className="hidden lg:block">{filterPanel}</div>

        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filteredCountries.length}</strong> of{" "}
            {countries.length} countries
          </div>

          {filteredCountries.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <p className="font-display text-base font-semibold">
                No countries match your current filters
              </p>
              <p className="text-xs text-muted-foreground">
                Try relaxing the BDT budget sliders or resetting filters.
              </p>
              <Button onClick={resetFilters} variant="secondary" size="sm">
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredCountries.map((c) => {
                  const living = c.livingCostTiers[lifestyleTier];
                  const isSaved = shortlistCountries.includes(c.slug);
                  const inCompare = compareCountries.includes(c.slug);

                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="flex h-full flex-col justify-between p-5 hover:border-indigo-500/40 transition">
                        <div className="space-y-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/countries/${c.slug}`} className="group flex items-center gap-2.5">
                              <span className="text-3xl">{c.flagEmoji}</span>
                              <div>
                                <h3 className="font-display text-lg font-bold group-hover:text-indigo-400 transition">
                                  {c.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {c.region} • {c.universities?.length || 0} Unis
                                </p>
                              </div>
                            </Link>
                            <Badge variant={visaBadgeVariant(c.visaPredictability)}>
                              {c.visaPredictability} Visa
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {c.tagline}
                          </p>

                          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-background/60 p-3">
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Tuition/yr
                              </div>
                              <DualCurrency
                                amount={c.tuitionAvgAnnual}
                                currencyCode={c.currencyCode}
                                size="sm"
                                zeroLabel="€0 Free"
                              />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Living/mo
                              </div>
                              <DualCurrency
                                amount={living.total}
                                currencyCode={c.currencyCode}
                                size="sm"
                              />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Solvency
                              </div>
                              <DualCurrency
                                amount={c.proofOfFundsAmount}
                                currencyCode={c.currencyCode}
                                size="sm"
                              />
                            </div>
                          </div>

                          <div className="text-[11px] text-muted-foreground">
                            {c.stayBackMonths} mo stay-back • {c.workHoursCap}h/wk work cap •{" "}
                            {c.proofOfFundsStyle}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCompareCountry(c.slug)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                                inCompare
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {inCompare ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <GitCompare className="h-3.5 w-3.5" />
                              )}
                              {inCompare ? "Added" : "Compare"}
                            </button>

                            <button
                              onClick={() => toggleShortlistCountry(c.slug)}
                              className={`rounded-lg border p-1.5 transition ${
                                isSaved
                                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-400"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                              title="Save to shortlist"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <Link href={`/countries/${c.slug}`}>
                            <Button size="sm">
                              Open Dossier <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Compare Dock */}
      <AnimatePresence>
        {compareCountries.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 w-[94%] max-w-3xl rounded-2xl border border-indigo-500/40 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Compare ({compareCountries.length}/4):
                </span>
                {compareCountries.map((slug) => {
                  const c = countries.find((item) => item.slug === slug);
                  if (!c) return null;
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium"
                    >
                      <span>{c.flagEmoji}</span>
                      <span>{c.name}</span>
                      <button
                        onClick={() => toggleCompareCountry(slug)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearCompareCountries}>
                  Clear
                </Button>
                <Link href="/compare">
                  <Button size="sm">
                    <GitCompare className="h-3.5 w-3.5" />
                    Compare Matrix
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
