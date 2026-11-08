import { client } from "@/shared/lib/client-wrapper";
import { action, atom, reatomAsync, withAssign, withCache, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { reatomMap } from "@reatom/framework";
import { notifyAboutRestrictRole } from "./actions.model";

export type OptionsPayload = ExtractApiData<"getPrivatedOptionsList">["data"];
export type Option = OptionsPayload[number]

type OptionExtended = Option & { isLoading: boolean }

const optionsAtom = reatomMap<string, OptionExtended>();

const getOptionIsLoading = (option: string) => atom((ctx) =>
  ctx.spy(optionsAtom).get(option)?.isLoading ?? false
);

const optionsControl = atom(null, "optionsControl").pipe(
  withAssign((_, name) => ({
    updateOption: action((ctx, option: Option["name"], value: Partial<OptionExtended>) => {
      const existsOption = optionsAtom.get(ctx, option);

      if (existsOption) {
        optionsAtom.set(ctx, option, { ...existsOption, ...value })
      }
    }),
    update: reatomAsync(async (ctx, option: Option["name"], value: Option["value"]) => {
      optionsControl.updateOption(ctx, option, { isLoading: true, value })

      try {
        const result = await client
          .post("/privated/options/{name}/edit", {
            json: { value },
            params: { path: { name: option } }
          })

        optionsControl.updateOption(ctx, option, { isLoading: false, value: result.value })
      } catch (e) {
        optionsControl.updateOption(ctx, option, { isLoading: false, value: !value })
        throw e;
      }
    }, {
      name: `${name}.update`,
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom()
    )
  }))
)

const options = atom(null, "options").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/privated/options/list")
      )
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        const defaultOpts = {
          isLoading: false
        }

        optionsAtom(ctx, new Map(res.map(option =>
          [option.name, { ...option, ...defaultOpts, }]))
        )
      },
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    )
  }))
)

export const optionsModel = () => {
  return {
    getOptionIsLoading,
    options,
    optionsControl,
    optionsAtom
  }
}
