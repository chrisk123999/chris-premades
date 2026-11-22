import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stubbed = /\/scripts\/(proxy|module)\.mjs$/;
/** Replace CPR's proxy and module entry points with modules whose exports are the shared Foundry stub. */
export async function load(url, context, nextLoad) {
    if (!stubbed.test(url)) return nextLoad(url, context);
    const source = readFileSync(fileURLToPath(url), 'utf8');
    const names = new Set();
    for (const match of source.matchAll(/^export\s+(?:const|let|function|class|async function)\s+(\w+)/gm)) names.add(match[1]);
    for (const match of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
        for (const part of match[1].split(',')) {
            const name = part.trim().split(/\s+as\s+/).pop();
            if (name) names.add(name);
        }
    }
    const body = [...names].map(name => `export const ${name} = globalThis.__docStub;`).join('\n');
    return {format: 'module', source: body + '\nexport default globalThis.__docStub;\n', shortCircuit: true};
}
