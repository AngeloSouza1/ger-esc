"use client";

import { useState } from "react";

export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const [ok, setOk] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    } catch {
      // fallback simples
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); setOk(true); setTimeout(()=>setOk(false), 1200); }
      finally { document.body.removeChild(area); }
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`p-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800 ${className ?? ""}`}
      aria-label="Copiar link de verificação"
      title="Copiar link de verificação"
    >
      <span aria-hidden>{ok ? "✅" : "📋"}</span>
    </button>
  );
}
