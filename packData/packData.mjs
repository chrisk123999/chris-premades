import {compilePack} from '@foundryvtt/foundryvtt-cli';
let packs = [
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
    'cpr-features-all',
    'cpr-embedded-macro-sample-items',
    'cpr-summons-2014',
    'cpr-summons-2024'
];
for (let i of packs) {
    await compilePack('./packData/' + i, './packs/' + i, {log: true});
}