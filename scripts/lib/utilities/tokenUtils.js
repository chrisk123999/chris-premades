import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, sceneUtils, socketUtils, workflowUtils} from '../../utils.js';
function getDistance(sourceToken, targetToken, {wallsBlock, checkCover} = {}) {
    // return MidiQOL.computeDistance(sourceToken, targetToken, wallsBlock, checkCover);
    if (checkCover) {
        return MidiQOL.computeDistance(sourceToken, targetToken, wallsBlock);
    }
    return getDistanceTemp(sourceToken, targetToken, wallsBlock);
}
// Ignore this if you're trying to figure out CPR code. This is temporary until midi receives an update
function getDistanceTemp(t1 /*Token*/, t2 /*Token*/, wallblocking = false) {
    if (!canvas || !canvas.scene)
        return -1;
    if (!canvas.grid || !canvas.dimensions)
        return -1;
    if (!t1 || !t2)
        return -1;
    if (!canvas || !canvas.grid || !canvas.dimensions)
        return -1;
    const actor = t1.actor;
    const ignoreWallsFlag = foundry.utils.getProperty(actor, 'flags.midi-qol.ignoreWalls');
    // get condition data & eval the property
    if (ignoreWallsFlag) {
        wallblocking = false;
    }
    let t1DocWidth = t1.document.width ?? 1;
    if (t1DocWidth > 10)
        t1DocWidth = t1DocWidth / canvas.dimensions.size;
    let t1DocHeight = t1.document.height ?? 1;
    if (t1DocHeight > 10)
        t1DocHeight = t1DocHeight / canvas.dimensions.size;
    let t2DocWidth = t2.document.width ?? 1;
    if (t2DocWidth > 10)
        t2DocWidth = t2DocWidth / canvas.dimensions.size;
    let t2DocHeight = t2.document.height ?? 1;
    if (t2DocHeight > 10)
        t2DocHeight = t2DocHeight / canvas.dimensions.size;
    const t1StartX = t1DocWidth >= 1 ? 0.5 : t1DocWidth / 2;
    const t1StartY = t1DocHeight >= 1 ? 0.5 : t1DocHeight / 2;
    const t2StartX = t2DocWidth >= 1 ? 0.5 : t2DocWidth / 2;
    const t2StartY = t2DocHeight >= 1 ? 0.5 : t2DocHeight / 2;
    const t1Elevation = t1.document.elevation ?? 0;
    const t2Elevation = t2.document.elevation ?? 0;
    const t1TopElevation = t1Elevation + Math.max(t1DocHeight, t1DocWidth) * (canvas?.dimensions?.distance ?? 5);
    const t2TopElevation = t2Elevation + Math.min(t2DocHeight, t2DocWidth) * (canvas?.dimensions?.distance ?? 5); // assume t2 is trying to make itself small
    let coverVisible;
    var x, x1, y, y1, d, r, segments = [], rdistance, distance;
    let heightDifference = 0;
    const configSettings = MidiQOL.configSettings();
    function safeGetGameSetting(moduleName, settingName) {
        if (game.settings.settings.get(`${moduleName}.${settingName}`))
            return game.settings.get(moduleName, settingName);
        else
            return undefined;
    }
    function midiMeasureDistances(segments, options = {}) {
        let isGridless = canvas?.grid?.constructor.name === 'GridlessGrid';
        if (!isGridless || !options.gridSpaces || !configSettings.griddedGridless || !canvas?.grid) {
            //@ts-expect-error
            return segments.map(s => canvas?.grid?.measurePath([s.ray.A, s.ray.B])).map(d => d.distance);
        }
        if (!canvas?.grid)
            return 0;
        const diagonals = safeGetGameSetting('core', 'gridDiagonals');
        const canvasGridProxy = new Proxy(canvas.grid, {
            get: function (target, prop, receiver) {
                //@ts-expect-error
                if (foundry.grid.SquareGrid.prototype[prop] instanceof Function) {
                    //@ts-expect-error
                    return foundry.grid.SquareGrid.prototype[prop].bind(canvasGridProxy);
                }
                else if (prop === 'diagonals') {
                    return diagonals;
                }
                else if (prop === 'isSquare')
                    return true;
                else if (prop === 'isGridless')
                    return false;
                else if (prop === 'isHex')
                    return false;
                return Reflect.get(target, prop);
            }
        });
        //@ts-expect-error
        const GridDiagonals = CONST.GRID_DIAGONALS;
        // First snap the poins to the nearest center point for equidistant/1,2,1/2,1,2
        // I expected this would happen automatically in the proxy call - but didn't and not sure why.
        if ([GridDiagonals.APPROXIMATE, GridDiagonals.EQUIDISTANT, GridDiagonals.ALTERNATING_1, GridDiagonals.ALTERNATING_2].includes(diagonals)) {
            segments = segments.map(s => {
                const gridPosA = canvasGridProxy.getOffset(s.ray.A);
                const aCenter = canvasGridProxy.getCenterPoint(gridPosA);
                const gridPosB = canvasGridProxy.getOffset(s.ray.B);
                const bCenter = canvasGridProxy.getCenterPoint(gridPosB);
                return { ray: new Ray(aCenter, bCenter) };
            });
        }
        //@ ts-expect-error
        let distances = segments.map(s => canvasGridProxy.measurePath([s.ray.A, s.ray.B]));
        return distances = distances.map(d => {
            let distance = d.distance;
            let fudgeFactor = configSettings.gridlessFudge ?? 0;
            switch (diagonals) {
                case GridDiagonals.EQUIDISTANT:
                case GridDiagonals.ALTERNATING_1:
                case GridDiagonals.ALTERNATING_2:
                    // already fudged by snapping so no extra adjustment
                    break;
                case GridDiagonals.EXACT:
                case GridDiagonals.RECTILINEAR:
                    if (d.diagonals > 0)
                        distance = d.distance - (Math.SQRT2 * fudgeFactor);
                    else
                        distance = d.distance - fudgeFactor;
                    break;
                case GridDiagonals.APPROXIMATE:
                    if (d.diagonals > 0)
                        distance = d.distance - fudgeFactor;
                    break;
                case GridDiagonals.ILLEGAL:
                default:
                    distance = d.distance;
            }
            return distance;
        });
    }
    // eslint-disable-next-line no-undef
    if (!(t2.document instanceof WallDocument)) {
        for (x = t1StartX; x < t1DocWidth; x++) {
            for (y = t1StartY; y < t1DocHeight; y++) {
                const point = canvas.grid.getCenterPoint({ x: Math.round(t1.document.x + (canvas.dimensions.size * x)), y: Math.round(t1.document.y + (canvas.dimensions.size * y)) });
                let origin = new PIXI.Point(point.x, point.y);
                for (x1 = t2StartX; x1 < t2DocWidth; x1++) {
                    for (y1 = t2StartY; y1 < t2DocHeight; y1++) {
                        const point = canvas.grid.getCenterPoint({ x: Math.round(t2.document.x + (canvas.dimensions.size * x1)), y: Math.round(t2.document.y + (canvas.dimensions.size * y1)) });
                        let dest = new PIXI.Point(point.x, point.y);
                        const r = new Ray(origin, dest);
                        if (wallblocking) {
                            switch (configSettings.optionalRules.wallsBlockRange) {
                                case 'center':
                                    // eslint-disable-next-line no-case-declarations
                                    let collisionCheck;
                                    //@ts-expect-error polygonBackends
                                    collisionCheck = CONFIG.Canvas.polygonBackends.move.testCollision(origin, dest, { source: t1.document, mode: 'any', type: 'move' });
                                    if (collisionCheck)
                                        continue;
                                    break;
                                case 'levelsautocover':
                                case 'centerLevels':
                                    // //@ts-expect-error
                                    // TODO include auto cover calcs in checking console.error(AutoCover.calculateCover(t1, t2));
                                    if (configSettings.optionalRules.wallsBlockRange === 'centerLevels' && game.modules.get('levels')?.active) {
                                        if (coverVisible === false)
                                            continue;
                                        if (coverVisible === undefined) {
                                            let p1 = {
                                                x: origin.x,
                                                y: origin.y,
                                                z: t1Elevation
                                            };
                                            let p2 = {
                                                x: dest.x,
                                                y: dest.y,
                                                z: t2Elevation
                                            };
                                            //@ts-expect-error
                                            const baseToBase = CONFIG.Levels.API.testCollision(p1, p2, 'collision');
                                            p1.z = t1TopElevation;
                                            p2.z = t2TopElevation;
                                            //@ts-expect-error
                                            const topToBase = CONFIG.Levels.API.testCollision(p1, p2, 'collision');
                                            if (baseToBase && topToBase)
                                                continue;
                                        }
                                    }
                                    else {
                                        let collisionCheck;
                                        //@ts-expect-error polygonBackends
                                        collisionCheck = CONFIG.Canvas.polygonBackends.move.testCollision(origin, dest, { source: t1.document, mode: 'any', type: 'move' });
                                        if (collisionCheck)
                                            continue;
                                    }
                                    break;
                                case 'alternative':
                                case 'simbuls-cover-calculator':
                                    if (coverVisible === undefined) {
                                        let collisionCheck;
                                        //@ts-expect-error polygonBackends
                                        collisionCheck = CONFIG.Canvas.polygonBackends.sight.testCollision(origin, dest, { source: t1.document, mode: 'any', type: 'sight' });
                                        if (collisionCheck)
                                            continue;
                                    }
                                    break;
                                case 'none':
                                default:
                            }
                        }
                        segments.push({ ray: r });
                    }
                }
            }
        }
        if (segments.length === 0) {
            return -1;
        }
        rdistance = segments.map(ray => midiMeasureDistances([ray], { gridSpaces: true }));
        distance = Math.min(...rdistance);
        if (configSettings.optionalRules.distanceIncludesHeight) {
            //let t1ElevationRange = Math.max(t1DocHeight, t1DocWidth) * (canvas?.dimensions?.distance ?? 5);
            if ((t2Elevation > t1Elevation && t2Elevation < t1TopElevation) || (t1Elevation > t2Elevation && t1Elevation < t2TopElevation)) {
                //check if bottom elevation of each token is within the other token's elevation space, if so make the height difference 0
                heightDifference = 0;
            }
            else if (t1Elevation < t2Elevation) { // t2 above t1
                heightDifference = Math.max(0, t2Elevation - t1TopElevation) + (canvas?.dimensions?.distance ?? 5);
            }
            else if (t1Elevation > t2Elevation) { // t1 above t2
                heightDifference = Math.max(0, t1Elevation - t2TopElevation) + (canvas?.dimensions?.distance ?? 5);
            }
        }
    }
    else {
        const w = t2.document;
        let closestPoint  = foundry.utils.closestPointToSegment(t1.center, w.object.edge.a, w.object.edge.b);
        distance = midiMeasureDistances([{ ray: new Ray(t1.center, closestPoint) }], { gridSpaces: true });
        if (configSettings.optionalRules.distanceIncludesHeight) {
            if (!w.flags?.['wall-height'])
                heightDifference = 0;
            else {
                const wh = w.flags?.['wall-height'];
                if (wh.top === null && wh.botton === null)
                    heightDifference = 0;
                else if (wh.top === null)
                    heightDifference = Math.max(0, wh.bottom - t1Elevation);
                else if (wh.bottom === null)
                    heightDifference = Math.max(0, t1Elevation - wh.top);
                else
                    heightDifference = Math.max(0, wh.bottom - t1TopElevation, t1Elevation - wh.top);
            }
        }
    }
    if (configSettings.optionalRules.distanceIncludesHeight) {
        //@ts-expect-error release
        if (game.release.generation < 12) {
            let rule = safeGetGameSetting('dnd5e', 'diagonalMovement') ?? 'EUCL'; // V12
            if (['555', '5105'].includes(rule)) {
                let nd = Math.min(distance, heightDifference);
                let ns = Math.abs(distance - heightDifference);
                distance = nd + ns;
                let dimension = canvas?.dimensions?.distance ?? 5;
                if (rule === '5105')
                    distance = distance + Math.floor(nd / 2 / dimension) * dimension;
            }
            else {
                distance = Math.sqrt(heightDifference * heightDifference + distance * distance);
            }
        }
        else { // TODO experimental
            let nd = Math.min(distance, heightDifference);
            let ns = Math.abs(distance - heightDifference);
            // distance = nd + ns;
            //let dimension = canvas?.dimensions?.distance ?? 5;
            let diagonals = safeGetGameSetting('core', 'gridDiagonals');
            //@ts-expect-error GRID_DIAGONALS
            const GRID_DIAGONALS = CONST.GRID_DIAGONALS;
            // Determine the offset distance of the diagonal moves
            let cd;
            switch (diagonals) {
                case GRID_DIAGONALS.EQUIDISTANT:
                    cd = nd;
                    break;
                case GRID_DIAGONALS.EXACT:
                    cd = Math.SQRT2 * nd;
                    break;
                case GRID_DIAGONALS.APPROXIMATE:
                    cd = 1.5 * nd;
                    break;
                case GRID_DIAGONALS.RECTILINEAR:
                    cd = 2 * nd;
                    break;
                case GRID_DIAGONALS.ALTERNATING_1:
                    // TODO get the diagonals return from MidiMeasureDistances
                    // if ( result.diagonals & 1 ) cd = ((nd + 1) & -2) + (nd >> 1);
                    // else cd = (nd & -2) + ((nd + 1) >> 1);
                    cd = ((nd + 1) & -2) + (nd >> 1);
                    break;
                case GRID_DIAGONALS.ALTERNATING_2:
                    // TODO get the diagonals return from MidiMeasureDistances
                    // if ( result.diagonals & 1 ) cd = (nd & -2) + ((nd + 1) >> 1);
                    //  else cd = ((nd + 1) & -2) + (nd >> 1);
                    cd = ((nd + 1) & -2) + (nd >> 1);
                    break;
                case GRID_DIAGONALS.ILLEGAL:
                    // Don't think I want this to be done
                    cd = 2 * nd;
                    nd = 0;
                    // n = di + dj;
                    ns = distance + heightDifference;
                    break;
            }
            distance = ns + cd;
        }
    }
    return distance;
}
// You can start paying attention again now
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
    return sceneUtil.getLightLevel({x: token.center.x, y: token.center.y, z: token.elevationZ})
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
