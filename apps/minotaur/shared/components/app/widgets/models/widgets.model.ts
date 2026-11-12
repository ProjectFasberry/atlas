import { currentUserState } from "@/shared/models/current-user/index.model";
import { action, type Atom, atom, type Ctx } from "@reatom/framework";
import { withAssign } from "@reatom/framework";
import { withCookie } from "@reatom/persist-web-storage";
import { type IconName } from "@/shared/ui/icon"
import { type ReactNode } from "react";
import { pageState } from "@/shared/models/page-context.model";
import { buildAuthRedirect } from "@/shared/lib/auth-redirect";
import { translate } from "@/shared/locales/helpers";

type WidgetBase = {
  icon?: IconName,
  title: string,
  description?: string,
  onAction: (ctx: Ctx) => void,
  onHide: (ctx: Ctx) => void
}

type WidgetItem = WidgetBase & {
  cd: Atom<boolean>,
}

export type Widget = WidgetBase & {
  id: string,
  action: ReactNode,
}

const WIDGET_IDS = {
  AUTH_REQUIRED: "auth.required"
} as const;
const WIDGETS_SOURCES: Map<string, WidgetItem> = new Map([
  [WIDGET_IDS.AUTH_REQUIRED, {
    cd: atom((ctx) => {
      if (ctx.spy(pageState.urlPathname).startsWith("/auth")) return true;

      const isHiddenByUser = ctx.spy(widgetsState.data)[WIDGET_IDS.AUTH_REQUIRED]
      if (isHiddenByUser === false) return true;

      const user = ctx.spy(currentUserState);
      return !!user;
    }),
    title: translate["auth.widget.title"](),
    icon: "sprite:lock",
    description: translate["auth.widget.description"](),
    onAction: (ctx) => {
      ctx.schedule(() => {
        const pathname = ctx.get(pageState.urlPathname)
        window.location.assign(buildAuthRedirect(pathname, window.location.search || null))
      })
    },
    onHide: (ctx) => {
      widget.hide(ctx, "auth.required")
    }
  }]
]);

export const widgetsState = atom(null, "widgetsState").pipe(
  withAssign((_, name) => ({
    data: atom<Record<string, boolean>>({}, `${name}.data`).pipe(
      withCookie({
        maxAge: 2600000000,
        path: "/",
      })(`${name}.data`)
    ),
    current: atom((ctx) => {
      for (const [id, body] of WIDGETS_SOURCES) {
        const isSatisfied = ctx.spy(body.cd);

        if (!isSatisfied) {
          return { id, ...body };
        }
      }

      return null;
    }, `${name}.current`)
  }))
)
export const widget = atom(null, "widget").pipe(
  withAssign((_, name) => ({
    hide: action((ctx, id: string) => {
      widgetsState.data(ctx, (state) => ({ ...state, [id]: false }))
    }, `${name}.hide`)
  }))
)
