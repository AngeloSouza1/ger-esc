// src/app/subjects/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type Subject = { id: string; nome: string; cargaHorariaAnual: number };

export default function SubjectsPage() {
  const [list, setList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Botão padrão (hover fundo branco + texto preto em ambos temas)
  const btnBase =
    "rounded-lg border px-3 py-1.5 text-sm transition " +
    "hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black " +
    "focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50";
  const btnDanger = btnBase + " border-red-300 text-red-700";

  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/subjects", { cache: "no-store" });
      if (!r.ok) {
        const j = await safeJson(r);
        throw new Error(j?.error || "Falha ao carregar a lista.");
      }
      const data = (await safeJson(r)) as unknown;
      setList(Array.isArray(data) ? (data as Subject[]) : []);
    } catch (e: any) {
      setError(e?.message || "Erro inesperado ao carregar.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
  
    // ⚠️ capture o form ANTES dos awaits
    const form = e.currentTarget as HTMLFormElement;
  
    const fd = new FormData(form);
    const nome = String(fd.get("nome") || "").trim();
    const chaRaw = String(fd.get("cha") || "").trim();
    const cha = Number(chaRaw);
  
    if (!nome) return setError("Informe o nome do componente.");
    if (!chaRaw || Number.isNaN(cha) || cha < 0)
      return setError("Informe uma carga horária anual válida (número ≥ 0).");
  
    setSaving(true);
    try {
      const r = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cargaHorariaAnual: cha }),
      });
  
      const text = await r.text();
      if (!r.ok) {
        let msg = "Erro ao criar componente.";
        try {
          const j = text ? JSON.parse(text) : null;
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
  
      form.reset();          // ✅ agora não quebra
      await load();          // recarrega a lista
    } catch (e: any) {
      setError(e?.message || "Erro inesperado ao criar.");
    } finally {
      setSaving(false);
    }
  }
  

  async function handleDelete(id: string) {
    setError(null);
    if (!confirm("Confirma excluir este componente?")) return;

    const prev = list; // otimista
    setList((cur) => cur.filter((s) => s.id !== id));

    try {
      const r = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const j = await safeJson(r);
        throw new Error(j?.error || "Erro ao excluir componente.");
      }
      // se quiser, pode chamar load() aqui também, mas o otimista já resolve
    } catch (e: any) {
      setList(prev); // rollback
      setError(e?.message || "Erro inesperado ao excluir.");
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Componentes Curriculares</h1>
        {/* Botão “Recarregar” removido por solicitação */}
      </header>

      {/* Aviso de erro */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulário de criação */}
      <form
        onSubmit={handleCreate}
        className="grid gap-2 sm:grid-cols-3 rounded-xl border p-4"
      >
        <input
          name="nome"
          placeholder="Nome"
          required
          className="border rounded-lg px-3 py-2 min-w-0"
          autoComplete="off"
        />
        <input
          name="cha"
          placeholder="CH anual"
          type="number"
          min={0}
          inputMode="numeric"
          required
          className="border rounded-lg px-3 py-2"
        />
        <button className={btnBase} disabled={saving}>
          {saving ? "Adicionando…" : "Adicionar"}
        </button>
      </form>

      {/* Loading inicial */}
      {loading && !list.length && (
        <div className="text-sm text-gray-500">Carregando…</div>
      )}

      {/* Tabela: mesmo padrão dos “Alunos” (borda visível; header claro/light, escuro/dark) */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[color-mix(in_oklab,var(--background),#fff_6%)]">
            <tr>
              <th className="p-2 text-left border-b">Nome</th>
              <th className="p-2 text-left border-b">CH</th>
              <th className="p-2 text-right border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.nome}</td>
                <td className="p-2">{s.cargaHorariaAnual}</td>
                <td className="p-2 text-right">
                  <button
                    className={btnDanger}
                    onClick={() => handleDelete(s.id)}
                    disabled={saving}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            {!loading && list.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={3}>
                  Nenhum componente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
