// src/lib/pdf.service.ts
import puppeteer from "puppeteer";

type PdfOptions = {
  html: string;
  fileName?: string;
};

export async function generatePdfFromHtml({ html }: PdfOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    // usa o Chromium instalado no container (definido no Dockerfile)
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

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
