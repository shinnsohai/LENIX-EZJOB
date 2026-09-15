#!/usr/bin/env node
// Merges a translated .md file (produced by scripts/i18n-export.mjs, then
// filled in by a human or LLM) back into the target locales/<lang>.ts file.
// Existing keys are updated in place; new keys are appended before the
// closing `};` under an "Imported <date>" comment. Unknown keys (typos,
// or keys no longer in en.ts) are skipped with a warning rather than
// silently breaking the UIStrings type contract.
//
// Usage:
//   node scripts/i18n-import.mjs --lang=zh --file=i18n-exports/zh-missing.md

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localesDir = path.join(root, 'locales');

const SUPPORTED_CODES = ['zh', 'bn', 'ta', 'ms', 'my'];

function parseArgs(argv) {
    const args = {};
    for (const a of argv) {
        if (a.startsWith('--lang=')) args.lang = a.slice('--lang='.length);
        else if (a.startsWith('--file=')) args.file = a.slice('--file='.length);
    }
    return args;
}

function parseLocaleKeys(text) {
    const keys = new Set();
    const re = /^\s*'([^']+)':\s*'(?:\\.|[^'\\])*',?\s*$/gm;
    let m;
    while ((m = re.exec(text))) keys.add(m[1]);
    return keys;
}

function parseTranslatedMd(text) {
    const blocks = text.split(/\n(?=###\s)/);
    const entries = [];
    for (const block of blocks) {
        const keyMatch = block.match(/^###\s+(.+?)\s*(?:\n|$)/);
        if (!keyMatch) continue;
        const key = keyMatch[1].trim();
        const trIdx = block.indexOf('TR:');
        if (trIdx === -1) continue;
        let trText = block.slice(trIdx + 3);
        // Cut off anything from the next "## Section" heading onward, in
        // case this was the last entry in its section (export always puts
        // "## " section headings before "### " entry headings).
        trText = trText.split(/\n##\s/)[0].trim();
        if (trText) entries.push({ key, value: trText });
    }
    return entries;
}

function escapeForTs(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function mergeIntoLocaleFile(langCode, translatedEntries) {
    const file = path.join(localesDir, `${langCode}.ts`);
    if (!fs.existsSync(file)) throw new Error(`No such locale file: ${file}`);
    const text = fs.readFileSync(file, 'utf8');

    const enFile = path.join(localesDir, 'en.ts');
    const validKeys = parseLocaleKeys(fs.readFileSync(enFile, 'utf8'));

    const trByKey = new Map();
    const skipped = [];
    for (const { key, value } of translatedEntries) {
        if (!validKeys.has(key)) { skipped.push(key); continue; }
        trByKey.set(key, value);
    }

    const lines = text.split(/\r?\n/);
    const updatedKeys = new Set();
    const entryLineRe = /^(\s*)'([^']+)':\s*'(?:\\.|[^'\\])*'(,?)\s*$/;

    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(entryLineRe);
        if (m && trByKey.has(m[2])) {
            const [, indent, key, comma] = m;
            lines[i] = `${indent}'${key}': '${escapeForTs(trByKey.get(key))}'${comma}`;
            updatedKeys.add(key);
        }
    }

    const toAppend = [];
    for (const [key, value] of trByKey) {
        if (!updatedKeys.has(key)) toAppend.push({ key, value });
    }

    if (toAppend.length > 0) {
        const closeIdx = lines.map(l => l.trim()).lastIndexOf('};');
        if (closeIdx === -1) throw new Error(`Could not find closing "};" in ${file}`);
        const insert = [`    // --- Imported ${new Date().toISOString().slice(0, 10)} ---`];
        for (const { key, value } of toAppend) {
            insert.push(`    '${key}': '${escapeForTs(value)}',`);
        }
        lines.splice(closeIdx, 0, ...insert);
    }

    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    return { updated: updatedKeys.size, appended: toAppend.length, skipped };
}

function main() {
    const { lang, file } = parseArgs(process.argv.slice(2));
    if (!lang || !SUPPORTED_CODES.includes(lang)) {
        console.error(`--lang is required and must be one of: ${SUPPORTED_CODES.join(', ')}`);
        process.exit(1);
    }
    if (!file) {
        console.error('--file=<path to translated .md> is required.');
        process.exit(1);
    }
    const filePath = path.isAbsolute(file) ? file : path.join(root, file);
    if (!fs.existsSync(filePath)) {
        console.error(`No such file: ${filePath}`);
        process.exit(1);
    }

    const entries = parseTranslatedMd(fs.readFileSync(filePath, 'utf8'));
    if (entries.length === 0) {
        console.log('No filled-in TR: entries found in that file — nothing to import.');
        return;
    }

    const { updated, appended, skipped } = mergeIntoLocaleFile(lang, entries);
    console.log(`[${lang}] Updated ${updated} existing key(s), appended ${appended} new key(s).`);
    if (skipped.length > 0) {
        console.log(`[${lang}] Skipped ${skipped.length} unknown key(s) not in locales/en.ts: ${skipped.join(', ')}`);
    }
    console.log(`[${lang}] Run "npm run typecheck" to confirm locales/${lang}.ts is still valid.`);
}

main();
