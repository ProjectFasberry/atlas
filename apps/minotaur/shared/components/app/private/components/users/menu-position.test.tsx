import { act } from "react";
import { createRoot } from "react-dom/client";
import { Menu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { beforeAll, expect, it } from "vitest";

beforeAll(() => {
	// floating-ui's autoUpdate needs ResizeObserver; jsdom has none.
	globalThis.ResizeObserver ??= class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
});

const point = { x: 120, y: 240 };

const Harness = () => (
	<Menu.Root
		open
		positioning={{
			strategy: "fixed",
			placement: "bottom-start",
			getAnchorRect: () => ({ ...point, width: 0, height: 0 }),
		}}
	>
		<Menu.Context>
			{() => (
				<Portal>
					<Menu.Positioner>
						<Menu.Content>content</Menu.Content>
					</Menu.Positioner>
				</Portal>
			)}
		</Menu.Context>
	</Menu.Root>
);

it("positions the singleton menu at the anchor point", async () => {
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);

	await act(async () => {
		root.render(<Harness />);
	});

	await act(async () => {
		await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
	});

	const positioner = document.querySelector<HTMLElement>('[data-scope="menu"][data-part="positioner"]');
	expect(positioner).not.toBeNull();

	const x = Number.parseFloat(positioner?.style.getPropertyValue("--x") ?? "");
	const y = Number.parseFloat(positioner?.style.getPropertyValue("--y") ?? "");

	expect(x).toBe(point.x);
	expect(y).toBeGreaterThan(point.y - 16);
	expect(y).toBeLessThan(point.y + 16);
});
