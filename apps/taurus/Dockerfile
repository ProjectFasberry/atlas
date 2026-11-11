FROM oven/bun:1-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  && rm -rf /var/lib/apt/lists/*

ARG STAGE
ENV STAGE=$STAGE

WORKDIR /

# The client bundle is built in CI; the image only carries the runtime.
COPY apps/taurus/dist ./dist
COPY apps/taurus/package.json ./package.json
COPY apps/taurus/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3006

USER bun
CMD ["/bin/sh", "/entrypoint.sh"]
