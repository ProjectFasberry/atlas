import { Editor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	applyLink,
	createEditorExtensions,
	isHostnameAllowed,
	removeLink,
	validateLinkUrl,
} from "./editor.model";

const editors: Editor[] = [];

const createEditor = (content = "<p>hello world</p>") => {
	const editor = new Editor({ extensions: createEditorExtensions(), content });
	editors.push(editor);
	return editor;
};

afterEach(() => {
	for (const editor of editors.splice(0)) editor.destroy();
});

describe("link whitelist", () => {
	it("allows project domains and their subdomains", () => {
		expect(isHostnameAllowed("fasberry.fun")).toBe(true);
		expect(isHostnameAllowed("fasberry.su")).toBe(true);
		expect(isHostnameAllowed("volume.fasberry.fun")).toBe(true);
		expect(isHostnameAllowed("discord.gg")).toBe(true);
	});

	it("rejects foreign hosts", () => {
		expect(isHostnameAllowed("evil.example")).toBe(false);
		expect(isHostnameAllowed("")).toBe(false);
	});
});

describe("validateLinkUrl", () => {
	it("adds the https scheme to a bare host", () => {
		expect(validateLinkUrl("fasberry.su/wiki")).toEqual({ ok: true, url: "https://fasberry.su/wiki" });
	});

	it("rejects empty, malformed and unsafe urls", () => {
		expect(validateLinkUrl("   ")).toEqual({ ok: false, reason: "empty" });
		expect(validateLinkUrl("javascript:alert(1)")).toEqual({ ok: false, reason: "protocol" });
		expect(validateLinkUrl("https://evil.example/x")).toEqual({ ok: false, reason: "domain" });
	});
});

describe("applyLink", () => {
	it("links the current selection", () => {
		const editor = createEditor();
		editor.commands.selectAll();

		expect(applyLink(editor, "https://fasberry.su/wiki")).toEqual({
			ok: true,
			url: "https://fasberry.su/wiki",
		});
		expect(editor.getHTML()).toContain('href="https://fasberry.su/wiki"');
	});

	it("replaces an existing link instead of stacking marks", () => {
		const editor = createEditor();
		editor.commands.selectAll();

		applyLink(editor, "https://discord.gg/X4x6Unj89g");
		applyLink(editor, "https://fasberry.su/start");

		const html = editor.getHTML();
		expect(html).toContain('href="https://fasberry.su/start"');
		expect(html).not.toContain("discord.gg");
		expect(html.match(/<a /g)).toHaveLength(1);
	});

	it("does not link a disallowed domain", () => {
		const editor = createEditor();
		editor.commands.selectAll();

		expect(applyLink(editor, "https://evil.example/x")).toEqual({ ok: false, reason: "domain" });
		expect(editor.getHTML()).not.toContain("<a");
	});

	it("inserts the url as linked text when nothing is selected", () => {
		const editor = createEditor("<p>text</p>");
		editor.commands.setTextSelection(1);

		expect(applyLink(editor, "fasberry.su/wiki").ok).toBe(true);
		expect(editor.getHTML()).toContain('<a target="_blank" rel="noopener noreferrer nofollow" href="https://fasberry.su/wiki"');
	});
});

describe("removeLink", () => {
	it("removes the whole link under the cursor", () => {
		const editor = createEditor();
		editor.commands.selectAll();
		applyLink(editor, "https://fasberry.su/wiki");

		// Cursor inside the link, not a selection: extendMarkRange must cover it.
		editor.commands.setTextSelection(3);
		removeLink(editor);

		expect(editor.getHTML()).not.toContain("<a");
		expect(editor.getHTML()).toContain("hello world");
	});
});
