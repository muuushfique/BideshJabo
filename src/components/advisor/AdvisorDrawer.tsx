"use client";

import React from "react";
import { Bot } from "lucide-react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { SlideOverDrawer } from "../ui/SlideOverDrawer";
import { AdvisorChat } from "./AdvisorChat";

export function AdvisorDrawer() {
  const { advisorOpen, setAdvisorOpen } = useWorkspace();

  return (
    <SlideOverDrawer
      open={advisorOpen}
      onClose={() => setAdvisorOpen(false)}
      widthClass="max-w-2xl"
      title={
        <span className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-400" />
          BideshJabo AI Advisor
        </span>
      }
      subtitle="Context-aware guidance synced with your student profile & live BDT rates"
    >
      <div className="h-[calc(100vh-120px)]">
        <AdvisorChat compact onNavigate={() => setAdvisorOpen(false)} />
      </div>
    </SlideOverDrawer>
  );
}
