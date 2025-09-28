// src/app/classes/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type SchoolYear = { id: string; anoLetivo: number; etapa: string };
type ClassRow = {
  id: string;
  turma: string;
  turno: string;
  schoolYear?: SchoolYear | null;
};

export default function ClassesPage() {
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [list, setList] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [y, c] = await Promise.all([
        fetch("/api/school-years", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/classes", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setYears(y);
      setList(c);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao carregar turmas";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const yearOptions = useMemo(
    () => Array.from(new Set(years.map((y) => y.anoLetivo))).sort((a, b) => b - a),
    [years]
  );
  const etapaOptions = useMemo(
    () => Array.from(new Set(years.map((y) => y.etapa))).sort(),
    [years]
  );

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Turmas</h1>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          const fd = new FormData(e.currentTarget);
          const payload = {
            anoLetivo: Number(fd.get("ano") || 0),
            etapa: String(fd.get("etapa") || "").trim(),
            turma: String(fd.get("turma") || "").trim(),
            turno: String(fd.get("turno") || "").trim(),
          };
          try {
            const r = await fetch("/api/classes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!r.ok) {
              const json = await r.json().catch(() => null);
              throw new Error(json?.error ?? "Erro ao criar turma");
            }
            (e.currentTarget as HTMLFormElement).reset();
            await load();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao criar turma";
            setErr(message);
          }
        }}
        className="grid gap-2 sm:grid-cols-5 rounded-xl border p-4"
      >
        <input
          name="ano"
          type="text"
          inputMode="numeric"
          placeholder="Ano letivo"
          required
          list="ano-options"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="etapa"
          placeholder="Etapa (ex.: 9º ANO)"
          required
          list="etapa-options"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="turma"
          placeholder="Turma (ex.: A)"
          required
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="turno"
          placeholder="Turno (ex.: MANHÃ)"
          required
          className="border rounded-lg px-3 py-2"
        />
        <button className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
          Adicionar
        </button>
      </form>

      <datalist id="ano-options">
        {yearOptions.map((ano) => (
          <option key={ano} value={ano} />
        ))}
      </datalist>

      <datalist id="etapa-options">
        {etapaOptions.map((etapa) => (
          <option key={etapa} value={etapa} />
        ))}
      </datalist>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {loading && <div className="text-sm text-gray-500">Carregando…</div>}

      {/* === Mesmo padrão visual da tabela de Alunos === */}
      <div className="rounded-xl border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[color-mix(in_oklab,var(--background),#fff_6%)]">
            <tr>
              <th className="text-left p-2 border-b">Ano/Etapa</th>
              <th className="text-left p-2 border-b">Turma</th>
              <th className="text-left p-2 border-b">Turno</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const yearLabel = c.schoolYear
                ? `${c.schoolYear.anoLetivo} — ${c.schoolYear.etapa}`
                : "— (sem ano letivo)";
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{yearLabel}</td>
                  <td className="p-2">{c.turma}</td>
                  <td className="p-2">{c.turno}</td>
                </tr>
              );
            })}

            {list.length === 0 && !loading && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={3}>
                  Nenhuma turma
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
