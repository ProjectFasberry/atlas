import type { ReactNode } from "react";
import { SectionAction } from "../components/ui";
import { reatomComponent } from "@reatom/npm-react";
import { actionsState, getSelectedParentAtom, type ActionParent, type ActionType } from "./actions.model";

/** Toggle plus the section's own submit button, same shape for every section. */
const SectionActions = ({ parent, type, submit }: {
  parent: ActionParent,
  type: "create" | "edit",
  submit: ReactNode
}) => (
  <div className="flex items-center gap-1">
    <SectionAction parent={parent} type={type} />
    {submit}
  </div>
)

export const createPrivatedSectionModel = ({
  event, components
}: {
  event: ActionParent,
  components: {
    header: Record<"create" | "edit", ReactNode>,
    content: Record<ActionType, ReactNode>
  }
}) => {
  const HeaderViewElement = () => (
    <SectionAction title="Создать" parent={event} type="create" />
  );

  const HeaderCreateElement = () => (
    <SectionActions parent={event} type="create" submit={components.header.create} />
  )

  const HeaderEditElement = () => (
    <SectionActions parent={event} type="edit" submit={components.header.edit} />
  )

  const VARIANTS: Record<ActionType, ReactNode> = {
    create: components.content.create,
    edit: components.content.edit,
    view: components.content.view
  }

  const Wrapper = reatomComponent(({ ctx }) => {
    if (!ctx.spy(getSelectedParentAtom(event))) return VARIANTS["view"]
    return VARIANTS[ctx.spy(actionsState.type)]
  }, `${event}.Wrapper`)

  return {
    Header: {
      Create: HeaderCreateElement,
      View: HeaderViewElement,
      Edit: HeaderEditElement
    },
    Wrapper
  }
}
