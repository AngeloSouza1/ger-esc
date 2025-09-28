import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await prisma.class.findMany({
      include: { schoolYear: true },
      orderBy: [
        { schoolYear: { anoLetivo: "desc" } },
        { schoolYear: { etapa: "asc" } },
        { turma: "asc" },
        { turno: "asc" },
      ],
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: "Falha ao listar turmas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const trimmed = z.string().trim().min(1);
  const createClassSchema = z.object({
    anoLetivo: z.coerce.number().int().min(1900),
    etapa: trimmed,
    turma: trimmed,
    turno: trimmed,
  });

  try {
    const body = await req.json();
    const parsed = createClassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { anoLetivo, etapa, turma, turno } = parsed.data;

    const schoolYear = await prisma.schoolYear.upsert({
      where: { anoLetivo_etapa: { anoLetivo, etapa } },
      update: {},
      create: { anoLetivo, etapa },
    });

    const created = await prisma.class.create({
      data: {
        turma,
        turno,
        schoolYearId: schoolYear.id,
      },
      include: { schoolYear: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Turma já cadastrada para este ano, etapa e turno." },
        { status: 409 }
      );
    }

    console.error("POST /api/classes error:", error);
    return NextResponse.json({ error: "Falha ao criar turma." }, { status: 500 });
  }
}
