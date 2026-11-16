import { useAtom, useIsomorphicEffect } from "@reatom/npm-react"
import { appearanceState } from "../../settings/models/settings-appearance.model"

export const AppearanceSync = () => {
  const [reduceMotion] = useAtom(appearanceState.reduceMotion)

  useIsomorphicEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion)
  }, [reduceMotion])

  return null
}
