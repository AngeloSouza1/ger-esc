// src/app/api/historico/[studentId]/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeQR } from "@/lib/qr.service";
import { generatePdfFromHtml } from "@/lib/pdf.service";
import { historicoHTML } from "@/templates/historico.html";

function formatDateBR(d?: Date | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ studentId: string }> } // Next 15: params é Promise
) {
  try {
    const { studentId } = await ctx.params;

    // 1) Buscar aluno completo
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

    // 2) Mapear para o formato esperado pelo historicoHTML (BLOCOS + DISCIPLINAS)
    const blocos = (student.enrollments ?? []).map((e) => ({
      anoLetivo: e.class?.schoolYear?.anoLetivo ?? 0,
      etapa: e.class?.schoolYear?.etapa ?? "—",
      turma: e.class?.turma ?? "—",
      turno: e.class?.turno ?? "—",
      frequenciaFinal: typeof e.frequenciaFinal === "number" ? e.frequenciaFinal : null,
      resultadoFinal: e.resultadoFinal ?? null,
      cargaHorariaTotal:
        typeof e.cargaHorariaTotal === "number" ? e.cargaHorariaTotal : null,
      disciplinas: (e.grades ?? []).map((g) => ({
        nome: g.subject?.nome ?? "—",
        cargaHorariaAnual:
          typeof g.subject?.cargaHorariaAnual === "number"
            ? g.subject.cargaHorariaAnual
            : null,
        notaFinal: typeof g.notaFinal === "number" ? g.notaFinal : null,
        faltas: typeof g.faltas === "number" ? g.faltas : null,
      })),
    }));

    // 3) Topo/rodapé e assinaturas
    const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
    const cidade = process.env.APP_CIDADE || "—";
    const data_emissao = formatDateBR(new Date());
    const diretor_nome = process.env.APP_DIRETOR_NOME || "—";
    const diretor_matricula = process.env.APP_DIRETOR_MATRICULA || "—";
    const secretario_nome = process.env.APP_SECRETARIO_NOME || "—";
    const secretario_matricula = process.env.APP_SECRETARIO_MATRICULA || "—";

    // 4) QR e HTML
    const qrDataUrl = await makeQR(`${base}/verificar/historico?student=${student.id}`);

    const html = historicoHTML({
      aluno: {
        id: student.id,
        nome: student.nome,
        documento: student.documento ?? "",
        nascimento: formatDateBR(student.nascimento),
      },
      blocos, // <- agora é "blocos" (array), nunca undefined
      qrDataUrl,
      app_url: base,
      documento_hash: "—",
      cidade,
      data_emissao,
      diretor_nome,
      diretor_matricula,
      secretario_nome,
      secretario_matricula,
      // bannerDataUrl: "data:image/png;base64,....", // opcional
    });

    // 5) Renderizar PDF
    const pdf = await generatePdfFromHtml({ html });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="historico-${student.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error(
      "GET /api/historico/[studentId]/pdf error:",
      err?.message,
      err?.stack || err
    );
    return NextResponse.json(
      { error: err?.message || "Falha ao gerar PDF" },
      { status: 500 }
    );
  }
}
