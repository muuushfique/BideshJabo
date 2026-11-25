import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FinancialPlanDTO } from "@/lib/types";

export async function PUT(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userId = session.sub;

    if (body.action === "toggleShortlist") {
      const { itemType, slug } = body as { itemType: "COUNTRY" | "UNIVERSITY"; slug: string };
      let itemId: string | undefined;
      if (itemType === "COUNTRY") {
        itemId = (await prisma.country.findUnique({ where: { slug }, select: { id: true } }))?.id;
      } else {
        itemId = (await prisma.university.findUnique({ where: { slug }, select: { id: true } }))?.id;
      }
      if (!itemId) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      const existing = await prisma.savedItem.findUnique({
        where: { userId_itemType_itemId: { userId, itemType, itemId } },
      });
      if (existing) {
        await prisma.savedItem.delete({ where: { id: existing.id } });
        return NextResponse.json({ saved: false });
      } else {
        await prisma.savedItem.create({ data: { userId, itemType, itemId } });
        return NextResponse.json({ saved: true });
      }
    }

    if (body.action === "saveNote") {
      const { countrySlug, content } = body as { countrySlug: string; content: string };
      const country = await prisma.country.findUnique({ where: { slug: countrySlug } });
      if (!country) return NextResponse.json({ error: "Country not found" }, { status: 404 });

      await prisma.researchNote.upsert({
        where: { userId_countryId: { userId, countryId: country.id } },
        update: { content },
        create: { userId, countryId: country.id, content },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "saveProfile") {
      await prisma.user.update({
        where: { id: userId },
        data: { studentProfile: JSON.stringify(body.studentProfile) },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "saveFinancialPlan") {
      const plan = body.financialPlan as FinancialPlanDTO;
      const existing = await prisma.financialPlan.findFirst({ where: { userId } });
      if (existing) {
        await prisma.financialItem.deleteMany({ where: { planId: existing.id } });
        await prisma.financialPlan.update({
          where: { id: existing.id },
          data: {
            name: plan.name,
            targetCountrySlug: plan.targetCountrySlug,
            totalBudgetBdt: plan.totalBudgetBdt,
            pofTargetBdt: plan.pofTargetBdt,
            seasoningStart: plan.seasoningStart,
            seasoningDaysReq: plan.seasoningDaysReq,
            items: {
              create: plan.items.map((item) => ({
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
      } else {
        await prisma.financialPlan.create({
          data: {
            userId,
            name: plan.name,
            targetCountrySlug: plan.targetCountrySlug,
            totalBudgetBdt: plan.totalBudgetBdt,
            pofTargetBdt: plan.pofTargetBdt,
            seasoningStart: plan.seasoningStart,
            seasoningDaysReq: plan.seasoningDaysReq,
            items: {
              create: plan.items.map((item) => ({
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
      return NextResponse.json({ ok: true });
    }

    if (body.action === "saveChatMessages") {
      const existing = await prisma.chatSession.findFirst({ where: { userId } });
      if (existing) {
        await prisma.chatSession.update({
          where: { id: existing.id },
          data: { messages: JSON.stringify(body.chatMessages || []) },
        });
      } else {
        await prisma.chatSession.create({
          data: {
            userId,
            title: "Study Abroad Advisor",
            messages: JSON.stringify(body.chatMessages || []),
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Workspace PUT error:", error);
    return NextResponse.json({ error: "Failed to save workspace" }, { status: 500 });
  }
}
