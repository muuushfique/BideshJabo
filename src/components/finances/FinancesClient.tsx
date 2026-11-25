"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { convertToBdt, formatBdt, formatLocalCurrency } from "@/lib/currency";
import type { FinancialItemDTO, FinancialPlanDTO, LifestyleTierKey } from "@/lib/types";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { DualCurrency } from "../ui/DualCurrency";
import { Badge, Button, Card } from "../ui/primitives";

type FinanceTab = "upfront" | "pof" | "simulator";

export function FinancesClient() {
  const { countries, rates, rateMap, lifestyleTier, setLifestyleTier, formatMode } =
    useCurrency();
  const { financialPlan, saveFinancialPlan, showToast } = useWorkspace();

  const [tab, setTab] = useState<FinanceTab>("upfront");

  // Add item inputs
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCurrency, setNewCurrency] = useState("BDT");
  const [newNotes, setNewNotes] = useState("");

  // Simulator state
  const targetCountry =
    countries.find((c) => c.slug === financialPlan.targetCountrySlug) || null;
  const [simCountrySlug, setSimCountrySlug] = useState(
    financialPlan.targetCountrySlug || countries[0]?.slug || "poland"
  );
  const simCountry =
    countries.find((c) => c.slug === simCountrySlug) || countries[0];

  const [jobMode, setJobMode] = useState<"odd" | "skilled">("odd");
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(
    simCountry?.workHoursCap || 20
  );
  const [monthlyStipendLocal, setMonthlyStipendLocal] = useState<number>(0);

  const upfrontItems = useMemo(
    () => financialPlan.items.filter((i) => i.category === "UPFRONT"),
    [financialPlan.items]
  );
  const pofItems = useMemo(
    () => financialPlan.items.filter((i) => i.category === "POF_SOURCE"),
    [financialPlan.items]
  );

  const upfrontTotalBdt = useMemo(
    () =>
      upfrontItems.reduce(
        (acc, i) => acc + convertToBdt(i.amount, i.currencyCode, rateMap),
        0
      ),
    [upfrontItems, rateMap]
  );

  const upfrontPaidBdt = useMemo(
    () =>
      upfrontItems
        .filter((i) => i.isPaid)
        .reduce((acc, i) => acc + convertToBdt(i.amount, i.currencyCode, rateMap), 0),
    [upfrontItems, rateMap]
  );

  const pofTotalBdt = useMemo(
    () =>
      pofItems.reduce(
        (acc, i) => acc + convertToBdt(i.amount, i.currencyCode, rateMap),
        0
      ),
    [pofItems, rateMap]
  );

  const requiredPofBdt = simCountry
    ? convertToBdt(simCountry.proofOfFundsAmount, simCountry.currencyCode, rateMap)
    : financialPlan.pofTargetBdt;

  const pofSolvencyPct =
    requiredPofBdt > 0 ? Math.min(200, Math.round((pofTotalBdt / requiredPofBdt) * 100)) : 100;

  // Bank statement seasoning tracker
  const seasoningStats = useMemo(() => {
    const start = financialPlan.seasoningStart
      ? new Date(financialPlan.seasoningStart)
      : new Date();
    const daysReq = financialPlan.seasoningDaysReq || 90;
    const maturity = new Date(start.getTime() + daysReq * 86400000);
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - start.getTime()) / 86400000)
    );
    const remaining = Math.max(0, daysReq - elapsed);
    const pct = Math.min(100, Math.round((elapsed / daysReq) * 100));
    return {
      maturityStr: maturity.toISOString().slice(0, 10),
      elapsed,
      remaining,
      pct,
    };
  }, [financialPlan.seasoningStart, financialPlan.seasoningDaysReq]);

  // Monthly Sustainability Simulator math
  const simMetrics = useMemo(() => {
    if (!simCountry) {
      return {
        monthlyExpenseLocal: 0,
        monthlyIncomeLocal: 0,
        netLocal: 0,
        monthlyExpenseBdt: 0,
        monthlyIncomeBdt: 0,
        netBdt: 0,
        barData: [],
        runwayData: [],
      };
    }

    const living = simCountry.livingCostTiers[lifestyleTier];
    const monthlyExpenseLocal = living.total;
    const hourlyWage =
      jobMode === "skilled"
        ? simCountry.skilledWageHourly
        : simCountry.partTimeWageHourly;
    const partTimeMonthlyLocal = hourlyWage * hoursPerWeek * 4.33;
    const monthlyIncomeLocal = partTimeMonthlyLocal + monthlyStipendLocal;
    const netLocal = monthlyIncomeLocal - monthlyExpenseLocal;

    const monthlyExpenseBdt = convertToBdt(
      monthlyExpenseLocal,
      simCountry.currencyCode,
      rateMap
    );
    const monthlyIncomeBdt = convertToBdt(
      monthlyIncomeLocal,
      simCountry.currencyCode,
      rateMap
    );
    const netBdt = monthlyIncomeBdt - monthlyExpenseBdt;

    const barData = [
      {
        name: "Monthly Cashflow",
        Income: Math.round(monthlyIncomeBdt),
        Expenses: Math.round(monthlyExpenseBdt),
      },
    ];

    const startingBufferBdt = Math.max(0, financialPlan.totalBudgetBdt - upfrontTotalBdt);
    const runwayData = Array.from({ length: 13 }, (_, month) => ({
      month: `M${month}`,
      SavingsBdt: Math.max(0, Math.round(startingBufferBdt + netBdt * month)),
    }));

    return {
      monthlyExpenseLocal,
      monthlyIncomeLocal,
      netLocal,
      monthlyExpenseBdt,
      monthlyIncomeBdt,
      netBdt,
      barData,
      runwayData,
    };
  }, [
    simCountry,
    lifestyleTier,
    jobMode,
    hoursPerWeek,
    monthlyStipendLocal,
    rateMap,
    financialPlan.totalBudgetBdt,
    upfrontTotalBdt,
  ]);

  const updatePlan = (patch: Partial<FinancialPlanDTO>) => {
    saveFinancialPlan({ ...financialPlan, ...patch });
  };

  const applyCountryPreset = (slug: string) => {
    const c = countries.find((item) => item.slug === slug);
    if (!c) return;
    setSimCountrySlug(c.slug);
    setHoursPerWeek(c.workHoursCap);

    const pofBdt = convertToBdt(c.proofOfFundsAmount, c.currencyCode, rateMap);
    const presetItems: FinancialItemDTO[] = [
      { id: `u1-${Date.now()}`, category: "UPFRONT", label: "IELTS / TOEFL / GRE Tests", amount: 27500, currencyCode: "BDT", isPaid: true, notes: "Dhaka test fee" },
      { id: `u2-${Date.now()}`, category: "UPFRONT", label: "University Application Fees (3 Unis)", amount: Math.round((c.universities?.[0]?.applicationFee || 80) * 3), currencyCode: c.currencyCode, isPaid: false, notes: "Dual-currency card" },
      { id: `u3-${Date.now()}`, category: "UPFRONT", label: "MoFA, Apostille & Translation", amount: 18000, currencyCode: "BDT", isPaid: false, notes: "Document legalization" },
      { id: `u4-${Date.now()}`, category: "UPFRONT", label: "1st Semester Tuition Deposit", amount: Math.round(c.tuitionAvgAnnual / 2), currencyCode: c.currencyCode, isPaid: false, notes: "50% of avg annual tuition" },
      { id: `u5-${Date.now()}`, category: "UPFRONT", label: "Student Health Insurance (1 Year)", amount: Math.round(c.livingCostTiers.balanced.insurance * 12), currencyCode: c.currencyCode, isPaid: false, notes: "Visa compliant cover" },
      { id: `u6-${Date.now()}`, category: "UPFRONT", label: "VFS / Embassy Visa & Logistics", amount: 42000, currencyCode: "BDT", isPaid: false, notes: "Visa fee + biometrics" },
      { id: `u7-${Date.now()}`, category: "UPFRONT", label: "Flight Ticket & First Month Cash", amount: 155000, currencyCode: "BDT", isPaid: false, notes: "Student fare + initial cash" },
      ...pofItems,
    ];

    updatePlan({
      targetCountrySlug: c.slug,
      pofTargetBdt: Math.round(pofBdt),
      items: presetItems,
    });
    showToast(`Loaded ${c.name} upfront budget & POF preset!`);
  };

  const addItem = (category: "UPFRONT" | "POF_SOURCE") => {
    const amt = Number(newAmount);
    if (!newLabel.trim() || !Number.isFinite(amt) || amt <= 0) return;
    const item: FinancialItemDTO = {
      id: `item-${Date.now()}`,
      category,
      label: newLabel.trim(),
      amount: amt,
      currencyCode: newCurrency,
      isPaid: category === "POF_SOURCE",
      notes: newNotes.trim(),
    };
    updatePlan({ items: [...financialPlan.items, item] });
    setNewLabel("");
    setNewAmount("");
    setNewNotes("");
  };

  const toggleItemPaid = (id: string) => {
    updatePlan({
      items: financialPlan.items.map((i) =>
        i.id === id ? { ...i, isPaid: !i.isPaid } : i
      ),
    });
  };

  const deleteItem = (id: string) => {
    updatePlan({
      items: financialPlan.items.filter((i) => i.id !== id),
    });
  };

  const remainingBudgetBdt = financialPlan.totalBudgetBdt - upfrontTotalBdt;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Financial Management &amp; Solvency Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track pre-departure BDT cash outflows, bank statement seasoning, and monthly part-time survival.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={financialPlan.targetCountrySlug}
            onChange={(e) => {
              if (e.target.value) applyCountryPreset(e.target.value);
            }}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium"
          >
            <option value="">Load Sample Country Estimate...</option>
            {countries.map((c) => (
              <option key={c.id} value={c.slug}>
                Preset: {c.flagEmoji} {c.name}
              </option>
            ))}
          </select>
          {financialPlan.targetCountrySlug && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyCountryPreset(financialPlan.targetCountrySlug)}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Preset
            </Button>
          )}
        </div>
      </div>

      {/* Executive KPI Banner */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Available Total Budget</span>
            <Wallet className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={50000}
              placeholder="Enter BDT budget"
              value={financialPlan.totalBudgetBdt || ""}
              onChange={(e) =>
                updatePlan({ totalBudgetBdt: Number(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-base font-bold"
            />
          </div>
          <div className="font-mono text-[11px] text-emerald-400">
            {financialPlan.totalBudgetBdt > 0
              ? formatBdt(financialPlan.totalBudgetBdt, formatMode)
              : "Set your BDT budget above"}
          </div>
        </Card>

        <Card className="p-4 space-y-1.5">
          <div className="text-xs text-muted-foreground">Planned Upfront Outflow</div>
          <div className="font-mono text-xl font-bold">
            {formatBdt(upfrontTotalBdt, formatMode)}
          </div>
          <div
            className={`font-mono text-xs ${
              remainingBudgetBdt >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {remainingBudgetBdt >= 0
              ? `Surplus: ${formatBdt(remainingBudgetBdt, formatMode)}`
              : `Shortfall: ${formatBdt(Math.abs(remainingBudgetBdt), formatMode)}`}
          </div>
        </Card>

        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>POF Solvency Coverage</span>
            <Landmark className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xl font-bold">{pofSolvencyPct}%</div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {formatBdt(pofTotalBdt, formatMode)} / {formatBdt(requiredPofBdt, formatMode)}
          </div>
        </Card>

        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Monthly Net ({simCountry?.name})</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div
            className={`font-mono text-xl font-bold ${
              simMetrics.netBdt >= 0 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {simMetrics.netBdt >= 0 ? "+" : ""}
            {formatBdt(simMetrics.netBdt, formatMode)}/mo
          </div>
          <div className="text-[11px] text-muted-foreground">
            {hoursPerWeek} hrs/wk ({jobMode === "skilled" ? "Skilled" : "Odd Job"})
          </div>
        </Card>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card/80 p-1.5">
        {[
          { id: "upfront", label: "1. Upfront Cash Outflow" },
          { id: "pof", label: "2. Proof-of-Funds & Seasoning" },
          { id: "simulator", label: "3. Monthly Survival Simulator" },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as FinanceTab)}
              className={`relative rounded-lg px-4 py-2 text-xs font-semibold transition ${
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="finance-tab-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-lg bg-primary"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: UPFRONT OUTFLOW CALCULATOR */}
      {tab === "upfront" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Pre-Departure Cash Outflow Ledger
              </h2>
              <span className="font-mono text-xs text-emerald-400">
                Paid: {formatBdt(upfrontPaidBdt, formatMode)} /{" "}
                {formatBdt(upfrontTotalBdt, formatMode)}
              </span>
            </div>

            {upfrontItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center space-y-2">
                <p className="text-sm font-medium">No expenses added yet</p>
                <p className="text-xs text-muted-foreground">
                  Add your own pre-departure expenses on the right, or select a country from &ldquo;Load Sample Country Estimate&rdquo; above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {upfrontItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleItemPaid(item.id)}
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition ${
                          item.isPaid
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-border bg-background"
                        }`}
                      >
                        {item.isPaid && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            item.isPaid ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.label}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-muted-foreground">{item.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DualCurrency
                        amount={item.amount}
                        currencyCode={item.currencyCode}
                        size="sm"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3 h-fit">
            <h3 className="font-display text-sm font-bold">Add Pre-Departure Expense</h3>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Uni-Assist VPD Fee"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Amount"
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-xs"
              />
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 font-mono text-xs"
              >
                {rates.map((r) => (
                  <option key={r.code} value={r.code}>{r.code}</option>
                ))}
              </select>
            </div>
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional note..."
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
            />
            <Button className="w-full" size="sm" onClick={() => addItem("UPFRONT")}>
              <Plus className="h-3.5 w-3.5" /> Add Outflow Item
            </Button>
          </Card>
        </div>
      )}

      {/* TAB 2: PROOF-OF-FUNDS & SEASONING */}
      {tab === "pof" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold">
                  Proof-of-Funds / Solvency Sources
                </h2>
                <p className="text-xs text-muted-foreground">
                  Target for {simCountry?.name}:{" "}
                  {simCountry && (
                    <span className="font-mono text-foreground">
                      {formatLocalCurrency(
                        simCountry.proofOfFundsAmount,
                        simCountry.currencyCode,
                        rateMap
                      )}{" "}
                      ({formatBdt(requiredPofBdt, formatMode)})
                    </span>
                  )}
                </p>
              </div>
              <Badge variant={pofSolvencyPct >= 100 ? "success" : "warning"}>
                {pofSolvencyPct}% Funded
              </Badge>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, pofSolvencyPct)}%` }}
              />
            </div>

            {pofItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-5 text-center text-xs text-muted-foreground">
                No funding sources added yet. Add savings, FDR, family sponsorship, or blocked account deposits below.
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {pofItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      {item.notes && (
                        <div className="text-[11px] text-muted-foreground">{item.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <DualCurrency
                        amount={item.amount}
                        currencyCode={item.currencyCode}
                        size="sm"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded p-1 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-2">
              <div className="text-xs font-semibold">Add Solvency Source</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Blocked Account / FDR"
                  className="h-9 rounded-lg border border-border bg-background px-3 text-xs sm:col-span-2"
                />
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Amount"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 font-mono text-xs"
                  />
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-1.5 font-mono text-xs"
                  >
                    {rates.map((r) => (
                      <option key={r.code} value={r.code}>{r.code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button size="sm" onClick={() => addItem("POF_SOURCE")}>
                <Plus className="h-3.5 w-3.5" /> Add POF Source
              </Button>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-indigo-400" />
              <div>
                <h2 className="font-display text-base font-bold">
                  Bank Statement Seasoning Countdown
                </h2>
                <p className="text-xs text-muted-foreground">
                  Track minimum holding days (e.g. 90-day / 6-month maturity) for embassy solvency checks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Funds Deposit Date</span>
                <input
                  type="date"
                  value={financialPlan.seasoningStart || ""}
                  onChange={(e) => updatePlan({ seasoningStart: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Required Days</span>
                <select
                  value={financialPlan.seasoningDaysReq}
                  onChange={(e) =>
                    updatePlan({ seasoningDaysReq: Number(e.target.value) })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value={28}>28 Days (UK / Short)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={180}>180 Days (6 Months - Ireland/CA)</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Seasoning Progress</span>
                <span className="font-mono font-bold text-indigo-400">
                  {seasoningStats.elapsed} / {financialPlan.seasoningDaysReq} Days (
                  {seasoningStats.pct}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${seasoningStats.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Maturity Date:{" "}
                  <strong className="font-mono text-foreground">
                    {seasoningStats.maturityStr}
                  </strong>
                </span>
                <Badge variant={seasoningStats.remaining === 0 ? "success" : "warning"}>
                  {seasoningStats.remaining === 0
                    ? "Mature & Ready"
                    : `${seasoningStats.remaining} days left`}
                </Badge>
              </div>
            </div>

            {simCountry && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs leading-relaxed">
                <strong className="text-amber-400">
                  {simCountry.name} Rule ({simCountry.proofOfFundsStyle}):{" "}
                </strong>
                {simCountry.proofOfFundsNotes}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: MONTHLY SUSTAINABILITY SIMULATOR */}
      {tab === "simulator" && simCountry && (
        <div className="space-y-5">
          <Card className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Destination Country</span>
              <select
                value={simCountry.slug}
                onChange={(e) => {
                  const next = countries.find((c) => c.slug === e.target.value);
                  setSimCountrySlug(e.target.value);
                  if (next) setHoursPerWeek(next.workHoursCap);
                }}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Lifestyle Tier</span>
              <select
                value={lifestyleTier}
                onChange={(e) => setLifestyleTier(e.target.value as LifestyleTierKey)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
              >
                <option value="frugal">Frugal / Dorm</option>
                <option value="balanced">Balanced / Shared</option>
                <option value="comfortable">Comfortable / Studio</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Part-Time Job Type</span>
              <select
                value={jobMode}
                onChange={(e) => setJobMode(e.target.value as "odd" | "skilled")}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
              >
                <option value="odd">
                  Odd Job ({formatLocalCurrency(simCountry.partTimeWageHourly, simCountry.currencyCode, rateMap)}/hr)
                </option>
                <option value="skilled">
                  Skilled / RA / Tech ({formatLocalCurrency(simCountry.skilledWageHourly, simCountry.currencyCode, rateMap)}/hr)
                </option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Scholarship / Lab Stipend ({simCountry.currencyCode}/mo)
              </span>
              <input
                type="number"
                min={0}
                value={monthlyStipendLocal}
                onChange={(e) => setMonthlyStipendLocal(Number(e.target.value) || 0)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs"
              />
            </label>

            <div className="sm:col-span-2 lg:col-span-4 space-y-1.5 border-t border-border pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  Weekly Work Hours:{" "}
                  <strong className="font-mono text-foreground">{hoursPerWeek} hrs/wk</strong>{" "}
                  (Recommended legal/realistic cap: {simCountry.workHoursCap} hrs/wk)
                </span>
                {hoursPerWeek > simCountry.workHoursCap && (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Exceeds term-time cap!
                  </span>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold">
                  Monthly Income vs. Expenses (BDT)
                </h3>
                <DualCurrency
                  amount={simMetrics.netLocal}
                  currencyCode={simCountry.currencyCode}
                  suffix="/mo"
                  size="sm"
                />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simMetrics.barData}>
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
                      formatter={(v: number) => [formatBdt(v, formatMode), ""]}
                    />
                    <Legend />
                    <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div>
                <h3 className="font-display text-base font-bold">
                  12-Month Savings Runway Projection (BDT)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Starting from post-upfront reserve of{" "}
                  {formatBdt(Math.max(0, financialPlan.totalBudgetBdt - upfrontTotalBdt), formatMode)}.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simMetrics.runwayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [formatBdt(v, formatMode), "Reserve"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="SavingsBdt"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.22}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
