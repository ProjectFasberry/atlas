import { atom, withAssign } from "@reatom/framework"
import { withSsr } from "@/shared/models/ssr"

export type CartListPayload = ExtractApiData<"getStoreCartList">["data"]
export type CartFinalPrice = ExtractApiData<"getStoreCartPrice">["data"]

export const EMPTY_CART_PRICE: CartFinalPrice = {
	BELKOIN: 0,
	CHARISM: 0,
	server: "",
	available: false,
	purchasable: false,
}

export type CartItem = CartListPayload["data"][number]

export const cartState = atom(null, "cartState").pipe(
	withAssign((_, name) => ({
		isTriggered: atom(false),
		price: atom<CartFinalPrice>(EMPTY_CART_PRICE, `${name}.price`).pipe(withSsr(`${name}.price`)),
		data: atom<CartListPayload["data"]>([], `${name}.data`).pipe(withSsr(`${name}.data`)),
		server: atom<Maybe<string>>(undefined, `${name}.server`),
		/** The cart has been fetched for this session (SSR snapshot or a client sync). */
		isLoaded: atom(false, `${name}.isLoaded`).pipe(withSsr(`${name}.isLoaded`))
	}))
)

export const cartDataSelectedAtom = atom<CartItem[]>((ctx) =>
	ctx.spy(cartState.data).filter((t) => t.selected)
)

/** Whether the product is in the cart; the only source of truth for the badge and buttons. */
export const cartContainsItemAtom = (id: number) => atom((ctx) => {
	return ctx.spy(cartState.data).some((item) => item.id === id)
}, `cart.contains.${id}`)

export const cartDataIsEmptyAtom = atom((ctx) => ctx.spy(cartState.data).length === 0)

export const cartDataItemIsSelectAtom = (id: number) => atom((ctx) => {
	const data = ctx.spy(cartDataSelectedAtom).find((d) => d.id === id);
	return data?.selected ?? false;
}, `${id}.selectedStatus`);

export const cartDataSelectedItemsLengthAtom = atom((ctx) => ctx.spy(cartDataSelectedAtom).length);

export const cartIsValidAtom = atom((ctx) => {
	const productsLengthValidate = ctx.spy(cartDataSelectedItemsLengthAtom) >= 1;
	const productsRecipientValidate = ctx.spy(cartDataSelectedAtom).filter((target) => target.recipient).length >= 1;
	return productsLengthValidate && productsRecipientValidate;
});
