import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];
const today0 = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const uuid = () => crypto.randomUUID();
const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);

async function main() {
  // limpa (dev)
  await prisma.gradeSource.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.document.deleteMany();
  await prisma.minute.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.schoolYear.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // users (20)
  const roles = ["ADMIN", "COORD", "PROF", "FIN"] as const;
  const users = Array.from({ length: 20 }, (_, i) => ({
    id: uuid(),
    name: `Usuário ${i + 1}`,
    email: `user${i + 1}@exemplo.com`,
    role: roles[i % roles.length] as unknown as string,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await prisma.user.createMany({ data: users, skipDuplicates: true });

  // students (40)
  const students = Array.from({ length: 40 }, (_, i) => {
    const n = i + 1;
    const doc = `0000000000${n}`.slice(-11);
    return {
      id: uuid(),
      nome: `Aluno ${n}`,
      nascimento: new Date(2010, rand(0, 11), rand(1, 28)),
      documento: doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  await prisma.student.createMany({ data: students, skipDuplicates: true });

  // documents (40)
  const documents = students.map((s, idx) => ({
    id: uuid(),
    studentId: s.id,
    type: idx % 2 === 0 ? "CPF" : "RG",
    url: `https://files.exemplo.com/doc/${s.id}.pdf`,
    hash: hash(`doc-${s.id}`),
    createdAt: new Date(),
  }));
  await prisma.document.createMany({ data: documents, skipDuplicates: true });

  // school years (20)
  const schoolYears = Array.from({ length: 20 }, (_, i) => ({
    id: `year-${2010 + i}`,
    anoLetivo: 2010 + i,
    etapa: "Anual",
  }));
  await prisma.schoolYear.createMany({ data: schoolYears, skipDuplicates: true });

  // classes (20)
  const turnos = ["Manhã", "Tarde"];
  const classes = Array.from({ length: 20 }, (_, i) => ({
    id: uuid(),
    turma: `Turma ${String.fromCharCode(65 + (i % 26))}`,
    turno: turnos[(i + 1) % 2],
    schoolYearId: schoolYears[i % schoolYears.length].id,
  }));
  await prisma.class.createMany({ data: classes, skipDuplicates: true });

  // subjects (20)
  const subjects = Array.from({ length: 20 }, (_, i) => ({
    id: uuid(),
    nome: `Disciplina ${i + 1}`,
    componenteBncc: (i + 1) % 3 === 0 ? "BNCC-Base" : null,
    cargaHorariaAnual: 40 * (((i + 1) % 6) + 3),
  }));
  await prisma.subject.createMany({ data: subjects, skipDuplicates: true });

  // enrollments (40)
  const enrollments = students.map((s, idx) => ({
    id: uuid(),
    studentId: s.id,
    classId: classes[idx % classes.length].id,
    frequenciaFinal: null,
    resultadoFinal: null,
    cargaHorariaTotal: pick([800, 900, 1000, 1200]),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await prisma.enrollment.createMany({ data: enrollments, skipDuplicates: true });

  // minutes (20)
  const minutes: any[] = [];
  const base = today0();
  classes.slice(0, 20).forEach((c, i) => {
    const dt = addDays(base, -i);
    minutes.push({
      id: uuid(),
      classId: c.id,
      dataFechamento: dt,
      arquivoUrl: `https://files.exemplo.com/minutas/${c.id}/${dt.toISOString().slice(0,10)}.pdf`,
      hash: hash(`${c.id}-${dt.toISOString()}`),
      createdAt: new Date(),
    });
  });
  await prisma.minute.createMany({ data: minutes, skipDuplicates: true });

  // grades (120 = 40 * 3)
  const grades: any[] = [];
  const subjectSlice = subjects.slice(0, 3);
  enrollments.forEach((e) => {
    subjectSlice.forEach((subj) => {
      grades.push({
        id: uuid(),
        enrollmentId: e.id,
        subjectId: subj.id,
        notaFinal: rand(50, 100) / 10,
        faltas: rand(0, 20),
        parecer: Math.random() < 0.15 ? "Bom desempenho" : null,
      });
    });
  });
  await prisma.grade.createMany({ data: grades, skipDuplicates: true });

  // grade sources (20)
  const gradeSources = Array.from({ length: 20 }, (_, i) => ({
    id: uuid(),
    gradeId: grades[i].id,
    minuteId: minutes[i % minutes.length].id,
    pagina: rand(1, 10),
    obs: Math.random() < 0.3 ? "Ata lançada manualmente" : null,
  }));
  await prisma.gradeSource.createMany({ data: gradeSources, skipDuplicates: true });

  // attendances (100 = 20 matrículas * 5 dias)
  const attendances: any[] = [];
  const enrollSlice = enrollments.slice(0, 20);
  enrollSlice.forEach((e, i) => {
    for (let d = 0; d < 5; d++) {
      const dt = addDays(base, -(i + d));
      const r = Math.random();
      const status = r < 0.7 ? "PRESENT" : r < 0.9 ? "ABSENT" : "LATE";
      attendances.push({
        id: uuid(),
        enrollmentId: e.id,
        date: dt,
        status,
        createdAt: new Date(),
      });
    }
  });
  await prisma.attendance.createMany({ data: attendances, skipDuplicates: true });

  console.log("✅ Seed concluído com sucesso!");
}

main().catch((e) => { console.error(e); process.exit(1); })
       .finally(async () => { await prisma.$disconnect(); });
