// src/app/api/reports/attendance/pdf/route.ts
import { NextResponse } from "next/server";
import { generatePdfFromHtml } from "@/lib/pdf.service";

export async function POST(req: Request) {
  const { html } = await req.json();
  const pdf = await generatePdfFromHtml({ html });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="relatorio-frequencia.pdf"',
    },
  });
}
