// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ignora erros de ESLint no build de produção (Vercel incluso)
  eslint: { ignoreDuringBuilds: true },

  // opcional: se quiser ignorar também erros de TypeScript no build
  // (não é estritamente necessário para esses erros de ESLint)
  // typescript: { ignoreBuildErrors: true },

  // remove o aviso do Turbopack sobre root
  turbopack: { root: __dirname },

  // se você tiver rotas que precisam Node.js (ex: PDF),
  // pode manter por rota com `export const runtime = "nodejs";`
};

export default nextConfig;
