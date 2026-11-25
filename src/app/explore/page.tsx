import { Suspense } from "react";
import { ExploreClient } from "@/components/explore/ExploreClient";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading Explorer...</div>}>
      <ExploreClient />
    </Suspense>
  );
}
