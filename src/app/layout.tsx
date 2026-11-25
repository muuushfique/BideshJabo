import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { prisma } from "@/lib/prisma";
import { serializeCountry } from "@/lib/serializers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "BideshJabo — Study Abroad Research, AI Advisory & Financial OS",
  description:
    "All-in-one study abroad operating system with dual-currency BDT equivalents, deep country dossiers, financial solvency planning, application roadmaps, and AI advisory.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [ratesRaw, countriesRaw] = await Promise.all([
    prisma.exchangeRate.findMany({ orderBy: { code: "asc" } }),
    prisma.country.findMany({
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      include: {
        universities: { include: { programs: true }, orderBy: { qsRank: "asc" } },
        scholarships: true,
      },
    }),
  ]);

  const initialRates = ratesRaw.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    symbol: r.symbol,
    rateToBdt: r.rateToBdt,
    updatedAt: r.updatedAt.toISOString(),
  }));

  const initialCountries = countriesRaw.map(serializeCountry);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <CurrencyProvider
            initialRates={initialRates}
            initialCountries={initialCountries}
          >
            <WorkspaceProvider>
              <AppShell>{children}</AppShell>
            </WorkspaceProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
