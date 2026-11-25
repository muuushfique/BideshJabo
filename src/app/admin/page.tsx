import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const [countries, universities, programs, scholarships, users, journeys, exchangeRates] =
    await Promise.all([
      prisma.country.count(),
      prisma.university.count(),
      prisma.program.count(),
      prisma.scholarship.count(),
      prisma.user.count(),
      prisma.userJourney.count(),
      prisma.exchangeRate.count(),
    ]);

  return (
    <AdminDashboardClient
      initialStats={{
        countries,
        universities,
        programs,
        scholarships,
        users,
        journeys,
        exchangeRates,
      }}
    />
  );
}
