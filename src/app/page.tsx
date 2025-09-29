export default function Home() {
  return (
    <section className="grid gap-4 md:grid-cols-2 items-start">
      <div className="rounded-xl border p-6">
        <h1 className="text-2xl font-semibold mb-2">Bem-vindo 👋</h1>
        <p className="text-sm text-gray-600">
          MVP da secretaria: cadastre alunos e gere o <b>Histórico Escolar</b> em PDF/DOCX.
        </p>
        <div className="mt-4 flex gap-2">
          <a href="/students" className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Listar alunos</a>
        </div>
      </div>
    </section>
  );
}
