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
async function moveTokenAlongRay(targetToken, ray, distance) {
    let knockBackFactor;
    let newCenter;
    let hitsWall = true;
    let oldDistance;
    if (ray.distance === 0) {
        ui.notifications.info(genericUtils.translate('CHRISPREMADES.movement.unableToBeMoved'));
        return;
    }
    while (hitsWall) {
        knockBackFactor = distance / canvas.dimensions.distance; // max squares?
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance)); // where would we be?
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: 'move', mode: 'any'});
        if (hitsWall) {
            oldDistance = distance;
            distance += distance > 0 ? -5 : 5;
            if (distance === 0 || (Math.sign(oldDistance) !== Math.sign(distance))) {
                ui.notifications.info(genericUtils.translate('CHRISPREMADES.movement.unableToBeMoved'));
                return;
            }
        }
    }
    newCenter = canvas.grid.getSnappedPoint({x: newCenter.x - targetToken.w / 2, y: newCenter.y - targetToken.h / 2}, {mode: 0xFF0});
    await targetToken.document.update({
        x: newCenter.x,
        y: newCenter.y
    });
}
async function pushToken(sourceToken, targetToken, distance) {
    let ray = new Ray(sourceToken.center, targetToken.center);
    await moveTokenAlongRay(targetToken, ray, distance);
}
export let tokenUtils = {
    getDistance,
    checkCover,
    checkCollision,
    moveTokenAlongRay,
    pushToken
};
