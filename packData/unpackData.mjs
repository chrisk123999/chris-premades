import {extractPack} from '@foundryvtt/foundryvtt-cli';
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
    'cpr-embedded-macro-sample-items'
];
let actorPacks = [
    'cpr-summons-2014',
    'cpr-summons-2024'
];
for (let i of itemPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {log: true, documentType: 'Item', transformEntry: (entry) => {
        delete entry._stats;
        delete entry.sort;
        delete entry.ownership;
        for (const i in entry.effects)
        {
            if (entry.effects[i]._stats) delete entry.effects[i]._stats;
        }
        if (entry.system?.source?.sourceClass) delete entry.system.source.sourceClass;
        if (entry.flags.core?.sourceId) delete entry.flags.core.sourceId;
        if (entry.system?.materials?.value) entry.system.materials.value = '';
    }});
}
for (let i of actorPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {log: true, documentType: 'Actor', transformEntry: (entry) => {delete entry._stats; delete entry.sort; delete entry.ownership;}});
}