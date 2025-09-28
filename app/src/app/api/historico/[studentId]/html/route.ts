// src/app/api/historico/[studentId]/html/route.ts
import { NextResponse } from "next/server";
import { buildHistorico } from "@/lib/historico.service";
import { historicoHTML } from "@/templates/historico.html";
import { makeQR } from "@/lib/qr.service";

export async function GET(_: Request, { params }: { params: { studentId: string } }) {
  const { student, blocos } = await buildHistorico(params.studentId);
  const qr = await makeQR(`${process.env.APP_PUBLIC_URL}/verificar/historico?student=${student.id}`);
  const html = historicoHTML({
    aluno: {
      nome: student.nome,
      documento: student.documento ?? "",
      nascimento: student.nascimento?.toISOString().slice(0, 10) ?? "",
    },
    blocos,
    qrDataUrl: qr,
  });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
