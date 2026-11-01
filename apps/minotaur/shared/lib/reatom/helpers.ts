import { configure, withHistory as withHistoryImported } from "@distribate/reatom-kit";

configure({
  logging: {
    actions: true,
    atoms: true
  }
})

export const withHistory = withHistoryImported;
