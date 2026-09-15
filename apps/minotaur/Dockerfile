FROM oven/bun:1-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  unzip \
  && rm -rf /var/lib/apt/lists/*

ARG STAGE
ENV STAGE=$STAGE

WORKDIR /

COPY apps/minotaur/dist ./dist
COPY apps/minotaur/package.json ./package.json
COPY apps/minotaur/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production

USER bun
CMD ["/bin/sh", "/entrypoint.sh"]
