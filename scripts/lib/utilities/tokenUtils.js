import {epicRolls} from '../../integrations/epicRolls.js';
import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../utils.js';

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
            return genericUtils.translate('CHRISPREMADES.Cover.No');
        case 2:
            return genericUtils.translate('CHRISPREMADES.Cover.Half');
        case 5:
            return genericUtils.translate('CHRISPREMADES.Cover.ThreeQuarters');
        case 999:
            return genericUtils.translate('CHRISPREMADES.Cover.Full');
        default:
            return genericUtils.translate('CHRISPREMADES.Cover.Unknown');
    }
}
async function moveTokenAlongRay(targetToken, origRay, distance) {
    let bulwark = itemUtils.getItemByIdentifier(targetToken.actor, 'bulwark');
    if (bulwark && !actorUtils.hasUsedReaction(targetToken.actor)) {
        let useBulwark = await dialogUtils.confirm(bulwark.name, 'CHRISPREMADES.Macros.Bulwark.Use', {userId: socketUtils.firstOwner(targetToken.actor, true)});
        if (useBulwark) {
            await workflowUtils.completeItemUse(bulwark);
            return;
        }
    }
    let knockBackFactor;
    let newCenter;
    let hitsWall = true;
    let oldDistance;
    let ray = Ray.fromAngle(targetToken.center.x, targetToken.center.y, origRay.angle, origRay.distance);
    if (ray.distance === 0) {
        genericUtils.notify('CHRISPREMADES.Movement.UnableToBeMoved', 'info');
        return;
    }
    while (hitsWall) {
        knockBackFactor = distance / canvas.dimensions.distance;
        newCenter = ray.project((canvas.dimensions.size * knockBackFactor) / ray.distance);
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: 'move', mode: 'any'});
        if (hitsWall) {
            oldDistance = distance;
            distance += distance > 0 ? -5 : 5;
            if (distance === 0 || (Math.sign(oldDistance) !== Math.sign(distance))) {
                genericUtils.notify('CHRISPREMADES.Movement.UnableToBeMoved', 'info');
                return;
            }
        }
    }
    newCenter = canvas.grid.getSnappedPoint({x: newCenter.x - targetToken.w / 2, y: newCenter.y - targetToken.h / 2}, {mode: 0xFF0});
    await genericUtils.update(targetToken.document, {
        x: newCenter.x,
        y: newCenter.y
    });
}
async function pushToken(sourceToken, targetToken, distance) {
    if (targetToken.actor) {
        let grappledEffects = effectUtils.getAllEffectsByIdentifier(targetToken.actor, 'grappled');
        let grapplingEffects = effectUtils.getAllEffectsByIdentifier(targetToken.actor, 'grappling');
        for (let effect of grappledEffects.concat(grapplingEffects)) {
            if (effect) await genericUtils.remove(effect);
        }
        // Wait for dependent grapples to be destroyed, in case Rideable is mounting tokens still
        await genericUtils.sleep(250);
    }
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
function checkIncapacitated(token, logResult = false) {
    return MidiQOL.checkIncapacitated(token, logResult);
}
function checkForRoom(token, gridSquares) {
    let point = token.getCenterPoint();
    let gridSize = token.document.parent.grid.size;
    let pixelDistance = gridSquares * gridSize;
    function check(direction) {
        let newPoint = genericUtils.duplicate(point);
        switch (direction) {
            case 'n': newPoint.y -= pixelDistance; break;
            case 'e': newPoint.x += pixelDistance; break;
            case 's': newPoint.y += pixelDistance; break;
            case 'w': newPoint.x -= pixelDistance; break;
        }
        return !token.checkCollision(newPoint, {origin: point, type: 'move', mode: 'any'});
    }
    return {
        n: check('n'),
        e: check('e'),
        s: check('s'),
        w: check('w')
    };
}
function findDirection(room) {
    if (room.s && room.e) return 'se';
    if (room.n && room.e) return 'ne';
    if (room.s && room.w) return 'sw';
    if (room.n && room.w) return 'nw';
}
function canSee(sourceToken, targetToken) {
    return MidiQOL.canSee(sourceToken, targetToken);
}
function canSense(sourceToken, targetToken, senseModes = ['all']) {
    return MidiQOL.canSense(sourceToken, targetToken, senseModes);
}
async function attachToToken(token, uuidsToAttach) {
    let currAttached = token.document.flags?.['chris-premades']?.attached?.attachedEntityUuids ?? [];
    await genericUtils.update(token.document, {
        flags: {
            'chris-premades': {
                attached: {
                    attachedEntityUuids: currAttached.concat(...uuidsToAttach)
                }
            }
        }
    });
}
function getLightLevel(token) {
    if (token.document.parent.environment.globalLight.enabled) return 'bright';
    let c = Object.values(token.center);
    let lights = canvas.effects.lightSources.filter(src => !(src instanceof foundry.canvas.sources.GlobalLightSource) && src.shape.contains(...c));
    if (!lights.length) return 'dark';
    let inBright = lights.some(light => {
        let {data: {x, y}, ratio} = light;
        let bright = ClockwiseSweepPolygon.create({'x': x, 'y': y}, {
            type: 'light',
            boundaryShapes: [new PIXI.Circle(x, y, ratio * light.shape.config.radius)]
        });
        return bright.contains(...c);
    });
    if (inBright) return 'bright';
    return 'dim';
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
    findDirection,
    canSee,
    canSense,
    attachToToken,
    getLightLevel
};
