import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { action, atom, withAssign } from "@reatom/framework";

export const createIdeas = () => ([
  {
    title: translate["gameplay.1.title"](),
    image: getStaticObject("images", "steve-alex.webp"),
    description: translate["gameplay.1.description"](),
    type: "full"
  },
  {
    title: translate["gameplay.2.title"](),
    image: getStaticObject("images", "wild-west.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "/wiki/profile"
    },
    description: translate["gameplay.2.description"](),
    type: "full"
  },
  {
    title: translate["gameplay.3.title"](),
    image: getStaticObject("images", "casino-barebones.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "/wiki/quests"
    },
    description: translate["gameplay.3.description"](),
    type: "full"
  },
  {
    title: translate["gameplay.4.title"](),
    image: getStaticObject("images", "custom-armor.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "https://wiki.fasberry.fun/"
    },
    description: translate["gameplay.4.description"](),
    type: "module"
  },
  {
    title: translate["gameplay.5.title"](),
    image: getStaticObject("images", "emotes-preview.webp"),
    link: {
      title: translate["gameplay.shared.get-more"](),
      href: "https://wiki.fasberry.fun/"
    },
    description: translate["gameplay.5.description"](),
    type: "module"
  }
]);

export const selectedKeyAtom = atom(0, "selectedKey").pipe(
  withAssign((atom) => ({
    prev: action((ctx) => {
      const current = ctx.get(atom);
      atom(ctx, (current - 1 + createIdeas.length) % createIdeas.length);
    }),
    next: action((ctx) => {
      const current = ctx.get(atom);
      atom(ctx, (current + 1) % createIdeas.length);
    })
  }))
)
