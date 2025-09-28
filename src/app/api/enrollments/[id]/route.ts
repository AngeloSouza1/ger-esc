import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, ResultadoFinal } from "@prisma/client";
import { z } from "zod";

type Params = { id: string };

const updateEnrollmentSchema = z.object({
  resultadoFinal: z.union([z.nativeEnum(ResultadoFinal), z.null()]).optional(),
  cargaHorariaTotal: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  frequenciaFinal: z.union([z.coerce.number().min(0).max(100), z.null()]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateEnrollmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { resultadoFinal, cargaHorariaTotal, frequenciaFinal } = parsed.data;

  try {
    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        ...(resultadoFinal !== undefined ? { resultadoFinal } : {}),
        ...(cargaHorariaTotal !== undefined ? { cargaHorariaTotal } : {}),
        ...(frequenciaFinal !== undefined ? { frequenciaFinal } : {}),
      },
      include: {
        student: { select: { id: true, nome: true } },
        class: {
          select: {
            id: true,
            turma: true,
            turno: true,
            schoolYear: { select: { anoLetivo: true, etapa: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 });
    }

    console.error(`PATCH /api/enrollments/${id} error:`, error);
    return NextResponse.json({ error: "Falha ao atualizar matrícula." }, { status: 500 });
  }
}
