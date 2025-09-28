import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const StudentSchema = z.object({
  nome: z.string().min(2),
  documento: z.string().optional().nullable(),
  nascimento: z.string().datetime().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const data = await prisma.student.findMany({
      where: q ? { nome: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/students error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = StudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { nome, documento, nascimento } = parsed.data;
    const created = await prisma.student.create({
      data: {
        nome,
        documento: documento || null,
        nascimento: nascimento ? new Date(nascimento) : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/students error:", err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Documento já existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
