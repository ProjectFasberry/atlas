import { apiKeysSection } from "@/shared/components/app/private/components/api"
import { ActionsHeaderSlot } from "@/shared/components/app/private/components/actions-header"
import { PanelSection } from "@/shared/components/app/private/components/panel-section"
import { translate } from "@/shared/locales/helpers"

export default function Page() {
  return (
    <PanelSection
      title={translate["panel.api-keys"]()}
      parent="api"
      action={<ActionsHeaderSlot parent="api" />}
    >
      <apiKeysSection.Wrapper />
    </PanelSection>
  )
}
