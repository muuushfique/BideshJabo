# BideshJabo — Study Abroad Research, AI Advisory & Financial Planning OS

BideshJabo is an all-in-one operating system for international students (with first-class universal BDT currency equivalents for Bangladeshi students) covering **Bachelor's, Master's, PhD, and Diploma** pathways across Europe, East Asia, and North America.

## Key Modules

1. **Universal Dual-Currency Engine**: Every monetary amount displays both local currency and live BDT equivalent (`≈ 13.0L BDT` compact or exact `1,300,000 BDT` toggle), powered by a centralized database Exchange Rate Manager.
2. **Smart Multi-Criteria Discovery (`/explore`)**: Filter by degree level, field of study, BDT budget sliders (tuition, proof-of-funds, monthly living), lifestyle tier (*Frugal / Balanced / Comfortable*), visa predictability, proof-of-funds style, part-time sustainability, language barrier, stay-back duration, and PR difficulty.
3. **Side-by-Side Comparison Matrix (`/compare`)**: Compare up to 4 countries or universities with CSV & Print/PDF export.
4. **Deep Nested Country Dossiers (`/countries/[slug]`)**: 7 nested tabs covering Overview & Expat Ground Reality Checks, Universities & Programs (with slide-over detail drawer), Tuition & Scholarships with realistic odds, Visa & Document Legalization stepper, Living Costs & Odd vs. Skilled Jobs, Post-Grad Salary & PR Timeline, and Personal Markdown Research Notes.
5. **Financial Management System (`/finances`)**: Upfront pre-departure cash outflow calculator, Proof-of-Funds & Bank Statement Seasoning Countdown tracker, and interactive Recharts Monthly Survival & 12-Month Runway Simulator.
6. **Actionable Country Journey Roadmaps (`/journey`)**: Initialize 5-phase country checklists with subtasks, priorities, due dates, custom tasks, and multi-country progress tracking.
7. **Profile-Aware AI Study Abroad Advisor (`/advisor` + Floating Drawer)**: Streaming SSE assistant (`@google/genai` / OpenAI / DB-grounded fallback) with editable Student Profile Context and interactive Actionable Cards.
8. **Guest Mode + Optional Account Sync + Protected Admin Console (`/admin`)**: Instant guest exploration in `localStorage` with automatic merge into Prisma on Sign Up / Sign In, plus full CRUD & Exchange Rate Manager in `/admin`.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **UI & Animations**: Tailwind CSS, Radix UI primitives, Lucide Icons, Framer Motion, Recharts, `cmdk` (`Cmd+K` / `Ctrl+K`)
- **Database**: Prisma ORM (`6.6.0`) with SQLite locally (`prisma/dev.db`) — swap `provider = "postgresql"` in `prisma/schema.prisma` and update `DATABASE_URL` to deploy on PostgreSQL
- **Auth**: Edge-compatible JWT cookies (`jose`) + `bcryptjs`

## Local Setup

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables (`.env`)

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"
ADMIN_EMAIL="admin@bideshjabo.com"
ADMIN_PASSWORD="BideshJaboAdmin2026!"
# Optional: enable live LLM streaming (falls back to grounded DB intelligence if empty)
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

### Default Dev Admin Credentials
- **Login URL**: `/admin/login`
- **Email**: `admin@bideshjabo.com`
- **Password**: `BideshJaboAdmin2026!`
