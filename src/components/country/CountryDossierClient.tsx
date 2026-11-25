"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GitCompare,
  GraduationCap,
  ListChecks,
  MapPin,
  Plane,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { convertToBdt, formatBdt, formatLocalCurrency } from "@/lib/currency";
import type { CountryDTO, LifestyleTierKey, UniversityDTO } from "@/lib/types";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { DualCurrency } from "../ui/DualCurrency";
import { SlideOverDrawer } from "../ui/SlideOverDrawer";
import { Badge, Button, Card, visaBadgeVariant } from "../ui/primitives";

const TABS = [
  { id: "overview", label: "Overview & Reality", icon: Sparkles },
  { id: "universities", label: "Universities & Programs", icon: GraduationCap },
  { id: "scholarships", label: "Tuition & Scholarships", icon: Award },
  { id: "visa", label: "Visa & Proof of Funds", icon: ShieldAlert },
  { id: "living", label: "Part-Time & Living", icon: Briefcase },
  { id: "postgrad", label: "Post-Grad, Salary & PR", icon: Plane },
  { id: "notes", label: "Research Notes", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CountryDossierClient({ country }: { country: CountryDTO }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rateMap, lifestyleTier, setLifestyleTier, formatMode } = useCurrency();
  const {
    shortlistCountries,
    shortlistUniversities,
    compareCountries,
    compareUniversities,
    toggleShortlistCountry,
    toggleShortlistUniversity,
    toggleCompareCountry,
    toggleCompareUniversity,
    researchNotes,
    saveResearchNote,
    startJourney,
    journeys,
    studentProfile,
  } = useWorkspace();

  const initialTab = (searchParams.get("tab") as TabId) || "overview";
  const initialUniSlug = searchParams.get("uni");

  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "overview"
  );
  const [selectedUni, setSelectedUni] = useState<UniversityDTO | null>(() => {
    if (!initialUniSlug) return null;
    return country.universities?.find((u) => u.slug === initialUniSlug) || null;
  });

  // University filters
  const [uniDegreeFilter, setUniDegreeFilter] = useState("All");
  const [uniTypeFilter, setUniTypeFilter] = useState("All");
  const [uniSearch, setUniSearch] = useState("");

  // Research notes
  const [noteDraft, setNoteDraft] = useState(researchNotes[country.slug] || "");
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);
  const [notePreview, setNotePreview] = useState(false);

  useEffect(() => {
    setNoteDraft(researchNotes[country.slug] || "");
  }, [researchNotes, country.slug]);

  const isSaved = shortlistCountries.includes(country.slug);
  const inCompare = compareCountries.includes(country.slug);
  const existingJourney = journeys.find((j) => j.countrySlug === country.slug);

  const living = country.livingCostTiers[lifestyleTier];
  const monthlyOddIncome = country.partTimeWageHourly * country.workHoursCap * 4.33;
  const monthlySkilledIncome = country.skilledWageHourly * country.workHoursCap * 4.33;

  const filteredUniversities = useMemo(() => {
    const q = uniSearch.toLowerCase().trim();
    return (country.universities || []).filter((u) => {
      if (uniTypeFilter !== "All" && u.type !== uniTypeFilter) return false;
      if (
        uniDegreeFilter !== "All" &&
        !u.programs.some((p) => p.degreeLevel === uniDegreeFilter)
      ) {
        return false;
      }
      if (q) {
        const hay = `${u.name} ${u.city} ${u.programs.map((p) => p.name).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [country.universities, uniDegreeFilter, uniTypeFilter, uniSearch]);

  const livingChartData = useMemo(
    () => [
      { name: "Rent", amount: living.rent },
      { name: "Food", amount: living.food },
      { name: "Utilities", amount: living.utilities },
      { name: "Transport", amount: living.transport },
      { name: "Insurance", amount: living.insurance },
      { name: "Misc", amount: living.misc },
    ],
    [living]
  );

  const handleSaveNote = async (val: string) => {
    setNoteDraft(val);
    await saveResearchNote(country.slug, val);
    setNoteSavedAt(new Date().toLocaleTimeString());
  };

  const handleDownloadNote = () => {
    const blob = new Blob([noteDraft], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${country.slug}-research-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Country Hero Summary Header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-4xl">{country.flagEmoji}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold sm:text-3xl">
                    {country.name}
                  </h1>
                  <Badge variant={visaBadgeVariant(country.visaPredictability)}>
                    {country.visaPredictability} Visa Predictability
                  </Badge>
                  <Badge variant="outline">{country.region}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                  {country.tagline}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleShortlistCountry(country.slug)}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "text-indigo-400" : ""}`} />
              {isSaved ? "Saved" : "Bookmark"}
            </Button>

            <Button
              variant={inCompare ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleCompareCountry(country.slug)}
            >
              <GitCompare className={`h-3.5 w-3.5 ${inCompare ? "text-emerald-400" : ""}`} />
              {inCompare ? "In Compare" : "Compare"}
            </Button>

            <Button
              size="md"
              onClick={async () => {
                await startJourney(
                  country.slug,
                  studentProfile.targetIntake,
                  studentProfile.degreeTarget
                );
                router.push(`/journey?country=${country.slug}`);
              }}
            >
              {existingJourney ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ListChecks className="h-4 w-4" />
              )}
              {existingJourney
                ? `Open ${country.name} Journey`
                : `Start Journey for ${country.name}`}
            </Button>
          </div>
        </div>

        {/* Key Snapshot Strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="text-[11px] text-muted-foreground">Avg Tuition / Yr</div>
            <DualCurrency
              amount={country.tuitionAvgAnnual}
              currencyCode={country.currencyCode}
              zeroLabel="€0 Free"
            />
          </div>
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="text-[11px] text-muted-foreground">
              Monthly Living ({lifestyleTier})
            </div>
            <DualCurrency amount={living.total} currencyCode={country.currencyCode} suffix="/mo" />
          </div>
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="text-[11px] text-muted-foreground">
              Proof of Funds ({country.proofOfFundsStyle})
            </div>
            <DualCurrency amount={country.proofOfFundsAmount} currencyCode={country.currencyCode} />
          </div>
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="text-[11px] text-muted-foreground">Stay-Back &amp; Work Cap</div>
            <div className="font-mono text-sm font-bold text-foreground">
              {country.stayBackMonths} Months
            </div>
            <div className="text-[11px] text-muted-foreground">
              {country.workHoursCap} hrs/wk • PR: {country.prDifficulty}
            </div>
          </div>
        </div>
      </Card>

      {/* Nested Tab Navigation with Framer Motion layoutId */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card/80 p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="country-dossier-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-lg bg-primary"
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & GROUND REALITY */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5 space-y-3 border-emerald-500/25">
              <h2 className="font-display text-base font-semibold text-emerald-400">
                Key Advantages
              </h2>
              <ul className="space-y-2">
                {country.pros.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 space-y-3 border-rose-500/25">
              <h2 className="font-display text-base font-semibold text-rose-400">
                Real-World Drawbacks &amp; Risks
              </h2>
              <ul className="space-y-2">
                {country.cons.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">
                  Expat &amp; Bangladeshi Student Ground Reality Check
                </h2>
                <p className="text-xs text-muted-foreground">
                  Unfiltered operational reality beyond university brochures.
                </p>
              </div>
              <Badge variant="indigo">Verified Field Notes</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-indigo-400">Housing Market</div>
                <p className="text-xs leading-relaxed text-foreground/90">
                  {country.groundReality.housing}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400">
                  Part-Time &amp; Graduate Job Market
                </div>
                <p className="text-xs leading-relaxed text-foreground/90">
                  {country.groundReality.jobMarket}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-amber-400">
                  Embassy &amp; Visa Bottleneck Warning
                </div>
                <p className="text-xs leading-relaxed text-foreground/90">
                  {country.groundReality.embassyWarning}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-indigo-400">
                  Bangladeshi Diaspora &amp; Support
                </div>
                <p className="text-xs leading-relaxed text-foreground/90">
                  {country.groundReality.bdCommunity}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm">
              <strong className="text-indigo-400">Bottom-Line Verdict: </strong>
              {country.groundReality.verdict}
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 2: UNIVERSITIES & PROGRAMS */}
      {activeTab === "universities" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={uniSearch}
              onChange={(e) => setUniSearch(e.target.value)}
              placeholder="Search university, city, or program..."
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 text-xs"
            />
            <select
              value={uniDegreeFilter}
              onChange={(e) => setUniDegreeFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs"
            >
              <option value="All">All Degrees</option>
              <option value="Bachelor's">Bachelor&apos;s</option>
              <option value="Master's">Master&apos;s</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
            </select>
            <select
              value={uniTypeFilter}
              onChange={(e) => setUniTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs"
            >
              <option value="All">Public &amp; Private</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUniversities.map((u) => {
              const uniSaved = shortlistUniversities.includes(u.slug);
              return (
                <Card
                  key={u.id}
                  onClick={() => setSelectedUni(u)}
                  className="cursor-pointer p-5 flex flex-col justify-between gap-4 hover:border-indigo-500/50 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-bold">{u.name}</h3>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {u.city} • {u.type}
                          {u.qsRank ? ` • QS #${u.qsRank}` : ""}
                        </p>
                      </div>
                      <Badge variant={uniSaved ? "indigo" : "outline"}>
                        {u.programs.length} Programs
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-background/60 p-2.5">
                      <div>
                        <div className="text-[10px] text-muted-foreground">Tuition From</div>
                        <DualCurrency
                          amount={u.tuitionMin}
                          currencyCode={country.currencyCode}
                          size="sm"
                          zeroLabel="€0 / Funded"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">English / Intake</div>
                        <div className="font-mono text-xs font-semibold">
                          IELTS {u.ieltsMin}+
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Fall: {u.intakeDeadlines.fall}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {u.fundingNotes}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-medium text-indigo-400">
                    <span>Click to inspect programs &amp; fees</span>
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB 3: TUITION & SCHOLARSHIPS */}
      {activeTab === "scholarships" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Card className="p-5 space-y-3">
            <h2 className="font-display text-base font-bold">Tuition Fee Structure</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">Minimum Annual</div>
                <DualCurrency
                  amount={country.tuitionMinAnnual}
                  currencyCode={country.currencyCode}
                  zeroLabel="€0 Free"
                />
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">Typical Average</div>
                <DualCurrency
                  amount={country.tuitionAvgAnnual}
                  currencyCode={country.currencyCode}
                  zeroLabel="€0 Free"
                />
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">Upper Tier</div>
                <DualCurrency
                  amount={country.tuitionMaxAnnual}
                  currencyCode={country.currencyCode}
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {country.tuitionNotes}
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {(country.scholarships || []).map((s) => (
              <Card key={s.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {s.provider} • {s.degreeLevels.join(", ")} • Deadline: {s.deadline}
                      </p>
                    </div>
                    <Badge
                      variant={
                        s.realisticOdds.includes("High")
                          ? "success"
                          : s.realisticOdds === "Moderate"
                          ? "warning"
                          : "danger"
                      }
                    >
                      Odds: {s.realisticOdds}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 p-3">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        Value ({s.coverageType})
                      </div>
                      <DualCurrency
                        amount={s.amountAnnual}
                        currencyCode={s.currencyCode}
                        suffix="/yr"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <strong className="text-amber-400">Realistic Odds Check: </strong>
                    {s.oddsExplanation}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.eligibilitySummary}</p>
                </div>

                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:underline"
                >
                  Official Scholarship Portal <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 4: VISA & PROOF OF FUNDS */}
      {activeTab === "visa" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 lg:grid-cols-2"
        >
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Visa Rules &amp; Solvency Requirement
              </h2>
              <Badge variant={visaBadgeVariant(country.visaPredictability)}>
                {country.visaPredictability} Predictability
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-[11px] text-muted-foreground">Visa Category</div>
                <div className="text-xs font-semibold mt-0.5">{country.visaType}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-[11px] text-muted-foreground">Embassy Backlog</div>
                <div className="text-xs font-semibold mt-0.5">{country.embassyBacklog}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="text-[11px] text-muted-foreground">Embassy / VFS Location</div>
              <div className="text-xs font-semibold mt-0.5">{country.embassyLocation}</div>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400">
                  Required Proof of Funds ({country.proofOfFundsStyle})
                </span>
                <Wallet className="h-4 w-4 text-indigo-400" />
              </div>
              <DualCurrency
                amount={country.proofOfFundsAmount}
                currencyCode={country.currencyCode}
                size="lg"
              />
              <p className="text-xs leading-relaxed text-foreground/90">
                {country.proofOfFundsNotes}
              </p>
            </div>

            <Link href="/finances">
              <Button variant="secondary" size="sm">
                Plan This Solvency in Financial Hub
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="font-display text-base font-bold">
              Document Legalization &amp; Apostille Stepper
            </h2>
            <div className="space-y-3">
              {country.legalizationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3.5"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-mono text-xs font-bold text-indigo-400">
                    {idx + 1}
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/90">{step}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 5: PART-TIME JOBS & LIVING COSTS */}
      {activeTab === "living" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">
                Monthly Living Budget &amp; Part-Time Reality
              </h2>
              <p className="text-xs text-muted-foreground">
                Switch lifestyle tier to inspect itemized monthly expenses in local currency + BDT.
              </p>
            </div>

            <div className="flex rounded-xl border border-border bg-card p-1">
              {(["frugal", "balanced", "comfortable"] as LifestyleTierKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setLifestyleTier(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    lifestyleTier === t
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize">
                  {lifestyleTier} Monthly Breakdown
                </span>
                <DualCurrency
                  amount={living.total}
                  currencyCode={country.currencyCode}
                  suffix="/mo"
                />
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={livingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [
                        `${formatLocalCurrency(val, country.currencyCode, rateMap)} (≈ ${formatBdt(
                          convertToBdt(val, country.currencyCode, rateMap),
                          formatMode
                        )})`,
                        "Monthly",
                      ]}
                    />
                    <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {livingChartData.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">{row.name}</span>
                    <DualCurrency
                      amount={row.amount}
                      currencyCode={country.currencyCode}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold">
                  Odd Jobs vs. Skilled / RA / TA Jobs
                </h3>
                <Badge variant="outline">{country.workHoursCap} hrs/wk cap</Badge>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400">
                      Odd Jobs (Delivery, Warehouse, Cafe)
                    </span>
                    <DualCurrency
                      amount={country.partTimeWageHourly}
                      currencyCode={country.currencyCode}
                      suffix="/hr"
                      size="sm"
                      layout="inline"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Estimated monthly gross at {country.workHoursCap} hrs/wk:
                  </div>
                  <DualCurrency
                    amount={monthlyOddIncome}
                    currencyCode={country.currencyCode}
                    suffix="/mo"
                  />
                </div>

                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">
                      Skilled / Tech / Lab RA &amp; TA
                    </span>
                    <DualCurrency
                      amount={country.skilledWageHourly}
                      currencyCode={country.currencyCode}
                      suffix="/hr"
                      size="sm"
                      layout="inline"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Estimated monthly gross at {country.workHoursCap} hrs/wk:
                  </div>
                  <DualCurrency
                    amount={monthlySkilledIncome}
                    currencyCode={country.currencyCode}
                    suffix="/mo"
                  />
                </div>

                <div className="rounded-xl border border-border p-3.5 text-xs space-y-1">
                  <div>
                    <strong>Sustainability Verdict:</strong> {country.partTimeSustain}
                  </div>
                  <div>
                    <strong>Language Barrier:</strong> {country.languageBarrier}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* TAB 6: POST-GRAD, SALARIES & PR */}
      {activeTab === "postgrad" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 lg:grid-cols-2"
        >
          <Card className="p-5 space-y-4">
            <h2 className="font-display text-base font-bold">
              Post-Study Visa &amp; Graduate Salaries
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background/60 p-3.5">
                <div className="text-xs text-muted-foreground">Stay-Back Duration</div>
                <div className="mt-1 font-mono text-xl font-bold text-indigo-400">
                  {country.stayBackMonths} Months
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3.5">
                <div className="text-xs text-muted-foreground">PR Difficulty</div>
                <div className="mt-1 font-display text-xl font-bold">
                  {country.prDifficulty}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-1.5">
              <div className="text-xs text-muted-foreground">
                Average Entry-Level Graduate Salary (Annual)
              </div>
              <DualCurrency
                amount={country.entrySalaryAnnual}
                currencyCode={country.currencyCode}
                suffix="/yr"
                size="lg"
              />
            </div>

            <p className="text-xs leading-relaxed text-foreground/90">
              <strong className="text-indigo-400">Purchasing Power Reality: </strong>
              {country.purchasingPowerNote}
            </p>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="font-display text-base font-bold">
              Step-by-Step Permanent Residency (PR) Pathway
            </h2>
            <div className="space-y-4 border-l-2 border-indigo-500/30 pl-4">
              {country.prPathwaySteps.map((step, idx) => (
                <div key={idx} className="relative space-y-1">
                  <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold">{step.step}</span>
                    <Badge variant="indigo">{step.timeline}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 7: PERSONAL RESEARCH NOTES */}
      {activeTab === "notes" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold">
                  Personal Research Scratchpad — {country.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Jot down professor emails, scholarship deadlines, or portal links. Auto-saved{" "}
                  {noteSavedAt ? `at ${noteSavedAt}` : "to your workspace"}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleSaveNote(
                      noteDraft ||
                        `# ${country.name} Research Notes\n\n## Target Universities\n- \n\n## Professor / Lab Contacts\n- \n\n## Financial & Visa Check\n- `
                    )
                  }
                >
                  Insert Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNotePreview((p) => !p)}
                >
                  {notePreview ? "Edit Markdown" : "Preview"}
                </Button>
                <Button size="sm" variant="secondary" onClick={handleDownloadNote}>
                  <Download className="h-3.5 w-3.5" /> Export .md
                </Button>
              </div>
            </div>

            {notePreview ? (
              <div className="min-h-[260px] rounded-xl border border-border bg-background/70 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {noteDraft || "Nothing written yet."}
              </div>
            ) : (
              <textarea
                value={noteDraft}
                onChange={(e) => handleSaveNote(e.target.value)}
                rows={12}
                placeholder={`Write your ${country.name} university notes, supervisor contacts, and funding ideas here...`}
                className="w-full rounded-xl border border-border bg-background/80 p-4 font-mono text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
              />
            )}
          </Card>
        </motion.div>
      )}

      {/* Slide-Over University Detail Drawer */}
      <SlideOverDrawer
        open={Boolean(selectedUni)}
        onClose={() => setSelectedUni(null)}
        title={selectedUni?.name || ""}
        subtitle={
          selectedUni
            ? `${selectedUni.city}, ${country.name} • ${selectedUni.type}${
                selectedUni.qsRank ? ` • QS World Rank #${selectedUni.qsRank}` : ""
              }`
            : ""
        }
      >
        {selectedUni && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={
                  shortlistUniversities.includes(selectedUni.slug)
                    ? "primary"
                    : "outline"
                }
                onClick={() => toggleShortlistUniversity(selectedUni.slug)}
              >
                <Bookmark className="h-3.5 w-3.5" />
                {shortlistUniversities.includes(selectedUni.slug)
                  ? "Saved University"
                  : "Save University"}
              </Button>
              <Button
                size="sm"
                variant={
                  compareUniversities.includes(selectedUni.slug)
                    ? "secondary"
                    : "outline"
                }
                onClick={() => toggleCompareUniversity(selectedUni.slug)}
              >
                <GitCompare className="h-3.5 w-3.5" />
                {compareUniversities.includes(selectedUni.slug)
                  ? "In Compare"
                  : "Add to Compare"}
              </Button>
              <a href={selectedUni.portalUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  Admissions Portal <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/60 p-3.5">
              <div>
                <div className="text-[11px] text-muted-foreground">Annual Tuition Range</div>
                <DualCurrency
                  amount={selectedUni.tuitionMin}
                  currencyCode={country.currencyCode}
                  size="sm"
                  zeroLabel="€0 / Funded"
                />
                {selectedUni.tuitionMax > selectedUni.tuitionMin && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Max: {formatLocalCurrency(selectedUni.tuitionMax, country.currencyCode, rateMap)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Application Fee</div>
                <DualCurrency
                  amount={selectedUni.applicationFee}
                  currencyCode={country.currencyCode}
                  size="sm"
                  zeroLabel="Free"
                />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Language &amp; GRE</div>
                <div className="font-mono text-xs font-semibold">
                  IELTS {selectedUni.ieltsMin}+{" "}
                  {selectedUni.toeflMin ? `/ TOEFL ${selectedUni.toeflMin}` : ""}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {selectedUni.greRequired ? "GRE Required (Non-EU)" : "GRE Optional / Not Req"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Intake Deadlines</div>
                <div className="text-xs font-semibold">
                  Fall: {selectedUni.intakeDeadlines.fall}
                </div>
                {selectedUni.intakeDeadlines.spring && (
                  <div className="text-[10px] text-muted-foreground">
                    Spring: {selectedUni.intakeDeadlines.spring}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-3.5 text-xs leading-relaxed">
              <strong className="text-indigo-400">Funding &amp; Scholarship Notes: </strong>
              {selectedUni.fundingNotes}
            </div>

            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-bold">
                Programs ({selectedUni.programs.length})
              </h3>
              {selectedUni.programs.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-border bg-background/60 p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-sm font-semibold">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.degreeLevel} • {p.field} • {p.durationMonths} months • {p.language}
                      </div>
                    </div>
                    <Badge variant="outline">Due {p.deadline}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <DualCurrency
                      amount={p.tuitionAnnual}
                      currencyCode={country.currencyCode}
                      suffix="/yr"
                      size="sm"
                      layout="inline"
                      zeroLabel="€0 / Funded"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{p.requirements}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
