// src/app/enrollments/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim().length) return error;
  return fallback;
}

type Student = { id: string; nome: string };
type SchoolYear = { anoLetivo: number; etapa: string } | null | undefined;
type ClassRow = { id: string; turma: string; turno: string; schoolYear?: SchoolYear };
type Enrollment = {
  id: string;
  student: Student;
  class: ClassRow;
  resultadoFinal: string | null;
  cargaHorariaTotal: number | null;
  frequenciaFinal: number | null;
};

export default function EnrollmentsPage() {
  const { theme, systemTheme } = useTheme();
  const activeTheme = theme === "system" ? systemTheme : theme;
  const isDark = activeTheme === "dark";

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [list, setList] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // ===== Paleta responsiva entre light / dark =====
  const inputBase =
    "rounded-lg px-3 py-2 border border-black bg-white text-sm text-black " +
    "placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-black/30 " +
    "dark:border-white/20 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400 dark:focus:ring-white/20";

  const btnBase =
    "rounded-lg border border-black px-3 py-1.5 text-sm text-black transition-colors disabled:opacity-50 " +
    "hover:bg-neutral-100 dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black";

  const btnDanger =
    "rounded-lg border border-red-600 px-3 py-1.5 text-sm text-red-700 transition-colors disabled:opacity-50 " +
    "hover:bg-red-50 dark:border-red-400 dark:text-red-300 dark:hover:bg-white dark:hover:text-black";

  const cardLight =
    "rounded-xl border border-black bg-white p-4 text-black shadow-sm " +
    "dark:bg-transparent dark:border-white/10 dark:text-white";

  const tableWrapper =
    "rounded-xl border border-black overflow-auto bg-white text-black shadow-sm " +
    "dark:bg-transparent dark:border-white/10 dark:text-white";

  const theadClass =
    "bg-neutral-100 text-black " +
    "dark:text-white dark:bg-[color-mix(in_oklab,var(--background),#fff_8%)]";

  const thClass =
    "p-2 text-left border-b border-black font-medium text-black " +
    "dark:text-white dark:border-white/10";

  const tdClass =
    "p-2 align-top border-t border-black/30 text-black " +
    "dark:text-white dark:border-white/10";

  // ===== utils =====
  async function safeJson(res: Response) {
    const t = await res.text();
    if (!t) return null;
    try { return JSON.parse(t); } catch { return null; }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stRes, clRes, enRes] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }),
        fetch("/api/classes", { cache: "no-store" }),
        fetch("/api/enrollments", { cache: "no-store" }),
      ]);
      if (!stRes.ok || !clRes.ok || !enRes.ok) throw new Error("Falha ao carregar matrículas/alunos/turmas.");
      const [st, cl, en] = await Promise.all([safeJson(stRes), safeJson(clRes), safeJson(enRes)]);
      setStudents(Array.isArray(st) ? st : []);
      setClasses(Array.isArray(cl) ? cl : []);
      setList(Array.isArray(en) ? en : []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Erro ao carregar dados."));
      setStudents([]); setClasses([]); setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const studentId = String(fd.get("studentId") || "");
    const classId = String(fd.get("classId") || "");
    if (!studentId || !classId) return;

    setSaving(true);
    try {
      const r = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classId }),
      });
      if (!r.ok) {
        const j = await safeJson(r);
        throw new Error(j?.error || "Erro ao matricular.");
      }
      formRef.current?.reset?.();
      await load();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Falha ao matricular."));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir esta matrícula?")) return;
    const prev = list;
    setList((cur) => cur.filter((e) => e.id !== id));
    try {
      const r = await fetch(`/api/enrollments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await safeJson(r);
        throw new Error(j?.error || "Erro ao excluir matrícula.");
      }
    } catch (error: unknown) {
      setList(prev);
      setError(getErrorMessage(error, "Falha ao excluir matrícula."));
    }
  }

  async function onSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      resultadoFinal: String(fd.get("resultadoFinal") || "") || null,
      cargaHorariaTotal: fd.get("cargaHorariaTotal") ? Number(fd.get("cargaHorariaTotal")) : null,
      frequenciaFinal: fd.get("frequenciaFinal") ? Number(fd.get("frequenciaFinal")) : null,
    };

    try {
      const r = await fetch(`/api/enrollments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = await safeJson(r);
        throw new Error(j?.error || "Erro ao salvar matrícula.");
      }
      const updated = await safeJson(r);
      setList((cur) => cur.map((en) => (en.id === editing.id ? { ...en, ...updated } : en)));
      setEditing(null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Falha ao salvar matrícula."));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <section className="space-y-4 text-black dark:text-white">
      <h1 className="text-xl font-semibold text-black dark:text-white">Matrículas</h1>

      {error && (
        <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulário (cartão claro com borda escura) */}
      <form
        ref={formRef}
        onSubmit={onCreate}
        className={cardLight + " grid gap-2 sm:grid-cols-4"}
        style={isDark ? undefined : { color: "#111", borderColor: "#111" }}
      >
        <select
          name="studentId"
          required
          className={inputBase}
          style={
            isDark
              ? { color: "#fff", backgroundColor: "#111", borderColor: "rgba(255,255,255,0.35)" }
              : { color: "#111", borderColor: "#111", backgroundColor: "#fff" }
          }
        >
          <option value="">Nome…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>

        <select
          name="classId"
          required
          className={inputBase}
          style={
            isDark
              ? { color: "#fff", backgroundColor: "#111", borderColor: "rgba(255,255,255,0.35)" }
              : { color: "#111", borderColor: "#111", backgroundColor: "#fff" }
          }
        >
          <option value="">Turma…</option>
          {classes.map((c) => {
            const sy = c.schoolYear;
            const label = sy ? `${sy.anoLetivo} — ${sy.etapa}` : "— (sem ano letivo)";
            return (
              <option key={c.id} value={c.id}>
                {label} · {c.turma} ({c.turno})
              </option>
            );
          })}
        </select>

        <div className="sm:col-span-2">
          <button
            className={btnBase}
            disabled={saving}
            style={isDark ? undefined : { color: "#111", borderColor: "#111" }}
          >
            {saving ? "Matriculando…" : "Matricular"}
          </button>
        </div>
      </form>

      {loading && !list.length && <div className="text-sm text-black dark:text-neutral-400">Carregando…</div>}

      {/* Tabela (layout forte no LIGHT; dark intocado) */}
      <div className={tableWrapper} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>
        <table className="w-full text-sm text-black dark:text-white" style={isDark ? undefined : { color: "#111" }}>
          <thead className={theadClass} style={isDark ? undefined : { color: "#111" }}>
            <tr>
              <th className={thClass} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>Aluno</th>
              <th className={thClass} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>Turma</th>
              <th className={thClass} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>Resultado</th>
              <th className={thClass} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>CH</th>
              <th className={thClass} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>Freq.</th>
              <th className={thClass + " text-right w-[160px]"} style={isDark ? undefined : { color: "#111", borderColor: "#111" }}>Ações</th>
            </tr>
          </thead>
          <tbody style={isDark ? undefined : { color: "#111" }}>
            {list.map((e, i) => {
              const sy = e.class.schoolYear;
              const turmaLabel = sy
                ? `${sy.anoLetivo} — ${sy.etapa} · ${e.class.turma} (${e.class.turno})`
                : `— (sem ano letivo) · ${e.class.turma} (${e.class.turno})`;

              return (
                <tr
                  key={e.id}
                  className={`${i % 2 ? "bg-neutral-50" : "bg-white"} border-t border-black/20 text-black dark:border-white/10 dark:bg-transparent dark:text-white`}
                  style={isDark ? undefined : { color: "#111" }}
                >
                  <td className={tdClass} style={isDark ? undefined : { color: "#111" }}>{e.student.nome}</td>
                  <td className={tdClass} style={isDark ? undefined : { color: "#111" }}>{turmaLabel}</td>
                  <td className={tdClass} style={isDark ? undefined : { color: "#111" }}>{e.resultadoFinal ?? "—"}</td>
                  <td className={tdClass} style={isDark ? undefined : { color: "#111" }}>{e.cargaHorariaTotal ?? "—"}</td>
                  <td className={tdClass} style={isDark ? undefined : { color: "#111" }}>{e.frequenciaFinal != null ? `${e.frequenciaFinal}%` : "—"}</td>
                  <td className={tdClass + " text-right"} style={isDark ? undefined : { color: "#111" }}>
                    <button
                      type="button"
                      className={btnBase}
                      onClick={() => setEditing(e)}
                      style={isDark ? undefined : { color: "#111", borderColor: "#111" }}
                    >
                      Editar
                    </button>
                    <button type="button" className={btnDanger + " ml-2"} onClick={() => onDelete(e.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}

            {!loading && list.length === 0 && (
              <tr>
                <td className="p-2" style={isDark ? undefined : { color: "#111" }} colSpan={6}>
                  Nenhuma matrícula
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            className="bg-white text-black dark:bg-[var(--background)] dark:text-[var(--foreground)] rounded-xl border border-black dark:border-white/10 w-full max-w-lg p-4 shadow-xl"
            style={isDark ? undefined : { color: "#111", borderColor: "#111" }}
          >
            <div className="flex items-center justify-between mb-3" style={isDark ? undefined : { color: "#111" }}>
              <h2 className="text-lg font-semibold" style={isDark ? undefined : { color: "#111" }}>
                Editar matrícula
              </h2>
              <button
                className="text-sm hover:underline"
                onClick={() => setEditing(null)}
                style={isDark ? undefined : { color: "#111" }}
              >
                Fechar
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="grid gap-3">
              <label className="grid gap-1" style={isDark ? undefined : { color: "#111" }}>
                <span
                  className="text-xs dark:text-neutral-300"
                  style={isDark ? undefined : { color: "#111" }}
                >
                  Resultado
                </span>
                <select
                  name="resultadoFinal"
                  defaultValue={editing.resultadoFinal ?? ""}
                  className={inputBase}
                  style={
                    isDark
                      ? { color: "#fff", backgroundColor: "#111", borderColor: "rgba(255,255,255,0.35)" }
                      : { color: "#111", borderColor: "#111", backgroundColor: "#fff" }
                  }
                >
                  <option value="">—</option>
                  <option value="APROVADO">APROVADO</option>
                  <option value="REPROVADO">REPROVADO</option>
                  <option value="APROVADO_CONSELHO">APROVADO_CONSELHO</option>
                  <option value="TRANSFERIDO">TRANSFERIDO</option>
                </select>
              </label>

              <label className="grid gap-1" style={isDark ? undefined : { color: "#111" }}>
                <span
                  className="text-xs dark:text-neutral-300"
                  style={isDark ? undefined : { color: "#111" }}
                >
                  Carga horária total
                </span>
                <input
                  name="cargaHorariaTotal"
                  type="number"
                  min={0}
                  defaultValue={editing.cargaHorariaTotal ?? ""}
                  className={inputBase}
                  style={
                    isDark
                      ? { color: "#fff", backgroundColor: "#111", borderColor: "rgba(255,255,255,0.35)" }
                      : { color: "#111", borderColor: "#111", backgroundColor: "#fff" }
                  }
                />
              </label>

              <label className="grid gap-1" style={isDark ? undefined : { color: "#111" }}>
                <span
                  className="text-xs dark:text-neutral-300"
                  style={isDark ? undefined : { color: "#111" }}
                >
                  Frequência (%)
                </span>
                <input
                  name="frequenciaFinal"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  defaultValue={editing.frequenciaFinal ?? ""}
                  className={inputBase}
                  style={
                    isDark
                      ? { color: "#fff", backgroundColor: "#111", borderColor: "rgba(255,255,255,0.35)" }
                      : { color: "#111", borderColor: "#111", backgroundColor: "#fff" }
                  }
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={btnBase}
                  onClick={() => setEditing(null)}
                  style={isDark ? undefined : { color: "#111", borderColor: "#111" }}
                >
                  Cancelar
                </button>
                <button
                  disabled={savingEdit}
                  className={btnBase}
                  style={isDark ? undefined : { color: "#111", borderColor: "#111" }}
                >
                  {savingEdit ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
