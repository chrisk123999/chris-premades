import {effectUtils} from './effectUtils.js';
import {genericUtils, tokenUtils} from '../../utils.js';
async function createRegions(regionDatas, scene, {parentEntity, excludeGPSRegionHandling = true, origin} = {}) {
    if (origin) regionDatas.forEach(regionData => {
        genericUtils.setProperty(regionData, 'flags.chris-premades.region.originUuid', origin.uuid);
    });
    let regions = await genericUtils.createEmbeddedDocuments(scene, 'Region', regionDatas);
    if (excludeGPSRegionHandling) {
        regionDatas.forEach(i => {
            genericUtils.setProperty(i, 'flags.gambits-premades.excludeGRegionHandling', true);
        });
    }
    if (parentEntity) await effectUtils.addDependent(parentEntity, regions);
    return regions;
}
function templateToRegionShape(template, {hole = false} = {}) {
    let origShape = template.object.shape ?? template.object._computeShape();
    let points = origShape.points ?? origShape.toPolygon().points;
    return {
        hole: hole,
        type: 'polygon',
        points: points.map((pt, ind) => ind % 2 ? pt + template.y : pt + template.x)
    };
}
function getCastData(region) {
    return region.flags['chris-premades']?.castData;
}
function getCastLevel(region) {
    return getCastData(region)?.castLevel;
}
function getBaseLevel(region) {
    return getCastData(region)?.baseLevel;
}
async function setCastData(region, data) {
    await region.setFlag('chris-premades', 'castData', data);
}
async function setCastLevel(region, level) {
    let data = getCastData(region) ?? {};
    data.castLevel = level;
    await setCastData(region, data);
}
async function setBaseLevel(region, level) {
    let data = getCastData(region) ?? {};
    data.baseLevel = level;
    await setCastData(region, data);
}
function getSaveDC(region) {
    return getCastData(region)?.saveDC;
}
async function setSaveDC(region, dc) {
    let data = getCastData(region) ?? {};
    data.saveDC = dc;
    await setCastData(region, data);
}
function rayIntersectsRegion(region, ray) {
    return getIntersections(region, ray.A, ray.B, true);
}
function getIntersections(region, A, B, boolOnly = false) {
    let totalIntersections = [];
    region.polygons.forEach(shape => {
        if (boolOnly && totalIntersections.length) return;
        if (shape.segmentIntersections) {
            let intersections = shape.segmentIntersections(A, B);
            totalIntersections.push(... intersections);
        } else {
            let intersections = [];
            let points = shape.points;
            for (let i = 0; i < points.length; i += 2) {
                let currCoord = {
                    x: points[i],
                    y: points[i + 1]
                };
                let nextCoord = {
                    x: points[(i + 2) % points.length],
                    y: points[(i + 3) % points.length]
                };
                if (foundry.utils.lineSegmentIntersects(A, B, currCoord, nextCoord)) {
                    totalIntersections.push(foundry.utils.lineLineIntersection(A, B, currCoord, nextCoord));
                    if (boolOnly) return true;
                }
            }
            totalIntersections.push(...intersections);
        }
    });
    if (boolOnly) return totalIntersections.length ? true : false;
    return totalIntersections;
}
async function getOrigin(region) {
    let originUuid = region.flags['chris-premades']?.region?.origin;
    if (!originUuid) return;
    return await fromUuid(originUuid);
}
function tokenInRegion(region, tokenDocument) {
    if (!tokenDocument.object.bounds.overlaps(region.bounds)) return false;
    if (region.elevation.bottom > tokenDocument.elevation || tokenDocument.elevation > region.elevation.top) return false;
    let regionShape = region.polygonTree;
    tokenUtils.getTokenCenterPoints(tokenDocument).forEach(p => {
        if (regionShape.testPoint(p)) return true;
    });
    let dx = tokenDocument.object.position.x;
    let dy = tokenDocument.object.position.y;
    let shape = tokenDocument.object.shape.clone();
    let tokenShape = shape instanceof PIXI.Polygon ? shape : shape.toPolygon();
    let tokenPoints = tokenShape.points;
    for (let i = 0; i < tokenPoints.length; i += 2) {
        tokenPoints[i] += dx;
        tokenPoints[i + 1] += dy;
        if (regionShape.testPoint({x: tokenPoints[i], y: tokenPoints[i + 1]})) return true;
    }
    for (let p of region.polygons) {
        let regionPoints = p.points;
        for (let j = 0; j < regionPoints.length; j += 2) {
            let r1 = {
                x: regionPoints[j], 
                y: regionPoints[j + 1]
            };
            if (tokenShape.contains(r1.x, r1.y)) return true;
            let r2 = {
                x: regionPoints[(j + 2) % regionPoints.length],
                y: regionPoints[(j + 3) % regionPoints.length]
            };
            for (let k = 0; k < tokenPoints.length; k += 2) {
                let t1 = {
                    x: tokenPoints[k], 
                    y: tokenPoints[k + 1]
                };
                let t2 = { 
                    x: tokenPoints[(k + 2) % tokenPoints.length], 
                    y: tokenPoints[(k + 3) % tokenPoints.length] 
                };
                if (foundry.utils.lineSegmentIntersects(r1, r2, t1, t2)) return true;
            }
        }
    }
    return false;
}
function tokensInRegion(region) {
    let tokens = new Set();
    let nearTokens = region.parent.tokens.filter(t => t.object.bounds.overlaps(region.bounds));
    if (!nearTokens.length) return [];
    for (let token of nearTokens) {
        if (tokens.has(token)) continue;
        if (!tokenInRegion(region, token)) continue;
        tokens.add(token);
    }
    return Array.from(tokens);
}
export let regionUtils = {
    createRegions,
    templateToRegionShape,
    getCastData,
    getCastLevel,
    getBaseLevel,
    setCastData,
    setCastLevel,
    setBaseLevel,
    getSaveDC,
    setSaveDC,
    rayIntersectsRegion,
    getIntersections,
    getOrigin,
    tokenInRegion,
    tokensInRegion
};