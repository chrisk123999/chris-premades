import {readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {cleanEntry} from './cleanEntry.mjs';
const source = './packData';
const [packName, entryName] = process.argv.slice(2);
const packs = (await readdir(source, {withFileTypes: true}))
    .filter(entry => entry.isDirectory() && (!packName || entry.name === packName))
    .map(entry => entry.name);
if (!packs.length) {
    console.error('No pack found matching: ' + packName);
    process.exit(1);
}
let cleaned = 0;
let changed = 0;
for (const pack of packs) {
    const directory = path.join(source, pack);
    const files = (await readdir(directory)).filter(file => path.extname(file) === '.json');
    for (const file of files) {
        const filePath = path.join(directory, file);
        const original = await readFile(filePath, {encoding: 'utf8'});
        const data = JSON.parse(original);
        if (data._key?.startsWith('!folders')) continue;
        if (entryName && data.name?.toLowerCase() !== entryName.toLowerCase()) continue;
        cleaned++;
        cleanEntry(data);
        const updated = JSON.stringify(data, null, 2) + '\n';
        if (updated === original) continue;
        await writeFile(filePath, updated, {encoding: 'utf8'});
        changed++;
        console.log('Cleaned ' + pack + '/' + file);
    }
}
console.log('Checked ' + cleaned + ' documents, rewrote ' + changed + '.');
