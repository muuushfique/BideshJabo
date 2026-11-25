"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, UserCheck } from "lucide-react";
import { formatBdt } from "@/lib/currency";
import type { DegreeLevel, LifestyleTierKey, StudentProfile } from "@/lib/types";
import { useWorkspace } from "../providers/WorkspaceProvider";

export function StudentProfileCard({ compact = false }: { compact?: boolean }) {
  const { studentProfile, saveStudentProfile } = useWorkspace();
  const [expanded, setExpanded] = useState(!compact);
  const [draft, setDraft] = useState<StudentProfile>(studentProfile);

  const updateField = <K extends keyof StudentProfile>(
    key: K,
    value: StudentProfile[K]
  ) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    saveStudentProfile(next);
  };

  return (
    <div className="rounded-xl border border-border bg-card/80 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              Student Profile Context
              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                <Sparkles className="h-2.5 w-2.5" /> Active in AI
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {draft.degreeTarget} • {draft.major} • CGPA {draft.cgpa} • Budget{" "}
              {formatBdt(draft.budgetBdt)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-border pt-3 sm:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Target Degree</span>
            <select
              value={draft.degreeTarget}
              onChange={(e) => updateField("degreeTarget", e.target.value as DegreeLevel)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
            >
              <option value="Bachelor's">Bachelor&apos;s</option>
              <option value="Master's">Master&apos;s</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Major / Field</span>
            <input
              value={draft.major}
              onChange={(e) => updateField("major", e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              placeholder="e.g. Computer Science"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">CGPA / GPA</span>
            <input
              value={draft.cgpa}
              onChange={(e) => updateField("cgpa", e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono"
              placeholder="3.50 / 4.00"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">IELTS Score</span>
            <input
              value={draft.ieltsScore}
              onChange={(e) => updateField("ieltsScore", e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono"
              placeholder="7.0"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Budget (BDT)</span>
            <input
              type="number"
              step={50000}
              value={draft.budgetBdt}
              onChange={(e) => updateField("budgetBdt", Number(e.target.value) || 0)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Work Exp (Yrs)</span>
            <input
              type="number"
              min={0}
              max={20}
              value={draft.workExperienceYears}
              onChange={(e) =>
                updateField("workExperienceYears", Number(e.target.value) || 0)
              }
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Lifestyle Tier</span>
            <select
              value={draft.preferredLifestyle}
              onChange={(e) =>
                updateField("preferredLifestyle", e.target.value as LifestyleTierKey)
              }
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
            >
              <option value="frugal">Frugal / Dorm</option>
              <option value="balanced">Balanced / Shared</option>
              <option value="comfortable">Comfortable / Studio</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Target Intake</span>
            <input
              value={draft.targetIntake}
              onChange={(e) => updateField("targetIntake", e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
              placeholder="Fall 2027"
            />
          </label>
        </div>
      )}
    </div>
  );
}
