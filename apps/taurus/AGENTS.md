# AGENTS.md — taurus

Read the repo rules in [`../../AGENTS.md`](../../AGENTS.md) first; they win.
App guides start at [`agent-docs/README.md`](./agent-docs/README.md).

- Taurus is Vike + Solid + Reatom, SSR, deployed as the `landing` Cloudflare
  Worker.
- No Solid signals/stores/context for state. Use atoms/actions and
  `useAtom`/`useCtx`.
- No hardcoded copy, domains or asset hosts.
- Do not commit, push or deploy without an explicit request.
