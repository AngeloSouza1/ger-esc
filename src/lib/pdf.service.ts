// src/lib/pdf.service.ts
import puppeteer from "puppeteer";

type PdfOptions = {
  html: string;
  fileName?: string;
};

export async function generatePdfFromHtml({ html }: PdfOptions): Promise<Buffer> {
  // Em produção (Docker) usamos o Chromium do sistema (env setado no Dockerfile).
  // Em desenvolvimento local, deixe o Puppeteer usar o binário baixado automaticamente
  // (não force executablePath se a env não estiver definida).
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const launchOpts: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  if (executablePath) {
    // no container Debian/Alpine normalmente: /usr/bin/chromium
    (launchOpts as any).executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
