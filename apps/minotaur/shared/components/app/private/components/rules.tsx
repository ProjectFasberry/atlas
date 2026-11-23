import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { EditorContent, useEditor } from "@tiptap/react"
import { clsx } from "cnfast"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ErrorBlock } from "@/shared/ui/error-block"
import { PageLoader } from "@/shared/ui/page-loader"
import { Noop } from "@/shared/ui/noop"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { RULES_UPDATE_PERMISSION } from "@/shared/consts/permissions"
import { editorExtensions } from "@/shared/components/config/editor/editor.model"
import { EditorMenuBar } from "@/shared/components/config/editor/editor"
import { rulesPanel, type RuleRow } from "../models/rules.model"
import { translate } from "@/shared/locales/helpers"

const RuleEditor = reatomComponent<{ rule: RuleRow, canEdit: boolean }>(({ ctx, rule, canEdit }) => {
  const editor = useEditor({
    extensions: editorExtensions,
    content: rule.content,
    editable: canEdit,
    onUpdate: ({ editor }) => rulesPanel.setContent(ctx, editor.getJSON()),
  })

  const saving = ctx.spy(rulesPanel.save.statusesAtom).isPending
  const dirty = ctx.spy(rulesPanel.dirty)

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <label className="flex max-w-md flex-col gap-1">
        <span className="text-xs font-medium text-neutral-400">
          {translate["panel.rules-category"]()}
        </span>
        <Input
          value={ctx.spy(rulesPanel.category)}
          disabled={!canEdit}
          onChange={(event) => rulesPanel.setCategory(ctx, event.target.value)}
        />
      </label>
      <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-800">
        <EditorMenuBar editor={editor} />
        <EditorContent
          editor={editor}
          className="tiptap min-h-64 w-full bg-neutral-800/40 px-3 py-2 text-base"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          background="positive"
          className="h-9"
          disabled={!canEdit || !dirty || saving}
          onClick={() => rulesPanel.save(ctx)}
        >
          {translate["panel.save"]()}
        </Button>
        {dirty && (
          <span className="text-xs text-amber-400">{translate["panel.not-saved"]()}</span>
        )}
      </div>
    </div>
  )
}, "RuleEditor")

export const RulesPanel = reatomComponent(({ ctx }) => {
  useUpdate(rulesPanel.fetch, [])

  const status = ctx.spy(rulesPanel.fetch.statusesAtom)
  const error = ctx.spy(rulesPanel.fetch.errorAtom)
  const rows = ctx.spy(rulesPanel.rows) ?? []
  const selected = ctx.spy(rulesPanel.selected)
  const rule = rows.find((item) => item.id === selected)
  const permissions = ctx.spy(currentUserState.perms) ?? []
  const canEdit = permissions.includes(RULES_UPDATE_PERMISSION)

  if (status.isFirstPending) return <PageLoader />
  if (error) return <ErrorBlock title={error.message} />
  if (!rows.length) return <Noop title={translate["panel.rules-empty"]()} />

  return (
    <div className="flex w-full flex-col gap-3">
      <Typography color="gray" className="text-sm">
        {translate["panel.rules-description"]()}
      </Typography>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-1 rounded-xl border border-neutral-800 p-1">
          {rows.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx(
                "rounded-lg px-2 py-1.5 text-left text-sm duration-150",
                item.id === selected
                  ? "bg-neutral-50 text-neutral-950"
                  : "text-neutral-300 hover:bg-neutral-800",
              )}
              onClick={() => rulesPanel.select(ctx, item)}
            >
              {item.category}
            </button>
          ))}
        </div>
        {rule
          ? <RuleEditor key={rule.id} rule={rule} canEdit={canEdit} />
          : (
            <Typography color="gray" className="text-sm">
              {translate["panel.rules-select"]()}
            </Typography>
          )}
      </div>
    </div>
  )
}, "RulesPanel")
