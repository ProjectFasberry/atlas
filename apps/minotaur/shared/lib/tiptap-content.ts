import { renderToHTMLString } from "@tiptap/static-renderer";
import type { Extensions, JSONContent } from "@tiptap/react";

/**
 * Tiptap JSON from the database is untrusted history: it may be null, have no
 * `doc` wrapper, or carry link marks whose `href` is null (older editor
 * versions). Rendering that raw crashes the whole page (`Node.fromJSON`) or
 * produces `<a href=null>`, so every consumer goes through these helpers.
 */

const SAFE_HREF = /^https?:\/\//i;
const LINK_REL = "noopener noreferrer nofollow";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

/** Drops null/undefined attributes so they never reach the HTML output. */
const normalizeAttrs = (attrs: unknown): Record<string, unknown> | undefined => {
	if (!isRecord(attrs)) return undefined;

	const next: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(attrs)) {
		if (value === null || value === undefined) continue;
		next[key] = value;
	}

	return Object.keys(next).length > 0 ? next : undefined;
};

const normalizeMarks = (marks: unknown): JSONContent["marks"] => {
	if (!Array.isArray(marks)) return undefined;

	const next = marks.flatMap((mark) => {
		if (!isRecord(mark) || typeof mark.type !== "string") return [];

		if (mark.type === "link") {
			const href = isRecord(mark.attrs) ? mark.attrs.href : undefined;
			if (typeof href !== "string" || !SAFE_HREF.test(href)) return [];

			return [
				{
					type: "link",
					attrs: { ...normalizeAttrs(mark.attrs), href, rel: LINK_REL, target: "_blank" },
				},
			];
		}

		const attrs = normalizeAttrs(mark.attrs);
		return [attrs ? { type: mark.type, attrs } : { type: mark.type }];
	});

	return next.length > 0 ? (next as JSONContent["marks"]) : undefined;
};

const normalizeNode = (node: unknown): JSONContent | null => {
	if (!isRecord(node) || typeof node.type !== "string") return null;

	const content = Array.isArray(node.content)
		? (node.content.map(normalizeNode).filter(Boolean) as JSONContent[])
		: undefined;
	const marks = normalizeMarks(node.marks);
	const attrs = normalizeAttrs(node.attrs);

	return {
		type: node.type,
		...(typeof node.text === "string" ? { text: node.text } : {}),
		...(attrs ? { attrs } : {}),
		...(marks ? { marks } : {}),
		...(content && content.length > 0 ? { content } : {}),
	};
};

export const EMPTY_TIPTAP_CONTENT: JSONContent = {
	type: "doc",
	content: [{ type: "paragraph" }],
};

/** Always returns a renderable `doc`, never null and never a broken link mark. */
export const normalizeTiptapContent = (content: unknown): JSONContent => {
	const normalized = normalizeNode(content);
	if (!normalized || normalized.type !== "doc" || !normalized.content?.length) {
		return EMPTY_TIPTAP_CONTENT;
	}

	return normalized;
};

/**
 * Tiptap renders attributes whose schema default is `null` as unquoted
 * `class=null` / `title=null`, which browsers read as the string "null".
 */
const stripNullAttributes = (html: string) =>
	html.replace(/\s(?:class|title|href|rel|target|src|alt)=null(?=[\s>])/g, "");

/** Static render that cannot take the page down on legacy content. */
export const renderTiptapContent = (content: unknown, extensions: Extensions): string => {
	try {
		return stripNullAttributes(
			renderToHTMLString({ extensions, content: normalizeTiptapContent(content) }),
		);
	} catch {
		return "";
	}
};
