# --- BUILD STAGE ---
FROM node:20-bookworm AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# budujemy TypeScript -> dist
RUN npm run build

# przerabiamy node_modules na prod-only (bez devDependencies)
RUN npm ci --omit=dev


# --- RUNTIME STAGE ---
FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# 1) Java + Chromium + fonts (Signal + WhatsApp)
RUN apt-get update && apt-get install -y wget gnupg \
  && mkdir -p /etc/apt/keyrings \
  && wget -O- https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor > /etc/apt/keyrings/adoptium.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list \
  && apt-get update \
  && apt-get install -y temurin-21-jre \
    chromium \
    fonts-liberation fonts-noto fonts-noto-color-emoji \
    ca-certificates curl tar bash \
  && rm -rf /var/lib/apt/lists/*
# 2) signal-cli (JVM, non-native)
ENV SIGNAL_VERSION=0.13.22

RUN curl -fsSL -o /tmp/signal-cli.tgz \
      https://github.com/AsamK/signal-cli/releases/download/v${SIGNAL_VERSION}/signal-cli-${SIGNAL_VERSION}.tar.gz \
  && tar -xzf /tmp/signal-cli.tgz -C /opt \
  && ln -sf /opt/signal-cli-${SIGNAL_VERSION}/bin/signal-cli /usr/local/bin/signal-cli \
  && rm /tmp/signal-cli.tgz

# 3) użytkownik + katalog
WORKDIR /app
# RUN useradd -ms /bin/bash appuser
# USER appuser

# 4) ENV spójne z docker-compose
ENV NODE_ENV=production
ENV PORT=3000
ENV TMPDIR=/var/tmp
ENV JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=/var/tmp"
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV SIGNAL_CONFIG_DIR=/signal-data
ENV SIGNAL_CLI_PATH=signal-cli
ENV UPLOADS_DIR=/uploads

# 5) wolumeny na dane
VOLUME ["/signal-data", "/.wwebjs_auth", "/.wwebjs_cache", "/uploads"]

# 6) kopiujemy gotowe rzeczy z build-stage
COPY --chown=appuser:appuser --from=build /app/package*.json ./
COPY --chown=appuser:appuser --from=build /app/node_modules ./node_modules
COPY --chown=appuser:appuser --from=build /app/dist ./dist
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["node", "dist/index.js"]
