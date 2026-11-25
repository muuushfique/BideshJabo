"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Coins,
  Globe2,
  GraduationCap,
  ListChecks,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import type {
  CountryDTO,
  ExchangeRateDTO,
  JourneyTemplateItem,
  ScholarshipDTO,
  UniversityDTO,
} from "@/lib/types";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { SlideOverDrawer } from "../ui/SlideOverDrawer";
import { Badge, Button, Card, visaBadgeVariant } from "../ui/primitives";

type AdminTab = "countries" | "universities" | "scholarships" | "templates" | "rates";

interface StatsPayload {
  countries: number;
  universities: number;
  programs: number;
  scholarships: number;
  users: number;
  journeys: number;
  exchangeRates: number;
}

export function AdminDashboardClient({ initialStats }: { initialStats: StatsPayload }) {
  const router = useRouter();
  const { refreshPlatformData } = useCurrency();
  const { showToast } = useWorkspace();

  const [tab, setTab] = useState<AdminTab>("rates");
  const [stats, setStats] = useState<StatsPayload>(initialStats);
  const [countries, setCountries] = useState<CountryDTO[]>([]);
  const [rates, setRates] = useState<ExchangeRateDTO[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Rate editor drafts
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [newRate, setNewRate] = useState({ code: "", name: "", symbol: "", rateToBdt: "" });

  // Country modal/drawer state
  const [editingCountry, setEditingCountry] = useState<Partial<CountryDTO> | null>(null);

  // University modal/drawer state
  const [editingUni, setEditingUni] = useState<
    (Partial<UniversityDTO> & { countryId?: string }) | null
  >(null);

  // Scholarship modal/drawer state
  const [editingScholarship, setEditingScholarship] = useState<
    (Partial<ScholarshipDTO> & { countryId?: string }) | null
  >(null);

  // Template editor state
  const [templateCountryId, setTemplateCountryId] = useState("");
  const [templateDraft, setTemplateDraft] = useState<JourneyTemplateItem[]>([]);

  const loadAdminData = useCallback(async () => {
    const [statsRes, countriesRes, ratesRes] = await Promise.all([
      fetch("/api/admin/stats", { cache: "no-store" }),
      fetch("/api/admin/countries", { cache: "no-store" }),
      fetch("/api/admin/exchange-rates", { cache: "no-store" }),
    ]);

    if (statsRes.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (statsRes.ok) {
      const s = await statsRes.json();
      setStats(s.stats);
    }
    if (countriesRes.ok) {
      const c = await countriesRes.json();
      setCountries(c.countries || []);
      if (c.countries?.length && !templateCountryId) {
        setTemplateCountryId(c.countries[0].id);
        setTemplateDraft(c.countries[0].journeyTemplates || []);
      }
    }
    if (ratesRes.ok) {
      const r = await ratesRes.json();
      const list = (r.exchangeRates || []) as ExchangeRateDTO[];
      setRates(list);
      setRateDrafts(Object.fromEntries(list.map((item) => [item.code, String(item.rateToBdt)])));
    }
  }, [router, templateCountryId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const saveRate = async (code: string, name?: string, symbol?: string) => {
    const val = Number(rateDrafts[code]);
    if (!Number.isFinite(val) || val <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/exchange-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, symbol, rateToBdt: val }),
      });
      if (res.ok) {
        showToast(`Updated ${code} -> ৳${val} BDT across entire app`);
        await Promise.all([loadAdminData(), refreshPlatformData()]);
      }
    } finally {
      setSaving(false);
    }
  };

  const createRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRate.code || !newRate.rateToBdt) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/exchange-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newRate.code.toUpperCase(),
          name: newRate.name || newRate.code.toUpperCase(),
          symbol: newRate.symbol || newRate.code.toUpperCase(),
          rateToBdt: Number(newRate.rateToBdt),
        }),
      });
      if (res.ok) {
        setNewRate({ code: "", name: "", symbol: "", rateToBdt: "" });
        showToast("Currency added!");
        await Promise.all([loadAdminData(), refreshPlatformData()]);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editingCountry.id);
      const url = isEdit
        ? `/api/admin/countries/${editingCountry.id}`
        : "/api/admin/countries";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCountry),
      });
      if (res.ok) {
        setEditingCountry(null);
        showToast(isEdit ? "Country updated" : "Country created");
        await Promise.all([loadAdminData(), refreshPlatformData()]);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCountry = async (id: string) => {
    if (!confirm("Delete this country and all its universities/scholarships?")) return;
    await fetch(`/api/admin/countries/${id}`, { method: "DELETE" });
    showToast("Country deleted");
    await Promise.all([loadAdminData(), refreshPlatformData()]);
  };

  const saveUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUni) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editingUni.id);
      const url = isEdit
        ? `/api/admin/universities/${editingUni.id}`
        : "/api/admin/universities";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUni),
      });
      if (res.ok) {
        setEditingUni(null);
        showToast(isEdit ? "University updated" : "University created");
        await Promise.all([loadAdminData(), refreshPlatformData()]);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteUniversity = async (id: string) => {
    if (!confirm("Delete this university?")) return;
    await fetch(`/api/admin/universities/${id}`, { method: "DELETE" });
    showToast("University deleted");
    await Promise.all([loadAdminData(), refreshPlatformData()]);
  };

  const saveScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScholarship) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editingScholarship.id);
      const url = isEdit
        ? `/api/admin/scholarships/${editingScholarship.id}`
        : "/api/admin/scholarships";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingScholarship),
      });
      if (res.ok) {
        setEditingScholarship(null);
        showToast(isEdit ? "Scholarship updated" : "Scholarship created");
        await Promise.all([loadAdminData(), refreshPlatformData()]);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteScholarship = async (id: string) => {
    if (!confirm("Delete this scholarship?")) return;
    await fetch(`/api/admin/scholarships/${id}`, { method: "DELETE" });
    showToast("Scholarship deleted");
    await Promise.all([loadAdminData(), refreshPlatformData()]);
  };

  const saveTemplates = async () => {
    if (!templateCountryId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/countries/${templateCountryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyTemplates: templateDraft }),
      });
      if (res.ok) {
        showToast("Journey checklist templates updated!");
        await Promise.all([loadAdminData(), refreshPlatformData()]);
      }
    } finally {
      setSaving(false);
    }
  };

  const allUniversities = useMemo(
    () =>
      countries.flatMap((c) =>
        (c.universities || []).map((u) => ({ ...u, countryName: c.name, flag: c.flagEmoji }))
      ),
    [countries]
  );

  const allScholarships = useMemo(
    () =>
      countries.flatMap((c) =>
        (c.scholarships || []).map((s) => ({ ...s, countryName: c.name, flag: c.flagEmoji }))
      ),
    [countries]
  );

  const q = search.toLowerCase().trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            BideshJabo Admin Operations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage countries, universities, scholarships, journey templates, and global BDT exchange rates.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5" /> Sign Out Admin
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Countries", value: stats.countries },
          { label: "Universities", value: stats.universities },
          { label: "Programs", value: stats.programs },
          { label: "Scholarships", value: stats.scholarships },
          { label: "Users", value: stats.users },
          { label: "Active Journeys", value: stats.journeys },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
            <div className="mt-1 font-mono text-2xl font-bold">{kpi.value}</div>
          </Card>
        ))}
      </div>

      {/* Admin Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
          {[
            { id: "rates", label: "Exchange Rates", icon: Coins },
            { id: "countries", label: "Countries", icon: Globe2 },
            { id: "universities", label: "Universities", icon: GraduationCap },
            { id: "scholarships", label: "Scholarships", icon: Award },
            { id: "templates", label: "Journey Templates", icon: ListChecks },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as AdminTab)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter records..."
            className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {/* EXCHANGE RATES TAB */}
      {tab === "rates" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Currency</th>
                  <th className="p-3.5">Symbol</th>
                  <th className="p-3.5">1 Unit → BDT</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rates
                  .filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(q))
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="p-3.5 font-mono font-bold">{r.code}</td>
                      <td className="p-3.5">{r.name}</td>
                      <td className="p-3.5 font-mono">{r.symbol}</td>
                      <td className="p-3.5">
                        <input
                          type="number"
                          step="0.001"
                          value={rateDrafts[r.code] ?? String(r.rateToBdt)}
                          onChange={(e) =>
                            setRateDrafts((prev) => ({ ...prev, [r.code]: e.target.value }))
                          }
                          className="h-8 w-28 rounded-lg border border-border bg-background px-2 font-mono text-xs"
                        />
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={saving}
                          onClick={() => saveRate(r.code, r.name, r.symbol)}
                        >
                          <Save className="h-3 w-3" /> Save
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-5 space-y-3 h-fit">
            <h3 className="font-display text-sm font-bold">Add / Upsert Currency</h3>
            <form onSubmit={createRate} className="space-y-2.5">
              <input
                required
                value={newRate.code}
                onChange={(e) => setNewRate({ ...newRate, code: e.target.value.toUpperCase() })}
                placeholder="Code (e.g. CHF)"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs"
              />
              <input
                required
                value={newRate.name}
                onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                placeholder="Name (e.g. Swiss Franc)"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
              />
              <input
                required
                value={newRate.symbol}
                onChange={(e) => setNewRate({ ...newRate, symbol: e.target.value })}
                placeholder="Symbol (e.g. CHF)"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
              />
              <input
                required
                type="number"
                step="0.001"
                value={newRate.rateToBdt}
                onChange={(e) => setNewRate({ ...newRate, rateToBdt: e.target.value })}
                placeholder="Rate to BDT (e.g. 139.5)"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs"
              />
              <Button type="submit" size="sm" className="w-full" disabled={saving}>
                <Plus className="h-3.5 w-3.5" /> Add Currency Rate
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* COUNTRIES TAB */}
      {tab === "countries" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() =>
                setEditingCountry({
                  name: "",
                  slug: "",
                  flagEmoji: "🌍",
                  region: "Western Europe",
                  currencyCode: "EUR",
                  tagline: "",
                  tuitionMinAnnual: 0,
                  tuitionMaxAnnual: 5000,
                  tuitionAvgAnnual: 2500,
                  proofOfFundsAmount: 10000,
                  proofOfFundsStyle: "Standard Bank Statement",
                  visaPredictability: "Moderate",
                  embassyBacklog: "Moderate",
                  partTimeWageHourly: 12,
                  skilledWageHourly: 18,
                  workHoursCap: 20,
                  stayBackMonths: 12,
                  prDifficulty: "Moderate",
                  entrySalaryAnnual: 38000,
                  isFeatured: false,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Country
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">Region</th>
                  <th className="p-3.5">Avg Tuition</th>
                  <th className="p-3.5">POF</th>
                  <th className="p-3.5">Visa</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {countries
                  .filter((c) => `${c.name} ${c.region}`.toLowerCase().includes(q))
                  .map((c) => (
                    <tr key={c.id}>
                      <td className="p-3.5 font-semibold">
                        {c.flagEmoji} {c.name}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{c.region}</td>
                      <td className="p-3.5 font-mono">
                        {c.tuitionAvgAnnual} {c.currencyCode}
                      </td>
                      <td className="p-3.5 font-mono">
                        {c.proofOfFundsAmount} {c.currencyCode}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={visaBadgeVariant(c.visaPredictability)}>
                          {c.visaPredictability}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCountry(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-400"
                          onClick={() => deleteCountry(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* UNIVERSITIES TAB */}
      {tab === "universities" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() =>
                setEditingUni({
                  countryId: countries[0]?.id || "",
                  name: "",
                  city: "",
                  type: "Public",
                  tuitionMin: 0,
                  tuitionMax: 15000,
                  applicationFee: 75,
                  ieltsMin: 6.5,
                  intakeDeadlines: { fall: "March 15" },
                  portalUrl: "https://",
                  fundingNotes: "",
                  programs: [],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add University
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
                  <th className="p-3.5">University</th>
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">Type / Rank</th>
                  <th className="p-3.5">Programs</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {allUniversities
                  .filter((u) => `${u.name} ${u.city} ${u.countryName}`.toLowerCase().includes(q))
                  .map((u) => (
                    <tr key={u.id}>
                      <td className="p-3.5 font-semibold">{u.name}</td>
                      <td className="p-3.5">
                        {u.flag} {u.countryName} ({u.city})
                      </td>
                      <td className="p-3.5 font-mono">
                        {u.type} {u.qsRank ? `• #${u.qsRank}` : ""}
                      </td>
                      <td className="p-3.5 font-mono">{u.programs.length}</td>
                      <td className="p-3.5 text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingUni(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-400"
                          onClick={() => deleteUniversity(u.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* SCHOLARSHIPS TAB */}
      {tab === "scholarships" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() =>
                setEditingScholarship({
                  countryId: countries[0]?.id || "",
                  name: "",
                  provider: "Government",
                  degreeLevels: ["Master's"],
                  coverageType: "Full Tuition + Stipend",
                  amountAnnual: 15000,
                  currencyCode: "EUR",
                  realisticOdds: "Moderate",
                  oddsExplanation: "",
                  deadline: "March 15",
                  eligibilitySummary: "",
                  url: "https://",
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Scholarship
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
                  <th className="p-3.5">Scholarship</th>
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Realistic Odds</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {allScholarships
                  .filter((s) => `${s.name} ${s.countryName}`.toLowerCase().includes(q))
                  .map((s) => (
                    <tr key={s.id}>
                      <td className="p-3.5 font-semibold">{s.name}</td>
                      <td className="p-3.5">
                        {s.flag} {s.countryName}
                      </td>
                      <td className="p-3.5 font-mono">
                        {s.amountAnnual} {s.currencyCode}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline">{s.realisticOdds}</Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingScholarship(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-400"
                          onClick={() => deleteScholarship(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* JOURNEY TEMPLATES TAB */}
      {tab === "templates" && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Select Country:</span>
              <select
                value={templateCountryId}
                onChange={(e) => {
                  const id = e.target.value;
                  setTemplateCountryId(id);
                  const c = countries.find((item) => item.id === id);
                  setTemplateDraft(c?.journeyTemplates || []);
                }}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTemplateDraft((prev) => [
                    ...prev,
                    {
                      phase: "Phase 1: Profile & Language Tests",
                      title: "New Template Task",
                      priority: "Medium",
                      description: "",
                      subtasks: [],
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Template Item
              </Button>
              <Button size="sm" onClick={saveTemplates} disabled={saving}>
                <Save className="h-3.5 w-3.5" /> Save Templates
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {templateDraft.map((item, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-xl border border-border bg-background/60 p-3 sm:grid-cols-[220px_1fr_110px_40px]"
              >
                <select
                  value={item.phase}
                  onChange={(e) =>
                    setTemplateDraft((prev) =>
                      prev.map((t, i) => (i === idx ? { ...t, phase: e.target.value } : t))
                    )
                  }
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                >
                  <option>Phase 1: Profile &amp; Language Tests</option>
                  <option>Phase 2: Document Legalization</option>
                  <option>Phase 3: University &amp; Scholarship Applications</option>
                  <option>Phase 4: Financial &amp; Visa Prep</option>
                  <option>Phase 5: Pre-Departure</option>
                </select>
                <input
                  value={item.title}
                  onChange={(e) =>
                    setTemplateDraft((prev) =>
                      prev.map((t, i) => (i === idx ? { ...t, title: e.target.value } : t))
                    )
                  }
                  className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
                />
                <select
                  value={item.priority}
                  onChange={(e) =>
                    setTemplateDraft((prev) =>
                      prev.map((t, i) =>
                        i === idx
                          ? { ...t, priority: e.target.value as "High" | "Medium" | "Low" }
                          : t
                      )
                    )
                  }
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={() =>
                    setTemplateDraft((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="flex h-8 items-center justify-center rounded-lg text-rose-400 hover:bg-secondary"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* COUNTRY EDIT DRAWER */}
      <SlideOverDrawer
        open={Boolean(editingCountry)}
        onClose={() => setEditingCountry(null)}
        title={editingCountry?.id ? `Edit ${editingCountry.name}` : "Add New Country"}
      >
        {editingCountry && (
          <form onSubmit={saveCountry} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="text-muted-foreground">Name</span>
                <input
                  required
                  value={editingCountry.name || ""}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Flag Emoji</span>
                <input
                  value={editingCountry.flagEmoji || ""}
                  onChange={(e) =>
                    setEditingCountry({ ...editingCountry, flagEmoji: e.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Region</span>
                <input
                  value={editingCountry.region || ""}
                  onChange={(e) => setEditingCountry({ ...editingCountry, region: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Currency Code</span>
                <input
                  value={editingCountry.currencyCode || ""}
                  onChange={(e) =>
                    setEditingCountry({ ...editingCountry, currencyCode: e.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Tagline</span>
              <input
                value={editingCountry.tagline || ""}
                onChange={(e) => setEditingCountry({ ...editingCountry, tagline: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="text-muted-foreground">Avg Annual Tuition</span>
                <input
                  type="number"
                  value={editingCountry.tuitionAvgAnnual ?? 0}
                  onChange={(e) =>
                    setEditingCountry({
                      ...editingCountry,
                      tuitionAvgAnnual: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Proof of Funds</span>
                <input
                  type="number"
                  value={editingCountry.proofOfFundsAmount ?? 0}
                  onChange={(e) =>
                    setEditingCountry({
                      ...editingCountry,
                      proofOfFundsAmount: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Visa Predictability</span>
                <select
                  value={editingCountry.visaPredictability || "Moderate"}
                  onChange={(e) =>
                    setEditingCountry({
                      ...editingCountry,
                      visaPredictability: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2"
                >
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Risky">Risky</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Stay-Back (Months)</span>
                <input
                  type="number"
                  value={editingCountry.stayBackMonths ?? 12}
                  onChange={(e) =>
                    setEditingCountry({
                      ...editingCountry,
                      stayBackMonths: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={Boolean(editingCountry.isFeatured)}
                onChange={(e) =>
                  setEditingCountry({ ...editingCountry, isFeatured: e.target.checked })
                }
              />
              <span>Feature on Home Command Center</span>
            </label>
            <Button type="submit" className="w-full" disabled={saving}>
              Save Country Changes
            </Button>
          </form>
        )}
      </SlideOverDrawer>

      {/* UNIVERSITY EDIT DRAWER */}
      <SlideOverDrawer
        open={Boolean(editingUni)}
        onClose={() => setEditingUni(null)}
        title={editingUni?.id ? `Edit ${editingUni.name}` : "Add University"}
      >
        {editingUni && (
          <form onSubmit={saveUniversity} className="space-y-3 text-xs">
            {!editingUni.id && (
              <label className="block space-y-1">
                <span className="text-muted-foreground">Country</span>
                <select
                  value={editingUni.countryId || ""}
                  onChange={(e) => setEditingUni({ ...editingUni, countryId: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2"
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flagEmoji} {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block space-y-1">
              <span className="text-muted-foreground">University Name</span>
              <input
                required
                value={editingUni.name || ""}
                onChange={(e) => setEditingUni({ ...editingUni, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="text-muted-foreground">City</span>
                <input
                  required
                  value={editingUni.city || ""}
                  onChange={(e) => setEditingUni({ ...editingUni, city: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Type</span>
                <select
                  value={editingUni.type || "Public"}
                  onChange={(e) => setEditingUni({ ...editingUni, type: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Min Tuition</span>
                <input
                  type="number"
                  value={editingUni.tuitionMin ?? 0}
                  onChange={(e) =>
                    setEditingUni({ ...editingUni, tuitionMin: Number(e.target.value) })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">IELTS Min</span>
                <input
                  type="number"
                  step="0.5"
                  value={editingUni.ieltsMin ?? 6.5}
                  onChange={(e) =>
                    setEditingUni({ ...editingUni, ieltsMin: Number(e.target.value) })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Portal URL</span>
              <input
                value={editingUni.portalUrl || ""}
                onChange={(e) => setEditingUni({ ...editingUni, portalUrl: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Funding Notes</span>
              <textarea
                rows={3}
                value={editingUni.fundingNotes || ""}
                onChange={(e) => setEditingUni({ ...editingUni, fundingNotes: e.target.value })}
                className="w-full rounded-lg border border-border bg-background p-2.5"
              />
            </label>
            <Button type="submit" className="w-full" disabled={saving}>
              Save University
            </Button>
          </form>
        )}
      </SlideOverDrawer>

      {/* SCHOLARSHIP EDIT DRAWER */}
      <SlideOverDrawer
        open={Boolean(editingScholarship)}
        onClose={() => setEditingScholarship(null)}
        title={editingScholarship?.id ? `Edit ${editingScholarship.name}` : "Add Scholarship"}
      >
        {editingScholarship && (
          <form onSubmit={saveScholarship} className="space-y-3 text-xs">
            {!editingScholarship.id && (
              <label className="block space-y-1">
                <span className="text-muted-foreground">Country</span>
                <select
                  value={editingScholarship.countryId || ""}
                  onChange={(e) =>
                    setEditingScholarship({
                      ...editingScholarship,
                      countryId: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2"
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flagEmoji} {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block space-y-1">
              <span className="text-muted-foreground">Scholarship Name</span>
              <input
                required
                value={editingScholarship.name || ""}
                onChange={(e) =>
                  setEditingScholarship({ ...editingScholarship, name: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="text-muted-foreground">Amount Annual</span>
                <input
                  type="number"
                  value={editingScholarship.amountAnnual ?? 0}
                  onChange={(e) =>
                    setEditingScholarship({
                      ...editingScholarship,
                      amountAnnual: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Currency</span>
                <input
                  value={editingScholarship.currencyCode || "EUR"}
                  onChange={(e) =>
                    setEditingScholarship({
                      ...editingScholarship,
                      currencyCode: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Realistic Odds</span>
                <select
                  value={editingScholarship.realisticOdds || "Moderate"}
                  onChange={(e) =>
                    setEditingScholarship({
                      ...editingScholarship,
                      realisticOdds: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2"
                >
                  <option value="High (Funding-backed)">High (Funding-backed)</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Very Low">Very Low</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Deadline</span>
                <input
                  value={editingScholarship.deadline || ""}
                  onChange={(e) =>
                    setEditingScholarship({ ...editingScholarship, deadline: e.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Realistic Odds Explanation</span>
              <textarea
                rows={3}
                value={editingScholarship.oddsExplanation || ""}
                onChange={(e) =>
                  setEditingScholarship({
                    ...editingScholarship,
                    oddsExplanation: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-border bg-background p-2.5"
              />
            </label>
            <Button type="submit" className="w-full" disabled={saving}>
              Save Scholarship
            </Button>
          </form>
        )}
      </SlideOverDrawer>
    </div>
  );
}
