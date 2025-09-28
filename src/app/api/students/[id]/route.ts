import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Params = { id: string };

export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { nome, documento, nascimento } = body as {
    nome?: string;
    documento?: string | null;
    nascimento?: string | null; // YYYY-MM-DD
  };

  try {
    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(typeof nome === "string" ? { nome } : {}),
        ...(documento !== undefined ? { documento: documento || null } : {}),
        ...(nascimento !== undefined
          ? { nascimento: nascimento ? new Date(nascimento) : null }
          : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  try {
    await prisma.grade.deleteMany({ where: { enrollment: { studentId: id } } });
    await (prisma as any).document?.deleteMany?.({ where: { studentId: id } });
    await prisma.enrollment.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
