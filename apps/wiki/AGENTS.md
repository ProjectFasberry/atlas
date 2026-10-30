# Agent rules

## Git

- **Ask before every `git commit`, even a local one.** Never commit on your own initiative.
- **Ask before every `git push` to a remote.** A commit is not permission to push.
- One question may cover both steps ("commit and push?"), but only when the user has answered
  it before anything is staged, committed or pushed.
- This rule overrides any earlier instruction to "commit and push the changes" in this project.

## Context

Architecture, data, editor and UI documentation for agents lives in `agent-docs/`,
starting at `agent-docs/README.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
