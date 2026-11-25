import type {
  Country,
  JourneyTask,
  Program,
  Scholarship,
  University,
  UserJourney,
} from "@prisma/client";
import type {
  CountryDTO,
  GroundReality,
  JourneyTaskDTO,
  JourneyTemplateItem,
  LivingCostTiers,
  PrPathwayStep,
  ProgramDTO,
  ScholarshipDTO,
  StudentProfile,
  SubtaskItem,
  UniversityDTO,
  UserJourneyDTO,
} from "./types";

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  degreeTarget: "",
  cgpa: "",
  major: "",
  workExperienceYears: 0,
  budgetBdt: 0,
  ieltsScore: "",
  preferredLifestyle: "balanced",
  targetIntake: "",
};

const EMPTY_TIER = {
  rent: 0,
  food: 0,
  transport: 0,
  utilities: 0,
  insurance: 0,
  misc: 0,
  total: 0,
};

export function serializeProgram(p: Program): ProgramDTO {
  return {
    id: p.id,
    universityId: p.universityId,
    name: p.name,
    degreeLevel: p.degreeLevel,
    field: p.field,
    durationMonths: p.durationMonths,
    tuitionAnnual: p.tuitionAnnual,
    language: p.language,
    deadline: p.deadline,
    requirements: p.requirements,
  };
}

export function serializeUniversity(
  u: University & { programs?: Program[] }
): UniversityDTO {
  return {
    id: u.id,
    countryId: u.countryId,
    slug: u.slug,
    name: u.name,
    city: u.city,
    type: u.type,
    qsRank: u.qsRank,
    tuitionMin: u.tuitionMin,
    tuitionMax: u.tuitionMax,
    applicationFee: u.applicationFee,
    ieltsMin: u.ieltsMin,
    toeflMin: u.toeflMin,
    greRequired: u.greRequired,
    intakeDeadlines: safeJsonParse<{ fall: string; spring?: string }>(
      u.intakeDeadlines,
      { fall: "March 15" }
    ),
    portalUrl: u.portalUrl,
    fundingNotes: u.fundingNotes,
    englishPrograms: u.englishPrograms,
    programs: (u.programs ?? []).map(serializeProgram),
  };
}

export function serializeScholarship(s: Scholarship): ScholarshipDTO {
  return {
    id: s.id,
    countryId: s.countryId,
    name: s.name,
    provider: s.provider,
    degreeLevels: safeJsonParse<string[]>(s.degreeLevels, ["Master's"]),
    coverageType: s.coverageType,
    amountAnnual: s.amountAnnual,
    currencyCode: s.currencyCode,
    realisticOdds: s.realisticOdds,
    oddsExplanation: s.oddsExplanation,
    deadline: s.deadline,
    eligibilitySummary: s.eligibilitySummary,
    url: s.url,
  };
}

export function serializeCountry(
  c: Country & {
    universities?: (University & { programs?: Program[] })[];
    scholarships?: Scholarship[];
  }
): CountryDTO {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    flagEmoji: c.flagEmoji,
    region: c.region,
    currencyCode: c.currencyCode,
    tagline: c.tagline,
    degreeLevels: safeJsonParse<string[]>(c.degreeLevels, []),
    fieldsOfStudy: safeJsonParse<string[]>(c.fieldsOfStudy, []),
    tuitionMinAnnual: c.tuitionMinAnnual,
    tuitionMaxAnnual: c.tuitionMaxAnnual,
    tuitionAvgAnnual: c.tuitionAvgAnnual,
    tuitionNotes: c.tuitionNotes,
    livingCostTiers: safeJsonParse<LivingCostTiers>(c.livingCostTiers, {
      frugal: EMPTY_TIER,
      balanced: EMPTY_TIER,
      comfortable: EMPTY_TIER,
    }),
    proofOfFundsAmount: c.proofOfFundsAmount,
    proofOfFundsStyle: c.proofOfFundsStyle,
    proofOfFundsNotes: c.proofOfFundsNotes,
    visaPredictability: c.visaPredictability,
    visaType: c.visaType,
    embassyLocation: c.embassyLocation,
    embassyBacklog: c.embassyBacklog,
    partTimeWageHourly: c.partTimeWageHourly,
    skilledWageHourly: c.skilledWageHourly,
    workHoursCap: c.workHoursCap,
    partTimeSustain: c.partTimeSustain,
    languageBarrier: c.languageBarrier,
    stayBackMonths: c.stayBackMonths,
    prDifficulty: c.prDifficulty,
    entrySalaryAnnual: c.entrySalaryAnnual,
    purchasingPowerNote: c.purchasingPowerNote,
    pros: safeJsonParse<string[]>(c.pros, []),
    cons: safeJsonParse<string[]>(c.cons, []),
    groundReality: safeJsonParse<GroundReality>(c.groundReality, {
      housing: "",
      jobMarket: "",
      embassyWarning: "",
      bdCommunity: "",
      verdict: "",
    }),
    legalizationSteps: safeJsonParse<string[]>(c.legalizationSteps, []),
    prPathwaySteps: safeJsonParse<PrPathwayStep[]>(c.prPathwaySteps, []),
    journeyTemplates: safeJsonParse<JourneyTemplateItem[]>(c.journeyTemplates, []),
    isFeatured: c.isFeatured,
    universities: c.universities ? c.universities.map(serializeUniversity) : undefined,
    scholarships: c.scholarships ? c.scholarships.map(serializeScholarship) : undefined,
  };
}

export function serializeJourneyTask(t: JourneyTask): JourneyTaskDTO {
  return {
    id: t.id,
    journeyId: t.journeyId,
    phase: t.phase,
    title: t.title,
    description: t.description,
    isCompleted: t.isCompleted,
    priority: (t.priority as "High" | "Medium" | "Low") || "Medium",
    dueDate: t.dueDate,
    subtasks: safeJsonParse<SubtaskItem[]>(t.subtasks, []),
    sortOrder: t.sortOrder,
    isCustom: t.isCustom,
  };
}

export function serializeJourney(
  j: UserJourney & { country: Country; tasks: JourneyTask[] }
): UserJourneyDTO {
  return {
    id: j.id,
    countryId: j.countryId,
    countrySlug: j.country.slug,
    countryName: j.country.name,
    countryFlag: j.country.flagEmoji,
    targetIntake: j.targetIntake,
    degreeLevel: j.degreeLevel,
    tasks: [...j.tasks].sort((a, b) => a.sortOrder - b.sortOrder).map(serializeJourneyTask),
    updatedAt: j.updatedAt.toISOString(),
  };
}
