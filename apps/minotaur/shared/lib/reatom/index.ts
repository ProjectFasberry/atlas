import { createCtx, type Ctx } from "@reatom/framework"
import { useRef } from "react"

interface Fn<Args extends any[] = any[], Return = any> {
  (...a: Args): Return
}

export const useCreateCtx = (extension?: Fn<[Ctx]>) => {
  const ctxRef = useRef(null as null | Ctx)

  if (!ctxRef.current) {
    ctxRef.current = createCtx({ restrictMultipleContexts: false })
    extension?.(ctxRef.current)
  }

  return ctxRef.current
}
