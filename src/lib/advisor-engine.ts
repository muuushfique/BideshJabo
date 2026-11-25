import { convertToBdt, formatBdt, formatLocalCurrency } from "./currency";
import type {
  ActionableCard,
  CountryDTO,
  ExchangeRateDTO,
  StudentProfile,
} from "./types";

interface ScoredCountry {
  country: CountryDTO;
  score: number;
  firstYearCostBdt: number;
  pofBdt: number;
  tuitionBdt: number;
  livingMonthlyBdt: number;
  reasons: string[];
}

export function scoreCountriesForProfile(
  countries: CountryDTO[],
  profile: StudentProfile,
  rateMap: Record<string, ExchangeRateDTO>,
  query: string
): ScoredCountry[] {
  const q = query.toLowerCase();
  const tierKey = profile.preferredLifestyle || "balanced";

  return countries
    .map((country) => {
      let score = 50;
      const reasons: string[] = [];

      const tuitionBdt = convertToBdt(country.tuitionAvgAnnual, country.currencyCode, rateMap);
      const livingMonthlyLocal = country.livingCostTiers[tierKey]?.total ?? country.livingCostTiers.balanced.total;
      const livingMonthlyBdt = convertToBdt(livingMonthlyLocal, country.currencyCode, rateMap);
      const pofBdt = convertToBdt(country.proofOfFundsAmount, country.currencyCode, rateMap);
      const firstYearCostBdt = tuitionBdt + livingMonthlyBdt * 12;

      // Degree match
      if (country.degreeLevels.includes(profile.degreeTarget)) {
        score += 12;
      } else {
        score -= 20;
      }

      // Field / major match
      const majorLower = profile.major.toLowerCase();
      if (
        country.fieldsOfStudy.some((f) => {
          const fl = f.toLowerCase();
          return (
            fl.includes(majorLower) ||
            majorLower.includes("computer") && fl.includes("computer") ||
            majorLower.includes("eng") && fl.includes("engineering") ||
            majorLower.includes("business") && fl.includes("business")
          );
        })
      ) {
        score += 10;
        reasons.push(`Strong programs in ${profile.major}`);
      }

      // Budget fit
      if (profile.budgetBdt >= firstYearCostBdt * 0.9) {
        score += 20;
        reasons.push(`Fits within your ${formatBdt(profile.budgetBdt)} budget`);
      } else if (country.proofOfFundsStyle === "Lab Funding Waiver") {
        score += 18;
        reasons.push("Lab/professor funding can waive tuition & bank solvency");
      } else if (profile.budgetBdt >= pofBdt) {
        score += 6;
        reasons.push("Meets upfront proof-of-funds threshold");
      } else {
        score -= 15;
      }

      // Visa predictability
      if (country.visaPredictability === "High") {
        score += 10;
        reasons.push("High visa predictability");
      } else if (country.visaPredictability === "Risky") {
        score -= 10;
      }

      // Query keyword boosts
      if (q.includes(country.name.toLowerCase()) || q.includes(country.slug)) {
        score += 45;
      }
      if (q.includes("cheap") || q.includes("budget") || q.includes("afford") || q.includes("low")) {
        if (firstYearCostBdt < 1800000 || country.tuitionAvgAnnual < 2000) score += 20;
      }
      if (q.includes("scholarship") || q.includes("fund") || q.includes("stipend") || q.includes("free")) {
        if (country.tuitionAvgAnnual < 1500 || country.proofOfFundsStyle === "Lab Funding Waiver") {
          score += 22;
        }
      }
      if (q.includes("pr") || q.includes("stay") || q.includes("job") || q.includes("english")) {
        if (country.stayBackMonths >= 18) score += 14;
        if (country.languageBarrier === "English-Friendly") score += 10;
      }
      if (q.includes("visa")) {
        if (country.visaPredictability === "High") score += 16;
      }

      return {
        country,
        score,
        firstYearCostBdt,
        pofBdt,
        tuitionBdt,
        livingMonthlyBdt,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildGroundedAdvice(
  query: string,
  countries: CountryDTO[],
  profile: StudentProfile,
  rateMap: Record<string, ExchangeRateDTO>
): { text: string; cards: ActionableCard[] } {
  const scored = scoreCountriesForProfile(countries, profile, rateMap, query);
  const top = scored.slice(0, 3);
  const q = query.toLowerCase();
  const tierKey = profile.preferredLifestyle || "balanced";

  const cards: ActionableCard[] = top.map((item) => {
    const c = item.country;
    return {
      type: "country",
      slug: c.slug,
      title: `${c.flagEmoji} ${c.name}`,
      subtitle: `${c.visaPredictability} Visa • ${c.stayBackMonths} mo Stay-Back • ${c.proofOfFundsStyle}`,
      highlight: `Avg Tuition ${formatLocalCurrency(c.tuitionAvgAnnual, c.currencyCode, rateMap)}/yr`,
      currencyCode: c.currencyCode,
      amountLocal: c.tuitionAvgAnnual,
      visaBadge: c.visaPredictability,
    };
  });

  // Also add top matching university card if query asks about universities/programs
  const topCountry = top[0]?.country;
  if (topCountry?.universities?.length) {
    const u = topCountry.universities[0];
    cards.push({
      type: "university",
      slug: u.slug,
      countrySlug: topCountry.slug,
      title: u.name,
      subtitle: `${u.city}, ${topCountry.name} • IELTS ${u.ieltsMin}+`,
      highlight: `Tuition from ${formatLocalCurrency(u.tuitionMin, topCountry.currencyCode, rateMap)}/yr`,
      currencyCode: topCountry.currencyCode,
      amountLocal: u.tuitionMin,
    });
  }

  const lines: string[] = [];
  lines.push(
    `Based on your profile (**${profile.degreeTarget}** in **${profile.major}**, CGPA **${profile.cgpa}**, IELTS **${profile.ieltsScore}**, Budget **${formatBdt(profile.budgetBdt, "exact")}**, **${tierKey}** lifestyle), here is my grounded analysis:\n`
  );

  if (q.includes("visa") || q.includes("pof") || q.includes("bank") || q.includes("embassy")) {
    lines.push("### Visa & Proof-of-Funds Breakdown\n");
    for (const item of top) {
      const c = item.country;
      lines.push(
        `- **${c.flagEmoji} ${c.name}** — *${c.visaType}* (**${c.visaPredictability} predictability**, Embassy Backlog: **${c.embassyBacklog}**): Requires **${formatLocalCurrency(c.proofOfFundsAmount, c.currencyCode, rateMap)}** (≈ \`${formatBdt(item.pofBdt)}\`) via **${c.proofOfFundsStyle}**. *Reality note:* ${c.groundReality.embassyWarning}`
      );
    }
  } else if (q.includes("living") || q.includes("part-time") || q.includes("job") || q.includes("wage")) {
    lines.push(`### Living Costs (${tierKey}) & Part-Time Sustainability\n`);
    for (const item of top) {
      const c = item.country;
      const monthly = c.livingCostTiers[tierKey]?.total ?? c.livingCostTiers.balanced.total;
      const estIncome = c.partTimeWageHourly * c.workHoursCap * 4.33;
      const estIncomeBdt = convertToBdt(estIncome, c.currencyCode, rateMap);
      lines.push(
        `- **${c.flagEmoji} ${c.name}**: Monthly ${tierKey} budget is **${formatLocalCurrency(monthly, c.currencyCode, rateMap)}** (≈ \`${formatBdt(item.livingMonthlyBdt)}\`). Odd-job wage is **${formatLocalCurrency(c.partTimeWageHourly, c.currencyCode, rateMap)}/hr** (${c.workHoursCap} hrs/wk cap ≈ **${formatLocalCurrency(estIncome, c.currencyCode, rateMap)}/mo** / \`${formatBdt(estIncomeBdt)}\`). Verdict: *${c.partTimeSustain}*.`
      );
    }
  } else {
    lines.push("### Top Recommended Destinations for Your Profile\n");
    top.forEach((item, idx) => {
      const c = item.country;
      const monthly = c.livingCostTiers[tierKey]?.total ?? c.livingCostTiers.balanced.total;
      lines.push(
        `#### ${idx + 1}. ${c.flagEmoji} ${c.name} (${c.region})\n` +
          `- **Annual Tuition (Avg):** ${formatLocalCurrency(c.tuitionAvgAnnual, c.currencyCode, rateMap)} (≈ \`${formatBdt(item.tuitionBdt)}\`)\n` +
          `- **Monthly Living (${tierKey}):** ${formatLocalCurrency(monthly, c.currencyCode, rateMap)}/mo (≈ \`${formatBdt(item.livingMonthlyBdt)}/mo\`)\n` +
          `- **Proof of Funds:** ${formatLocalCurrency(c.proofOfFundsAmount, c.currencyCode, rateMap)} (≈ \`${formatBdt(item.pofBdt)}\`) — *${c.proofOfFundsStyle}*\n` +
          `- **Visa & Stay-Back:** ${c.visaPredictability} predictability (${c.embassyBacklog} backlog) • **${c.stayBackMonths} months** post-study visa • PR: *${c.prDifficulty}*\n` +
          `- **Why it fits:** ${item.reasons[0] || c.tagline} *Ground reality:* ${c.groundReality.verdict}`
      );
    });
  }

  lines.push(
    "\n---\n**Next Steps:** Click any card below to inspect the full country dossier, bookmark it to your shortlist, or initialize a 5-phase application roadmap."
  );

  return { text: lines.join("\n"), cards };
}
