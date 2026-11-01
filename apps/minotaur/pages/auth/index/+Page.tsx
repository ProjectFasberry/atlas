import { Auth, AuthError } from "@/shared/components/app/auth/components/auth";
import { auth, authState } from "@/shared/components/app/auth/models/auth.model";
import { useAtom } from "@reatom/npm-react";
import { createPageModel } from "@/shared/lib/events";
import { pageState } from "@/shared/models/page-context.model";
import { register } from "@/shared/components/app/auth/models/register.model";
import { getDevModulesInfo } from "@/shared/models/app/index.model";

const page = createPageModel({
  name: "auth",
  hooks: {
    onConnect: async (ctx, dataAtom, isConnected) => {
      authState.searchParams(ctx, (state) => ctx.get(pageState.urlParsed)?.search ?? state)

      if (!isConnected()) return;

      const devModulesInfo = getDevModulesInfo(ctx);

      if (devModulesInfo?.isImport) {
        const { startAuthWidget } = await import("@/shared/components/app/auth/models/dev-only.model")
        const unsubscribe = await startAuthWidget(ctx)

        if (!isConnected()) {
          unsubscribe()
          return;
        }

        dataAtom(ctx, { unsubscribe })
      }
    },
    onDisconnect: (ctx) => {
      auth.resetAuthState(ctx)
      register.resetRegisterState(ctx)
    },
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom);

  return (
    <div className="flex flex-col gap-4 items-center py-30 min-h-dvh w-full">
      <Auth />
      <AuthError />
    </div>
  )
}
