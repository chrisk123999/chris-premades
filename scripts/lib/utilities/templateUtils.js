import {genericUtils} from './genericUtils.js';
function getTokensInTemplate(template) {
    let tokens = new Set();
    let scene = template.parent;
    if (!scene) return tokens;
    let {size} = scene.grid;
    let {x: tempx, y: tempy, object} = template;
    let sceneTokens = scene.tokens;
    if (!scene) return tokens;
    for (let token of sceneTokens) {
        let {width, height, x: tokx, y: toky} = token;
        let startX = width >= 1 ? 0.5 : width / 2;
        let startY = height >= 1 ? 0.5 : height / 2;
        for (let x = startX; x < width; x++) {
            for (let y = startY; y < width; y++) {
                let curr = {
                    x: tokx + x * size - tempx,
                    y: toky + y * size - tempy
                };
                let contains = object.shape?.contains(curr.x, curr.y);
                if (contains) {
                    tokens.add(token.object);
                    continue;
                }
            }
        }
    }
    return tokens;
}
function getTemplatesInToken(token) {
    let templates = new Set();
    let scene = token.document?.parent;
    if (!scene) return templates;
    let {size} = scene.grid;
    let {width, height, x: tokx, y: toky} = token.document;
    let sceneTemplates = scene.templates;
    for (let template of sceneTemplates) {
        let {x: tempx, y: tempy, object} = template;
        let startX = width >= 1 ? 0.5 : width / 2;
        let startY = height >= 1 ? 0.5 : height / 2;
        for (let x = startX; x < width; x++) {
            for (let y = startY; y < width; y++) {
                let curr = {
                    x: tokx + x * size - tempx,
                    y: toky + y * size - tempy
                };
                let contains = object.shape?.contains(curr.x, curr.y);
                if (contains) {
                    templates.add(template);
                    continue;
                }
            }
        }
    }
    return templates;
}
function findGrids(A, B, template) {
    let locations = new Set();
    let scene = template.parent;
    if (!scene) return locations;
    let ray = new Ray(A, B);
    if (!ray.distance) return locations;
    let gridCenter = scene.grid.size / 2;
    let spacer = scene.grid.type === CONST.GRID_TYPES.SQUARE ? 1.41 : 1;
    let nMax = Math.max(Math.floor(ray.distance / (spacer * Math.min(scene.grid.sizeX, scene.grid.sizeY))), 1);
    let tMax = Array.fromRange(nMax + 1).map(t => t / nMax);
    let prior = null;
    for (let [i, t] of tMax.entries()) {
        let [r0, c0] = (i === 0) ? [null, null] : prior;
        let {i: r1, j: c1} = scene.grid.getOffset(ray.project(t));
        if (r0 === r1 && c0 === c1) continue;
        let {x: x1, y: y1} = scene.grid.getTopLeftPoint({i: r1, j: c1});
        let contained = template.object.shape.contains(
            x1 + gridCenter - template.object.center.x,
            y1 + gridCenter - template.object.center.y
        );
        if (contained) locations.add({x: x1, y: y1});
        prior = [r1, c1];
        if (i === 0) continue;
        if (!scene.grid.testAdjacency({i: r0, j: c0}, {i: r1, j: c1})) {
            let th = tMax[i - 1] + (0.5 / nMax);
            let {x: xh, y: yh} = scene.grid.getTopLeftPoint(ray.project(th));
            let contained = template.object.shape.contains(
                xh + gridCenter - template.object.center.x,
                yh + gridCenter - template.object.center.y
            );
            if (contained) locations.add({x: xh, y: yh});
        }
    }
    return locations;
}
function getCastData(template) {
    return template.flags['chris-premades']?.castData;
}
function getCastLevel(template) {
    return getCastData(template)?.castLevel;
}
function getBaseLevel(template) {
    return getCastData(template)?.baseLevel;
}
async function setCastData(template, data) {
    await template.setFlag('chris-premades', 'castData', data);
}
async function setCastLevel(template, level) {
    let data = getCastData(template) ?? {};
    data.castLevel = level;
    await setCastData(template, data);
}
async function setBaseLevel(template, level) {
    let data = getCastData(template) ?? {};
    data.baseLevel = level;
    await setCastData(template, data);
}
function getSaveDC(template) {
    return getCastData(template)?.saveDC;
}
async function setSaveDC(template, dc) {
    let data = getCastData(template) ?? {};
    data.saveDC = dc;
    await setCastData(template, data);
}
function getName(template) {
    return template.flags['chris-premades']?.template?.name ?? genericUtils.translate('CHRISPREMADES.Template.UnknownTemplate');
}
async function setName(template, name) {
    await template.setFlag('chris-premades', 'template.name', name);
}
async function placeTemplate(templateData, returnTokens=false) {
    let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {parent: canvas.scene});
    let previewTemplate = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
    let template = false;
    try {
        [template] = await previewTemplate.drawPreview();
    } catch (error) {/* Why does this throw an error when a template isn't placed by the user? */}
    if (!returnTokens) return template;
    if (!template) return {template: null, tokens: []};
    await genericUtils.sleep(100);
    let tokens = getTokensInTemplate(template);
    return {template, tokens};
}
function rayIntersectsTemplate(templateDoc, ray) {
    return getIntersections(templateDoc.object, ray.A, ray.B, true);
}
function getIntersections(templateObj, A, B, boolOnly = false) {
    if (templateObj.shape.segmentIntersections) {
        let adjustedA = {
            x: A.x - templateObj.center.x,
            y: A.y - templateObj.center.y
        };
        let adjustedB = {
            x: B.x - templateObj.center.x,
            y: B.y - templateObj.center.y
        };
        let intersections = templateObj.shape.segmentIntersections(adjustedA, adjustedB);
        if (boolOnly) return intersections.length;
        return intersections.map(i => ({x: i.x + templateObj.center.x, y: i.y + templateObj.center.y}));
    }
    let intersections = [];
    let points = templateObj.shape.points;
    for (let i = 0; i < points.length; i += 2) {
        let currCoord = {
            x: points[i] + templateObj.center.x,
            y: points[i + 1] + templateObj.center.y
        };
        let nextCoord = {
            x: points[(i + 2) % points.length] + templateObj.center.x,
            y: points[(i + 3) % points.length] + templateObj.center.y
        };
        if (foundry.utils.lineSegmentIntersects(A, B, currCoord, nextCoord)) {
            if (boolOnly) return true;
            intersections.push(foundry.utils.lineLineIntersection(A, B, currCoord, nextCoord));
        }
    }
    if (boolOnly) return false;
    return intersections;
}
async function getSourceActor(template) {
    return (await fromUuid(template.flags.dnd5e?.origin))?.parent;
}
export let templateUtils = {
    getTokensInTemplate,
    getTemplatesInToken,
    findGrids,
    getCastData,
    getCastLevel,
    getBaseLevel,
    setCastData,
    setCastLevel,
    setBaseLevel,
    getSaveDC,
    setSaveDC,
    getName,
    setName,
    placeTemplate,
    rayIntersectsTemplate,
    getIntersections,
    getSourceActor
};