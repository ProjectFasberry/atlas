import { getStaticAsset, getStaticObject } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import type { ServersContent } from "@/shared/api/site"

type ServerFeatureKey =
  | "survival"
  | "rp"
  | "quests"
  | "resourcepack"
  | "emotes"
  | "minigames"
  | "events"
  | "community"
  | "anarchy"
  | "economy"

/** Icons stay in the model so the page only renders translated copy. */
const FEATURES = {
  survival: { icon: "items/netherite_sword.webp", key: "survival" },
  rp: { icon: "icons/experience_big.webp", key: "rp" },
  quests: { icon: "icons/book_big.webp", key: "quests" },
  resourcepack: { icon: "icons/chest_closed.webp", key: "resourcepack" },
  emotes: { icon: "items/ender_pearl.webp", key: "emotes" },
  minigames: { icon: "icons/bell.webp", key: "minigames" },
  events: { icon: "icons/experience_big.webp", key: "events" },
  community: { icon: "icons/book_big.webp", key: "community" },
  anarchy: { icon: "items/netherite_sword.webp", key: "anarchy" },
  economy: { icon: "icons/chest_closed.webp", key: "economy" },
} as const

type ServerFeature = {
  title: string
  description: string
  icon: string
}

const TITLES = {
  survival: "servers.features.survival.title",
  rp: "servers.features.rp.title",
  quests: "servers.features.quests.title",
  resourcepack: "servers.features.resourcepack.title",
  emotes: "servers.features.emotes.title",
  minigames: "servers.features.minigames.title",
  events: "servers.features.events.title",
  community: "servers.features.community.title",
  anarchy: "servers.features.anarchy.title",
  economy: "servers.features.economy.title",
} as const

const DESCRIPTIONS = {
  survival: "servers.features.survival.description",
  rp: "servers.features.rp.description",
  quests: "servers.features.quests.description",
  resourcepack: "servers.features.resourcepack.description",
  emotes: "servers.features.emotes.description",
  minigames: "servers.features.minigames.description",
  events: "servers.features.events.description",
  community: "servers.features.community.description",
  anarchy: "servers.features.anarchy.description",
  economy: "servers.features.economy.description",
} as const

const createFeature = (key: ServerFeatureKey): ServerFeature => ({
  title: translate[TITLES[key]](),
  description: translate[DESCRIPTIONS[key]](),
  icon: getStaticObject("minecraft", FEATURES[key].icon),
})

export type ServerProfile = {
  id: string
  name: string
  tagline: string
  description: string
  image: string
  icon?: string
  features: ServerFeature[]
}

/** Server keys match the catalog `origin`, lowercased. */
const createDefaultProfiles = (): ServerProfile[] => [
  {
    id: "bisquite",
    name: translate["servers.items.bisquite.name"](),
    tagline: translate["servers.items.bisquite.tagline"](),
    description: translate["servers.items.bisquite.description"](),
    image: getStaticObject("arts", "bzzvanet-mp1jpg.jpg"),
    features: (["rp", "survival", "quests", "resourcepack", "emotes"] as const).map(createFeature),
  },
  {
    id: "lobby",
    name: translate["servers.items.lobby.name"](),
    tagline: translate["servers.items.lobby.tagline"](),
    description: translate["servers.items.lobby.description"](),
    image: getStaticObject("arts", "adventure-in-blossom.jpg"),
    features: (["minigames", "events", "community"] as const).map(createFeature),
  },
  {
    id: "muffin",
    name: translate["servers.items.muffin.name"](),
    tagline: translate["servers.items.muffin.tagline"](),
    description: translate["servers.items.muffin.description"](),
    image: getStaticObject("arts", "bzzvanet-newyork.webp"),
    features: (["anarchy", "survival", "economy"] as const).map(createFeature),
  },
]

/**
 * Defaults merged with the editable document. An absent field keeps the shipped
 * copy; an empty string clears it on purpose (the muffin page hides its panel).
 */
export const createServerProfiles = (content?: ServersContent | null): ServerProfile[] => {
  const profiles = createDefaultProfiles()
  const items = content?.items

  if (!items) return profiles

  return profiles.map((profile) => {
    const override = items[profile.id]

    if (!override) return profile

    return {
      ...profile,
      name: override.name ?? profile.name,
      tagline: override.tagline ?? profile.tagline,
      description: override.description ?? profile.description,
      image: override.image ? getStaticAsset(override.image) : profile.image,
      icon: override.icon ? getStaticAsset(override.icon) : profile.icon,
      features: override.features
        ? override.features.map((feature) => ({
            title: feature.title,
            description: feature.description,
            icon: getStaticAsset(feature.icon),
          }))
        : profile.features,
    }
  })
}
