#!/usr/bin/env node
// Exports UI-chrome strings from locales/en.ts into per-language .md files
// under i18n-exports/, formatted for a human or LLM to translate offline.
// Companion to scripts/i18n-import.mjs, which merges the translated .md
// back into the target locales/<lang>.ts file.
//
// Usage:
//   node scripts/i18n-export.mjs                 # missing keys, all languages
//   node scripts/i18n-export.mjs --lang=zh        # missing keys, Chinese only
//   node scripts/i18n-export.mjs --lang=zh --all  # every key (full re-pass), Chinese only
//   node scripts/i18n-export.mjs --all            # every key, all languages
//
// "Missing" = present in en.ts but absent (or blank) in the target locale
// file. This is the normal day-to-day mode: add new English strings to
// locales/en.ts while building a page, then run this to produce exactly
// the new lines that need translating.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localesDir = path.join(root, 'locales');
const exportsDir = path.join(root, 'i18n-exports');

const SUPPORTED = [
    { code: 'zh', label: 'Chinese (Mandarin)' },
    { code: 'bn', label: 'Bengali' },
    { code: 'ta', label: 'Tamil' },
    { code: 'ms', label: 'Malay' },
    { code: 'my', label: 'Myanmar (Burmese)' },
];

function parseArgs(argv) {
    const args = { lang: 'all', all: false };
    for (const a of argv) {
        if (a === '--all') args.all = true;
        else if (a.startsWith('--lang=')) args.lang = a.slice('--lang='.length);
    }
    return args;
}

function parseLocaleFile(text) {
    const lines = text.split(/\r?\n/);
    const entries = [];
    let section = 'App Chrome (Navigation, Header, Footer)';
    for (const line of lines) {
        const trimmed = line.trim();
        const sectionMatch = trimmed.match(/^\/\/\s*-{2,}\s*(.+?)\s*-{2,}\s*$/);
        if (sectionMatch) { section = sectionMatch[1]; continue; }
        const entryMatch = trimmed.match(/^'([^']+)':\s*'((?:\\.|[^'\\])*)',?\s*$/);
        if (entryMatch) {
            const value = entryMatch[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
            entries.push({ key: entryMatch[1], value, section });
        }
    }
    return entries;
}

function loadLocale(code) {
    const file = path.join(localesDir, `${code}.ts`);
    if (!fs.existsSync(file)) return [];
    return parseLocaleFile(fs.readFileSync(file, 'utf8'));
}

function buildExport(langCode, langLabel, includeAll) {
    const enEntries = loadLocale('en');
    const targetEntries = loadLocale(langCode);
    const targetMap = new Map(targetEntries.map(e => [e.key, e.value]));

    const rows = enEntries.filter(e => includeAll || !targetMap.has(e.key) || !targetMap.get(e.key).trim());
    if (rows.length === 0) return null;

    let md = `<!-- LENIX EZJOB — UI string translation: ${langLabel} (${langCode}) -->\n`;
    md += `<!--\nInstructions for the translator (human or LLM):\n`;
    md += `- This is UI chrome for a mobile-first, blue-collar/skilled-trades job board (workers, employers, admins in Singapore/Malaysia).\n`;
    md += `- Translate ONLY the text after "EN:" into ${langLabel}. Do not translate the "### key" line.\n`;
    md += `- Keep {placeholders} like {count}, {date}, {filled}, {total} exactly as-is, unchanged, in the same position they'd naturally read.\n`;
    md += `- These are buttons/labels/short messages, not prose — keep translations short and natural, not literal word-for-word.\n`;
    md += `- Write the translation on the line after "TR:" (it may already hold the current translation to review/improve). Leave nothing after "TR:" untranslated or blank.\n`;
    md += `- Do not add commentary, notes, or extra "### "/"## " headings of your own.\n-->\n\n`;

    let currentSection = null;
    for (const row of rows) {
        if (row.section !== currentSection) {
            currentSection = row.section;
            md += `## ${currentSection}\n\n`;
        }
        md += `### ${row.key}\n`;
        md += `EN: ${row.value}\n`;
        const existing = includeAll ? (targetMap.get(row.key) ?? '') : '';
        md += `TR: ${existing}\n\n`;
    }
    return md;
}

function main() {
    const { lang, all } = parseArgs(process.argv.slice(2));
    fs.mkdirSync(exportsDir, { recursive: true });
    const targets = lang === 'all' ? SUPPORTED : SUPPORTED.filter(l => l.code === lang);
    if (targets.length === 0) {
        console.error(`Unknown --lang=${lang}. Supported: ${SUPPORTED.map(l => l.code).join(', ')}, or "all".`);
        process.exit(1);
    }
    let wrote = 0;
    for (const t of targets) {
        const md = buildExport(t.code, t.label, all);
        const suffix = all ? 'full' : 'missing';
        const outFile = path.join(exportsDir, `${t.code}-${suffix}.md`);
        if (md === null) {
            console.log(`[${t.code}] Nothing to export (locale already covers every current English key). Skipped.`);
            continue;
        }
        fs.writeFileSync(outFile, md, 'utf8');
        console.log(`[${t.code}] Wrote ${outFile}`);
        wrote++;
    }
    if (wrote === 0) {
        console.log('\nNo files written. Every supported locale already has every current English key filled in.');
        console.log('Add new English strings to locales/en.ts first (new page work), then re-run this export.');
    }
}

main();
