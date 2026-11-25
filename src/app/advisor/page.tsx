import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { Card } from "@/components/ui/primitives";

export default function AdvisorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          AI Study Abroad Advisor
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile-aware, database-grounded strategy with dual-currency (Local + BDT) calculations and actionable cards.
        </p>
      </div>

      <Card className="p-4 sm:p-5 h-[calc(100vh-190px)] min-h-[600px]">
        <AdvisorChat />
      </Card>
    </div>
  );
}
