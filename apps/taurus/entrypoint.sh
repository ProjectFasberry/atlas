#!/bin/sh

set -e
exec bun run ./dist/server/index.mjs
