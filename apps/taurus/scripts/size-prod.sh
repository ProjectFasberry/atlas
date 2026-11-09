#!/bin/sh
set -eu

out="$(mktemp)"
trap 'rm -f "$out"' EXIT

node ../../scripts/build-size.mjs \
  --app taurus \
  --stage prod \
  --branch "${BUILD_METRICS_BRANCH:-main}" \
  --commit "${BUILD_METRICS_COMMIT:-$(git rev-parse HEAD)}" \
  --out "$out"

if [ -n "${BUILD_METRICS_TOKEN:-}" ]; then
  curl -fsS -X POST "${BUILD_METRICS_URL:-https://panel.fasberry.fun}/metrics/build" \
    -H "Authorization: Bearer ${BUILD_METRICS_TOKEN}" \
    -H "content-type: application/json" \
    --data @"$out"
else
  echo "BUILD_METRICS_TOKEN is not set, metrics were not uploaded"
fi
