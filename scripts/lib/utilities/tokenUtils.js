import {genericUtils} from './genericUtils.js';
function getDistance(sourceToken, targetToken, {wallsBlock} = {}) {
    return MidiQOL.computeDistance(sourceToken, targetToken, wallsBlock);
}
function checkCollision(token, ray) {
    return token.checkCollision(ray.B, {origin: ray.A, type: 'move', mode: 'any'});
}
function checkCover(sourceToken, targetToken, {item, displayName}) {
    let cover = MidiQOL.computeCoverBonus(sourceToken, targetToken, item);
    if (!displayName) return cover;
    switch (cover) {
        case 0:
            return genericUtils.translate('CHRISPREMADES.cover.no');
        case 2:
            return genericUtils.translate('CHRISPREMADES.cover.half');
        case 5:
            return genericUtils.translate('CHRISPREMADES.cover.threeQuarters');
        case 999:
            return genericUtils.translate('CHRISPREMADES.cover.full');
        default:
            return genericUtils.translate('CHRISPREMADES.cover.unknown');
    }
}
export let tokenUtils = {
    getDistance,
    checkCover,
    checkCollision
};
