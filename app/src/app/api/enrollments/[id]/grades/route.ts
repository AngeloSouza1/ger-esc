import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { id: string };

export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const grades = await prisma.grade.findMany({
    where: { enrollmentId: id },
    include: { subject: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(grades);
}

export async function PUT(req: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const { subjectIds } = (await req.json().catch(() => ({}))) as { subjectIds?: string[] };
  if (!Array.isArray(subjectIds)) return NextResponse.json({ error: "subjectIds (array) é obrigatório" }, { status: 400 });

  const existing = await prisma.grade.findMany({
    where: { enrollmentId: id },
    select: { id: true, subjectId: true },
  });

  const have = new Set(existing.map(g => g.subjectId));
  const want = new Set(subjectIds);

  const toCreate = subjectIds.filter(sid => !have.has(sid));
  const toDelete = existing.filter(g => !want.has(g.subjectId)).map(g => g.id);

  await prisma.$transaction([
    ...toCreate.map(sid => prisma.grade.create({ data: { enrollmentId: id, subjectId: sid } })),
    ...(toDelete.length ? [prisma.grade.deleteMany({ where: { id: { in: toDelete } } })] : []),
  ]);

  return NextResponse.json({ ok: true });
}
