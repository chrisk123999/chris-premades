import {actorUtils, dialogUtils, documentUtils, queryUtils} from '../../../proxy.mjs';
import {wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
async function siphon({document: item, workflow}) {
    if (!['wall-of-death', 'wall-of-death-ring', 'wall-of-death-damage'].includes(workflow.activity.identifier)) return;
    const caster = workflow.actor;
    const dealt = Math.max(0, ...(workflow.damageList ?? []).map(damage => (damage.hpDamage ?? 0) + (damage.tempDamage ?? 0)));
    if (!dealt || actorUtils.hasUsedReaction(caster)) return;
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.WallOfDeath.Siphon', {amount: dealt}), {userId: queryUtils.firstOwner(caster, true)})) return;
    if (dealt > (caster.system.attributes.hp.temp ?? 0)) await documentUtils.update(caster, {'system.attributes.hp.temp': dealt});
    await actorUtils.setReactionUsed(caster);
}
export const wallOfDeath = wallMacro({
    name: 'Wall of Death',
    roll: [
        {pass: 'itemRollFinished', macro: siphon, priority: 50}
    ]
}, {
    animation: 'wall',
    freeDraw: true,
    shapes: {
        'wall-of-death': {shape: {maxLength: 60}},
        'wall-of-death-ring': {shape: {ring: {maxDiameter: 20, minDiameter: 5, step: 5}}}
    },
    options: () => ({
        thickness: 1,
        height: 20,
        walls: 'opaque',
        color: '#4b2a5c',
        side: {identifier: 'wall-of-death-damage', depth: 10, color: '#6b3f80', name: _loc('CHRISPREMADES.Macros.Generic.Wall.HarmfulSide')},
        draw: {highlightTokens: {path: 0x6b3f80, side: 0x9b59b6}, summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewSaves', 'CHRISPREMADES.Macros.Generic.Wall.PreviewSide')}
    })
});
