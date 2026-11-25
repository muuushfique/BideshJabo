"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import type { JourneyTaskDTO } from "@/lib/types";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { Badge, Button, Card, ProgressRing } from "../ui/primitives";

const PHASES = [
  "Phase 1: Profile & Language Tests",
  "Phase 2: Document Legalization",
  "Phase 3: University & Scholarship Applications",
  "Phase 4: Financial & Visa Prep",
  "Phase 5: Pre-Departure",
];

export function JourneyClient() {
  const searchParams = useSearchParams();
  const countryParam = searchParams.get("country");

  const { countries } = useCurrency();
  const {
    journeys,
    startJourney,
    updateJourney,
    deleteJourney,
    studentProfile,
  } = useWorkspace();

  const [activeCountrySlug, setActiveCountrySlug] = useState<string>(
    countryParam || journeys[0]?.countrySlug || ""
  );
  const [newCountrySlug, setNewCountrySlug] = useState(countries[0]?.slug || "poland");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done" | "high">(
    "all"
  );
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PHASES.map((p) => [p, true]))
  );
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [customTitleByPhase, setCustomTitleByPhase] = useState<Record<string, string>>({});
  const [subtaskDraftByTask, setSubtaskDraftByTask] = useState<Record<string, string>>({});

  useEffect(() => {
    if (countryParam) {
      setActiveCountrySlug(countryParam);
    } else if (!activeCountrySlug && journeys[0]) {
      setActiveCountrySlug(journeys[0].countrySlug);
    }
  }, [countryParam, journeys, activeCountrySlug]);

  const activeJourney = useMemo(
    () =>
      journeys.find((j) => j.countrySlug === activeCountrySlug) || journeys[0] || null,
    [journeys, activeCountrySlug]
  );

  const overallPercent = useMemo(() => {
    if (!activeJourney || activeJourney.tasks.length === 0) return 0;
    const done = activeJourney.tasks.filter((t) => t.isCompleted).length;
    return (done / activeJourney.tasks.length) * 100;
  }, [activeJourney]);

  const toggleTaskComplete = (taskId: string) => {
    if (!activeJourney) return;
    const tasks = activeJourney.tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updateJourney({ ...activeJourney, tasks });
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    if (!activeJourney) return;
    const tasks = activeJourney.tasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
      };
    });
    updateJourney({ ...activeJourney, tasks });
  };

  const addSubtask = (taskId: string) => {
    if (!activeJourney) return;
    const title = (subtaskDraftByTask[taskId] || "").trim();
    if (!title) return;
    const tasks = activeJourney.tasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...t.subtasks, { id: `sub-${Date.now()}`, title, done: false }],
      };
    });
    updateJourney({ ...activeJourney, tasks });
    setSubtaskDraftByTask((prev) => ({ ...prev, [taskId]: "" }));
  };

  const updateTaskDueDate = (taskId: string, dueDate: string) => {
    if (!activeJourney) return;
    const tasks = activeJourney.tasks.map((t) =>
      t.id === taskId ? { ...t, dueDate: dueDate || null } : t
    );
    updateJourney({ ...activeJourney, tasks });
  };

  const updateTaskPriority = (taskId: string, priority: "High" | "Medium" | "Low") => {
    if (!activeJourney) return;
    const tasks = activeJourney.tasks.map((t) =>
      t.id === taskId ? { ...t, priority } : t
    );
    updateJourney({ ...activeJourney, tasks });
  };

  const addCustomTask = (phase: string) => {
    if (!activeJourney) return;
    const title = (customTitleByPhase[phase] || "").trim();
    if (!title) return;

    const newTask: JourneyTaskDTO = {
      id: `custom-${Date.now()}`,
      phase,
      title,
      description: "Custom user milestone",
      isCompleted: false,
      priority: "Medium",
      dueDate: null,
      subtasks: [],
      sortOrder: activeJourney.tasks.length,
      isCustom: true,
    };

    updateJourney({
      ...activeJourney,
      tasks: [...activeJourney.tasks, newTask],
    });
    setCustomTitleByPhase((prev) => ({ ...prev, [phase]: "" }));
  };

  const deleteTask = (taskId: string) => {
    if (!activeJourney) return;
    updateJourney({
      ...activeJourney,
      tasks: activeJourney.tasks.filter((t) => t.id !== taskId),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Country Application Roadmaps
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage multiple country roadmaps side-by-side with phase milestones, subtasks, and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={newCountrySlug}
            onChange={(e) => setNewCountrySlug(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs"
          >
            {countries.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.flagEmoji} {c.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={async () => {
              const j = await startJourney(
                newCountrySlug,
                studentProfile.targetIntake,
                studentProfile.degreeTarget
              );
              if (j) setActiveCountrySlug(j.countrySlug);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Start Journey
          </Button>
        </div>
      </div>

      {/* Multi-Journey Switcher */}
      {journeys.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {journeys.map((j) => {
            const done = j.tasks.filter((t) => t.isCompleted).length;
            const pct = j.tasks.length ? Math.round((done / j.tasks.length) * 100) : 0;
            const active = activeJourney?.id === j.id;
            return (
              <button
                key={j.id}
                onClick={() => setActiveCountrySlug(j.countrySlug)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-indigo-500/50 bg-indigo-500/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{j.countryFlag}</span>
                <span>{j.countryName}</span>
                <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!activeJourney ? (
        <Card className="p-10 text-center space-y-4">
          <ListChecks className="mx-auto h-10 w-10 text-indigo-400" />
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold">
              Initialize Your First Country Roadmap
            </h2>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Select any country above and click Start Journey to generate a tailored 5-phase checklist covering IELTS, MoFA/Apostille, University Portals, Proof-of-Funds, and Pre-Departure.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {countries.slice(0, 4).map((c) => (
              <Button
                key={c.id}
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const j = await startJourney(
                    c.slug,
                    studentProfile.targetIntake,
                    studentProfile.degreeTarget
                  );
                  if (j) setActiveCountrySlug(j.countrySlug);
                }}
              >
                {c.flagEmoji} Start {c.name}
              </Button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Active Journey Summary Header */}
          <Card className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <ProgressRing percentage={overallPercent} size={72} label="Done" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeJourney.countryFlag}</span>
                  <h2 className="font-display text-xl font-bold">
                    {activeJourney.countryName} Application Roadmap
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeJourney.tasks.filter((t) => t.isCompleted).length} of{" "}
                  {activeJourney.tasks.length} tasks completed
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={activeJourney.targetIntake}
                    onChange={(e) =>
                      updateJourney({ ...activeJourney, targetIntake: e.target.value })
                    }
                    className="h-7 w-28 rounded-lg border border-border bg-background px-2 text-xs"
                  />
                  <select
                    value={activeJourney.degreeLevel}
                    onChange={(e) =>
                      updateJourney({ ...activeJourney, degreeLevel: e.target.value })
                    }
                    className="h-7 rounded-lg border border-border bg-background px-2 text-xs"
                  >
                    <option value="Bachelor's">Bachelor&apos;s</option>
                    <option value="Master's">Master&apos;s</option>
                    <option value="PhD">PhD</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
              >
                <option value="all">Show: All Tasks</option>
                <option value="pending">Pending Only</option>
                <option value="done">Completed Only</option>
                <option value="high">High Priority</option>
              </select>

              <Link href={`/countries/${activeJourney.countrySlug}`}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3.5 w-3.5" /> Dossier
                </Button>
              </Link>

              <Button
                size="sm"
                variant="ghost"
                className="text-rose-400 hover:text-rose-300"
                onClick={() => deleteJourney(activeJourney.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>

          {/* 5-Phase Accordions */}
          <div className="space-y-4">
            {PHASES.map((phase) => {
              const phaseTasksAll = activeJourney.tasks.filter(
                (t) => t.phase === phase
              );
              const phaseTasks = phaseTasksAll.filter((t) => {
                if (statusFilter === "pending") return !t.isCompleted;
                if (statusFilter === "done") return t.isCompleted;
                if (statusFilter === "high") return t.priority === "High";
                return true;
              });
              const doneCount = phaseTasksAll.filter((t) => t.isCompleted).length;
              const isOpen = openPhases[phase] ?? true;

              return (
                <Card key={phase} className="overflow-hidden">
                  <button
                    onClick={() =>
                      setOpenPhases((prev) => ({ ...prev, [phase]: !isOpen }))
                    }
                    className="flex w-full items-center justify-between bg-secondary/30 px-5 py-3.5 text-left transition hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-display text-sm font-bold">{phase}</span>
                    </div>
                    <Badge variant={doneCount === phaseTasksAll.length && phaseTasksAll.length > 0 ? "success" : "outline"}>
                      {doneCount}/{phaseTasksAll.length} Done
                    </Badge>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="divide-y divide-border/70 px-5"
                      >
                        {phaseTasks.map((task) => {
                          const subOpen = expandedTaskIds[task.id] ?? false;
                          return (
                            <div key={task.id} className="py-3.5 space-y-2.5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => toggleTaskComplete(task.id)}
                                    className="mt-0.5 text-indigo-400"
                                  >
                                    {task.isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </button>
                                  <div className="space-y-1">
                                    <div
                                      onClick={() =>
                                        setExpandedTaskIds((prev) => ({
                                          ...prev,
                                          [task.id]: !subOpen,
                                        }))
                                      }
                                      className={`cursor-pointer text-sm font-semibold ${
                                        task.isCompleted
                                          ? "line-through text-muted-foreground"
                                          : ""
                                      }`}
                                    >
                                      {task.title}
                                    </div>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {task.description}
                                      </p>
                                    )}
                                    {task.subtasks.length > 0 && (
                                      <button
                                        onClick={() =>
                                          setExpandedTaskIds((prev) => ({
                                            ...prev,
                                            [task.id]: !subOpen,
                                          }))
                                        }
                                        className="text-[11px] font-medium text-indigo-400 hover:underline"
                                      >
                                        {subOpen ? "Hide" : "Show"} Sub-tasks (
                                        {task.subtasks.filter((s) => s.done).length}/
                                        {task.subtasks.length})
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
                                  <select
                                    value={task.priority}
                                    onChange={(e) =>
                                      updateTaskPriority(
                                        task.id,
                                        e.target.value as "High" | "Medium" | "Low"
                                      )
                                    }
                                    className="h-7 rounded-lg border border-border bg-background px-2 text-[11px]"
                                  >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                  </select>

                                  <input
                                    type="date"
                                    value={task.dueDate || ""}
                                    onChange={(e) =>
                                      updateTaskDueDate(task.id, e.target.value)
                                    }
                                    className="h-7 rounded-lg border border-border bg-background px-2 font-mono text-[11px]"
                                  />

                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="rounded p-1 text-muted-foreground hover:text-rose-400"
                                    title="Delete task"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {subOpen && (
                                <div className="ml-8 space-y-1.5 rounded-xl border border-border/70 bg-background/60 p-3">
                                  {task.subtasks.map((sub) => (
                                    <label
                                      key={sub.id}
                                      className="flex cursor-pointer items-center gap-2 text-xs"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={sub.done}
                                        onChange={() => toggleSubtask(task.id, sub.id)}
                                        className="rounded accent-emerald-500"
                                      />
                                      <span
                                        className={
                                          sub.done ? "line-through text-muted-foreground" : ""
                                        }
                                      >
                                        {sub.title}
                                      </span>
                                    </label>
                                  ))}
                                  <div className="flex gap-2 pt-1.5">
                                    <input
                                      value={subtaskDraftByTask[task.id] || ""}
                                      onChange={(e) =>
                                        setSubtaskDraftByTask((prev) => ({
                                          ...prev,
                                          [task.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Add a sub-task..."
                                      className="h-7 flex-1 rounded-lg border border-border bg-background px-2.5 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() => addSubtask(task.id)}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Custom Task per Phase */}
                        <div className="flex items-center gap-2 py-3">
                          <input
                            value={customTitleByPhase[phase] || ""}
                            onChange={(e) =>
                              setCustomTitleByPhase((prev) => ({
                                ...prev,
                                [phase]: e.target.value,
                              }))
                            }
                            placeholder={`Add custom task to ${phase.split(":")[0]}...`}
                            className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addCustomTask(phase)}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Task
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
