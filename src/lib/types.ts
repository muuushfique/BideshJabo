export type LifestyleTierKey = "frugal" | "balanced" | "comfortable";

export type DegreeLevel = "Bachelor's" | "Master's" | "PhD" | "Diploma";

export type CurrencyFormatMode = "compact" | "exact";

export interface ExchangeRateDTO {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rateToBdt: number;
  updatedAt?: string;
}

export interface LivingCostBreakdown {
  rent: number;
  food: number;
  transport: number;
  utilities: number;
  insurance: number;
  misc: number;
  total: number;
}

export interface LivingCostTiers {
  frugal: LivingCostBreakdown;
  balanced: LivingCostBreakdown;
  comfortable: LivingCostBreakdown;
}

export interface GroundReality {
  housing: string;
  jobMarket: string;
  embassyWarning: string;
  bdCommunity: string;
  verdict: string;
}

export interface PrPathwayStep {
  step: string;
  timeline: string;
  detail: string;
}

export interface JourneyTemplateItem {
  phase: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  subtasks: string[];
}

export interface ProgramDTO {
  id: string;
  universityId: string;
  name: string;
  degreeLevel: string;
  field: string;
  durationMonths: number;
  tuitionAnnual: number;
  language: string;
  deadline: string;
  requirements: string;
}

export interface UniversityDTO {
  id: string;
  countryId: string;
  slug: string;
  name: string;
  city: string;
  type: string;
  qsRank: number | null;
  tuitionMin: number;
  tuitionMax: number;
  applicationFee: number;
  ieltsMin: number;
  toeflMin: number | null;
  greRequired: boolean;
  intakeDeadlines: { fall: string; spring?: string };
  portalUrl: string;
  fundingNotes: string;
  englishPrograms: boolean;
  programs: ProgramDTO[];
}

export interface ScholarshipDTO {
  id: string;
  countryId: string;
  name: string;
  provider: string;
  degreeLevels: string[];
  coverageType: string;
  amountAnnual: number;
  currencyCode: string;
  realisticOdds: string;
  oddsExplanation: string;
  deadline: string;
  eligibilitySummary: string;
  url: string;
}

export interface CountryDTO {
  id: string;
  slug: string;
  name: string;
  flagEmoji: string;
  region: string;
  currencyCode: string;
  tagline: string;
  degreeLevels: string[];
  fieldsOfStudy: string[];
  tuitionMinAnnual: number;
  tuitionMaxAnnual: number;
  tuitionAvgAnnual: number;
  tuitionNotes: string;
  livingCostTiers: LivingCostTiers;
  proofOfFundsAmount: number;
  proofOfFundsStyle: string;
  proofOfFundsNotes: string;
  visaPredictability: string;
  visaType: string;
  embassyLocation: string;
  embassyBacklog: string;
  partTimeWageHourly: number;
  skilledWageHourly: number;
  workHoursCap: number;
  partTimeSustain: string;
  languageBarrier: string;
  stayBackMonths: number;
  prDifficulty: string;
  entrySalaryAnnual: number;
  purchasingPowerNote: string;
  pros: string[];
  cons: string[];
  groundReality: GroundReality;
  legalizationSteps: string[];
  prPathwaySteps: PrPathwayStep[];
  journeyTemplates: JourneyTemplateItem[];
  isFeatured: boolean;
  universities?: UniversityDTO[];
  scholarships?: ScholarshipDTO[];
}

export interface StudentProfile {
  degreeTarget: DegreeLevel;
  cgpa: string;
  major: string;
  workExperienceYears: number;
  budgetBdt: number;
  ieltsScore: string;
  preferredLifestyle: LifestyleTierKey;
  targetIntake: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
}

export interface JourneyTaskDTO {
  id: string;
  journeyId?: string;
  phase: string;
  title: string;
  description: string;
  isCompleted: boolean;
  priority: "High" | "Medium" | "Low";
  dueDate: string | null;
  subtasks: SubtaskItem[];
  sortOrder: number;
  isCustom: boolean;
}

export interface UserJourneyDTO {
  id: string;
  countryId: string;
  countrySlug: string;
  countryName: string;
  countryFlag: string;
  targetIntake: string;
  degreeLevel: string;
  tasks: JourneyTaskDTO[];
  updatedAt?: string;
}

export interface FinancialItemDTO {
  id: string;
  category: "UPFRONT" | "POF_SOURCE";
  label: string;
  amount: number;
  currencyCode: string;
  isPaid: boolean;
  notes: string;
}

export interface FinancialPlanDTO {
  id: string;
  name: string;
  targetCountrySlug: string;
  totalBudgetBdt: number;
  pofTargetBdt: number;
  seasoningStart: string | null;
  seasoningDaysReq: number;
  items: FinancialItemDTO[];
}

export interface ActionableCard {
  type: "country" | "university";
  slug: string;
  countrySlug?: string;
  title: string;
  subtitle: string;
  highlight: string;
  currencyCode: string;
  amountLocal: number;
  visaBadge?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: ActionableCard[];
  mode?: string;
  timestamp: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: string;
  studentProfile: StudentProfile;
}

export interface GuestWorkspaceState {
  shortlistCountries: string[]; // slugs
  shortlistUniversities: string[]; // slugs
  compareCountries: string[]; // up to 4 slugs
  compareUniversities: string[]; // up to 4 slugs
  researchNotes: Record<string, string>; // countrySlug -> markdown
  journeys: UserJourneyDTO[];
  financialPlan: FinancialPlanDTO;
  studentProfile: StudentProfile;
  chatMessages: ChatMessage[];
}
