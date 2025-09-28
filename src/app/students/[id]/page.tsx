// src/app/students/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QRCode from "qrcode";
import CopyButton from "@/components/CopyButton";
import SubjectPicker from "@/components/SubjectPicker";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RouteParams = { id: string };

export default async function StudentDetail({
  params,
}: {
  params: Promise<RouteParams>; // Next 15: params é assíncrono
}) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
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
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6 text-sm text-destructive">
          Aluno não encontrado.
        </CardContent>
      </Card>
    );
  }

  const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
  const verifyUrl = `${base}/verify/historico?student=${student.id}`;

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 });
  } catch {
    qrDataUrl = null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid gap-4 md:grid-cols-[1fr,320px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">
              {student.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                Doc.: {student.documento || "—"}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                Nasc.:{" "}
                {student.nascimento
                  ? new Date(student.nascimento).toLocaleDateString()
                  : "—"}
              </Badge>
              <Badge variant="outline" className="font-normal">
                ID: {student.id}
              </Badge>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/verify/historico?student=${student.id}`}>
                  Verificar histórico
                </Link>
              </Button>

              {/* PDF em nova aba */}
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/api/historico/${student.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gerar PDF
                </a>
              </Button>

              {/* DOCX em nova aba (download) */}
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/api/historico/${student.id}/docx`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Baixar DOCX
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verificação / QR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">
              Verificação
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            {qrDataUrl ? (
              <Link
                href={`/verify/historico?student=${student.id}`}
                title="Abrir verificação"
                className="rounded-xl border p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code de verificação do histórico"
                  width={160}
                  height={160}
                />
              </Link>
            ) : (
              <div className="text-xs text-muted-foreground">
                QR indisponível
              </div>
            )}

            <div className="mt-1 flex items-center justify-center gap-2">
              <a
                href={`/verify/historico?student=${student.id}`}
                className="text-[11px] text-primary underline-offset-2 hover:underline break-all max-w-[18rem]"
              >
                {verifyUrl}
              </a>
              <CopyButton text={verifyUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matrículas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Matrículas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {student.enrollments.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Sem matrículas. Use o seed ou cadastre via API.
            </div>
          ) : (
            <div className="divide-y">
              {student.enrollments.map((e) => {
                const sy = e.class?.schoolYear;
                const yearLabel = sy
                  ? `${sy.anoLetivo} — ${sy.etapa}`
                  : "— (sem ano letivo)";

                const initiallySelected = e.grades
                  .filter((g) => !!g.subject)
                  .map((g) => ({ id: g.subject!.id, nome: g.subject!.nome }));

                return (
                  <div key={e.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{yearLabel}</span>

                      <Badge variant="secondary" className="font-normal">
                        Turma {e.class?.turma ?? "—"}
                      </Badge>
                      <Badge variant="secondary" className="font-normal">
                        {e.class?.turno ?? "—"}
                      </Badge>

                      <Badge variant="outline" className="font-normal">
                        CH Total: {e.cargaHorariaTotal ?? "—"}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        Freq.: {e.frequenciaFinal ?? "—"}%
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        Resultado: {e.resultadoFinal ?? "—"}
                      </Badge>

                      <div className="ml-auto">
                        <SubjectPicker
                          enrollmentId={e.id}
                          initiallySelected={initiallySelected}
                          onChanged={undefined /* me avise se quiser live update */}
                        />
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50%]">Componente</TableHead>
                            <TableHead className="w-[15%]">CH</TableHead>
                            <TableHead className="w-[15%]">Nota</TableHead>
                            <TableHead className="w-[20%]">Faltas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {e.grades.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-muted-foreground">
                                Sem componentes/lançamentos.
                              </TableCell>
                            </TableRow>
                          ) : (
                            e.grades.map((g) => (
                              <TableRow key={g.id}>
                                <TableCell>{g.subject?.nome ?? "—"}</TableCell>
                                <TableCell>{g.subject?.cargaHorariaAnual ?? "—"}</TableCell>
                                <TableCell>{g.notaFinal ?? "—"}</TableCell>
                                <TableCell>{g.faltas ?? "—"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex">
        <Button asChild variant="ghost" size="sm" className="pl-0">
          <Link href="/students">← Voltar</Link>
        </Button>
      </div>
    </div>
  );
}
