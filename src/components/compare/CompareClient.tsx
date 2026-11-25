"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download, GitCompare, Plus, Printer, X } from "lucide-react";
import { convertToBdt, formatBdt, formatLocalCurrency } from "@/lib/currency";
import type { LifestyleTierKey } from "@/lib/types";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { DualCurrency } from "../ui/DualCurrency";
import { Badge, Button, Card, visaBadgeVariant } from "../ui/primitives";

export function CompareClient() {
  const { countries, rateMap, lifestyleTier, setLifestyleTier, formatMode } = useCurrency();
  const {
    compareCountries,
    toggleCompareCountry,
    compareUniversities,
    toggleCompareUniversity,
  } = useWorkspace();

  const [entityMode, setEntityMode] = useState<"countries" | "universities">("countries");

  const selectedCountries = useMemo(
    () =>
      compareCountries
        .map((slug) => countries.find((c) => c.slug === slug))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [compareCountries, countries]
  );

  const allUniversities = useMemo(
    () =>
      countries.flatMap((c) =>
        (c.universities || []).map((u) => ({ ...u, country: c }))
      ),
    [countries]
  );

  const selectedUniversities = useMemo(
    () =>
      compareUniversities
        .map((slug) => allUniversities.find((u) => u.slug === slug))
        .filter((u): u is NonNullable<typeof u> => Boolean(u)),
    [compareUniversities, allUniversities]
  );

  const exportCsv = () => {
    if (entityMode === "countries" && selectedCountries.length > 0) {
      const headers = ["Metric", ...selectedCountries.map((c) => c.name)];
      const rows = [
        ["Region", ...selectedCountries.map((c) => c.region)],
        [
          "Avg Tuition / Yr",
          ...selectedCountries.map(
            (c) =>
              `${formatLocalCurrency(c.tuitionAvgAnnual, c.currencyCode, rateMap)} (${formatBdt(
                convertToBdt(c.tuitionAvgAnnual, c.currencyCode, rateMap),
                formatMode
              )})`
          ),
        ],
        [
          `Monthly Living (${lifestyleTier})`,
          ...selectedCountries.map((c) => {
            const m = c.livingCostTiers[lifestyleTier].total;
            return `${formatLocalCurrency(m, c.currencyCode, rateMap)} (${formatBdt(
              convertToBdt(m, c.currencyCode, rateMap),
              formatMode
            )})`;
          }),
        ],
        [
          "Proof of Funds",
          ...selectedCountries.map(
            (c) =>
              `${formatLocalCurrency(c.proofOfFundsAmount, c.currencyCode, rateMap)} (${formatBdt(
                convertToBdt(c.proofOfFundsAmount, c.currencyCode, rateMap),
                formatMode
              )})`
          ),
        ],
        ["POF Style", ...selectedCountries.map((c) => c.proofOfFundsStyle)],
        ["Visa Predictability", ...selectedCountries.map((c) => c.visaPredictability)],
        ["Embassy Backlog", ...selectedCountries.map((c) => c.embassyBacklog)],
        [
          "Part-Time Wage",
          ...selectedCountries.map(
            (c) =>
              `${formatLocalCurrency(c.partTimeWageHourly, c.currencyCode, rateMap)}/hr (${c.workHoursCap}h/wk)`
          ),
        ],
        ["Stay-Back Visa", ...selectedCountries.map((c) => `${c.stayBackMonths} months`)],
        ["PR Difficulty", ...selectedCountries.map((c) => c.prDifficulty)],
      ];

      const csv = [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bideshjabo-country-comparison.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 print-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Side-by-Side Comparison Matrix
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare up to 4 countries or universities side-by-side with live BDT equivalents and CSV/PDF export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setEntityMode("countries")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                entityMode === "countries" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Countries ({selectedCountries.length}/4)
            </button>
            <button
              onClick={() => setEntityMode("universities")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                entityMode === "universities" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Universities ({selectedUniversities.length}/4)
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {entityMode === "countries" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-3 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Add / Toggle Countries:
              </span>
              {countries.map((c) => {
                const active = compareCountries.includes(c.slug);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCompareCountry(c.slug)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-400 font-medium"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{c.flagEmoji}</span>
                    <span>{c.name}</span>
                    {active ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            <select
              value={lifestyleTier}
              onChange={(e) => setLifestyleTier(e.target.value as LifestyleTierKey)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
            >
              <option value="frugal">Lifestyle: Frugal / Dorm</option>
              <option value="balanced">Lifestyle: Balanced / Shared</option>
              <option value="comfortable">Lifestyle: Comfortable / Studio</option>
            </select>
          </div>

          {selectedCountries.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <GitCompare className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="font-display text-base font-semibold">No Countries Selected</h2>
              <p className="text-xs text-muted-foreground">
                Select up to 4 countries above to view the side-by-side matrix.
              </p>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="w-48 p-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dimension
                    </th>
                    {selectedCountries.map((c) => (
                      <th key={c.id} className="p-4 align-top">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/countries/${c.slug}`}
                            className="flex items-center gap-2 font-display text-base font-bold hover:text-indigo-400"
                          >
                            <span className="text-xl">{c.flagEmoji}</span>
                            <span>{c.name}</span>
                          </Link>
                          <button
                            onClick={() => toggleCompareCountry(c.slug)}
                            className="rounded p-1 text-muted-foreground hover:bg-secondary no-print"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-1 text-[11px] font-normal text-muted-foreground">
                          {c.region} • {c.currencyCode}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Avg Annual Tuition</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4">
                        <DualCurrency
                          amount={c.tuitionAvgAnnual}
                          currencyCode={c.currencyCode}
                          zeroLabel="€0 Free"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">
                      Monthly Living ({lifestyleTier})
                    </td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4">
                        <DualCurrency
                          amount={c.livingCostTiers[lifestyleTier].total}
                          currencyCode={c.currencyCode}
                          suffix="/mo"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Est. 1st Year Total</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4">
                        <DualCurrency
                          amount={
                            c.tuitionAvgAnnual + c.livingCostTiers[lifestyleTier].total * 12
                          }
                          currencyCode={c.currencyCode}
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Proof of Funds</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4 space-y-1">
                        <DualCurrency
                          amount={c.proofOfFundsAmount}
                          currencyCode={c.currencyCode}
                        />
                        <Badge variant="outline">{c.proofOfFundsStyle}</Badge>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Visa Predictability</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4 space-y-1">
                        <Badge variant={visaBadgeVariant(c.visaPredictability)}>
                          {c.visaPredictability}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground">
                          Backlog: {c.embassyBacklog}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Embassy Location</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4 text-foreground/90">
                        {c.embassyLocation}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">
                      Part-Time Wage &amp; Cap
                    </td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4 space-y-1">
                        <DualCurrency
                          amount={c.partTimeWageHourly}
                          currencyCode={c.currencyCode}
                          suffix="/hr"
                          size="sm"
                        />
                        <div className="text-[11px] text-muted-foreground">
                          {c.workHoursCap} hrs/wk • {c.partTimeSustain}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Language Barrier</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4">
                        <Badge variant="outline">{c.languageBarrier}</Badge>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">
                      Stay-Back Visa &amp; PR
                    </td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4 space-y-1">
                        <div className="font-mono font-semibold text-foreground">
                          {c.stayBackMonths} Months
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          PR: {c.prDifficulty}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Avg Entry Salary</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4">
                        <DualCurrency
                          amount={c.entrySalaryAnnual}
                          currencyCode={c.currencyCode}
                          suffix="/yr"
                          size="sm"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">Reality Verdict</td>
                    {selectedCountries.map((c) => (
                      <td key={c.id} className="p-4 text-[11px] leading-relaxed text-muted-foreground">
                        {c.groundReality.verdict}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/80 p-3 no-print">
            <span className="text-xs font-medium text-muted-foreground">
              Select up to 4 Universities:
            </span>
            {allUniversities.map((u) => {
              const active = compareUniversities.includes(u.slug);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleCompareUniversity(u.slug)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${
                    active
                      ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-400 font-medium"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{u.country.flagEmoji}</span>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>

          {selectedUniversities.length === 0 ? (
            <Card className="p-10 text-center space-y-2">
              <p className="font-display text-base font-semibold">No Universities Selected</p>
              <p className="text-xs text-muted-foreground">
                Pick universities above or from any Country Dossier&apos;s slide-over drawer.
              </p>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="w-44 p-4 font-semibold uppercase text-muted-foreground">
                      Attribute
                    </th>
                    {selectedUniversities.map((u) => (
                      <th key={u.id} className="p-4">
                        <div className="font-display text-sm font-bold">{u.name}</div>
                        <div className="text-[11px] font-normal text-muted-foreground">
                          {u.country.flagEmoji} {u.city}, {u.country.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  <tr>
                    <td className="p-4 text-muted-foreground">Type &amp; QS Rank</td>
                    {selectedUniversities.map((u) => (
                      <td key={u.id} className="p-4 font-mono">
                        {u.type} • {u.qsRank ? `QS #${u.qsRank}` : "Applied"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">Annual Tuition Range</td>
                    {selectedUniversities.map((u) => (
                      <td key={u.id} className="p-4 space-y-1">
                        <DualCurrency
                          amount={u.tuitionMin}
                          currencyCode={u.country.currencyCode}
                          size="sm"
                          zeroLabel="€0 / Funded"
                        />
                        {u.tuitionMax > u.tuitionMin && (
                          <div className="text-[11px] text-muted-foreground">
                            up to {formatLocalCurrency(u.tuitionMax, u.country.currencyCode, rateMap)}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">Application Fee</td>
                    {selectedUniversities.map((u) => (
                      <td key={u.id} className="p-4">
                        <DualCurrency
                          amount={u.applicationFee}
                          currencyCode={u.country.currencyCode}
                          size="sm"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">English &amp; GRE</td>
                    {selectedUniversities.map((u) => (
                      <td key={u.id} className="p-4 font-mono">
                        IELTS {u.ieltsMin}+ {u.toeflMin ? `• TOEFL ${u.toeflMin}+` : ""} •{" "}
                        {u.greRequired ? "GRE Req" : "No GRE"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">Intake Deadlines</td>
                    {selectedUniversities.map((u) => (
                      <td key={u.id} className="p-4">
                        Fall: {u.intakeDeadlines.fall}
                        {u.intakeDeadlines.spring ? ` • Spring: ${u.intakeDeadlines.spring}` : ""}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">Funding Notes</td>
                    {selectedUniversities.map((u) => (
                      <td key={u.id} className="p-4 text-[11px] text-muted-foreground">
                        {u.fundingNotes}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
