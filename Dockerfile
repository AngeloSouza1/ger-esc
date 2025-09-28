# app/Dockerfile
FROM node:20-bookworm-slim

# 1) Dependências do Chromium (para Puppeteer gerar PDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  fonts-liberation fonts-noto-core fonts-noto-color-emoji \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
  libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 \
  libxext6 libxfixes3 libxkbcommon0 libxrandr2 xdg-utils tzdata \
  && rm -rf /var/lib/apt/lists/*

# 2) Puppeteer: use Chromium do sistema e não baixe outro
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 3) Config Next/Node
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app

# 4) Copia manifestos e schema (para cache melhor do npm ci)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# 5) Instala dependências (postinstall do Prisma roda aqui)
RUN npm ci

# 6) Copia o restante do código
COPY . .

# 7) Exponha a porta do app
EXPOSE 3000

# 8) Comando padrão: desenvolvimento com Turbopack
#    (para produção, troque por:  RUN npm run build  &&  CMD ["npm","start"])
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
