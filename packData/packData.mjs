import {compilePack, extractPack} from '@foundryvtt/foundryvtt-cli';
let packs = [
    'cpr-3rd-party-class-features',
    'cpr-3rd-party-items',
    'cpr-3rd-party-feats',
    'cpr-actions',
    'cpr-class-feature-items',
    'cpr-class-features',
    'cpr-feats',
    'cpr-item-features',
    'cpr-items',
    'cpr-miscellaneous',
    'cpr-miscellaneous-items',
    'cpr-monster-features',
    'cpr-race-features',
    'cpr-spell-features',
    'cpr-spells',
    'cpr-summon-features',
    'cpr-summons',
    'cpr-spells-2024',
    'cpr-class-features-2024',
    'cpr-items-2024'
];
for (let i of packs) {
    await compilePack('./packData/' + i, './packs/' + i, {'log': true});
}