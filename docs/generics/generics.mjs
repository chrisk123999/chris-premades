import {existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {join, relative, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const root = process.cwd();
const outDir = process.argv[2] ?? 'wiki';
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : undefined;
const stub = globalThis.__docStub;
const sourceUrl = process.env.SOURCE_URL ?? 'https://github.com/chrisk123999/chris-premades/blob/main';
const lang = JSON.parse(readFileSync(join(root, 'lang/en.json'), 'utf8'));
const catLangPath = process.env.CAT_LANG ?? join(root, '../covens-automation-toolkit/lang/en.json');
Object.assign(lang, existsSync(catLangPath) ? JSON.parse(readFileSync(catLangPath, 'utf8')) : {});
const barrelPath = join(root, 'scripts/macros/generic.mjs');
const generics = await import(pathToFileURL(barrelPath).href);

/** Resolve a dotted lang key, or return undefined. */
function loc(key) {
    if (typeof key !== 'string') return;
    return key.split('.').reduce((node, part) => node?.[part], lang) ?? undefined;
}
function humanize(identifier) {
    return identifier.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
}
function isStubbed(value) {
    if (value === stub) return true;
    if (Array.isArray(value)) return value.some(isStubbed);
    if (value && typeof value === 'object') return Object.values(value).some(isStubbed);
    return false;
}
function cell(text) {
    return String(text ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

/** Barrel order: each export's category header and source file. */
function readBarrel() {
    const entries = new Map();
    const categories = [];
    let category;
    for (const line of readFileSync(barrelPath, 'utf8').split('\n')) {
        const header = line.match(/^\/\*\s+([A-Z][A-Z ]+?)\s+\*\/$/);
        if (header && header[1] !== 'GENERIC MACROS') {
            category = header[1].toLowerCase();
            categories.push(category);
        }
        const exported = line.match(/^export \{([^}]*)\} from '\.\/generic\/(\w+)\.mjs';/);
        if (exported) for (const name of exported[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop())) entries.set(name, {category, file: exported[2]});
    }
    return {entries, categories};
}

/** The JSDoc block directly above `export const name`, as plain text, or undefined. */
function readJsDoc(source, name) {
    const match = source.match(new RegExp(`/\\*\\*((?:(?!\\*/)[\\s\\S])*)\\*/\\s*export const ${name}\\b`));
    if (!match) return;
    const lines = match[1].split('\n').map(line => line.replace(/^\s*\* ?/, '')).join('\n').trim().split('\n');
    const summary = [];
    const examples = [];
    let inExample = false;
    for (const line of lines) {
        if (line.startsWith('@example')) { inExample = true; continue; }
        if (line.startsWith('@')) { inExample = false; continue; }
        (inExample ? examples : summary).push(line);
    }
    return {summary: summary.join('\n').trim(), example: examples.join('\n').trim()};
}

/** Every CPR pack item that binds each generic, keyed by identifier. */
function readUsage() {
    const usage = new Map();
    let file, rules;
    const walk = (node, item, pack) => {
        if (Array.isArray(node)) return node.forEach(child => walk(child, item, pack));
        if (!node || typeof node !== 'object') return;
        for (const [key, value] of Object.entries(node)) {
            if (key === 'macros' && value && typeof value === 'object' && !Array.isArray(value)) {
                for (const list of Object.values(value)) {
                    if (!Array.isArray(list)) continue;
                    for (const macro of list) {
                        if (macro?.source !== 'chris-premades' || !macro.identifier) continue;
                        if (!usage.has(macro.identifier)) usage.set(macro.identifier, new Map());
                        usage.get(macro.identifier).set(file, {item, pack, file, rules});
                    }
                }
            }
            walk(value, item, pack);
        }
    };
    const visit = dir => {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (statSync(path).isDirectory()) visit(path);
            else if (name.endsWith('.json')) {
                let data;
                try { data = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
                file = relative(root, path).split(sep).join('/');
                rules = data?.system?.source?.rules ?? '';
                if (data?.name) walk(data, data.name, relative(join(root, 'packData'), dir).split(/[\\/]/)[0]);
            }
        }
    };
    visit(join(root, 'packData'));
    return usage;
}

const typeNames = {checkbox: 'On/Off', select: 'Choice', 'select-many': 'Choices', selectMany: 'Choices', formula: 'Formula', number: 'Number', text: 'Text', selectAnimation: 'Animation', selectActivity: 'Activity', selectActivities: 'Activities', selectItem: 'Item', selectItems: 'Items', damageTypes: 'Damage types', file: 'File', color: 'Color'};
const documentNames = {activeeffect: 'effect', activity: 'activity', item: 'item', region: 'region', actor: 'actor'};
function describeType(type) {
    return typeNames[type] ?? humanize(String(type ?? ''));
}
function describeDocuments(documents = []) {
    return documents.map(d => documentNames[d] ?? d).join(', ');
}
function describeDefault(value, type) {
    if (isStubbed(value)) return 'computed';
    if (typeof value === 'boolean') return value ? 'On' : 'Off';
    if (type === 'selectAnimation' && value?.identifier) return value.identifier === 'none' ? 'None' : humanize(value.identifier);
    if (value === '' || value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.length ? value.map(v => '`' + (typeof v === 'object' ? JSON.stringify(v) : v) + '`').join(', ') : '';
    if (typeof value === 'object') return '`' + JSON.stringify(value) + '`';
    return '`' + value + '`';
}
function describeChoices(config) {
    const descriptor = Object.getOwnPropertyDescriptor(config, 'options');
    if (!descriptor) return '';
    let options;
    try { options = descriptor.get ? descriptor.get.call(config) : descriptor.value; } catch { return ''; }
    if (!Array.isArray(options) || isStubbed(options) || !options.length) return '';
    return options.map(o => (typeof o === 'object' ? loc(o.label) ?? o.label ?? o.value : o)).join(', ');
}
function triggersOf(value) {
    return Object.entries(value).filter(([, list]) => Array.isArray(list) && list.some(entry => entry?.pass)).map(([trigger, list]) => ({trigger, passes: [...new Set(list.map(entry => entry.pass))]}));
}

const {entries: barrel, categories} = readBarrel();
const usage = readUsage();
const pages = new Map();
for (const [identifier, value] of Object.entries(generics)) {
    if (!value?.generic) continue;
    const place = barrel.get(identifier);
    if (!place || (only && !only.has(place.file))) continue;
    const source = readFileSync(join(root, 'scripts/macros/generic', place.file + '.mjs'), 'utf8');
    if (!pages.has(place.file)) pages.set(place.file, {file: place.file, source, variants: []});
    const page = pages.get(place.file);
    if (value.category !== place.category) console.warn(`${identifier}: category '${value.category}' but the barrel lists it under '${place.category}'`);
    page.variants.push({identifier, value, name: loc('CHRISPREMADES.Macros.Generic.' + identifier.charAt(0).toUpperCase() + identifier.slice(1) + '.Name') ?? humanize(identifier), category: value.category, doc: readJsDoc(source, identifier)});
}

mkdirSync(outDir, {recursive: true});
const pageName = page => (page.variants.length > 1 ? humanize(page.file) : page.variants[0].name).replace(/[^A-Za-z0-9]+/g, '-');
const firstSentence = text => (text ?? '').split(/(?<=\.)\s/)[0];

for (const page of pages.values()) {
    const shared = page.variants.find(v => v.doc)?.doc ?? {summary: '', example: ''};
    const allKeys = new Map();
    for (const variant of page.variants) for (const key of Object.keys(variant.value.genericConfig ?? {})) {
        if (!allKeys.has(key)) allKeys.set(key, {config: variant.value.genericConfig[key], variants: []});
        allKeys.get(key).variants.push(variant.identifier);
    }
    const lines = [];
    const title = page.variants.length > 1 ? humanize(page.file) : page.variants[0].name;
    lines.push(`[Generics](../wiki/Generics) / ${title}`, '', `# ${title}`, '');
    if (shared.summary) lines.push(shared.summary, '');
    lines.push('| Identifier | Bound on | Runs on |', '| --- | --- | --- |');
    for (const variant of page.variants) {
        const runs = triggersOf(variant.value).map(t => t.passes.map(p => '`' + p + '`').join(', ')).join(', ');
        const label = page.variants.length > 1 ? `**${variant.name}**<br>` : '';
        lines.push(`| ${label}\`${variant.identifier}\` | ${describeDocuments(variant.value.documents)} | ${runs} |`);
    }
    lines.push('');
    if (allKeys.size) {
        const groups = new Map();
        for (const [key, entry] of allKeys) {
            const group = entry.config.category ?? 'behavior';
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push([key, entry]);
        }
        lines.push('## Options', '');
        for (const [group, keys] of groups) {
            if (groups.size > 1) lines.push(`### ${humanize(group)}`, '');
            lines.push('| Option | Type | Default | Description |', '| --- | --- | --- | --- |');
            for (const [key, {config, variants}] of keys) {
                const label = loc(config.label) ?? humanize(key);
                const scope = page.variants.length > 1 && variants.length < page.variants.length ? ` *${variants.map(v => '`' + v + '`').join(', ')} only.*` : '';
                const choices = config.type === 'select' || config.type === 'selectMany' || config.options ? describeChoices(config) : '';
                const hint = loc(config.hint) ?? '';
                lines.push(`| **${cell(label)}**<br>\`${key}\` | ${describeType(config.type)} | ${describeDefault(config.default, config.type)} | ${cell(hint)}${choices ? ` Choices: ${cell(choices)}.` : ''}${scope} |`);
            }
            lines.push('');
        }
    }
    const notes = page.variants.map(v => v.value.notes).find(n => typeof n === 'string');
    if (notes) {
        lines.push('## Notes', '');
        for (const line of notes.split('\n')) lines.push(line.startsWith('\t') ? '  - ' + line.trim() : '- ' + line.trim());
        lines.push('');
    }
    if (shared.example) lines.push('## Example', '', '```js', shared.example, '```', '');
    const users = page.variants.flatMap(v => [...(usage.get(v.identifier)?.values() ?? [])]);
    if (users.length) {
        const unique = [...new Map(users.map(u => [u.file, u])).values()];
        const year = u => u.pack.match(/20\d\d/)?.[0] ?? u.rules;
        const byName = Map.groupBy(unique, u => u.item);
        const link = u => `${sourceUrl}/${u.file.split('/').map(encodeURIComponent).join('/')}`;
        const entries = [...byName.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([name, list]) => {
            const years = new Set(list.map(year));
            if (years.has('2014') && years.has('2024')) return [`[${name} (All)](${link(list.find(u => year(u) === '2024'))})`];
            return list.map(u => `[${name} (${year(u) || 'All'})](${link(u)})`);
        });
        lines.push(`## Used by`, '', `<details><summary>${entries.length} CPR item${entries.length === 1 ? '' : 's'}</summary>`, '', entries.join(', '));
        lines.push('', '</details>', '');
    }
    writeFileSync(join(outDir, pageName(page) + '.md'), lines.join('\n'));
}

const master = ['# Generics', '', 'Generic macros are configurable automations that any item, activity or effect can use. Each one is set up per document in the CAT medkit.', ''];
for (const category of categories) {
    const rows = [...pages.values()].filter(page => page.variants[0].category === category);
    if (!rows.length) continue;
    master.push(`## ${humanize(category)}`, '', '| Generic | Description | Bound on |', '| --- | --- | --- |');
    for (const page of rows) {
        const title = page.variants.length > 1 ? humanize(page.file) : page.variants[0].name;
        const ids = page.variants.map(v => (page.variants.length > 1 ? v.name + ': ' : '') + '`' + v.identifier + '`').join('<br>');
        const summary = page.variants.find(v => v.doc)?.doc.summary;
        const documents = [...new Set(page.variants.flatMap(v => v.value.documents ?? []))];
        master.push(`| [${title}](../wiki/${pageName(page)})<br>${ids} | ${cell(firstSentence(summary))} | ${describeDocuments(documents)} |`);
    }
    master.push('');
}
writeFileSync(join(outDir, 'Generics.md'), master.join('\n'));
console.log(`wrote ${pages.size} generic pages and Generics.md to ${outDir}`);
