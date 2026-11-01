import { lazy, type ComponentType } from "react";
import { ClientOnly } from "vike-react/ClientOnly";
import { entries } from "@reatom/framework"

const _IMPORTS = {
  "Settings": () => import("@/shared/components/app/settings/components/settings").then((m) => ({ default: m.Settings })),
  "Toaster": () => import("@/shared/components/config/toaster").then((m) => ({ default: m.Toaster })),
  "AlertDialog": () => import("@/shared/components/config/alert-dialog/alert-dialog").then((m) => ({ default: m.AlertDialog })),
  "Cap": () => import("../../../config/cap/components/cap").then((m) => ({ default: m.Cap })),
  "Widgets": () => import("../../widgets/components/widgets").then((m) => ({ default: m.Widgets })),
}

const LAZY_COMPONENTS: Array<{ key: string; Component: ComponentType<any> }> =
  entries(_IMPORTS).map(([key, cb]) => ({ key, Component: lazy(cb) }));

export const Global = () => {
  return (
    <ClientOnly>
      {LAZY_COMPONENTS.map(({ key, Component }) => <Component key={key} />)}
    </ClientOnly>
  )
}
