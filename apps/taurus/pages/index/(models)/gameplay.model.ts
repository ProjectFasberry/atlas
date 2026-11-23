import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { action, atom, withAssign, type Ctx } from "@reatom/framework";

export const createIdeas = () => ([
  {
    title: translate["gameplay.1.title"](),
    tabTitle: translate["gameplay.1.short"](),
    image: getStaticObject("images", "steve-alex.webp"),
    description: translate["gameplay.1.description"](),
  },
  {
    title: translate["gameplay.2.title"](),
    tabTitle: translate["gameplay.2.short"](),
    image: getStaticObject("images", "wild-west.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "/servers"
    },
    description: translate["gameplay.2.description"](),
  },
  {
    title: translate["gameplay.3.title"](),
    tabTitle: translate["gameplay.3.short"](),
    image: getStaticObject("images", "casino-barebones.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "https://wiki.fasberry.fun/"
    },
    description: translate["gameplay.3.description"](),
  },
  {
    title: translate["gameplay.4.title"](),
    tabTitle: translate["gameplay.4.short"](),
    image: getStaticObject("images", "custom-armor.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "https://wiki.fasberry.fun/"
    },
    description: translate["gameplay.4.description"](),
  },
  {
    title: translate["gameplay.5.title"](),
    tabTitle: translate["gameplay.5.short"](),
    image: getStaticObject("images", "emotes-preview.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "/discord"
    },
    description: translate["gameplay.5.description"](),
  }
]);

export const selectedKeyAtom = atom(0, "selectedKey").pipe(
  withAssign((atom) => {
    const move = (ctx: Ctx, delta: number) => {
      const ideas = createIdeas();
      const current = ctx.get(atom);
      atom(ctx, (current + delta + ideas.length) % ideas.length);
    };

    return {
      prev: action((ctx) => move(ctx, -1)),
      next: action((ctx) => move(ctx, 1))
    }
  })
)
