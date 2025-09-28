// src/app/students/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  nome: string;
  documento: string | null;
  nascimento: string | null;
  createdAt: string;
};

type SortKey = "nome" | "documento" | "id" | "createdAt";
type SortDir = "asc" | "desc";

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ordenação
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // edição
  const [editing, setEditing] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchData(query = "") {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/students?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Erro ao buscar alunos (${res.status})`);
      const json: Student[] = await res.json();
      setList(json);
      setPage(1); // reinicia paginação após busca
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchData(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      nome: String(fd.get("nome") || "").trim(),
      documento: String(fd.get("documento") || "").trim() || null,
    };
    if (!payload.nome) return;

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao criar aluno");
      form.reset();
      fetchData(q);
    } catch (err: any) {
      setError(err?.message || "Falha ao criar aluno");
    }
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va =
        sortKey === "documento"
          ? (a.documento ?? "")
          : sortKey === "createdAt"
          ? a.createdAt
          : (a as any)[sortKey];
      const vb =
        sortKey === "documento"
          ? (b.documento ?? "")
          : sortKey === "createdAt"
          ? b.createdAt
          : (b as any)[sortKey];

      if (sortKey === "createdAt") {
        const da = new Date(va).getTime();
        const db = new Date(vb).getTime();
        return (da - db) * dir;
      }
      const sa = String(va).toLocaleLowerCase();
      const sb = String(vb).toLocaleLowerCase();
      if (sa < sb) return -1 * dir;
      if (sa > sb) return 1 * dir;
      return (a.id < b.id ? -1 : 1) * dir;
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  function Arrow({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="opacity-40">↕</span>;
    return <span>{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir este aluno? Esta ação não pode ser desfeita.")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      // otimista
      setList((l) => l.filter((s) => s.id !== id));
    } catch (e: any) {
      setError(e?.message || "Erro ao excluir");
    }
  }

  async function onSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      nome: String(fd.get("nome") || "").trim(),
      documento: String(fd.get("documento") || "").trim() || null,
      nascimento: String(fd.get("nascimento") || "").trim() || null, // ISO yyyy-mm-dd opcional
    };
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      const updated: Student = await res.json();
      setList((l) => l.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setEditing(null);
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="grid gap-2 sm:grid-cols-[1fr_200px] sm:items-center">
        <h1 className="text-xl font-semibold">Alunos</h1>
        <input
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="Buscar por nome"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar alunos por nome"
        />
      </header>

      {/* Criar aluno rápido */}
      <div className="rounded-xl border p-4">
        <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-3">
          <input name="nome" required placeholder="Nome do aluno" className="border rounded-lg px-3 py-2" />
          <input name="documento" placeholder="Documento (opcional)" className="border rounded-lg px-3 py-2" />
          <button
            className="
              border rounded-lg px-3 py-2 text-sm transition-colors
              hover:bg-gray-100 hover:text-gray-900
              dark:hover:bg-gray-100 dark:hover:text-gray-900
            "
          >
            Adicionar aluno
          </button>
        </form>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Carregando...</div>}

      {/* Controles de paginação */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          Itens por página:
          <select
            className="border rounded px-2 py-1"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="border rounded px-2 py-1 disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span>
            Página <b>{currentPage}</b> de <b>{totalPages}</b> — {total} aluno(s)
          </span>
          <button
            className="border rounded px-2 py-1 disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Tabela de alunos */}
      <div className="rounded-xl border overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-gray-50 dark:bg-[color-mix(in_oklab,var(--background),#fff_4%)]">
            <tr>
              <th className="p-2 border-b">
                <button onClick={() => toggleSort("nome")} className="flex flex-col items-start leading-tight">
                  <span>Nome</span>
                  <span className="th-arrow">{sortKey === "nome" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                </button>
              </th>

              <th className="p-2 border-b">
                <button onClick={() => toggleSort("documento")} className="flex flex-col items-start leading-tight">
                  <span>Documento</span>
                  <span className="th-arrow">{sortKey === "documento" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                </button>
              </th>

              <th className="p-2 border-b">
                <button onClick={() => toggleSort("id")} className="flex flex-col items-start leading-tight">
                  <span>ID</span>
                  <span className="th-arrow">{sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                </button>
              </th>

              <th className="p-2 border-b">
                <button onClick={() => toggleSort("createdAt")} className="flex flex-col items-start leading-tight">
                  <span>Criado em</span>
                  <span className="th-arrow">{sortKey === "createdAt" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                </button>
              </th>

              <th className="p-2 border-b w-[420px]">
                <div className="flex flex-col items-start leading-tight">
                  <span>Ações</span>
                  <span className="th-arrow invisible">↕</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2 align-top">
                  <Link href={`/students/${s.id}`} className="font-medium hover:underline">
                    {s.nome}
                  </Link>
                </td>
                <td className="p-2 align-top text-gray-700">{s.documento || "—"}</td>
                <td className="p-2 align-top text-[11px] text-gray-500 break-all">{s.id}</td>
                <td className="p-2 align-top">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="p-2 align-top">
                  <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/historico/${s.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      rounded-lg border px-3 py-1.5 transition-colors
                      hover:bg-gray-100 hover:text-gray-900
                      dark:hover:bg-gray-100 dark:hover:text-gray-900
                    "
                  >
                    PDF
                  </a>
                  <a
                    href={`/api/historico/${s.id}/docx`}
                    className="
                      rounded-lg border px-3 py-1.5 transition-colors
                      hover:bg-gray-100 hover:text-gray-900
                      dark:hover:bg-gray-100 dark:hover:text-gray-900
                    "
                  >
                    DOCX
                  </a>

                  <Link
                    href={`/students/${s.id}`}
                    className="
                      rounded-lg border px-3 py-1.5 transition-colors
                      hover:bg-gray-100 hover:text-gray-900
                      dark:hover:bg-gray-100 dark:hover:text-gray-900
                    "
                  >
                    Detalhes
                  </Link>

                   
                  <button
                    onClick={() => setEditing(s)}
                    className="
                      rounded-lg border px-3 py-1.5 transition-colors
                      hover:bg-gray-100 hover:text-gray-900
                      dark:hover:bg-gray-100 dark:hover:text-gray-900
                    "
                  >
                    Editar
                  </button>

                    <button
                      className="rounded-lg border px-3 py-1.5 hover:bg-red-50 text-red-700"
                      onClick={() => onDelete(s.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visible.length === 0 && !loading && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  Nenhum aluno encontrado. Adicione um no formulário acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal simples de edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] text-[var(--foreground)] rounded-xl border w-full max-w-lg p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Editar aluno</h2>
              <button className="text-sm hover:underline" onClick={() => setEditing(null)}>
                Fechar
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Nome</span>
                <input
                  name="nome"
                  defaultValue={editing.nome}
                  required
                  className="border rounded-lg px-3 py-2"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Documento</span>
                <input
                  name="documento"
                  defaultValue={editing.documento ?? ""}
                  className="border rounded-lg px-3 py-2"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Nascimento (YYYY-MM-DD)</span>
                <input
                  name="nascimento"
                  type="date"
                  defaultValue={editing.nascimento ? editing.nascimento.slice(0, 10) : ""}
                  className="border rounded-lg px-3 py-2"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button
                  disabled={saving}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
