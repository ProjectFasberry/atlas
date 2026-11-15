import { apiKeysSection } from "@/shared/components/app/private/components/api"
import { ActionsHeaderSlot } from "@/shared/components/app/private/components/actions-header"
import { PanelSection } from "@/shared/components/app/private/components/panel-section"

export default function Page() {
  return (
    <PanelSection
      title="API-ключи"
      parent="api"
      action={<ActionsHeaderSlot parent="api" />}
    >
      <apiKeysSection.Wrapper />
    </PanelSection>
  )
}
