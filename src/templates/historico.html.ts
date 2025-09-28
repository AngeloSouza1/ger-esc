// src/templates/historico.html.ts
export type HistoricoHTMLAluno = {
  nome: string;
  documento?: string | null;
  nascimento?: string | null; // já formatado
  id?: string;                // opcional
};

export type HistoricoHTMLDisciplina = {
  nome: string;
  cargaHorariaAnual?: number | null;
  notaFinal?: number | string | null;
  faltas?: number | null;
};

export type HistoricoHTMLBloco = {
  anoLetivo: number;
  etapa: string;
  turma: string;
  turno: string;
  frequenciaFinal?: number | null;
  resultadoFinal?: string | null;
  cargaHorariaTotal?: number | null;
  disciplinas: HistoricoHTMLDisciplina[];
};

export type HistoricoHTMLProps = {
  aluno: HistoricoHTMLAluno;
  blocos?: HistoricoHTMLBloco[]; // ← pode vir undefined
  qrDataUrl: string;
  app_url?: string;
  documento_hash?: string;
  cidade?: string;
  data_emissao?: string;
  diretor_nome?: string;
  diretor_matricula?: string;
  secretario_nome?: string;
  secretario_matricula?: string;
  bannerDataUrl?: string;
};

function fmtNumBR(n?: number | null, dec = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  try {
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  } catch {
    return String(n);
  }
}
function safe(s?: string | null) {
  return s ?? "";
}

export function historicoHTML(props: HistoricoHTMLProps) {
  const {
    aluno,
    qrDataUrl,
    app_url = process.env.APP_PUBLIC_URL || "",
    documento_hash = "—",
    cidade = "—",
    data_emissao = new Date().toLocaleDateString("pt-BR"),
    diretor_nome = "—",
    diretor_matricula = "—",
    secretario_nome = "—",
    secretario_matricula = "—",
    bannerDataUrl,
  } = props;

  const blocos = Array.isArray(props.blocos) ? props.blocos : []; // ← blindagem

  const linhas = blocos
    .map((b) => {
      const disciplinas = Array.isArray(b.disciplinas) ? b.disciplinas : []; // ← blindagem
      const linhasDisciplinas = disciplinas
        .map((d) => {
          const ch = d.cargaHorariaAnual ?? "";
          const nota =
            typeof d.notaFinal === "number"
              ? fmtNumBR(d.notaFinal, 1).replace(".", ",")
              : safe(d.notaFinal);
          const faltas = d.faltas ?? "";
          return `
            <tr>
              <td>${safe(d.nome)}</td>
              <td class="num">${ch}</td>
              <td class="num">${nota}</td>
              <td class="num">${faltas}</td>
            </tr>`;
        })
        .join("");

      const freq = b.frequenciaFinal == null ? "" : fmtNumBR(b.frequenciaFinal, 0);
      const chTotal = b.cargaHorariaTotal == null ? "" : fmtNumBR(b.cargaHorariaTotal, 0);

      return `
        <section class="matricula">
          <h3>${b.anoLetivo} — ${safe(b.etapa)} <span class="muted">(Turma ${safe(b.turma)}, ${safe(b.turno)})</span></h3>

          <table class="tabela">
            <thead>
              <tr>
                <th>Componente</th>
                <th class="num">CH</th>
                <th class="num">Nota</th>
                <th class="num">Faltas</th>
              </tr>
            </thead>
            <tbody>
              ${linhasDisciplinas || `<tr><td colspan="4" class="muted">Sem lançamentos</td></tr>`}
            </tbody>
          </table>

          <div class="resumo">
            <div><b>Frequência:</b> ${freq ? `${freq}%` : "—"}</div>
            <div><b>Resultado:</b> ${safe(b.resultadoFinal) || "—"}</div>
            <div><b>CH Total:</b> ${chTotal || "—"}</div>
          </div>
        </section>
      `;
    })
    .join("");

  const verificaUrl = app_url ? `${app_url}/verificar/historico` : "#";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Histórico Escolar</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    :root{
      --fg:#111;
      --muted:#6b7280;
      --line:#e5e7eb;
      --accent:#111;
    }
    *{ box-sizing:border-box }
    body{
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      color: var(--fg);
      background: #fff;
      margin: 24px;
      font-size: 13px;
      line-height: 1.45;
    }
    header.site{
      display:flex; align-items:center; gap:16px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--line);
    }
    header.site .title{ font-size:20px; font-weight:700; letter-spacing:.2px; }
    .banner{
      width: 72px; height: 72px; object-fit:contain; border-radius:8px; border:1px solid var(--line); background:#f9fafb;
    }
    .aluno{ display:grid; grid-template-columns: 1fr; gap:4px; margin-bottom:12px; }
    .aluno b{ font-weight:600 }
    .muted{ color: var(--muted) }
    h3{ font-size:14px; margin:16px 0 8px; }
    .matricula{ padding:12px 0; border-top:1px dashed var(--line) }
    .tabela{ width:100%; border-collapse:separate; border-spacing:0; border:1px solid var(--line); }
    .tabela thead th{ text-align:left; padding:8px; border-bottom:1px solid var(--line); background:#f9fafb; }
    .tabela td{ padding:8px; border-top:1px solid var(--line); }
    .tabela .num{ text-align:right; white-space:nowrap }
    .resumo{ display:flex; gap:16px; flex-wrap:wrap; padding-top:8px; color:#111; }
    .assinaturas{ display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-top:24px; }
    .assinaturas .line{ height:1px; background:#111; margin:36px 0 6px; }
    .rodape{ display:flex; align-items:center; gap:12px; margin-top:20px; border-top:1px solid var(--line); padding-top:12px; }
    small{ color:var(--muted) }
    @media print {
      a[href^="http"]::after{ content:""; }
      body{ margin: 16mm; }
      header.site{ margin-bottom:10mm; }
    }
  </style>
</head>
<body>
  <header class="site">
    ${bannerDataUrl ? `<img src="${bannerDataUrl}" alt="Brasão/Logo" class="banner"/>` : ""}
    <div>
      <div class="title">DECLARAÇÃO DE HISTÓRICO ESCOLAR</div>
      <div class="muted">Documento gerado eletronicamente</div>
    </div>
  </header>

  <section class="aluno">
    <div><b>Aluno:</b> ${safe(aluno?.nome)}</div>
    <div><b>Documento:</b> ${safe(aluno?.documento)}</div>
    <div><b>Nascimento:</b> ${safe(aluno?.nascimento)}</div>
    ${aluno?.id ? `<div><b>ID:</b> ${aluno.id}</div>` : ""}
    ${documento_hash ? `<div><b>Hash:</b> ${documento_hash}</div>` : ""}
  </section>

  ${linhas || `<p class="muted">Sem matrículas para exibir.</p>`}

  <section class="assinaturas">
    <div>
      <div class="line"></div>
      <div><b>Diretor(a):</b> ${safe(diretor_nome)} <span class="muted">(Matrícula: ${safe(diretor_matricula)})</span></div>
    </div>
    <div>
      <div class="line"></div>
      <div><b>Secretário(a):</b> ${safe(secretario_nome)} <span class="muted">(Matrícula: ${safe(secretario_matricula)})</span></div>
    </div>
  </section>

  <section class="rodape">
    <img src="${qrDataUrl}" width="96" height="96" alt="QR de verificação"/>
    <div>
      <div><b>Local e data:</b> ${safe(cidade)}, ${safe(data_emissao)}</div>
      <small>Validação online: ${verificaUrl}</small>
    </div>
  </section>
</body>
</html>`;
}
