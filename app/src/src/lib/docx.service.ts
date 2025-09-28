// src/lib/docx.service.ts
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export type DocxData = Record<string, any>;

/**
 * Renderiza um .docx a partir de um template e dados.
 * O template deve estar em src/templates/historico.docx
 * Delimitadores configurados para [[ ... ]].
 */
export function renderDocxFromTemplate(templateFilename: string, data: DocxData): Buffer {
  const templatePath = path.join(process.cwd(), "src", "templates", templateFilename);
  const content = fs.readFileSync(templatePath);

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // como seu template usa [[ ... ]], configuramos os delimitadores:
    delimiters: { start: "[[", end: "]]" },
  });

  // API nova: render() com os dados (substitui setData + render)
  doc.render(data);

  const out = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return out;
}
