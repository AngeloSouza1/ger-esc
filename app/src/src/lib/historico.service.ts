// src/lib/historico.service.ts
import { prisma } from "./prisma";

export async function buildHistorico(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          class: { include: { schoolYear: true } },
          grades: {
            include: {
              subject: true,
              sources: { include: { minute: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!student) throw new Error("Aluno não encontrado");

  const anos = [
    ...new Set(student.enrollments.map((e) => e.class.schoolYear.anoLetivo)),
  ].sort();

  const blocos = anos.flatMap((ano) => {
    const enrolls = student.enrollments.filter(
      (e) => e.class.schoolYear.anoLetivo === ano
    );
    return enrolls.map((e) => ({
      anoLetivo: ano,
      etapa: e.class.schoolYear.etapa,
      turma: e.class.turma,
      turno: e.class.turno,
      frequenciaFinal: e.frequenciaFinal,
      resultadoFinal: e.resultadoFinal,
      cargaHorariaTotal: e.cargaHorariaTotal,
      disciplinas: e.grades.map((g) => ({
        nome: g.subject.nome,
        cargaHoraria: g.subject.cargaHorariaAnual,
        nota: g.notaFinal,
        faltas: g.faltas,
        parecer: g.parecer,
      })),
    }));
  });

  const alertas: string[] = [];
  blocos.forEach((b) => {
    const somaCH = b.disciplinas.reduce(
      (acc, d) => acc + (d.cargaHoraria || 0),
      0
    );
    if (b.cargaHorariaTotal && somaCH !== b.cargaHorariaTotal) {
      alertas.push(
        `CH inconsistente em ${b.anoLetivo} ${b.etapa}: soma ${somaCH}, total ${b.cargaHorariaTotal}`
      );
    }
  });

  return { student, blocos, alertas };
}
