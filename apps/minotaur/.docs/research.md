# Minotaur: verified remaining issues

Re-checked against the current code and, where possible, against the live API.
Closed or intentionally stubbed items were removed; see the last section.

## Confirmed, fixable on the client

| # | Severity | Where | What was confirmed |
|---|---|---|---|
| - | med | `shop/models/store-order.model.tsx:131` | Confirmed against the live API: `GET /store/order/external/test-id/events` returns `422` (route exists), `GET /store/order/test-id/events` returns `404`. The client builds the second URL, so paid-status updates over SSE never connect. One-line fix: add `/external/`. |
| - | med | `renderer/+onCreatePageContext.server.ts:70`, `shared/models/app/index.model.ts` | `@reatom/url` keeps its default browser settings on the client (they are replaced with `setupUrlAtomSettings` only in the server hook). It installs its own click interceptor on `document.body` in addition to Vike's router on `document`; the interceptor calls `history.pushState`, then Vike pushes the same URL again. After visiting `/auth` (or `/store`, which use URL-persisted atoms) every link click adds a duplicate history entry, so "Back" needs two presses. Confirmed by code reading; worth one manual check in the browser. |
| - | low | `land/models/land.model.ts:74-77`, `land/components/land.tsx:207-228` | Every land is enriched with a hardcoded point `{x: 412.12, y: 65.6}` that overwrites whatever the API returns; the page shows "1 точка" with the same fake coordinates for all lands. Not gated to staging (unlike land editing). |
| - | low | `player/models/skin.model.ts:119` | `size: target.size * 1024` shows a 20 KB file as `20480` and has no unit label. |
| - | low | `pages/player/@nickname/rates/+Page.tsx:20-21`, `player/models/player.model.ts:129-130` | For a guest `fetchList` returns `null`, and the page renders the empty state "пусто" instead of asking to sign in. |
| - | low | `pages/not-exist/+Page.tsx:22` | The "back" button only calls `history.back()`; on a direct visit/new tab it does nothing and the user is stuck on the page. |

## Confirmed, but blocked by API

| # | Severity | Where | Blocker |
|---|---|---|---|
| 5 | high | `settings/components/settings-sessions.tsx:67`, `settings/models/settings-security.model.ts:68-72` | The session list payload (`getAuthSessionList`, `getAuthSessionCurrent`) has no session id, while `deleteAuthSessionById` requires one. The client cannot implement per-session termination until the API exposes an id; the current hardcoded `"2"` + `throw Not implemented` is a placeholder. |
| 22 | SSR med | `renderer/+onBeforeRoute.server.ts:10` | `overwriteGetLocale` replaces the module-global `getLocale` and bypasses Paraglide's `serverAsyncLocalStorage` for the whole process, so concurrent SSR requests can render with another visitor's locale. A safe fix means propagating the per-request locale through ALS instead of a global override. |
| 23 | SSR med | `renderer/+config.ts`, Paraglide strategies | On the server the `preferredLanguage` strategy is skipped, so without a locale cookie the locale is `ru`; on the client it is `navigator.language` (e.g. `en`). The SSR pages `/` and `/player` hydrate text in another language and flip after mount. Needs one source of truth (e.g. `pageContext.locale` on the client too). |

## i18n migration status

Done: `shared/components/app/shop/**`, `shared/components/app/settings/**`,
`pages/support`, `pages/banned`, `shared/components/config/alert-dialog/**`,
`shared/ui/copy.tsx`, `shared/ui/page-loader.tsx`, the global error boundary.
New keys were added to `messages/ru.json`/`messages/en.json` and Paraglide was
regenerated. The seed-phrase and recovery message namespaces were deleted together
with the removed auth flow.

Still hardcoded (Russian):

- public: `news/**`, `tasks/**`, `ratings/**`, `player/**` (skin, activity, balance,
  socials, lands), `referrals/**`, `land/components/land.tsx`, header/footer aria-labels
  and menu text, `shared/lib/helpers.ts` (`NOT_EXIST_TYPES`), `shared/schemas/auth.ts`
  validation messages, `pages/lands/@id/+data.tsx` and `pages/player/@nickname/+data.tsx`
  metadata, `pages/store/order/@id/+data.ts`;
- the whole `/private` admin panel (~190 lines).

## Closed as non-issues

- Registration/recovery via seed phrase: removed by product decision. Registration is now
  nickname + password (+ referrer). Recovery is handled by an admin until 2FA and
  email/Telegram recovery are rolled out. The deleted client code includes the seed-phrase
  steps in the register form, `/auth/restore`, `auth-security`/`seed-phrase` models,
  the seed-phrase UI and the related messages. The backend (`aether/apps/thunderbird`) now
  accepts the body without `hash` and its stub `/auth/restore` routes were removed; the API
  image still has to be deployed and the generated client contract regenerated.
- Social connections (Discord/Telegram): an intentional stub for a future feature.
- `console.log` leftovers (`cart-item.tsx:30`, `land.tsx:202`,
  `store-order.model.tsx:107`): cleanup only, no behavioral impact.
- `type` query param on `getStoreOrderExternalByUniqueId`: the generated schema has no
  such parameter, but the order page works in production, so the schema is likely stale.
- `@scure/bip39` is still listed in `package.json` but no client code imports it anymore
  (the manual chunk rule was removed); removal needs a lockfile update.
