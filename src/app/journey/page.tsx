import { Suspense } from "react";
import { JourneyClient } from "@/components/journey/JourneyClient";

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading Roadmaps...</div>}>
      <JourneyClient />
    </Suspense>
  );
}
