import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Noop } from "@/shared/ui/noop"
import { PageLoader } from "@/shared/ui/page-loader"
import { Typography } from "@/shared/ui/typography"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { CONTENT_UPDATE_PERMISSION } from "@/shared/consts/permissions"
import { translate } from "@/shared/locales/helpers"
import {
  FAQ_LOCALES, FAQ_SCOPES,
  faqPanel,
  type FaqDraft, type FaqRow, type FaqScope,
} from "../models/faq.model"

const answerClassName = `min-h-24 w-full resize-y rounded-xl border border-neutral-800 bg-neutral-900
  px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-600`

const scopeTitle: Record<FaqScope, string> = {
  home: translate["panel.faq-scope-home"](),
  support: translate["panel.faq-scope-support"](),
}

const isDirty = (row: FaqRow, draft: FaqDraft) =>
  draft.question !== row.question
  || draft.answer !== row.answer
  || draft.linkLabel !== (row.linkLabel ?? "")
  || draft.linkHref !== (row.linkHref ?? "")
  || draft.published !== row.published

const FaqEditor = ({
  row, draft, canEdit, pending, onChange, onSave, onDelete,
}: {
  row: FaqRow
  draft: FaqDraft
  canEdit: boolean
  pending: boolean
  onChange: (patch: Partial<FaqDraft>) => void
  onSave: () => void
  onDelete: () => void
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-neutral-500">#{row.position}</span>
      <span className={`text-xs ${draft.published ? "text-green-400" : "text-neutral-500"}`}>
        {draft.published ? translate["panel.faq-published"]() : translate["panel.faq-hidden"]()}
      </span>
    </div>
    <Input
      value={draft.question}
      disabled={!canEdit}
      placeholder={translate["panel.faq-question"]()}
      onChange={(event) => onChange({ question: event.target.value })}
    />
    <textarea
      value={draft.answer}
      disabled={!canEdit}
      placeholder={translate["panel.faq-answer"]()}
      className={answerClassName}
      onChange={(event) => onChange({ answer: event.target.value })}
    />
    <div className="grid gap-2 sm:grid-cols-2">
      <Input
        value={draft.linkLabel}
        disabled={!canEdit}
        placeholder={translate["panel.faq-link-label"]()}
        onChange={(event) => onChange({ linkLabel: event.target.value })}
      />
      <Input
        value={draft.linkHref}
        disabled={!canEdit}
        placeholder={translate["panel.faq-link-href"]()}
        onChange={(event) => onChange({ linkHref: event.target.value })}
      />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          checked={draft.published}
          disabled={!canEdit}
          onChange={(event) => onChange({ published: event.target.checked })}
        />
        {translate["panel.faq-published"]()}
      </label>
      <div className="ms-auto flex items-center gap-2">
        <Button
          background="positive"
          className="h-9"
          disabled={!canEdit || !isDirty(row, draft) || pending}
          onClick={onSave}
        >
          {translate["panel.save"]()}
        </Button>
        <Button
          background="default"
          className="h-9 text-red-300"
          disabled={!canEdit || pending}
          onClick={onDelete}
        >
          {translate["panel.delete"]()}
        </Button>
      </div>
    </div>
  </div>
)

const FaqCreateForm = ({
  draft, scope, canEdit, pending, onChange, onCreate, onCancel,
}: {
  draft: FaqDraft
  scope: FaqScope
  canEdit: boolean
  pending: boolean
  onChange: (patch: Partial<FaqDraft>) => void
  onCreate: () => void
  onCancel: () => void
}) => (
  <div className="flex flex-col gap-2 rounded-xl border border-green-800/40 bg-green-950/20 p-3">
    <Input
      value={draft.question}
      placeholder={translate["panel.faq-question"]()}
      onChange={(event) => onChange({ question: event.target.value })}
    />
    <textarea
      value={draft.answer}
      placeholder={translate["panel.faq-answer"]()}
      className={answerClassName}
      onChange={(event) => onChange({ answer: event.target.value })}
    />
    <div className="flex items-center gap-2">
      <Button
        background="positive"
        className="h-9"
        disabled={!canEdit || pending || draft.question.trim().length === 0 || draft.answer.trim().length === 0}
        onClick={onCreate}
      >
        {translate["panel.save"]()}
      </Button>
      <Button background="default" className="h-9" onClick={onCancel}>
        {translate["panel.cancel"]()}
      </Button>
      <span className="text-xs text-neutral-500">{scopeTitle[scope]}</span>
    </div>
  </div>
)

const FaqFilters = reatomComponent(({ ctx }) => {
  const scope = ctx.spy(faqPanel.scope)
  const locale = ctx.spy(faqPanel.locale)
  const creating = ctx.spy(faqPanel.creating)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const canEdit = permissions.includes(CONTENT_UPDATE_PERMISSION)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FAQ_SCOPES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => faqPanel.setScope(ctx, value)}
          className={`rounded-xl px-3 py-1.5 text-sm duration-150 ${
            scope === value ? "bg-neutral-50 text-neutral-950" : "bg-neutral-900 text-neutral-300"
          }`}
        >
          {scopeTitle[value]}
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-neutral-800" />
      {FAQ_LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => faqPanel.setLocale(ctx, value)}
          className={`rounded-xl px-3 py-1.5 text-sm uppercase duration-150 ${
            locale === value ? "bg-neutral-50 text-neutral-950" : "bg-neutral-900 text-neutral-300"
          }`}
        >
          {value}
        </button>
      ))}
      <Button
        background="positive"
        className="ms-auto h-9"
        disabled={!canEdit || creating}
        onClick={() => faqPanel.startCreate(ctx)}
      >
        {translate["panel.faq-add"]()}
      </Button>
    </div>
  )
}, "FaqFilters")

const FaqList = reatomComponent(({ ctx }) => {
  const rows = ctx.spy(faqPanel.rows) ?? []
  const drafts = ctx.spy(faqPanel.drafts)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const canEdit = permissions.includes(CONTENT_UPDATE_PERMISSION)
  const pending = ctx.spy(faqPanel.create.statusesAtom).isPending
    || ctx.spy(faqPanel.update.statusesAtom).isPending
    || ctx.spy(faqPanel.remove.statusesAtom).isPending

  if (rows.length === 0) return <Noop title={translate["panel.faq-empty"]()} />

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <FaqEditor
          key={row.id}
          row={row}
          draft={drafts[row.id] ?? {
            question: row.question,
            answer: row.answer,
            linkLabel: row.linkLabel ?? "",
            linkHref: row.linkHref ?? "",
            published: row.published,
          }}
          canEdit={canEdit}
          pending={pending}
          onChange={(patch) => faqPanel.editDraft(ctx, row.id, patch)}
          onSave={() => faqPanel.saveDraft(ctx, row.id)}
          onDelete={() => faqPanel.deleteBefore(ctx, row)}
        />
      ))}
    </div>
  )
}, "FaqList")

const FaqNewItem = reatomComponent(({ ctx }) => {
  const creating = ctx.spy(faqPanel.creating)
  const draft = ctx.spy(faqPanel.newDraft)
  const scope = ctx.spy(faqPanel.scope)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const canEdit = permissions.includes(CONTENT_UPDATE_PERMISSION)
  const pending = ctx.spy(faqPanel.create.statusesAtom).isPending

  if (!creating) return null

  return (
    <FaqCreateForm
      draft={draft}
      scope={scope}
      canEdit={canEdit}
      pending={pending}
      onChange={(patch) => faqPanel.editNewDraft(ctx, patch)}
      onCancel={() => faqPanel.cancelCreate(ctx)}
      onCreate={() => faqPanel.submitCreate(ctx)}
    />
  )
}, "FaqNewItem")

export const FaqPanel = reatomComponent(({ ctx }) => {
  useUpdate(faqPanel.fetch, [])

  const status = ctx.spy(faqPanel.fetch.statusesAtom)
  const error = ctx.spy(faqPanel.fetch.errorAtom)

  if (status.isFirstPending) return <PageLoader />
  if (error) return <ErrorBlock title={error.message} />

  return (
    <div className="flex w-full flex-col gap-4">
      <Typography color="gray" className="text-sm">
        {translate["panel.faq-description"]()}
      </Typography>
      <FaqFilters />
      <FaqNewItem />
      <FaqList />
    </div>
  )
}, "FaqPanel")
