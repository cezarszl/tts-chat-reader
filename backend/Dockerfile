FROM node:20-bookworm AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm ci --omit=dev

FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y wget gnupg \
  && mkdir -p /etc/apt/keyrings \
  && wget -O- https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor > /etc/apt/keyrings/adoptium.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list \
  && apt-get update \
  && apt-get install -y temurin-21-jre \
    chromium \
    fonts-liberation fonts-noto fonts-noto-color-emoji \
    ca-certificates curl tar bash \
    dbus \
  && rm -rf /var/lib/apt/lists/*

ENV SIGNAL_VERSION=0.13.22

RUN dbus-uuidgen > /etc/machine-id

RUN curl -fsSL -o /tmp/signal-cli.tgz \
      https://github.com/AsamK/signal-cli/releases/download/v${SIGNAL_VERSION}/signal-cli-${SIGNAL_VERSION}.tar.gz \
  && tar -xzf /tmp/signal-cli.tgz -C /opt \
  && ln -sf /opt/signal-cli-${SIGNAL_VERSION}/bin/signal-cli /usr/local/bin/signal-cli \
  && rm /tmp/signal-cli.tgz

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV SIGNAL_CLI_PATH=signal-cli

RUN mkdir -p /data/signal \
    /data/uploads \
    /data/whatsapp/session \
    /data/whatsapp/cache \
    /data/tts \
    /data/messages

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]