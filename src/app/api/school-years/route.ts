import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await prisma.schoolYear.findMany({ orderBy: [{ anoLetivo: "desc" }, { etapa: "asc" }] });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const schema = z.object({ anoLetivo: z.number().int(), etapa: z.string().min(1) });
  const { anoLetivo, etapa } = schema.parse(body);
  const created = await prisma.schoolYear.create({ data: { anoLetivo, etapa } });
  return NextResponse.json(created, { status: 201 });
}

