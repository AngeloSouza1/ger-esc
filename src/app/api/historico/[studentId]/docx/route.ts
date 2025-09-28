// src/app/api/historico/[studentId]/docx/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { prisma } from "@/lib/prisma";

// Helpers
function formatDateBR(d?: Date | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}
function avg(nums: number[]) {
  if (!nums.length) return null;
  const total = nums.reduce((a, b) => a + b, 0);
  return total / nums.length;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ studentId: string }> } // Next 15: params é Promise
) {
  try {
    const { studentId } = await ctx.params;

    // Carrega aluno completo
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            class: { include: { schoolYear: true } },
            grades: { include: { subject: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }


    // Mapeia matrículas com aliases SEM ponto (com idx)
    const enrollments = (student.enrollments || []).map((e, i) => {
      const idx = i + 1;

      const notas = e.grades
        .map((g) => (typeof g.notaFinal === "number" ? g.notaFinal : null))
        .filter((n): n is number => n !== null);

      const media = avg(notas);
      const mediaFmt =
        typeof media === "number" ? Number(media.toFixed(1)).toString().replace(".", ",") : "—";

      const freqFmt =
        typeof e.frequenciaFinal === "number"
          ? String(e.frequenciaFinal).replace(".", ",")
          : "—";

      const anoLetivo = e.class?.schoolYear?.anoLetivo ?? "—";
      const etapa = e.class?.schoolYear?.etapa ?? "—";
      const turma = e.class?.turma ?? "—";
      const turno = e.class?.turno ?? "—";

      const grades = e.grades.map((g) => {
        const subjectNome = g.subject?.nome ?? "—";
        const subjectCH =
          typeof g.subject?.cargaHorariaAnual === "number" ? g.subject?.cargaHorariaAnual : "—";

        return {
          // compat: estrutura aninhada
          subject: { nome: subjectNome, cargaHorariaAnual: subjectCH },
          // achatado:
          subject_nome: subjectNome,
          subject_cargaHorariaAnual: subjectCH,
          notaFinal: typeof g.notaFinal === "number" ? String(g.notaFinal).replace(".", ",") : "—",
          faltas: typeof g.faltas === "number" ? g.faltas : "—",
        };
      });

      const resumo = {
        cargaHorariaTotal: typeof e.cargaHorariaTotal === "number" ? e.cargaHorariaTotal : "—",
        mediaFinal: mediaFmt,
        frequenciaFinal: freqFmt,
      };

      return {
        idx, // <<— adicionado
      
        // compat: estrutura aninhada
        class: { schoolYear: { anoLetivo, etapa }, turma, turno },
        grades,
        resumo,
      
        // achatado (use isso no .docx)
        anoLetivo,
        etapa,
        turma,
        turno,
        resumo_cargaHorariaTotal: resumo.cargaHorariaTotal,
        resumo_mediaFinal: resumo.mediaFinal,
        resumo_frequenciaFinal: resumo.frequenciaFinal,
      };
      
    });

    const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
    const cidade = process.env.APP_CIDADE || "—";
    const data_emissao = formatDateBR(new Date());
    const assinaturas = {
      diretor_nome: process.env.APP_DIRETOR_NOME || "—",
      diretor_matricula: process.env.APP_DIRETOR_MATRICULA || "—",
      secretario_nome: process.env.APP_SECRETARIO_NOME || "—",
      secretario_matricula: process.env.APP_SECRETARIO_MATRICULA || "—",
    };

    // Topo com aliases achatados
    const aluno_nome = student.nome ?? "—";
    const aluno_documento = student.documento ?? "—";
    const aluno_nascimento = formatDateBR(student.nascimento);
    const aluno_id = student.id;

    const data = {
      // compat: estrutura aninhada
      aluno: {
        nome: aluno_nome,
        documento: aluno_documento,
        nascimento: aluno_nascimento,
        id: aluno_id,
      },
      app_url: base,
      documento_hash: "—",
      enrollments,
      cidade,
      data_emissao,
      assinaturas, // opcional manter

      // achatado p/ template
      aluno_nome,
      aluno_documento,
      aluno_nascimento,
      aluno_id,
      diretor_nome: assinaturas.diretor_nome,
      diretor_matricula: assinaturas.diretor_matricula,
      secretario_nome: assinaturas.secretario_nome,
      secretario_matricula: assinaturas.secretario_matricula,
    };

    // Carrega template e renderiza
    const templatePath = path.join(process.cwd(), "src", "templates", "historico.docx");
    const content = await fs.readFile(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "[[", end: "]]" }, // você está usando [[...]]
    });

    doc.render(data);

    const uint8 = doc.getZip().generate({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const fileBuffer = Buffer.from(uint8);
    const filename = `historico-${(aluno_nome || aluno_id).replace(/\s+/g, "_")}.docx`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error(
      "GET /api/historico/[studentId]/docx error:",
      err?.message,
      err?.properties || err
    );
    return NextResponse.json(
      { error: err?.message || "Falha ao gerar DOCX" },
      { status: 500 }
    );
  }
}
