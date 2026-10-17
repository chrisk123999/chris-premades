import {automationUtils, documentUtils, effectUtils, genericUtils, itemUtils, regionUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
import {spareDesignated, wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
export const prismaticLayers = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
function getWall(item, scene) {
    return regionUtils.getPlacedRegions(scene, item).find(region => region.flags['chris-premades']?.prismaticLayers);
}
async function spare({document: item, workflow}) {
    if (!['prismatic-wall-pass', 'prismatic-wall-glare'].includes(workflow.activity.identifier)) return;
    if (workflow.activity.identifier === 'prismatic-wall-glare') {
        const blinded = Array.from(workflow.targets).filter(token => documentUtils.getEffectByIdentifier(token.actor, 'prismaticGlare'));
        if (blinded.length === workflow.targets.size) {
            workflow.aborted = true;
            return true;
        }
        if (blinded.length) await workflowUtils.removeTargets(workflow, blinded);
    }
    return spareDesignated(item, workflow);
}
function getSaveDC(effect) {
    return documentUtils.getSavedCastData(effect)?.saveDC ?? effectUtils.getOriginActivitySync(effect)?.save?.dc?.value;
}
async function indigo({document: effect, token}) {
    if (documentUtils.getIdentifier(effect) !== 'prismaticIndigo' || !token?.actor) return;
    const saveDC = getSaveDC(effect);
    const roll = await rollUtils.requestRoll(token.actor, 'save', 'con', {rollDC: saveDC});
    if (!roll) return;
    const counts = {...{success: 0, failure: 0}, ...effect.flags['chris-premades']?.indigo};
    counts[roll.total >= saveDC ? 'success' : 'failure']++;
    if (counts.success >= 3) {
        await documentUtils.deleteDocument(effect);
        return;
    }
    if (counts.failure < 3) {
        await documentUtils.setFlag(effect, 'chris-premades', 'indigo', counts);
        return;
    }
    const petrified = {name: _loc('CHRISPREMADES.Macros.All.PrismaticWall.Petrified'), img: effect.img, statuses: ['petrified'], origin: effect.origin};
    await effectUtils.createEffects(token.actor, [petrified]);
    await documentUtils.deleteDocument(effect);
}
async function violet({document: effect, token, combatant}) {
    if (documentUtils.getIdentifier(effect) !== 'prismaticViolet' || !token?.actor) return;
    const caster = effectUtils.getOriginActivitySync(effect)?.actor;
    if (!caster || combatant?.actor !== caster) return;
    const saveDC = getSaveDC(effect);
    const roll = await rollUtils.requestRoll(token.actor, 'save', 'wis', {rollDC: saveDC});
    await documentUtils.deleteDocument(effect);
    if (!roll || roll.total >= saveDC) return;
    const shifted = {name: _loc('CHRISPREMADES.Macros.All.PrismaticWall.OtherPlane'), img: effect.img, origin: effect.origin, flags: {cat: {banish: {permanent: true}, macros: {effect: [{source: 'chris-premades', rules: 'all', identifier: 'banish'}]}}}};
    await effectUtils.createEffects(token.actor, [shifted]);
}
async function passThrough({document: item, workflow}) {
    if (workflow.activity.identifier !== 'prismatic-wall-pass') return;
    const target = workflow.targets.first();
    const wall = getWall(item, target?.document.parent);
    if (!target || !wall) return;
    for (const layer of wall.flags['chris-premades'].prismaticLayers) {
        const activity = itemUtils.getActivityByIdentifier(item, `prismatic-wall-${layer}`);
        if (activity) await workflowUtils.syntheticActivityRoll(activity, [target.document], {atLevel: wall.flags.dnd5e?.spellLevel, consumeUsage: false, consumeResources: false, spellSlot: false});
    }
}
async function destroyLayer({document: item, workflow}) {
    if (workflow.activity.identifier !== 'prismatic-wall-destroy') return;
    const wall = getWall(item, workflow.token?.document.parent ?? canvas.scene);
    if (!wall) return;
    const [layer, ...remaining] = wall.flags['chris-premades'].prismaticLayers;
    if (!layer) return;
    if (!remaining.length) {
        await documentUtils.deleteDocument(wall);
        return;
    }
    await documentUtils.update(wall, {'flags.chris-premades.prismaticLayers': remaining});
    genericUtils.notify('CHRISPREMADES.Macros.All.PrismaticWall.LayerDestroyed', {format: {layer: _loc(`CHRISPREMADES.Macros.All.PrismaticWall.Layers.${layer}`)}});
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    await animation?.macros?.destroyLayer?.(wall, layer, options);
}
export const prismaticWall = wallMacro({
    name: 'Prismatic Wall',
    roll: [
        {pass: 'itemPreambleComplete', macro: spare, priority: 40},
        {pass: 'itemRollFinished', macro: passThrough, priority: 50},
        {pass: 'itemRollFinished', macro: destroyLayer, priority: 55}
    ],
    combat: [
        {pass: 'actorTurnEnd', macro: indigo, priority: 50},
        {pass: 'actorEveryTurn', macro: violet, priority: 50}
    ]
}, {
    animation: 'prismaticWall',
    freeDraw: true,
    shapes: {
        'prismatic-wall': {shape: {maxLength: 90}},
        'prismatic-wall-globe': {shape: {ring: {maxDiameter: 30, minDiameter: 5, step: 5}}}
    },
    options: () => ({
        thickness: 1,
        height: 30,
        walls: 'opaque',
        color: '#c77dff',
        timer: 100,
        designate: true,
        light: {bright: 100, dim: 200},
        aura: {identifier: 'prismatic-wall-glare', distance: 20, color: '#e0c3ff', name: _loc('CHRISPREMADES.Macros.Generic.Wall.Zone')},
        flags: {'chris-premades': {prismaticLayers}},
        draw: {summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewInside')}
    })
});
