"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteStudentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      className="iconbtn"
      title="Excluir"
      onClick={() =>
        start(async () => {
          if (!confirm("Tem certeza que deseja excluir este aluno?")) return;
          const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j?.error || "Falha ao excluir");
            return;
          }
          router.refresh();
        })
      }
      disabled={pending}
      aria-busy={pending}
    >
      🗑️
    </button>
  );
}
