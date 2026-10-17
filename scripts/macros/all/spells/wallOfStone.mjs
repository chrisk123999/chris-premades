import {actorUtils, dialogUtils, itemUtils, queryUtils, regionUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
import {wallMacro, wallPanel, wallSummary} from '../../generic/wallSpell.mjs';
const panelHP = {'wall-of-stone': 180, 'wall-of-stone-thin': 90};
function isEnclosed(token, bounds) {
    const origin = token.center;
    const reach = Math.hypot(Math.max(Math.abs(bounds.left - origin.x), Math.abs(bounds.right - origin.x)), Math.max(Math.abs(bounds.top - origin.y), Math.abs(bounds.bottom - origin.y))) + token.document.parent.grid.size;
    return Array.fromRange(16).every(index => {
        const angle = index / 16 * Math.PI * 2;
        const destination = {x: origin.x + Math.cos(angle) * reach, y: origin.y + Math.sin(angle) * reach};
        return CONFIG.Canvas.polygonBackends.move.testCollision(origin, destination, {type: 'move', mode: 'any'});
    });
}
async function escape({document: item, workflow}) {
    if (!panelHP[workflow.activity.identifier] || workflow.aborted) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'wall-of-stone-escape');
    const region = regionUtils.getPlacedRegions(workflow.token?.document.parent ?? canvas.scene, item).at(-1);
    if (!activity || !region) return;
    const scene = region.parent;
    const {x, y, width, height} = region.bounds;
    const margin = scene.grid.size * 6;
    const nearby = scene.tokens.filter(token => token.object && token.actor && !token.actor.flags.cat?.wallPanel && token.object.center.x > x - margin && token.object.center.x < x + width + margin && token.object.center.y > y - margin && token.object.center.y < y + height + margin);
    const enclosed = nearby.filter(token => isEnclosed(token.object, region.bounds));
    if (!enclosed.length) return;
    const save = await workflowUtils.syntheticActivityRoll(activity, enclosed, {consumeUsage: false, consumeResources: false, spellSlot: false});
    if (!save) return;
    const failed = new Set(Array.from(save.failedSaves, token => token.document ?? token));
    for (const token of enclosed) {
        if (failed.has(token) || actorUtils.hasUsedReaction(token.actor)) continue;
        const userId = queryUtils.firstOwner(token.actor, true);
        if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.WallOfStone.Escape', {name: token.name}), {userId})) continue;
        await tokenUtils.teleportToken(token, {range: token.actor.system.attributes.movement.walk ?? 30, requireSight: false, ignoreWalls: true, userId});
        await actorUtils.setReactionUsed(token.actor);
    }
}
export const wallOfStone = wallMacro({
    name: 'Wall of Stone',
    roll: [
        {pass: 'itemRollFinished', macro: escape, priority: 50}
    ]
}, {
    animation: 'wall',
    shapes: {
        'wall-of-stone': {shape: {panels: {count: 10, size: 10, flat: true}}},
        'wall-of-stone-thin': {shape: {panels: {count: 10, size: 20, flat: true}}}
    },
    options: (item, identifier) => ({
        thickness: 1,
        walls: 'solid',
        push: true,
        permanent: true,
        color: '#8a8580',
        panels: wallPanel(item.name, {hp: panelHP[identifier], ac: 15, immune: ['poison', 'psychic']}),
        draw: {highlightTokens: {path: 0xb0a090}, summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewPushed')}
    })
});
