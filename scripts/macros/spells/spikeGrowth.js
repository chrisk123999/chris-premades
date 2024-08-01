import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['spikeGrowthSpikes']
                }
            }
        }
    });
}
async function enterOrLeave({trigger: {entity: template, token}, options}) {
    let templateObj = template.object;
    let prevCoords = options?.['chris-premades']?.coords?.previous;
    if (!prevCoords) return;
    let pxToCenter = token.document.width * canvas.grid.size / 2;
    prevCoords.x = prevCoords.x + pxToCenter;
    prevCoords.y = prevCoords.y + pxToCenter;
    if (canvas.scene.grid.units !== 'ft') return;
    if (canvas.scene.grid.type === CONST.GRID_TYPES.GRIDLESS) {
        let startedIn = templateObj.shape.contains(prevCoords.x - templateObj.center.x, prevCoords.y - templateObj.center.y);
        let endedIn = templateObj.shape.contains(token.center.x - templateObj.center.x, token.center.y - templateObj.center.y);
        let pointA, pointB;
        let intersections = templateUtils.getIntersections(templateObj, prevCoords, token.center);
        if (!intersections.length) return;
        if (!startedIn && !endedIn) {
            // pass through - grab intersects and get distance between
            if (intersections.length < 2) return;
            if (intersections.length > 2) {
                let maxDist = 0;
                for (let i = 0; i < intersections.length - 1; i++) {
                    for (let j = i + 1; j < intersections.length; j++) {
                        let currDist = canvas.grid.measurePath([intersections[i], intersections[j]]).distance;
                        if (currDist > maxDist) [pointA, pointB] = [intersections[i], intersections[j]];
                    }
                }
            } else {
                [pointA, pointB] = intersections;
            }
        } else if (startedIn) {
            // left - grab intersect & get distance from prev to intersect
            pointA = prevCoords;
            [pointB] = intersections;
        } else {
            // entered - grab intersect & get distance from intersect to curr
            [pointA] = intersections;
            pointB = token.center;
        }
        await damageHelper(pointA, pointB, template, token, {gridless: true});
    } else {
        await damageHelper(prevCoords, token.center, template, token);
    }
}
async function stay({trigger: {entity: template, token}, options}) {
    let prevCoords = options?.['chris-premades']?.coords?.previous;
    if (!prevCoords) return;
    let pxToCenter = token.document.width * canvas.grid.size / 2;
    prevCoords.x = prevCoords.x + pxToCenter;
    prevCoords.y = prevCoords.y + pxToCenter;
    if (canvas.scene.grid.units !== 'ft') return;
    await damageHelper(prevCoords, token.center, template, token, {stay: true, gridless: canvas.scene.grid.type === CONST.GRID_TYPES.GRIDLESS});
}
async function damageHelper(pointA, pointB, template, token, {stay, gridless} = {stay: false, gridless: false}) {
    let timesToDamage;
    if (gridless) {
        timesToDamage = Math.floor(canvas.grid.measurePath([pointA, pointB]).distance / 5);
    } else {
        let gridsMoved = templateUtils.findGrids(pointA, pointB, template)?.size;
        if (stay) gridsMoved -= 1;
        timesToDamage = Math.floor(gridsMoved * canvas.grid.distance / 5);
    }
    if (timesToDamage <= 0) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Spike Growth: Thorns', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SpikeGrowth.Thorns'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    for (let i = 0; i < timesToDamage; i++) {
        await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
    }
}
export let spikeGrowth = {
    name: 'Spike Growth',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let spikeGrowthSpikes = {
    name: 'Spike Growth: Spikes',
    version: spikeGrowth.version,
    template: [
        {
            pass: 'enter',
            macro: enterOrLeave,
            priority: 50
        },
        {
            pass: 'left',
            macro: enterOrLeave,
            priority: 50
        },
        {
            pass: 'passedThrough',
            macro: enterOrLeave,
            priority: 50
        },
        {
            pass: 'stay',
            macro: stay,
            priority: 50
        }
    ]
};