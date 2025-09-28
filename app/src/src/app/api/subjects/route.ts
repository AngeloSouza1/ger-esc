import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await prisma.subject.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({ nome: z.string().min(2), cargaHorariaAnual: z.number().int().min(1) });
    const { nome, cargaHorariaAnual } = schema.parse(body);
    const created = await prisma.subject.create({ data: { nome, cargaHorariaAnual } });
    return NextResponse.json(created, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
