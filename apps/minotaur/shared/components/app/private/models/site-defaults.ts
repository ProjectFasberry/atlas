export type BlockDefault = { title?: string; description?: string }

/** Current site copy for the built-in sections; mirrors the taurus translations. */
export const BLOCK_DEFAULTS: Record<string, Record<string, Record<"ru" | "en", BlockDefault>>> = {
  "home": {
    "hero": {
      "ru": {
        "title": "Fasberry Project",
        "description": "Minecraft-проект: разные режимы"
      },
      "en": {
        "title": "Fasberry Project",
        "description": "A Minecraft project: different modes"
      }
    },
    "join": {
      "ru": {
        "title": "Три шага до первого дня",
        "description": "Лаунчер и аккаунт — больше ничего не нужно."
      },
      "en": {
        "title": "Three steps to your first day",
        "description": "A launcher and an account — that's it."
      }
    },
    "features": {
      "ru": {
        "title": "Что есть на проекте"
      },
      "en": {
        "title": "What the project offers"
      }
    },
    "news": {
      "ru": {
        "title": "Что нового",
        "description": "Обновления проекта, сервера и вики"
      },
      "en": {
        "title": "What is new",
        "description": "Project, server and wiki updates"
      }
    },
    "spawn": {
      "ru": {
        "title": "Спавн сервера",
        "description": "Спавном сервера является город Оффенбург, в котором можно найти много интересных и даже секретных мест, персонажей, с которыми можно пообщаться и прочие активности."
      },
      "en": {
        "title": "Server Spawn",
        "description": "The server spawn is located in the town of Offenburg, where you can find many interesting and even secret places, characters to chat with, and other activities."
      }
    },
    "community": {
      "ru": {
        "title": "Куда дальше",
        "description": "Карта, вики и модпак — в одном месте"
      },
      "en": {
        "title": "Where to next",
        "description": "Map, wiki and modpack — all in one place"
      }
    },
    "faq": {
      "ru": {
        "title": "Частые вопросы",
        "description": "Коротко о том, что спрашивают чаще всего"
      },
      "en": {
        "title": "Frequently asked",
        "description": "The short version of what people ask most"
      }
    },
    "share": {
      "ru": {
        "title": "Соцсети проекта",
        "description": "Анонсы, ивенты и живое общение - выбирай удобную площадку."
      },
      "en": {
        "title": "Project Socials",
        "description": "Announcements, events and live chat - pick the place that suits you."
      }
    }
  },
  "servers": {},
  "start": {
    "start-hero": {
      "ru": {
        "title": "Как начать играть"
      },
      "en": {
        "title": "How to start playing"
      }
    }
  },
  "support": {
    "support-hero": {
      "ru": {
        "title": "Поддержка проекта",
        "description": "Здесь можно узнать о способах поддержки развития проекта"
      },
      "en": {
        "title": "Project Support",
        "description": "Here you can find out how to support the development of the project"
      }
    },
    "support-help": {
      "ru": {
        "title": "Как помочь проекту",
        "description": "Поддержать можно без денег: голосом, ссылкой или помощью с вики и артом."
      },
      "en": {
        "title": "How to help the project",
        "description": "You can help without money: with a vote, a link, or help with the wiki and art."
      }
    },
    "support-where": {
      "ru": {
        "title": "Чем занимается команда"
      },
      "en": {
        "title": "What the team does"
      }
    },
    "support-thanks": {
      "ru": {
        "title": "Спасибо",
        "description": "Спасибо, что голосуешь, делишься и помогаешь. Ты делаешь проект живым."
      },
      "en": {
        "title": "Thank you",
        "description": "Thanks for voting, sharing and helping. You keep the project alive."
      }
    },
    "support-faq": {
      "ru": {
        "title": "Частые вопросы",
        "description": "Коротко о том, как это работает"
      },
      "en": {
        "title": "Frequently asked",
        "description": "The short version of how it works"
      }
    },
    "support-cta": {
      "ru": {
        "title": "Остались вопросы?",
        "description": "Заходи в Discord или Telegram — расскажем, чем можно помочь."
      },
      "en": {
        "title": "Still have questions?",
        "description": "Join Discord or Telegram — we will tell you how you can help."
      }
    }
  },
  "modpack": {
    "modpack-hero": {
      "ru": {
        "title": "Сборки модов",
        "description": "Скачай лаунчер — он сам поставит версию, моды и текстуры."
      },
      "en": {
        "title": "Modpacks",
        "description": "Download the launcher — it installs the version, mods and textures for you."
      }
    },
    "modpack-manual": {
      "ru": {
        "title": "Сборки для продвинутых",
        "description": "Если умеешь ставить моды сам — держи сборки. Если нет — просто скачай лаунчер."
      },
      "en": {
        "title": "Builds for advanced players",
        "description": "If you can install mods yourself, here are the builds. If not, just download the launcher."
      }
    },
    "modpack-faq": {
      "ru": {
        "title": "Частые вопросы",
        "description": "Коротко про установку"
      },
      "en": {
        "title": "Frequently asked",
        "description": "The short version of installing"
      }
    }
  }
}
