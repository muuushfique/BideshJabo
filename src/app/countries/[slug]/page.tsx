import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CountryDossierClient } from "@/components/country/CountryDossierClient";
import { prisma } from "@/lib/prisma";
import { serializeCountry } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const country = await prisma.country.findUnique({
    where: { slug },
    include: {
      universities: {
        include: { programs: true },
        orderBy: { qsRank: "asc" },
      },
      scholarships: true,
    },
  });

  if (!country) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading Dossier...</div>}>
      <CountryDossierClient country={serializeCountry(country)} />
    </Suspense>
  );
}
