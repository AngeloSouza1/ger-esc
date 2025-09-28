// src/components/SubjectPicker.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; nome: string; cargaHorariaAnual: number | null };

export default function SubjectPicker({
  enrollmentId,
  initiallySelected,
  onChanged,
}: {
  enrollmentId: string;
  initiallySelected: { id: string; nome: string }[];
  onChanged?: () => void;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<Subject[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initiallySelected.map((s) => s.id))
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // sempre que abrir, ressincroniza a seleção e foca a busca
  useEffect(() => {
    if (!open) return;
    setSelected(new Set(initiallySelected.map((s) => s.id)));
    // foco no campo de busca
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, initiallySelected]);

  // carrega subjects ao abrir (com cancelamento)
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/subjects", {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Falha ao buscar componentes");
        const data: Subject[] = await res.json();
        setAll(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error(err);
          alert("Erro ao carregar componentes.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((s) => s.nome.toLowerCase().includes(term));
  }, [all, q]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/grades`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Falha ao salvar componentes");
      setOpen(false);
      router.refresh(); // refaz o fetch do Server Component
      onChanged?.();
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // fecha ao clicar no backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  // evita "Enter" salvar quando estiver digitando no input
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter") {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag !== "INPUT" && !saving) handleSave();
    }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        Gerenciar componentes
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          <div
            className="w-full max-w-3xl rounded-xl border bg-[var(--background)] p-4 text-[var(--foreground)] shadow-xl"
            // impede clique dentro de fechar o modal
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Selecionar componentes</h2>
              <button
                type="button"
                className="text-sm hover:underline"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar componente por nome"
                className="w-full rounded border px-3 py-2 sm:w-72"
                aria-label="Buscar componente"
              />
              <div className="ml-auto flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  onClick={() => setSelected(new Set(filtered.map((s) => s.id)))}
                >
                  Selecionar tudo
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  onClick={() => setSelected(new Set())}
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="mt-3 h-[360px] overflow-auto rounded border">
              {loading ? (
                <div className="p-3 text-sm text-gray-500">
                  Carregando componentes…
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">
                  Nenhum componente encontrado.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="w-[48px] border-b p-2 text-left">Sel.</th>
                      <th className="border-b p-2 text-left">Componente</th>
                      <th className="border-b p-2 text-left">CH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const checked = selected.has(s.id);
                      return (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(s.id)}
                              aria-label={`Selecionar ${s.nome}`}
                            />
                          </td>
                          <td className="p-2">{s.nome}</td>
                          <td className="p-2">
                            {s.cargaHorariaAnual ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-600">
                Selecionados: {selected.size}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Salvando…" : "Salvar seleção"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
