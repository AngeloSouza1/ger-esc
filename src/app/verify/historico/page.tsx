// src/app/verify/historico/page.tsx
import { prisma } from "@/lib/prisma";

type SP = { student?: string | string[] };

export default async function VerifyHistorico({
  searchParams,
}: {
  searchParams: Promise<SP>; // Next 15: searchParams é assíncrono
}) {
  const sp = await searchParams;
  const raw = sp.student;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const form = (
    <form method="GET" className="rounded-xl border p-4 grid gap-2 sm:grid-cols-[1fr,auto]">
      <input
        type="text"
        name="student"
        placeholder="ID do aluno (ex.: cmfbtmiwr0000qxyi3aayrwqq)"
        defaultValue={id ?? ""}
        className="border rounded-lg px-3 py-2"
      />
      <button className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Verificar</button>
    </form>
  );

  if (!id) {
    return (
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Verificação de Histórico</h1>
        <p className="text-sm text-gray-600">Informe o parâmetro <code>?student=&lt;id&gt;</code> ou use o formulário abaixo.</p>
        {form}
      </section>
    );
  }

  const student = await prisma.student.findUnique({ where: { id } });

  if (!student) {
    return (
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Verificação de Histórico</h1>
        <div className="text-sm text-red-600">Aluno não encontrado.</div>
        {form}
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Verificação de Histórico</h1>
      <p className="text-sm text-gray-600">
        Documento emitido para <b>{student.nome}</b> (ID: <code>{student.id}</code>).
      </p>
      <p className="text-sm">
        Se os dados conferem com o documento impresso ou arquivo, considere o histórico <b>válido</b>.
      </p>

      <div className="text-sm text-gray-600">
        <a
          className="inline-block mt-2 border rounded-lg px-3 py-1.5 hover:bg-gray-50"
          href={`/students/${student.id}`}
        >
          Ver detalhes do aluno
        </a>
      </div>

      <div className="pt-4 border-t">{form}</div>
    </section>
  );
}
