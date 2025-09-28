import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppHeader from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gestão Escolar",
  description: "Histórico Escolar e certificados em 1 clique",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} font-sans`}
    >
      <body className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>
          <AppHeader />

          <main className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 py-6 md:py-8">
            {children}
          </main>

          <footer className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 pb-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Gestão Escolar
          </footer>

          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
