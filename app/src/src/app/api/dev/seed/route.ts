// src/app/api/dev/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // pega (ou cria) um aluno
    const student = await prisma.student.upsert({
      where: { documento: "123.456.789-00" },
      update: {},
      create: { nome: "Maria Souza", documento: "123.456.789-00" },
    });

    const sy = await prisma.schoolYear.upsert({
      where: { anoLetivo_etapa: { anoLetivo: 2024, etapa: "9º ANO" } },
      update: {},
      create: { anoLetivo: 2024, etapa: "9º ANO" },
    });

    const cl = await prisma.class.upsert({
      where: { schoolYearId_turma_turno: { schoolYearId: sy.id, turma: "A", turno: "MANHÃ" } },
      update: {},
      create: { turma: "A", turno: "MANHÃ", schoolYearId: sy.id },
    });

    const e = await prisma.enrollment.upsert({
      where: { studentId_classId: { studentId: student.id, classId: cl.id } },
      update: { resultadoFinal: "APROVADO", cargaHorariaTotal: 800, frequenciaFinal: 92 },
      create: {
        studentId: student.id,
        classId: cl.id,
        resultadoFinal: "APROVADO",
        cargaHorariaTotal: 800,
        frequenciaFinal: 92,
      },
    });

    const subj = await prisma.subject.upsert({
      where: { nome_cargaHorariaAnual: { nome: "Matemática", cargaHorariaAnual: 200 } },
      update: {},
      create: { nome: "Matemática", cargaHorariaAnual: 200 },
    });

    await prisma.grade.upsert({
      where: { enrollmentId_subjectId: { enrollmentId: e.id, subjectId: subj.id } },
      update: { notaFinal: 8.5, faltas: 12 },
      create: { enrollmentId: e.id, subjectId: subj.id, notaFinal: 8.5, faltas: 12 },
    });

    return NextResponse.json({ ok: true, studentId: student.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/dev/seed error:", err);
    return NextResponse.json({ error: err?.message || "internal" }, { status: 500 });
  }
}
