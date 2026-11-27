import type { Config } from "vike/types";

export default {
  // The first page comes from the API on every request: a build-time snapshot
  // would keep showing the gallery as it was when the image was built.
  prerender: false
} satisfies Config
