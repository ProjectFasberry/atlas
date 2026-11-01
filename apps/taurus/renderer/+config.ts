import type { Config } from "vike/types";
import vikeSolid from 'vike-solid/config'

export default {
  title: "Fasberry",
  extends: [vikeSolid],
  passToClient: ['snapshot'],
  ssr: true,
  redirects: {
    "/wiki": "https://wiki.fasberry.fun/",
    "/wiki/*": "https://wiki.fasberry.fun/*",
    "/info/privacy": "https://api.fasberry.fun/misc/privacy",
    "/info/terms": "https://api.fasberry.fun/misc/terms",
    "/info/contacts": "https://api.fasberry.fun/misc/contacts",
    "/discord": "https://api.fasberry.fun/misc/discord",
    "/telegram": "https://api.fasberry.fun/misc/telegram"
  },
} satisfies Config;
