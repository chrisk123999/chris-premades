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
        genericUtils.notify('CHRISPREMADES.movement.unableToBeMoved');
        return;
    }
    while (hitsWall) {
        knockBackFactor = distance / canvas.dimensions.distance;
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: 'move', mode: 'any'});
        if (hitsWall) {
            oldDistance = distance;
            distance += distance > 0 ? -5 : 5;
            if (distance === 0 || (Math.sign(oldDistance) !== Math.sign(distance))) {
                genericUtils.notify('CHRISPREMADES.movement.unableToBeMoved');
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
function findNearby(token, range, disposition, {includeIncapacitated = false, includeToken = false} = {}) {
    let dispositionValue;
    switch (disposition) {
        case 'ally':
            dispositionValue = 1;
            break;
        case 'neutral':
            dispositionValue = 0;
            break;
        case 'enemy':
            dispositionValue = -1;
            break;
        default:
            dispositionValue = null;
    }
    return MidiQOL.findNearby(dispositionValue, token, range, {includeIncapacitated, includeToken}).filter(i => !i.document.hidden);
}
function checkIncapacitated(token, logResult=false) {
    return MidiQOL.checkIncapacitated(token, logResult);
}
function checkForRoom(token, distance) {
    let point = token.getCenterPoint();
    let padding = token.w / 2 - canvas.grid.size / 2;
    let pixelDistance = distance * canvas.grid.size + padding;
    function check(direction) {
        let newPoint = duplicate(point);
        switch (direction) {
            case 'n':
                newPoint.y -= pixelDistance;
                break;
            case 'e':
                newPoint.x += pixelDistance;
                break;
            case 's':
                newPoint.y += pixelDistance;
                break;
            case 'w':
                newPoint.x -= pixelDistance;
                break;
        }
        return token.checkCollision(newPoint, {origin: point, type: 'move', mode: 'any'});
    }
    return {
        n: check('n'),
        e: check('e'),
        s: check('s'),
        w: check('w')
    };
}
function findDirection(room) {
    if (!room.s && !room.e) return 'se';
    if (!room.n && !room.e) return 'ne';
    if (!room.s && !room.w) return 'sw';
    if (!room.n && !room.w) return 'nw';
}
export let tokenUtils = {
    getDistance,
    checkCover,
    checkCollision,
    moveTokenAlongRay,
    pushToken,
    findNearby,
    checkIncapacitated,
    checkForRoom,
    findDirection
};
