// src/app/api/enrollments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const list = await prisma.enrollment.findMany({
      orderBy: { createdAt: "desc" },
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
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao listar matrículas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as
      | { studentId?: string; classId?: string }
      | null;

    const studentId = body?.studentId?.trim();
    const classId = body?.classId?.trim();

    if (!studentId || !classId) {
      return NextResponse.json({ error: "Informe studentId e classId." }, { status: 400 });
    }

    // valida FK
    const [student, klass] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { id: true } }),
      prisma.class.findUnique({ where: { id: classId }, select: { id: true } }),
    ]);
    if (!student) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    if (!klass) return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });

    // cria matrícula
    const created = await prisma.enrollment.create({
      data: {
        studentId,
        classId,
        // campos opcionais já ficam null por padrão (frequenciaFinal, resultadoFinal, etc.)
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

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Prisma unique (já existe matrícula do mesmo aluno na mesma turma)
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Aluno já matriculado nessa turma." },
        { status: 409 }
      );
    }
    // FK ou outros erros do Prisma
    if (e?.code === "P2003") {
      return NextResponse.json(
        { error: "Aluno ou Turma inválidos." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: e?.message || "Falha ao matricular." },
      { status: 500 }
    );
  }
}
