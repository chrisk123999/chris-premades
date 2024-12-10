import {compilePack, extractPack} from '@foundryvtt/foundryvtt-cli';
let packs = [
    // 'cpr-actions',
    // 'cpr-class-feature-items',
    // 'cpr-class-features',
    // 'cpr-feat-features',
    // 'cpr-feats',
    //'cpr-homebrew-feature-items',
    'cpr-item-features',
    // 'cpr-items',
    //'cpr-monster-feature-items',
    // 'cpr-monster-features',
    // 'cpr-race-feature-items',
    // 'cpr-race-features',
    // 'cpr-spells',
    // 'cpr-spell-features',
    // 'cpr-summon-features',
    // 'cpr-summons',
    // 'cpr-miscellaneous-items',
    // 'cpr-3rd-party-class-features',
    // 'cpr-3rd-party-items',
    // 'cpr-3rd-party-feats',
    // 'cpr-miscellaneous'
];
for (let i of packs) {
    await compilePack('./packData/' + i, './packs/' + i, {'log': true});
}