import { action, atom, createCtx, spawn } from "@reatom/framework";
import {
  reatomAsync, sleep,
  withAssign, withConcurrency, withDataAtom, withErrorAtom, withStatusesAtom
} from "@reatom/framework";
import { type PageContextServer } from "vike/types";
import { logError } from "@/shared/lib/log";
import { finalizeSsr } from "@/shared/models/ssr";
import { client } from "@/shared/lib/client-wrapper";
import { getRecipient } from "../../settings/models/settings-store.model";
import { navigate } from "vike/client/router";
import { invariant } from "@/shared/lib/utils";
import { storeItems } from "./store.model";
import { getIsAuthed } from "@/shared/models/app/utils";
import { userState } from "@/shared/models/app/index.model";
import { cartContainsItemAtom, cartState } from "./store-cart.state";
import { toast } from "sonner";
import { translate } from "@/shared/locales/helpers";

export * from "./store-cart.state";

async function getCartData(init?: RequestInit) {
	return client.get("/store/cart/list", { ...init });
}

async function getCartPrice(server?: string, init?: RequestInit) {
	return client.get("/store/cart/price", {
		...init,
		params: { query: { server: server as "bisquite" | "muffin" | undefined } },
	});
}

export const cart = atom(null, "cart").pipe(
	withAssign((_, name) => ({
		// server only
		async init(pageCtx: PageContextServer) {
			const headers = pageCtx.headers;
			if (!headers) return;

			if (!getIsAuthed(pageCtx.snapshot)) return;

			const ctx = createCtx();

			const [list, price] = await Promise.all([
				getCartData({ headers }),
				getCartPrice(undefined, { headers })
			]);

			cartState.price(ctx, price);
			cartState.data(ctx, list.data);
			cartState.isLoaded(ctx, true);
			if (!ctx.get(cartState.server) && price.server) cartState.server(ctx, price.server);

			finalizeSsr(ctx, pageCtx);
		},
		/** Loads the cart once per session when the SSR pass had no authorized cart. */
		sync: action(async (ctx) => {
			if (!ctx.get(cartState.isLoaded) && ctx.get(userState.isAuthed)) {
				cartState.isLoaded(ctx, true);
				await cart.update(ctx);
			}
		}, `${name}.sync`),
		addItem: reatomAsync(async (ctx, id: number) => {
			const isAuth = ctx.get(userState.isAuthed);

			if (!isAuth) {
				ctx.schedule(() => navigate("/auth"));
				return;
			}

			storeItems.setPending(ctx, id, true);

			const recipient = getRecipient(ctx);

			try {
				const result = await client
					.post("/store/cart/add/{id}", { json: { recipient }, params: { path: { id } } })

				return { id, result };
			} catch (e) {
				storeItems.setPending(ctx, id, false);
				throw e;
			}
		}, {
			name: `${name}.addItem`,
			onFulfill: (ctx, res) => {
				if (!res) return;

				cart.touch(ctx);
				cart.update(ctx);
			},
			onReject: (_, e) => logError(e, { type: "combined" })
		}).pipe(
			withStatusesAtom()
		),
		removeItem: reatomAsync(async (ctx, id: number) => {
			storeItems.setPending(ctx, id, true);

			try {
				const result = await client
					.delete("/store/cart/remove/{id}", { params: { path: { id } } })

				return { id, result }
			} catch (e) {
				storeItems.setPending(ctx, id, false);
				throw e
			}
		}, {
			name: `${name}.removeItem`,
			onFulfill: (ctx) => cart.update(ctx),
			onReject: (_, e) => logError(e, { type: "combined" })
		}).pipe(
			withStatusesAtom()
		),
		/** Toggles the product in the cart; the button state for the store cards. */
		toggle: action((ctx, id: number) => {
			if (ctx.get(cartContainsItemAtom(id))) {
				cart.removeItem(ctx, id)
				return;
			}

			cart.addItem(ctx, id)
		}, `${name}.toggle`),
		setSelected: reatomAsync(async (ctx, id: number) => {
			const current = ctx.get(cartState.data).find((target) => target.id === id);
			invariant(current, "Cart item is not defined");

			storeItems.setPending(ctx, id, true);

			try {
				const result = await client
					.post("/store/cart/edit/{id}", {
						json: { key: "selected", value: !current.selected },
						params: { path: { id } }
					})

				return { id, result }
			} catch (e) {
				storeItems.setPending(ctx, id, false);
				throw e
			}
		}, {
			name: `${name}.setSelected`,
			onFulfill: (ctx) => cart.update(ctx),
			onReject: (_, e) => logError(e, { type: "combined" }),
		}).pipe(
			withStatusesAtom()
		),
		/** Removes the item and offers an undo toast; the model keeps this flow out of the view. */
		removeWithUndo: action((ctx, item: { id: number; recipient?: string | null }) => {
			spawn(ctx, async (spawnCtx) => {
				try {
					await cart.removeItem(spawnCtx, item.id)

					toast(translate["cart.actions.removed"](), {
						action: {
							label: translate["cart.actions.undo"](),
							onClick: () => { void cart.restoreItem(spawnCtx, item) },
						},
					})
				} catch {
					// the model already logs the failure
				}
			})
		}, `${name}.removeWithUndo`),
		update: reatomAsync(async (ctx) => {
			const server = ctx.get(cartState.server) ?? undefined;
			const [list, price] = await Promise.all([
				getCartData({ signal: ctx.controller.signal }),
				getCartPrice(server, { signal: ctx.controller.signal })
			]);

			cartState.data(ctx, list.data);
			cartState.price(ctx, price);
			cartState.isLoaded(ctx, true);
			storeItems.clearPending(ctx);
		}, {
			name: `${name}.update`,
			onReject: (ctx, e) => {
				storeItems.clearPending(ctx);
				logError(e, { type: "combined" });
			},
		}),
		setServer: reatomAsync(async (ctx, server: string) => {
			cartState.server(ctx, server);
			return await getCartPrice(server, { signal: ctx.controller.signal });
		}, {
			name: `${name}.setServer`,
			onFulfill: (ctx, price) => cartState.price(ctx, price),
			onReject: (ctx, e) => logError(e, { type: "combined" }),
		}).pipe(
			withStatusesAtom(),
		),
		restoreItem: reatomAsync(async (ctx, item: { id: number, recipient?: string | null }) => {
			return await client
				.post("/store/cart/add/{id}", {
					json: { recipient: item.recipient ?? getRecipient(ctx) },
					params: { path: { id: item.id } },
				});
		}, {
			name: `${name}.restoreItem`,
			onFulfill: (ctx) => cart.update(ctx),
			onReject: (ctx, e) => logError(e, { type: "combined" }),
		}).pipe(
			withStatusesAtom(),
		),
		setAllSelected: reatomAsync(async (ctx, selected: boolean) => {
			const targets = ctx.get(cartState.data).filter((item) => item.selected !== selected);

			for (const item of targets) {
				await client.post("/store/cart/edit/{id}", {
					json: { key: "selected", value: selected },
					params: { path: { id: item.id } },
				});
			}

			return selected;
		}, {
			name: `${name}.setAllSelected`,
			onFulfill: (ctx) => cart.update(ctx),
			onReject: (ctx, e) => logError(e, { type: "combined" }),
		}).pipe(
			withStatusesAtom(),
			withErrorAtom(),
		),
		clear: reatomAsync(async (ctx) => {
			const items = ctx.get(cartState.data);

			for (const item of items) {
				await client.delete("/store/cart/remove/{id}", { params: { path: { id: item.id } } });
			}

			return items.length;
		}, {
			name: `${name}.clear`,
			onFulfill: (ctx) => cart.update(ctx),
			onReject: (ctx, e) => logError(e, { type: "combined" }),
		}).pipe(
			withStatusesAtom(),
			withErrorAtom(),
		),
		suggestions: reatomAsync(async (ctx) => {
			const payload = await client.get("/store/items", {
				params: { query: { category: "all", wallet: "ALL", searchQuery: undefined } },
				signal: ctx.controller.signal,
			});
			return payload.data.filter((item) => !ctx.get(cartState.data).some((cartItem) => cartItem.id === item.id)).slice(0, 4);
		}, `${name}.suggestions`).pipe(
			withDataAtom(null),
			withStatusesAtom(),
		),
		touch: action(async (ctx) => {
			cartState.isTriggered(ctx, true);
			await ctx.schedule(() => sleep(300));
			cartState.isTriggered(ctx, false);
		}).pipe(
			withConcurrency()
		)
	}))
)
