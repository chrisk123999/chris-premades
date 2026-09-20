import {extractPack} from '@foundryvtt/foundryvtt-cli';
import {cleanEntry} from './cleanEntry.mjs';
let itemPacks = [
    'cpr-features-2014',
    'cpr-monster-features-2014',
    'cpr-spells-2014',
    'cpr-equipment-2014',
    'cpr-misc-2014',
    'cpr-features-2024',
    'cpr-monster-features-2024',
    'cpr-spells-2024',
    'cpr-equipment-2024',
    'cpr-misc-2024',
    'cpr-embedded-macro-sample-items',
    'cpr-automation-items'
];
let actorPacks = [
    'cpr-summons-2014',
    'cpr-summons-2024'
];
for (let i of itemPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {log: true, documentType: 'Item', transformEntry: cleanEntry});
}
for (let i of actorPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {log: true, documentType: 'Actor', transformEntry: cleanEntry});
}