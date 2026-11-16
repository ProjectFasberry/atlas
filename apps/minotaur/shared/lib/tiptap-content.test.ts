import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { normalizeTiptapContent, renderTiptapContent } from "./tiptap-content";

const extensions = [StarterKit];

const doc = (content: unknown[]) => ({ type: "doc", content });

describe("normalizeTiptapContent", () => {
	it("turns null into an empty document", () => {
		expect(normalizeTiptapContent(null)).toEqual({
			type: "doc",
			content: [{ type: "paragraph" }],
		});
	});

	it("drops link marks without a usable href", () => {
		const html = renderTiptapContent(
			doc([
				{
					type: "paragraph",
					content: [{ type: "text", text: "битая", marks: [{ type: "link", attrs: { href: null } }] }],
				},
			]),
			extensions,
		);

		expect(html).toBe("<p>битая</p>");
	});

	it("drops unsafe protocols", () => {
		const html = renderTiptapContent(
			doc([
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "click", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
					],
				},
			]),
			extensions,
		);

		expect(html).not.toContain("<a");
	});

	it("keeps valid links and removes null attributes", () => {
		const html = renderTiptapContent(
			doc([
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "тык",
							marks: [
								{
									type: "link",
									attrs: { href: "https://discord.gg/X4x6Unj89g", class: null, target: "_blank" },
								},
							],
						},
					],
				},
			]),
			extensions,
		);

		expect(html).toContain('href="https://discord.gg/X4x6Unj89g"');
		expect(html).toContain('rel="noopener noreferrer nofollow"');
		expect(html).not.toContain("class=null");
		expect(html).not.toContain("title=null");
	});

	it("does not throw on malformed nodes", () => {
		expect(() => renderTiptapContent({ type: "doc", content: [null, 42] }, extensions)).not.toThrow();
	});
});
