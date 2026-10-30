#!/usr/bin/env node
/**
 * Sync of the Fasberry wiki with the backend.
 *
 *   pnpm sync:wiki
 *   WIKI_API_URL=https://api.fasberry.fun pnpm sync:wiki
 *
 * The script pulls /wiki/categories and /wiki/category/{slug}, converts TipTap JSON
 * into HTML/markdown and writes pages straight into PostgreSQL. Images are
 * downloaded into public/images/wiki/<slug>/; when an image is unavailable an empty
 * placeholder stays in its place and the reason goes to content/wiki-sync-report.json.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import ky from 'ky';
import { marked } from 'marked';
import { wikiPages } from '../lib/schema.ts';
import { htmlToMarkdown, jsxToHtml } from './lib/content.mjs';
import { openDb, upsertPage } from './lib/db.mjs';

const API = (process.env.WIKI_API_URL || 'https://api.fasberry.fun').replace(/\/$/, '');
const ROOT = process.cwd();
const REPORT_FILE = path.join(ROOT, 'content/wiki-sync-report.json');

async function fetchJson(url, attempt = 1) {
  try {
    return await ky.get(url, { headers: { accept: 'application/json' }, timeout: 30_000 }).json();
  } catch (error) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      return fetchJson(url, attempt + 1);
    }
    throw error;
  }
}

function normalizeUrl(url) {
  if (typeof url !== 'string') return '';
  return (
    url
      // typo in the content: https://volume/fasberry.su/...
      .replace('https://volume/fasberry.su/', 'https://volume.fasberry.fun/')
      .replace('volume.fasberry.su', 'volume.fasberry.fun')
      // images saved by the editor with a local MinIO address
      .replace(
        /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/static\//,
        'https://volume.fasberry.fun/static/',
      )
  );
}

function plainText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(plainText).join('');
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return ' ';
  return plainText(node.content);
}

function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MD_IMAGE_RE = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/g;

function textNode(node, ctx) {
  let raw = node.text || '';
  if (ctx?.table) raw = raw.replace(/\|/g, '\\|');

  const marks = new Set((node.marks || []).map((mark) => mark.type));
  const applyMarks = (value) => {
    let result = value;
    if (marks.has('code')) result = `\`${result}\``;
    if (marks.has('bold')) result = `**${result}**`;
    if (marks.has('italic')) result = `_${result}_`;
    for (const mark of node.marks || []) {
      if (mark.type === 'link' && mark.attrs?.href) {
        result = `[${result}](${normalizeUrl(mark.attrs.href)})`;
      }
    }
    return result;
  };

  // an image inserted into the editor as markdown text
  if (!raw.includes('![')) return applyMarks(escapeText(raw));

  const parts = [];
  let index = 0;
  for (const match of raw.matchAll(MD_IMAGE_RE)) {
    if (match.index > index) {
      parts.push(applyMarks(escapeText(raw.slice(index, match.index))));
    }
    const alt = match[1] || match[3] || '';
    parts.push(imageTag({ attrs: { src: match[2], alt } }));
    index = match.index + match[0].length;
  }
  if (index < raw.length) parts.push(applyMarks(escapeText(raw.slice(index))));

  return parts.join('');
}

function inline(nodes, ctx) {
  const out = [];
  for (const node of nodes || []) {
    switch (node.type) {
      case 'text': {
        out.push(textNode(node, ctx));
        break;
      }
      case 'hardBreak':
        out.push(ctx?.table ? '<br />' : '\\\n');
        break;
      case 'image':
        out.push(imageTag(node));
        break;
      default:
        out.push(inline(node.content, ctx));
    }
  }
  return out.join('');
}

function imageTag(node) {
  const attrs = node.attrs || {};
  const alt = attrs.alt && attrs.alt !== 'null' ? String(attrs.alt) : '';
  const width = Number.isFinite(Number(attrs.width)) ? Number(attrs.width) : null;
  const height = Number.isFinite(Number(attrs.height)) ? Number(attrs.height) : null;
  const normalized = normalizeUrl(attrs.src);

  const props = [];
  if (normalized) props.push(`src="${escapeAttr(normalized)}"`);
  props.push(`alt="${escapeAttr(alt)}"`);
  if (width) props.push(`width={${width}}`);
  if (height) props.push(`height={${height}}`);

  return `<WikiImage ${props.join(' ')} />`;
}

function tableCell(node) {
  const parts = [];
  for (const child of node.content || []) {
    parts.push(block(child, { table: true }));
  }
  return parts.filter((part) => part.trim()).join('<br />');
}

function table(node) {
  const rows = node.content || [];
  const lines = [];
  rows.forEach((row, index) => {
    const cells = (row.content || []).map(tableCell);
    lines.push(`| ${cells.join(' | ')} |`);
    if (index === 0) lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
  });
  return lines.join('\n');
}

function list(node, ctx) {
  const ordered = node.type === 'orderedList';
  const start = ordered ? Number(node.attrs?.start || 1) : 1;
  return (node.content || [])
    .map((item, index) => {
      const marker = ordered ? `${start + index}.` : '-';
      const nested = [];
      const parts = [];
      for (const child of item.content || []) {
        if (child.type === 'bulletList' || child.type === 'orderedList') {
          nested.push(list(child, ctx));
        } else {
          parts.push(block(child, ctx));
        }
      }
      const text = parts.filter(Boolean).join('\n').replace(/\n/g, '\n  ');
      const nestedText = nested
        .join('\n')
        .split('\n')
        .filter(Boolean)
        .map((line) => `  ${line}`)
        .join('\n');
      return `${marker} ${text}${nestedText ? `\n${nestedText}` : ''}`;
    })
    .join('\n');
}

function block(node, ctx) {
  switch (node.type) {
    case 'paragraph':
      return inline(node.content, ctx);
    case 'heading':
      return `${'#'.repeat(node.attrs?.level || 2)} ${inline(node.content, ctx)}`;
    case 'table':
      return table(node);
    case 'image':
      return imageTag(node, ctx);
    case 'bulletList':
    case 'orderedList':
      return list(node, ctx);
    case 'blockquote':
      return (node.content || [])
        .map((child) => block(child, ctx))
        .join('\n\n')
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'codeBlock':
      return `\`\`\`${node.attrs?.language || ''}\n${plainText(node.content)}\n\`\`\``;
    case 'horizontalRule':
      return '---';
    default:
      return inline(node.content, ctx);
  }
}

function renderContent(doc, ctx) {
  const blocks = [];
  const nodes = doc?.content || [];
  let firstBlock = true;

  for (const node of nodes) {
    if (firstBlock && node.type === 'heading' && node.attrs?.level === 1) {
      firstBlock = false;
      continue; // H1 duplicates the page title
    }
    if (node.type !== 'paragraph' || (node.content || []).length > 0) firstBlock = false;
    const rendered = block(node, ctx);
    if (rendered && rendered.trim()) blocks.push(rendered);
  }

  return `${blocks.join('\n\n').trim()}\n`;
}

function isBoldOnly(node) {
  const texts = (node.content || []).filter((child) => child.type === 'text');
  if (texts.length === 0) return false;
  return texts.every((child) => (child.marks || []).some((mark) => mark.type === 'bold'));
}

function firstParagraph(doc) {
  const nodes = doc?.content || [];
  let fallback = '';
  for (const node of nodes) {
    if (node.type !== 'paragraph') continue;
    const text = plainText(node.content).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (!fallback) fallback = text;
    // short bold lines in the content act as subheadings
    if (isBoldOnly(node) || text.length < 40) continue;
    return text;
  }
  return fallback;
}

function shortDescription(doc, limit = 160) {
  const text = firstParagraph(doc).replace(/[\s,;:.\-–—]+$/, '');
  if (text.length <= limit) return text;
  return `${text
    .slice(0, limit)
    .trimEnd()
    .replace(/[\s,;:.\-–—]+$/, '')}...`;
}

function titleMap(categories) {
  const titles = {};
  for (const [key, group] of Object.entries(categories)) {
    if (group?.title) titles[key] = group.title;
    for (const node of group?.nodes || []) {
      if (node?.value && node.title) titles[node.value] = node.title;
    }
  }
  return titles;
}

function buildSections(categories) {
  const isCategory = (value) => Object.hasOwn(categories, value);
  const childGroups = new Set();
  for (const group of Object.values(categories)) {
    const nodes = group.nodes || [];
    if (nodes.length > 0 && nodes.every((node) => isCategory(node.value))) {
      for (const node of nodes) childGroups.add(node.value);
    }
  }

  const sections = [];
  const used = new Set();

  const push = (label, nodes) => {
    const pages = nodes.map((node) => node.value).filter((slug) => !used.has(slug));
    if (pages.length === 0) return;
    for (const slug of pages) used.add(slug);
    sections.push({ label, pages });
  };

  if (categories.general) {
    push('С чего начать', categories.general.nodes || []);
  }

  for (const [key, group] of Object.entries(categories)) {
    if (key === 'general' || childGroups.has(key)) continue;
    const nodes = group.nodes || [];
    if (nodes.length > 0 && nodes.every((node) => isCategory(node.value))) {
      for (const node of nodes) {
        push(categories[node.value].title, categories[node.value].nodes || []);
      }
    } else {
      push(group.title, nodes);
    }
  }

  const orphans = Object.keys(categories).filter((slug) => {
    if (used.has(slug) || childGroups.has(slug)) return false;
    const nodes = categories[slug]?.nodes || [];
    if (nodes.length > 0 && nodes.every((node) => isCategory(node.value))) return false;
    return true;
  });
  if (orphans.length > 0) {
    push(
      'Прочее',
      orphans.map((slug) => ({ title: categories[slug].title, value: slug })),
    );
  }

  return sections;
}

async function main() {
  console.log(`API: ${API}`);
  const categories = (await fetchJson(`${API}/wiki/categories`)).data;
  if (!categories) throw new Error('пустой ответ /wiki/categories');

  const sections = buildSections(categories);
  const titles = titleMap(categories);
  const slugs = [...new Set(sections.flatMap((section) => section.pages))];

  const { client, db } = await openDb();
  const previous = new Set(
    (
      await db.select({ slug: wikiPages.slug }).from(wikiPages).where(eq(wikiPages.source, 'sync'))
    ).map((row) => row.slug),
  );

  // linear order: groups first, inside a group as on the backend
  const pageMeta = new Map();
  let position = 0;
  for (const section of sections) {
    for (const slug of section.pages) {
      pageMeta.set(slug, { section: section.label, position: ++position });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    api: API,
    pages: 0,
    empty: [],
    failedPages: [],
    removed: [],
  };
  const written = [];

  for (const slug of slugs) {
    let payload = null;
    let fetchError = null;
    try {
      payload = (await fetchJson(`${API}/wiki/category/${encodeURIComponent(slug)}`)).data;
    } catch (error) {
      fetchError = error;
    }

    // network or backend failed: do not overwrite an already generated page with a stub
    if (fetchError && previous.has(slug)) {
      console.warn(`! ${slug}: ${fetchError.message} — оставляю прежнюю версию`);
      report.failedPages.push({ slug, error: fetchError.message });
      written.push(slug);
      continue;
    }
    if (fetchError) {
      console.warn(`! ${slug}: ${fetchError.message}`);
      report.failedPages.push({ slug, error: fetchError.message });
    }
    const title = payload?.title || titles[slug] || categories[slug]?.title || slug;

    const body = payload?.content
      ? renderContent(payload.content, {})
      : 'Раздел пока не заполнен.\n';

    if (!payload?.content) report.empty.push(slug);

    const description = payload?.content
      ? shortDescription(payload.content)
      : 'Раздел пока не заполнен.';
    const html = jsxToHtml(String(await marked.parse(body)));

    await upsertPage(db, {
      slug,
      title,
      description,
      html,
      markdown: htmlToMarkdown(html),
      section: pageMeta.get(slug)?.section ?? null,
      position: pageMeta.get(slug)?.position ?? 0,
      source: 'sync',
      updatedAt: payload?.updated_at || new Date().toISOString(),
      updatedBy: null,
    });

    report.pages += 1;
    written.push(slug);
    console.log(`✓ ${slug} — ${title}${payload?.content ? '' : ' (пусто)'}`);
  }

  // pages generated by a previous run that disappeared from the wiki
  for (const slug of previous) {
    if (written.includes(slug)) continue;
    await db.delete(wikiPages).where(eq(wikiPages.slug, slug));
    report.removed.push(slug);
    console.log(`− ${slug} (удалён)`);
  }

  await fs.writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await client.end();

  console.log(`\nГотово: ${report.pages} страниц, удалено ${report.removed.length}.`);
  console.log(`Отчёт: ${path.relative(ROOT, REPORT_FILE)}`);
}

await main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
