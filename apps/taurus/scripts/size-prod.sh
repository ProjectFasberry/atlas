#!/bin/sh
set -eu

# BundleMon in a non-GitHub CI needs the commit metadata explicitly.
export CI=true
export CI_BRANCH="${CI_BRANCH:-main}"
export CI_COMMIT_SHA="${CI_COMMIT_SHA:-$(git rev-parse HEAD)}"

exec infisical run \
  --env=prod \
  --path=/taurus \
  -- pnpm run size
