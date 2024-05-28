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
                let contains = object.shape.contains(curr.x, curr.y);
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
    let scene = token.document.parent;
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
                let contains = object.shape.contains(curr.x, curr.y);
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
    let a = scene.grid.getCenter(A.x, A.y);
    let b = scene.grid.getCenter(B.x, B.y);
    let ray = new Ray({x: a[0], y: a[1]}, {x: b[0], y: b[1]});
    if (!ray.distance) return locations;
    let gridCenter = scene.grid.size / 2;
    let spacer = scene.grid.type === CONST.GRID_TYPES.SQUARE ? 1.41 : 1;
    let nMax = Math.max(Math.floor(ray.distance / (spacer * Math.min(scene.grid.w, scene.grid.h))), 1);
    let tMax = Array.fromRange(nMax + 1).map(t => t / nMax);
    let prior = null;
    for (let [i, t] of tMax.entries()) {
        let {x, y} = ray.project(t);
        let [r0, c0] = (i === 0) ? [null, null] : prior;
        let [r1, c1] = scene.grid.grid.getGridPositionFromPixels(x, y);
        if (r0 === r1 && c0 === c1) continue;
        let [x1, y1] = scene.grid.grid.getPixelsFromGridPosition(r1, c1);
        let contained = template.object.shape.contains(
            x1 + gridCenter - template.object.center.x,
            y1 + gridCenter - template.object.center.y
        );
        if (contained) locations.add({x: x1, y: y1});
        prior = [r1, c1];
        if (i === 0) continue;
        if (!scene.grid.isNeighbor(r0, c0, r1, c1)) {
            let th = tMax[i - 1] + (0.5 / nMax);
            let {x, y} = ray.project(th);
            let [rh, ch] = scene.grid.grid.getGridPositionFromPixels(x, y);
            let [xh, yh] = scene.grid.grid.getPixelsFromGridPosition(rh, ch);
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
    return getCastData(template)?.castDC;
}
async function setSaveDC(template, dc) {
    let data = getCastData(template) ?? {};
    data.saveDC = dc;
    await setCastData(template, data);
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
    setSaveDC
};