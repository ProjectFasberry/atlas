# Plane

Work for this repo is tracked in Plane: workspace **modkeep**, project
**Fasberry** (`FASBERRY`). This file is the label/priority convention and the
short recipe for agents.

## Where things live

| Entity | Value | ID |
|---|---|---|
| Workspace | modkeep | `cc826215-1001-4f5d-a33d-474ff272a14e` |
| Project | Fasberry (`FASBERRY`) | `a2c819ff-ba47-48eb-94b1-4d3156373eae` |
| Base API | `https://api.plane.so/api/v1/workspaces/modkeep` | `X-API-Key` header |

Agent identity is `opencode-agent`, project role **contributor**: work items and
comments are writable, project settings are not.

## Labels

Every issue created by an agent gets `AI`, plus the label of the app it belongs
to. The apps in this monorepo are:

| Label | ID | Use for |
|---|---|---|
| `AI` | `9452e69a-6104-467e-8fcd-3999a08fb342` | every agent-created issue |
| `minotaur` | `993c3a06-b4ff-4140-af5b-13a0671151f8` | anything inside `apps/minotaur` (web client) |
| `taurus` | `543218c5-0e1d-475b-9d2c-379530efa7ec` | anything inside `apps/taurus` (landing site) |
| `wiki` | `b2f3f7d2-0a9e-44f6-b656-9bdf8d415c9a` | anything inside `apps/wiki` |
| `infra` | `f6b2c354-43c4-43bf-ab97-4ae5ad5f1cba` | hosts, docker, networks, CI, deploy |
| `Bug` | `e37a0a58-bf55-48c1-9d4f-99c709599cdc` | broken behaviour |
| `Feature` | `7e88d224-74ce-495f-b739-3e94e87da585` | new capability |
| `Improvement` | `43262067-1396-4a84-b07f-bd34537d2815` | quality, UX, performance |

An issue that needs changes on both sides of an app/API boundary gets both app
labels (for example `minotaur` + `thunderbird`). Backend labels belong to the
aether/mods repos but live in the same project; use them only for issues that
touch those repos:

| Label | ID | Repo |
|---|---|---|
| `aether` | `9e1c490d-297d-452b-a007-c8db8100fe95` | API backend |
| `thunderbird` | `bb736367-dfab-417d-b917-521d5d973ec0` | API service |
| `janus` | `595e8750-d55d-4d86-9375-0f1a55243235` | launcher |
| `api` | `763d194a-dfb0-4e60-929e-b69b4b673dd1` | public API surface |
| `config` | `c0bab626-ea99-4c78-ad93-7833587d4052` | plugin/server configuration |
| `bisquite` | `b89bcf98-ff44-419c-a502-e3d06ca21f27` | the Bisquite server |

Labels are project-scoped. Create or rename one with `label create` /
`label update`; attach ids through the `labels` array on a work item.

## States

| State | Group | ID |
|---|---|---|
| Backlog | backlog | `0d6744be-4eaf-4fd9-936d-f66a569bbbbf` |
| Todo | unstarted | `db598bd4-30bb-491b-a527-7b831e130225` |
| In Progress | started | `b4f86f9d-1371-4c5d-bc4f-88e7efe5afac` |
| Done | completed | `ddd89724-c17c-49b8-9f39-b318af84db7e` |
| Cancelled | cancelled | `36ecf1eb-2824-48e7-990c-7c57c871a54d` |

## Priority mapping

| Our severity | Plane `priority` |
|---|---|
| P0 | `urgent` |
| P1 (high) | `high` |
| P2 (mid) | `medium` |
| P3 (low) | `low` |

`none` means "not triaged", never use it for a real finding. Audit findings at
mid severity or higher get P1/P2 and a `Bug` label; do not file low-severity
polish from an audit batch unless it is asked for.

## Creating a batch

```js
const PID = 'a2c819ff-ba47-48eb-94b1-4d3156373eae';

await tools.plane.workitem({
  action: 'create',
  project_id: PID,
  name: 'Minotaur: <short finding>',
  description_html: '<p>Where, why, fix.</p>',   // HTML, not markdown
  priority: 'medium',
  state: '0d6744be-4eaf-4fd9-936d-f66a569bbbbf', // Backlog
  labels: ['9452e69a-6104-467e-8fcd-3999a08fb342', '993c3a06-b4ff-4140-af5b-13a0671151f8', 'e37a0a58-bf55-48c1-9d4f-99c709599cdc'],
  external_source: 'atlas',
  external_id: 'atlas-<slug>',
});
```

Check for duplicates first: `workitem list` with `project_id` and `per_page: 100`,
or a PQL filter such as `stateGroup = "backlog"`. Lists come back as
`{ result: { results: [...], next_page_results } }`; page with `cursor`. Verify a
batch by listing again - create returns the item, not a summary.

## Issue shape

An audit finding is one issue and answers:

- **Where** - file and function, exact paths.
- **Why** - impact in production, not a restatement of the code.
- **Fix** - a concrete change someone can start from.

Keep the description short (5-8 lines). Routes, schemas and process details
belong in the description; long analysis goes to a linked Plane page.

## Gotchas

- Descriptions are HTML (`description_html`); markdown is not rendered. Plane
  derives `description_stripped`, which is useful for grepping.
- `labels` replaces the whole set on update and silently drops `AI`; re-send it
  when changing labels.
- The rate limit is 60 requests per minute per API key. Batch ~10-15 writes per
  `execute` call; the sandbox has no timers, so rely on the gap between calls.
- Identifiers are `FASBERRY-<n>`; `a2c819ff-...` is the project, not an issue.
- Items imported from Linear keep the old key in `external_id` (`MN-<n>`); use it
  to avoid creating a duplicate during or after the migration.
- Deleting a work item needs the Admin role; a contributor can create, update,
  comment and archive.
- Inside `execute`, backticks break the template literal - write HTML without
  inline code ticks or build it with single quotes.
