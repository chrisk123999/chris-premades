import {actorUtils, automationUtils, crosshairUtils, documentUtils, genericUtils, workflowUtils} from '../../../proxy.mjs';
const maxCubes = 10;
function isValidCube(cubes, cube) {
    if (!cubes.length) return true;
    let touching = false;
    for (const other of cubes) {
        const dx = Math.abs(cube.x - other.x);
        const dy = Math.abs(cube.y - other.y);
        if (dx < cube.width && dy < cube.width) return false;
        if ((dx === cube.width && dy < cube.width) || (dy === cube.width && dx < cube.width)) touching = true;
    }
    return touching;
}
async function placeCubes(workflow) {
    const token = workflow.token.document;
    const scene = token.parent;
    const size = 10 * scene.dimensions.distancePixels;
    const cells = 10 / scene.grid.distance;
    const toCube = (x, y) => new PIXI.Rectangle(x - size / 2, y - size / 2, size, size);
    const cubes = [];
    genericUtils.notify('CHRISPREMADES.Macros.All.FireStorm.Place');
    for (let i = 0; i < maxCubes; i++) {
        const result = await crosshairUtils.aimCrosshair({
            token,
            maxRange: Number(workflow.item.system.range.value) || 150,
            checkOverlap: false,
            ignoreWalls: true,
            crosshairsConfig: {size: 5, resolution: cells % 2 ? 1 : -1, anchorTopLeft: false, icon: workflow.item.img, label: `${i + 1}/${maxCubes}`},
            validityFunctions: [(_crosshairs, {x, y}) => isValidCube(cubes, toCube(x, y))]
        });
        if (result.cancelled) break;
        cubes.push(toCube(result.x, result.y));
    }
    return cubes;
}
async function early({document: item, workflow}) {
    if (!workflow.token) return;
    const cubes = await placeCubes(workflow);
    if (!cubes.length) {
        workflow.aborted = true;
        return true;
    }
    const scene = workflow.token.document.parent;
    const [region] = await documentUtils.createEmbeddedDocuments(scene, 'Region', [{
        name: item.name,
        color: '#ff6a00',
        shapes: cubes.map(({x, y, width, height}) => ({type: 'rectangle', x, y, width, height})),
        flags: {dnd5e: {item: item.uuid, activity: workflow.activity.uuid, origin: workflow.token.document.uuid, spellLevel: workflowUtils.getCastLevel(workflow)}}
    }]) ?? [];
    const sparePlants = automationUtils.getConfigValue(item, 'sparePlants');
    const targets = canvas.tokens.placeables.filter(token => {
        if (!token.actor || (sparePlants && actorUtils.typeOrRace(token.actor) === 'plant')) return false;
        const bounds = token.bounds.clone().pad(-1);
        return cubes.some(cube => bounds.intersects(cube));
    });
    await workflowUtils.updateTargets(workflow, targets);
    if (!region) return;
    workflowUtils.setWorkflowProperty(workflow, 'fireStormRegion', region.uuid);
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    animation?.macros?.play?.(workflow.token.document, region, options);
}
async function late({workflow}) {
    const uuid = workflowUtils.getWorkflowProperty(workflow, 'fireStormRegion');
    const region = uuid && fromUuidSync(uuid, {strict: false});
    if (region) await documentUtils.deleteDocument(region);
}
export const fireStorm = {
    name: 'Fire Storm',
    version: '2.1.4',
    rules: 'all',
    roll: [
        {pass: 'itemPreambleComplete', macro: early, priority: 50},
        {pass: 'itemRollFinished', macro: late, priority: 50}
    ],
    config: {
        sparePlants: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.FireStorm.SparePlants',
            hint: 'CHRISPREMADES.Macros.All.FireStorm.SparePlantsHint',
            category: 'behavior'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'fireStorm'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
