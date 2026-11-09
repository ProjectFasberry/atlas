import { action, atom, batch, createCtx } from "@reatom/framework";
import { reatomAsync, sleep, withAssign, withConcurrency, withStatusesAtom } from "@reatom/framework";
import { type PageContextServer } from "vike/types";
import { logError } from "@/shared/lib/log";
import { snapshots } from "@/shared/models/ssr";
import { client } from "@/shared/lib/client-wrapper";
import { getRecipient } from "../../settings/models/settings-store.model";
import { navigate } from "vike/client/router";
import { invariant } from "@/shared/lib/utils";
import { storeItem } from "./store-item.model";
import { storeItems } from "./store.model";
import { getIsAuthed } from "@/shared/models/app/utils";
import { userState } from "@/shared/models/app/index.model";
import { cartState } from "./store-cart.state";

export * from "./store-cart.state";

async function getCartData(init?: RequestInit) {
	return client.get("/store/cart/list", { ...init });
}

async function getCartPrice(init?: RequestInit) {
	return client.get("/store/cart/price", { ...init });
}

function assertDefined<T>(val: T, name: string): asserts val is NonNullable<T> {
	if (val === undefined || val === null) {
		const message = `${name} is undefined or null`;
		console.warn(message);
	}
}

export const cart = atom(null, "cart").pipe(
	withAssign((_, name) => ({
		// server only
		async init(pageCtx: PageContextServer) {
			const headers = pageCtx.headers;
			if (!headers) return;

			const isAuthed = getIsAuthed(pageCtx.snapshot);
			assertDefined(isAuthed, "isAuthed")

			if (!isAuthed) return;

			const ctx = createCtx();

			const [list, price] = await Promise.all([
				getCartData({ headers }),
				getCartPrice({ headers })
			]);

			cartState.price(ctx, price);
			cartState.data(ctx, list.data);

			const newSnapshot = snapshots.merge(ctx, pageCtx);
			pageCtx.snapshot = newSnapshot;
		},
		addItem: reatomAsync(async (ctx, id: number) => {
			const isAuth = ctx.get(userState.isAuthed);

			if (!isAuth) {
				ctx.schedule(() => navigate("/auth"));
				return;
			}

			storeItems.simulate(ctx, id, "load");

			const recipient = getRecipient(ctx);

			try {
				const result = await client
					.post("/store/cart/add/{id}", { json: { recipient }, params: { path: { id } } })

				return { id, result };
			} catch (e) {
				storeItems.simulate(ctx, id, "unload");
				throw e;
			}
		}, {
			name: `${name}.addItem`,
			onFulfill: (ctx, res) => {
				if (!res) return;

				const { result, id } = res;
				invariant(id, "Store target id is not defined")

				batch(ctx, () => {
					storeItems.simulate(ctx, id, "select");
					storeItems.simulate(ctx, id, "unload");
				});

				cart.touch(ctx);
				cart.update(ctx);
			},
			onReject: (ctx, e) => logError(e, { type: "combined" })
		}).pipe(
			withStatusesAtom()
		),
		removeItem: reatomAsync(async (ctx, id: number) => {
			storeItems.simulate(ctx, id, "load")

			try {
				const result = await client
					.delete("/store/cart/remove/{id}", { params: { path: { id } } })

				return { id, result }
			} catch (e) {
				storeItems.simulate(ctx, id, "unload");
				throw e
			}
		}, {
			name: "removeItemFromCartAction",
			onFulfill: (ctx, { id, result }) => {
				invariant(id, "Store target id is not defined")

				batch(ctx, () => {
					storeItems.simulate(ctx, id, "select")
					storeItems.simulate(ctx, id, "unload");
				})

				batch(ctx, () => {
					cart.update(ctx)
					storeItem.updateStatus(ctx, id, { remove: true })
				});
			},
			onReject: (ctx, e) => logError(e, { type: "combined" })
		}).pipe(
			withStatusesAtom()
		),
		update: reatomAsync(async (ctx) => {
			const [list, price] = await Promise.all([
				getCartData({ signal: ctx.controller.signal }),
				getCartPrice({ signal: ctx.controller.signal })
			]);

			cartState.data(ctx, list.data);
			cartState.price(ctx, price);
		}, `${name}.update`),
		touch: action(async (ctx) => {
			cartState.isTriggered(ctx, true);
			await ctx.schedule(() => sleep(300));
			cartState.isTriggered(ctx, false);
		}).pipe(
			withConcurrency()
		)
	}))
)
