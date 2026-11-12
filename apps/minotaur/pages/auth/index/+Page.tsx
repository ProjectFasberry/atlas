import { useAtom } from "@reatom/npm-react";
import { createPageModel } from "@/shared/lib/events";
import { pageState } from "@/shared/models/page-context.model";
import { auth, authState } from "@/shared/components/app/auth/models/auth.model";
import { register } from "@/shared/components/app/auth/models/register.model";
import { getDevModulesInfo } from "@/shared/models/app/index.model";
import { authLoginVariantAtom } from "@/shared/components/app/auth/models/login.model";
import { qrLogin } from "@/shared/components/app/auth/models/qr.model";
import { AuthScreen } from "@/shared/components/app/auth/components/auth-screen";

const page = createPageModel({
  name: "auth",
  hooks: {
    onConnect: async (ctx, dataAtom, isConnected) => {
      authState.searchParams(ctx, (state) => ctx.get(pageState.urlParsed)?.search ?? state)

      if (!isConnected()) return;

      if (ctx.get(authLoginVariantAtom) === "qr") {
        qrLogin.generate(ctx);
      }

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
      qrLogin.close(ctx)
    },
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom);

  return <AuthScreen />;
}
