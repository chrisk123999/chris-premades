import {compilePack, extractPack} from '@foundryvtt/foundryvtt-cli';
let itemPacks = [
    //'cpr-actions',
    //'cpr-class-feature-items',
    //'cpr-class-features',
    //'cpr-feat-features',
    //'cpr-homebrew-feature-items',
    //'cpr-item-features',
    //'cpr-items',
    //'cpr-miscellaneous',
    //'cpr-monster-feature-items',
    //'cpr-monster-features',
    //'cpr-race-feature-items',
    //'cpr-race-features',
    'cpr-spells',
    'cpr-spell-features',
    'cpr-summon-features',
    //'cpr-feats'
];
let actorPacks = [
    'cpr-summons'
];
for (let i of itemPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {'log': true, 'documentType': 'Item'});
}
for (let i of actorPacks) {
    await extractPack('packs/' + i, 'packData/' + i, {'log': true, 'documentType': 'Actor'});
}