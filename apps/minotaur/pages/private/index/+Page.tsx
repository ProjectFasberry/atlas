import { Config } from "@/shared/components/app/private/components/config"
import { actionsState } from "@/shared/components/app/private/models/actions.model"
import { createPageModel } from "@/shared/lib/events"
import { pageState } from "@/shared/models/page-context.model"
import { useAtom } from "@reatom/npm-react"

const page = createPageModel({
  name: "private.config",
  hooks: {
    onSpy: (ctx, _, urlParsed) => {
      actionsState.searchParams(ctx, (state) => urlParsed?.search ?? state)
    },
  },
  spyedAtom: pageState.urlParsed
})


export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return <Config />
}
