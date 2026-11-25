"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Bot,
  Calculator,
  Compass,
  GitCompare,
  GraduationCap,
  Home,
  ListChecks,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCurrency } from "../providers/CurrencyProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";

export function CommandPalette() {
  const router = useRouter();
  const { countries } = useCurrency();
  const { commandOpen, setCommandOpen, setAdvisorOpen, journeys } = useWorkspace();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === "Escape" && commandOpen) {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, setCommandOpen]);

  if (!commandOpen) return null;

  const go = (path: string) => {
    setCommandOpen(false);
    setSearch("");
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={() => setCommandOpen(false)}
      />
      <Command className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-2.5 h-4 w-4 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            autoFocus
            placeholder="Jump to country, university, calculator, AI advisor, or roadmap..."
            className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[380px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
            No matching countries, universities, or tools found.
          </Command.Empty>

          <Command.Group heading="Workspace Tools" className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <Command.Item
              onSelect={() => go("/")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <Home className="h-4 w-4 text-indigo-400" /> Command Center (Home)
            </Command.Item>
            <Command.Item
              onSelect={() => go("/explore")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <Compass className="h-4 w-4 text-indigo-400" /> Smart Discovery Engine (/explore)
            </Command.Item>
            <Command.Item
              onSelect={() => go("/compare")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <GitCompare className="h-4 w-4 text-indigo-400" /> Side-by-Side Comparison Matrix (/compare)
            </Command.Item>
            <Command.Item
              onSelect={() => go("/finances")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <Calculator className="h-4 w-4 text-emerald-400" /> Financial Planner & Simulator (/finances)
            </Command.Item>
            <Command.Item
              onSelect={() => go("/journey")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <ListChecks className="h-4 w-4 text-emerald-400" /> Application Roadmaps (/journey)
            </Command.Item>
            <Command.Item
              onSelect={() => go("/advisor")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <Bot className="h-4 w-4 text-indigo-400" /> Full-Screen AI Advisor (/advisor)
            </Command.Item>
            <Command.Item
              onSelect={() => {
                setCommandOpen(false);
                setAdvisorOpen(true);
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <Bot className="h-4 w-4 text-amber-400" /> Open Floating AI Advisor Drawer
            </Command.Item>
            <Command.Item
              onSelect={() => go("/admin")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
            >
              <ShieldCheck className="h-4 w-4 text-rose-400" /> Admin Panel (/admin)
            </Command.Item>
          </Command.Group>

          {journeys.length > 0 && (
            <Command.Group heading="Active Roadmaps" className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
              {journeys.map((j) => (
                <Command.Item
                  key={j.id}
                  onSelect={() => go(`/journey?country=${j.countrySlug}`)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
                >
                  <span>{j.countryFlag}</span>
                  <span>{j.countryName} Journey ({j.targetIntake})</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Country Dossiers" className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {countries.map((c) => (
              <Command.Item
                key={c.id}
                value={`${c.name} ${c.region} ${c.currencyCode} ${c.tagline}`}
                onSelect={() => go(`/countries/${c.slug}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <span>{c.flagEmoji}</span>
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.region}</span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {c.visaPredictability} Visa
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Universities" className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {countries.flatMap((c) =>
              (c.universities || []).map((u) => (
                <Command.Item
                  key={u.id}
                  value={`${u.name} ${u.city} ${c.name}`}
                  onSelect={() => go(`/countries/${c.slug}?tab=universities&uni=${u.slug}`)}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-secondary"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="truncate">{u.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {u.city}, {c.flagEmoji}
                  </span>
                </Command.Item>
              ))
            )}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
