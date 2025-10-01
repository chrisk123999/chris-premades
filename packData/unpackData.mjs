import {compilePack, extractPack} from '@foundryvtt/foundryvtt-cli';
let itemPacks = [
    'cpr-3rd-party-class-features',
    'cpr-3rd-party-items',
    'cpr-3rd-party-feats',
    'cpr-actions',
    'cpr-class-feature-items',
    'cpr-class-features',
    'cpr-feats',
    'cpr-feat-features',
    'cpr-item-features',
    'cpr-items',
    'cpr-miscellaneous',
    'cpr-miscellaneous-items',
    'cpr-monster-features',
    'cpr-race-features',
    'cpr-spell-features',
    'cpr-spells',
    'cpr-summon-features',
    'cpr-spells-2024',
    'cpr-class-features-2024',
    'cpr-items-2024',
    'cpr-summon-features-2024',
    'cpr-feats-2024',
    'cpr-feat-features-2024',
    'cpr-embedded-macro-sample-items',
    'cpr-actions-2024',
    'cpr-feature-items-2024'
];
let actorPacks = [
    'cpr-summons',
    'cpr-summons-2024'
];
for (let i of itemPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {'log': true, 'documentType': 'Item', transformEntry: (entry) => {
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
    await extractPack('packs/' + i, 'packData/' + i, {'log': true, 'documentType': 'Actor', transformEntry: (entry) => {delete entry._stats; delete entry.sort; delete entry.ownership;}});
}