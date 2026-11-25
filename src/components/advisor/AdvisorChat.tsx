"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Bot,
  CheckCircle2,
  Compass,
  ExternalLink,
  ListChecks,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import type { ActionableCard, ChatMessage } from "@/lib/types";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { DualCurrency } from "../ui/DualCurrency";
import { Badge, Button } from "../ui/primitives";
import { StudentProfileCard } from "./StudentProfileCard";

const STARTER_PROMPTS = [
  "Which countries fit my current BDT budget and CS profile best?",
  "Compare Germany Blocked Account vs South Korea Lab Funding vs Poland.",
  "Where can I realistically cover living costs with part-time odd jobs?",
  "Break down visa predictability & embassy backlogs from Dhaka.",
];

function renderMarkdownLines(text: string) {
  return text.split("\n").map((line, i) => {
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="rounded bg-secondary px-1 py-0.5 font-mono text-[11px] text-emerald-400">$1</code>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    if (line.startsWith("#### ")) {
      return (
        <h4
          key={i}
          className="mt-3 mb-1 font-display text-sm font-semibold text-foreground"
          dangerouslySetInnerHTML={{ __html: formatted.slice(5) }}
        />
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3
          key={i}
          className="mt-3 mb-1.5 font-display text-base font-semibold text-indigo-400"
          dangerouslySetInnerHTML={{ __html: formatted.slice(4) }}
        />
      );
    }
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="ml-2 flex items-start gap-2 py-0.5 text-sm leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
        </div>
      );
    }
    if (line.trim() === "---") {
      return <hr key={i} className="my-3 border-border" />;
    }
    if (!line.trim()) {
      return <div key={i} className="h-2" />;
    }
    return (
      <p
        key={i}
        className="text-sm leading-relaxed text-foreground/90"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

function ActionCardItem({
  card,
  onNavigate,
}: {
  card: ActionableCard;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const {
    shortlistCountries,
    shortlistUniversities,
    toggleShortlistCountry,
    toggleShortlistUniversity,
    startJourney,
    journeys,
    studentProfile,
  } = useWorkspace();

  const targetCountrySlug = card.type === "country" ? card.slug : card.countrySlug || "";
  const isSaved =
    card.type === "country"
      ? shortlistCountries.includes(card.slug)
      : shortlistUniversities.includes(card.slug);
  const hasJourney = journeys.some((j) => j.countrySlug === targetCountrySlug);

  return (
    <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-border bg-background/80 p-3 transition hover:border-indigo-500/40">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="font-display text-xs font-semibold text-foreground">
            {card.title}
          </div>
          {card.visaBadge && (
            <Badge
              variant={
                card.visaBadge === "High"
                  ? "success"
                  : card.visaBadge === "Risky"
                  ? "danger"
                  : "warning"
              }
            >
              {card.visaBadge} Visa
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{card.subtitle}</p>
        <div className="mt-2">
          <DualCurrency
            amount={card.amountLocal}
            currencyCode={card.currencyCode}
            suffix="/yr"
            layout="inline"
            size="sm"
            zeroLabel="€0 / Funded"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-2 text-[11px]"
          onClick={() => {
            onNavigate?.();
            router.push(`/countries/${targetCountrySlug}`);
          }}
        >
          <ExternalLink className="h-3 w-3" />
          View Dossier
        </Button>

        <Button
          size="sm"
          variant={isSaved ? "primary" : "outline"}
          className="h-7 px-2 text-[11px]"
          onClick={() =>
            card.type === "country"
              ? toggleShortlistCountry(card.slug)
              : toggleShortlistUniversity(card.slug)
          }
        >
          <Bookmark className="h-3 w-3" />
          {isSaved ? "Saved" : "Save"}
        </Button>

        {targetCountrySlug && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={async () => {
              await startJourney(
                targetCountrySlug,
                studentProfile.targetIntake,
                studentProfile.degreeTarget
              );
              onNavigate?.();
              router.push(`/journey?country=${targetCountrySlug}`);
            }}
          >
            {hasJourney ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            ) : (
              <ListChecks className="h-3 w-3" />
            )}
            {hasJourney ? "Open Journey" : "Start Journey"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdvisorChat({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { chatMessages, saveChatMessages, studentProfile } = useWorkspace();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [liveMode, setLiveMode] = useState<string>("local-intelligence");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, liveText]);

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || streaming) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...chatMessages, userMsg];
    saveChatMessages(nextHistory);
    setStreaming(true);
    setLiveText("");

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          profile: studentProfile,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Advisor request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let accumulatedText = "";
      let receivedCards: ActionableCard[] = [];
      let mode = "local-intelligence";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() || "";

        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === "meta") {
              mode = parsed.mode;
              setLiveMode(parsed.mode);
            } else if (parsed.type === "text") {
              accumulatedText += parsed.content;
              setLiveText(accumulatedText);
            } else if (parsed.type === "cards") {
              receivedCards = parsed.cards || [];
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: accumulatedText || "I could not generate a response. Please try again.",
        cards: receivedCards,
        mode,
        timestamp: new Date().toISOString(),
      };
      saveChatMessages([...nextHistory, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something interrupted the advisor stream. Please try again.",
        timestamp: new Date().toISOString(),
      };
      saveChatMessages([...nextHistory, errMsg]);
    } finally {
      setStreaming(false);
      setLiveText("");
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <StudentProfileCard />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Compass className="h-3.5 w-3.5 text-indigo-400" />
          <span>DB-Grounded Advisor • Dual-Currency (Local + BDT)</span>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={() => saveChatMessages([])}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset Chat
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-background/50 p-4">
        {chatMessages.length === 0 && !streaming && (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display text-base font-semibold">
              Ask BideshJabo AI Anything
            </h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Every recommendation automatically considers your CGPA, budget in BDT, degree target, and live country data (embassy backlogs, housing crises, scholarships).
            </p>
            <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="rounded-xl border border-border bg-card/80 p-3 text-left text-xs text-foreground/90 transition hover:border-indigo-500/40 hover:bg-secondary/60"
                >
                  <Sparkles className="mb-1 h-3.5 w-3.5 text-indigo-400" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-2 ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card/95 text-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <div className="space-y-1">
                  {msg.mode && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      {msg.mode === "local-intelligence"
                        ? "Grounded DB Intelligence"
                        : `${msg.mode} AI`}
                    </div>
                  )}
                  {renderMarkdownLines(msg.content)}
                </div>
              )}
            </div>

            {msg.cards && msg.cards.length > 0 && (
              <div className="grid w-full gap-2.5 sm:grid-cols-2">
                {msg.cards.map((c, idx) => (
                  <ActionCardItem
                    key={`${c.slug}-${idx}`}
                    card={c}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex flex-col items-start gap-2">
            <div className="max-w-[92%] rounded-2xl border border-indigo-500/30 bg-card/95 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-indigo-400">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Streaming ({liveMode})...
              </div>
              {liveText ? (
                renderMarkdownLines(liveText)
              ) : (
                <span className="text-xs text-muted-foreground">
                  Analyzing countries, exchange rates & visa rules...
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about countries, visas, bank solvency, scholarships, or PR..."
          className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <Button type="submit" size="lg" disabled={streaming || !input.trim()}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </div>
  );
}
