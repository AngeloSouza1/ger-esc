-- DropForeignKey
ALTER TABLE "public"."Class" DROP CONSTRAINT "Class_schoolYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Grade" DROP CONSTRAINT "Grade_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeSource" DROP CONSTRAINT "GradeSource_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeSource" DROP CONSTRAINT "GradeSource_minuteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Minute" DROP CONSTRAINT "Minute_classId_fkey";

-- CreateIndex
CREATE INDEX "Class_schoolYearId_idx" ON "public"."Class"("schoolYearId");

-- CreateIndex
CREATE INDEX "Document_studentId_idx" ON "public"."Document"("studentId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "public"."Document"("type");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "public"."Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_idx" ON "public"."Enrollment"("classId");

-- CreateIndex
CREATE INDEX "Grade_enrollmentId_idx" ON "public"."Grade"("enrollmentId");

-- CreateIndex
CREATE INDEX "Grade_subjectId_idx" ON "public"."Grade"("subjectId");

-- CreateIndex
CREATE INDEX "GradeSource_gradeId_idx" ON "public"."GradeSource"("gradeId");

-- CreateIndex
CREATE INDEX "GradeSource_minuteId_idx" ON "public"."GradeSource"("minuteId");

-- CreateIndex
CREATE INDEX "Minute_classId_idx" ON "public"."Minute"("classId");

-- CreateIndex
CREATE INDEX "Minute_dataFechamento_idx" ON "public"."Minute"("dataFechamento");

-- CreateIndex
CREATE INDEX "SchoolYear_anoLetivo_idx" ON "public"."SchoolYear"("anoLetivo");

-- CreateIndex
CREATE INDEX "Student_nome_idx" ON "public"."Student"("nome");

-- CreateIndex
CREATE INDEX "Subject_nome_idx" ON "public"."Subject"("nome");

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "public"."SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Grade" ADD CONSTRAINT "Grade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Minute" ADD CONSTRAINT "Minute_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeSource" ADD CONSTRAINT "GradeSource_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeSource" ADD CONSTRAINT "GradeSource_minuteId_fkey" FOREIGN KEY ("minuteId") REFERENCES "public"."Minute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
