// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function AppHeader() {
  return (
    <header className="border-b sticky top-0 bg-[var(--background)]/80 backdrop-blur z-50">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Gestão Escolar
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link className="hover:underline" href="/students">Alunos</Link>
          <Link className="hover:underline" href="/subjects">Componentes</Link>
          <Link className="hover:underline" href="/classes">Turmas</Link>
          <Link className="hover:underline" href="/enrollments">Matrículas</Link>
          <Link className="hover:underline" href="/reports">Relatórios</Link>
          <DarkModeToggle />
        </div>
      </nav>
    </header>
  );
}
