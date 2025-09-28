export default function ReportsPage() {
    return (
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-gray-600">Gere documentos oficiais rapidamente.</p>
        <div className="rounded-xl border p-4 grid gap-2 sm:grid-cols-2">
          <a className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50" href="/students">Histórico por aluno</a>
          <a className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50" href="/verify/historico">Verificar histórico</a>
        </div>
      </section>
    );
  }
  