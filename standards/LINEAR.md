# Linear

Work for this repo is tracked in Linear: workspace **modkeep**, team **main**
(`MN`), project **Fasberry** (`P-MN-1`). This file is the label/priority
convention and the short recipe for agents.

## Where things live

| Entity | Value | ID |
|---|---|---|
| Workspace | modkeep | `b9fec801-6f1d-4e39-84d3-d8ab0d6378b7` |
| Team | main (`MN`) | `f4b55ccf-8c00-41a9-a55e-d8231e51c676` |
| Project | Fasberry (`P-MN-1`) | `8aa86643-28ec-4edd-bc45-066b269101b5` |

## Labels

Every issue created by an agent gets `AI`, plus the label of the app it belongs
to. The three apps in this monorepo are:

| Label | ID | Use for |
|---|---|---|
| `AI` | `7a671200-4b24-4682-9eaf-c21f2d8619b3` | every agent-created issue |
| `minotaur` | `13262f74-6b30-4207-8cd2-bc18abd55235` | anything inside `apps/minotaur` (web client) |
| `taurus` | `9ad236c0-df71-4767-9284-aca2197cae57` | anything inside `apps/taurus` (landing site) |
| `wiki` | `b9ae905c-fd03-490d-bdf1-7161b004b5e5` | anything inside `apps/wiki` |
| `Infra` | `8bd80203-ee68-4e79-8658-7ea85692b553` | hosts, docker, networks, CI, deploy |
| `Bug` / `Feature` / `Improvement` | `a1b02f33-…` / `4d89a6fe-…` / `1f96a8df-…` | kind of work, optional |

An issue that needs changes on both sides of an app/API boundary gets both app
labels (for example `minotaur` + `thunderbird`). The backend labels (`api`,
`thunderbird`, `janus`, `config`, `bisquite`) belong to the aether/mods repos and
live in the same team; use them only for issues that touch those repos.

Create or rename a label with `save_issue_label`; attach it with `addLabels`
(see below). Labels are team-scoped, so pass `team: 'main'`.

## Priority mapping

| Our severity | Linear `priority` | Name |
|---|---|---|
| P0 | `1` | Urgent |
| P1 (high) | `2` | High |
| P2 (mid) | `3` | Medium |
| P3 (low) | `4` | Low |

`0` is "No priority", never use it for a real finding. Audit findings at mid
severity or higher get P1/P2 and a "Bug" label; do not file low-severity polish
from an audit batch unless it is asked for.

## Creating a batch

```js
await tools.linear.save_issue({
  team: 'main',
  project: 'P-MN-1',
  title,
  description,          // markdown, real newlines
  priority: 3,          // P2 / mid
  state: 'Backlog',
  addLabels: ['AI', 'minotaur', 'Bug'],
});
```

Check for duplicates first: `list_issues({ project: 'P-MN-1', limit: 100 })`
returns `{ issues: [...] }`. `save_issue` returns little, so verify created
issues with a second `list_issues` call.

## Issue shape

An audit finding is one issue and answers:

- **Where** - file and function, exact paths.
- **Why** - impact in production, not a restatement of the code.
- **Fix** - a concrete change someone can start from.

Keep the description short (5-8 lines). Routes, schemas and process details
belong in the description; long analysis goes to a linked Linear document.

## Gotchas

- Create needs both `team` and `project`; update takes only `id`.
- `labels` replaces the whole set and silently drops `AI`; prefer `addLabels`.
- The Linear API answers 403 "not available in your region" from Russia; the
  Windows host needs VPN egress, do not retry in a loop.
- Inside `execute`, backticks break the template literal - write descriptions
  without inline code ticks or build them with single quotes.
- Issue identifiers are `MN-<n>`; `P-MN-1` is the project, not an issue.
