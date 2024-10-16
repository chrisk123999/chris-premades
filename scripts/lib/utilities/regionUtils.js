import {effectUtils} from './effectUtils.js';
import {genericUtils} from './genericUtils.js';
async function createRegions(regionDatas, scene, {parentEntity} = {}) {
    let regions = await genericUtils.createEmbeddedDocuments(scene, 'Region', regionDatas);
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
    region.object.polygons.forEach(shape => {
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
                    if (boolOnly) return true;
                    intersections.push(foundry.utils.lineLineIntersection(A, B, currCoord, nextCoord));
                }
            }
            totalIntersections.push(...intersections);
        }
    });
    if (boolOnly) return totalIntersections.length ? true : false;
    return totalIntersections;
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
    getIntersections
};