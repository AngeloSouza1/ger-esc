// src/lib/pdf.service.ts
import puppeteer from "puppeteer";

type PdfOptions = {
  html: string;
  fileName?: string;
};

export async function generatePdfFromHtml({ html }: PdfOptions): Promise<Buffer> {
  // Vercel (produção): usar @sparticuz/chromium + puppeteer-core.
  // Local/Docker: usar puppeteer completo (com binário baixado ou PUPPETEER_EXECUTABLE_PATH).
  let browser: import("puppeteer").Browser;

  if (process.env.VERCEL) {
    const chromium = await import("@sparticuz/chromium");
    const pptr = await import("puppeteer-core");

    const executablePath = await chromium.executablePath();
    browser = await pptr.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
    } as any);
  } else {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const launchOpts: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };
    if (executablePath) (launchOpts as any).executablePath = executablePath;
    browser = await puppeteer.launch(launchOpts);
  }

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
