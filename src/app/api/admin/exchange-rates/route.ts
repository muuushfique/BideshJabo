import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rates = await prisma.exchangeRate.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ exchangeRates: rates });
}

export async function PUT(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    code: string;
    name?: string;
    symbol?: string;
    rateToBdt: number;
  };
  const code = (body.code || "").toUpperCase().trim();
  if (!code || !Number.isFinite(Number(body.rateToBdt)) || Number(body.rateToBdt) <= 0) {
    return NextResponse.json({ error: "Invalid currency rate payload" }, { status: 400 });
  }

  const updated = await prisma.exchangeRate.upsert({
    where: { code },
    update: {
      rateToBdt: Number(body.rateToBdt),
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.symbol ? { symbol: body.symbol.trim() } : {}),
    },
    create: {
      code,
      name: body.name?.trim() || code,
      symbol: body.symbol?.trim() || code,
      rateToBdt: Number(body.rateToBdt),
    },
  });

  return NextResponse.json({ exchangeRate: updated });
}
