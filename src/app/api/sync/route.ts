import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GuestWorkspaceState } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guest = (await req.json()) as Partial<GuestWorkspaceState>;
    const userId = session.sub;

    const [countries, universities] = await Promise.all([
      prisma.country.findMany({ select: { id: true, slug: true } }),
      prisma.university.findMany({ select: { id: true, slug: true } }),
    ]);
    const countryIdBySlug = new Map(countries.map((c) => [c.slug, c.id]));
    const uniIdBySlug = new Map(universities.map((u) => [u.slug, u.id]));

    if (guest.studentProfile) {
      await prisma.user.update({
        where: { id: userId },
        data: { studentProfile: JSON.stringify(guest.studentProfile) },
      });
    }

    if (Array.isArray(guest.shortlistCountries)) {
      for (const slug of guest.shortlistCountries) {
        const cid = countryIdBySlug.get(slug);
        if (!cid) continue;
        await prisma.savedItem.upsert({
          where: { userId_itemType_itemId: { userId, itemType: "COUNTRY", itemId: cid } },
          update: {},
          create: { userId, itemType: "COUNTRY", itemId: cid },
        });
      }
    }

    if (Array.isArray(guest.shortlistUniversities)) {
      for (const slug of guest.shortlistUniversities) {
        const uid = uniIdBySlug.get(slug);
        if (!uid) continue;
        await prisma.savedItem.upsert({
          where: { userId_itemType_itemId: { userId, itemType: "UNIVERSITY", itemId: uid } },
          update: {},
          create: { userId, itemType: "UNIVERSITY", itemId: uid },
        });
      }
    }

    if (guest.researchNotes) {
      for (const [slug, content] of Object.entries(guest.researchNotes)) {
        const cid = countryIdBySlug.get(slug);
        if (!cid || !content.trim()) continue;
        const existing = await prisma.researchNote.findUnique({
          where: { userId_countryId: { userId, countryId: cid } },
        });
        if (!existing || !existing.content.trim()) {
          await prisma.researchNote.upsert({
            where: { userId_countryId: { userId, countryId: cid } },
            update: { content },
            create: { userId, countryId: cid, content },
          });
        }
      }
    }

    if (Array.isArray(guest.journeys)) {
      for (const j of guest.journeys) {
        const cid = countryIdBySlug.get(j.countrySlug);
        if (!cid) continue;
        const existing = await prisma.userJourney.findUnique({
          where: { userId_countryId: { userId, countryId: cid } },
        });
        if (!existing) {
          await prisma.userJourney.create({
            data: {
              userId,
              countryId: cid,
              targetIntake: j.targetIntake || "Fall 2027",
              degreeLevel: j.degreeLevel || "Master's",
              tasks: {
                create: j.tasks.map((t, idx) => ({
                  phase: t.phase,
                  title: t.title,
                  description: t.description || "",
                  isCompleted: Boolean(t.isCompleted),
                  priority: t.priority || "Medium",
                  dueDate: t.dueDate || null,
                  subtasks: JSON.stringify(t.subtasks || []),
                  sortOrder: t.sortOrder ?? idx,
                  isCustom: Boolean(t.isCustom),
                })),
              },
            },
          });
        }
      }
    }

    if (guest.financialPlan && guest.financialPlan.items?.length) {
      const existingPlan = await prisma.financialPlan.findFirst({ where: { userId } });
      if (!existingPlan) {
        await prisma.financialPlan.create({
          data: {
            userId,
            name: guest.financialPlan.name || "Primary Study Abroad Plan",
            targetCountrySlug: guest.financialPlan.targetCountrySlug || "poland",
            totalBudgetBdt: guest.financialPlan.totalBudgetBdt || 2500000,
            pofTargetBdt: guest.financialPlan.pofTargetBdt || 1400000,
            seasoningStart: guest.financialPlan.seasoningStart || null,
            seasoningDaysReq: guest.financialPlan.seasoningDaysReq || 90,
            items: {
              create: guest.financialPlan.items.map((item) => ({
                category: item.category,
                label: item.label,
                amount: item.amount,
                currencyCode: item.currencyCode,
                isPaid: item.isPaid,
                notes: item.notes || "",
              })),
            },
          },
        });
      }
    }

    if (Array.isArray(guest.chatMessages) && guest.chatMessages.length > 0) {
      const existingChat = await prisma.chatSession.findFirst({ where: { userId } });
      if (!existingChat) {
        await prisma.chatSession.create({
          data: {
            userId,
            title: "Study Abroad Advisor",
            messages: JSON.stringify(guest.chatMessages),
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
