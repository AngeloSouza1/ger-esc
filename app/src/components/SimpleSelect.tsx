"use client";
import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function SimpleSelect({
  name,
  value,
  onChange,
  options,
  placeholder = "Selecione…",
  className = "",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);
  const currentIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  // fecha ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // teclado no botão
  function onButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      // foca lista depois que abrir
      requestAnimationFrame(() => listRef.current?.focus());
    }
  }

  // teclado na lista
  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      (rootRef.current?.querySelector("button[data-trigger]") as HTMLButtonElement | null)?.focus();
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-opt]") ?? []
      );
      if (items.length === 0) return;
      const idx = Math.max(
        0,
        items.findIndex((el) => el.dataset.value === value)
      );
      const next =
        e.key === "ArrowDown"
          ? Math.min(items.length - 1, idx + 1)
          : Math.max(0, idx - 1);
      items[next]?.focus();
    }
    if (e.key === "Enter" || e.key === " ") {
      // “Enter” aqui só confirma o item focado (o próprio item trata o click)
      e.preventDefault();
    }
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
    (rootRef.current?.querySelector("button[data-trigger]") as HTMLButtonElement | null)?.focus();
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* integra com <form> */}
      <input type="hidden" name={name} value={value} />

      {/* DISPARADOR — mesmo visual dos inputs de Alunos */}
      <button
        type="button"
        data-trigger
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${name}-listbox`}
        className={[
          "w-full border rounded-lg px-3 py-2 text-left transition",
          // Light: fundo claro/branco + texto escuro (igual Alunos)
          "bg-white text-gray-900",
          // Dark: sem branco chapado + texto claro
          "dark:bg-transparent dark:text-white",
          // Hover/Focus (igual Alunos)
          "hover:bg-gray-50 dark:hover:bg-white/5",
          "focus:outline-none focus:ring-2 focus:ring-black/15 dark:focus:ring-white/20",
          "disabled:opacity-50"
        ].join(" ")}
      >
        <span className={current ? "" : "text-gray-500 dark:text-gray-400"}>
          {current ? current.label : placeholder}
        </span>
        <span className="float-right opacity-60" aria-hidden="true">▾</span>
      </button>

      {/* LISTA — mesma lógica de cores do cabeçalho/menus nos outros screens */}
      {open && (
        <div
          id={`${name}-listbox`}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onListKeyDown}
          className={[
            "absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border shadow-md",
            // Light: painel branco; Dark: painel escuro suave (sem branco)
            "bg-white text-gray-900",
            "dark:bg-[color-mix(in_oklab,var(--background),#fff_6%)] dark:text-white"
          ].join(" ")}
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
              Sem opções
            </div>
          )}

          {options.map((o, idx) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={value === o.value}
              data-opt
              data-value={o.value}
              onClick={() => choose(o.value)}
              // foco inicial quando abre e não há valor selecionado
              autoFocus={open && value === "" && idx === Math.max(0, currentIndex)}
              className={[
                "block w-full text-left px-3 py-2 text-sm transition",
                // Hover: claro no light; leve no dark
                "hover:bg-gray-50 dark:hover:bg-white/10",
                // “selecionado” destacado sutilmente
                value === o.value ? "font-medium" : ""
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
