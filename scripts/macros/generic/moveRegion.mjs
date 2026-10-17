import {automationUtils, documentUtils, itemUtils, Logging, regionUtils} from '../../proxy.mjs';
function getRegionCenter(region) {
    const {x, y} = regionUtils.getArea(region);
    return {x: Math.round(x), y: Math.round(y)};
}
export async function createRegionLight(region, config = {}) {
    const [light] = await documentUtils.createEmbeddedDocuments(region.parent, 'AmbientLight', [{
        ...getRegionCenter(region),
        config: {dim: Math.max(regionUtils.getArea(region).radius, 0) / region.parent.dimensions.distancePixels, ...config}
    }]);
    if (!light) return;
    await documentUtils.makeDependent(region, [light]);
    return light;
}
/**
 * Name a placed region after its spell and show the spell's move activity until the region is gone.
 * @param {object} region Placed region.
 * @param {object} item Spell that placed it.
 * @param {string} moveIdentifier Identifier of the activity that moves the region.
 * @returns {Promise<void>}
 */
export async function prepareMovableRegion(region, item, moveIdentifier) {
    await documentUtils.update(region, {name: item.name});
    const move = itemUtils.getActivityByIdentifier(item, moveIdentifier);
    if (!move) return;
    const unhideEffect = await itemUtils.unhideActivities(item, [move.id], {ids: true, favorite: true});
    if (unhideEffect) await documentUtils.makeDependent(region, [unhideEffect]);
}
export async function syncRegionLights(region) {
    const {x, y} = getRegionCenter(region);
    const updates = region.parent.lights.filter(light => light.flags.dnd5e?.dependentOn === region.uuid && (light.x !== x || light.y !== y)).map(light => ({_id: light.id, x, y}));
    if (updates.length) await documentUtils.updateEmbeddedDocuments(region.parent, 'AmbientLight', updates);
}
function getPlacedRegion(activity, scene) {
    return regionUtils.getPlacedRegions(scene, activity).at(-1);
}
async function use({document, workflow}) {
    const newRegion = workflow.template;
    if (!newRegion) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'moveRegion', configKeys);
    const identifier = documentUtils.getIdentifier(workflow.item);
    const sourceActivity = workflow.item.system.activities.get(config.sourceActivityId);
    if (!sourceActivity) {
        await documentUtils.deleteDocument(newRegion);
        return Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.Generic.MoveRegion.NoSourceActivity', {notify: 'warn'});
    }
    const region = getPlacedRegion(sourceActivity, newRegion.parent);
    if (!region) {
        await documentUtils.deleteDocument(newRegion);
        return Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.Generic.MoveRegion.NoRegion');
    }
    if (config.maxRange) {
        const oldArea = regionUtils.getArea(region);
        const newArea = regionUtils.getArea(newRegion);
        const distance = Math.hypot(newArea.x - oldArea.x, newArea.y - oldArea.y) / region.parent.dimensions.distancePixels;
        if (distance > config.maxRange) {
            await documentUtils.deleteDocument(newRegion);
            return Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.Generic.MoveRegion.TooFar', {notify: true, format: {maxRange: config.maxRange}});
        }
    }
    const {shapes, elevation, levels} = newRegion.toObject();
    await documentUtils.deleteDocument(newRegion);
    await documentUtils.update(region, {shapes, elevation, levels});
    await syncRegionLights(region);
}
/**
 * Moves the region an earlier activity placed to the area this activity places, then deletes the new area.
 * Bound on an activity. Fires on `activityRollFinished`.
 * Lights made dependent on the region follow it to its new centre.
 *
 * Config:
 * - `sourceActivityId`: activity that placed the region being moved.
 * - `maxRange`: furthest the region's centre can move, in scene units. 0 ignores distance.
 */
export const moveRegion = {
    rules: 'all',
    version: '2.0.0',
    category: 'movement',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        sourceActivityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MoveRegion.SourceActivity',
            hint: 'CHRISPREMADES.Macros.Generic.MoveRegion.SourceActivityHint'
        },
        maxRange: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MoveRegion.MaxRange',
            hint: 'CHRISPREMADES.Macros.Generic.MoveRegion.MaxRangeHint'
        }
    }
};
const configKeys = Object.keys(moveRegion.genericConfig);
