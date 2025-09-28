-- CreateEnum
CREATE TYPE "public"."ResultadoFinal" AS ENUM ('APROVADO', 'REPROVADO', 'APROVADO_CONSELHO', 'TRANSFERIDO');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nascimento" TIMESTAMP(3),
    "documento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SchoolYear" (
    "id" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "etapa" TEXT NOT NULL,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Class" (
    "id" TEXT NOT NULL,
    "turma" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subject" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "componenteBncc" TEXT,
    "cargaHorariaAnual" INTEGER NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "frequenciaFinal" DOUBLE PRECISION,
    "resultadoFinal" "public"."ResultadoFinal",
    "cargaHorariaTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Grade" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "notaFinal" DOUBLE PRECISION,
    "faltas" INTEGER,
    "parecer" TEXT,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Minute" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dataFechamento" TIMESTAMP(3) NOT NULL,
    "arquivoUrl" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Minute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeSource" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "minuteId" TEXT NOT NULL,
    "pagina" INTEGER,
    "obs" TEXT,

    CONSTRAINT "GradeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_documento_key" ON "public"."Student"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_anoLetivo_etapa_key" ON "public"."SchoolYear"("anoLetivo", "etapa");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolYearId_turma_turno_key" ON "public"."Class"("schoolYearId", "turma", "turno");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_nome_cargaHorariaAnual_key" ON "public"."Subject"("nome", "cargaHorariaAnual");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "public"."Enrollment"("studentId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_enrollmentId_subjectId_key" ON "public"."Grade"("enrollmentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Minute_hash_key" ON "public"."Minute"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "GradeSource_gradeId_minuteId_key" ON "public"."GradeSource"("gradeId", "minuteId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_hash_key" ON "public"."Document"("hash");

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "public"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Grade" ADD CONSTRAINT "Grade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Grade" ADD CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Minute" ADD CONSTRAINT "Minute_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeSource" ADD CONSTRAINT "GradeSource_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeSource" ADD CONSTRAINT "GradeSource_minuteId_fkey" FOREIGN KEY ("minuteId") REFERENCES "public"."Minute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
