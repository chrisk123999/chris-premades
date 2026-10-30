import {combatUtils, crosshairUtils, dialogUtils, documentUtils, itemUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
function inSphere(point, token, radius) {
    const {x, y, width, height} = token.object.bounds;
    const dx = point.x - Math.clamp(point.x, x, x + width);
    const dy = point.y - Math.clamp(point.y, y, y + height);
    return Math.hypot(dx, dy) < radius;
}
async function preItemRoll({document: item, workflow}) {
    const token = workflow.token?.document;
    if (!token || workflow.activity.type !== 'attack') return;
    const combatData = tokenUtils.getCombatData(token);
    const stamps = workflow.actor.flags['chris-premades']?.explode ?? [];
    if (combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
    const label = itemUtils.getMasteryLabel('explode');
    if (!await dialogUtils.confirm(label, _loc('CHRISPREMADES.WeaponMasteries.Explode.Prompt'))) return;
    const point = await crosshairUtils.aimCrosshair({token, maxRange: item.system.range.value, crosshairsConfig: {icon: item.img, size: 2}, checkOverlap: false});
    if (!point || point.cancelled) return true;
    if (combatData.inCombat) await documentUtils.setFlag(workflow.actor, 'chris-premades', 'explode', combatUtils.addTurnStamp(stamps, token.id, combatData));
    const radius = 5 / canvas.grid.distance * canvas.grid.size;
    const targets = token.parent.tokens.filter(target => target.actor && target.object && inSphere(point, target, radius));
    const abilities = workflow.actor.system.abilities;
    const dc = Math.max(abilities.str.dc, abilities.dex.dc);
    const base = item.system.damage.base;
    const modifier = abilities[workflow.activity.ability]?.mod ?? 0;
    const formula = base.formula + (modifier < 0 ? ' - ' + Math.abs(modifier) : '');
    const activityId = foundry.utils.randomID();
    const itemData = {
        name: label,
        type: 'feat',
        img: item.img,
        system: {
            activities: {
                [activityId]: {
                    _id: activityId,
                    type: 'save',
                    activation: {type: 'special'},
                    save: {ability: ['dex'], dc: {calculation: '', formula: String(dc)}},
                    damage: {onSave: 'half', parts: [{custom: {enabled: true, formula}, types: Array.from(base.types)}]}
                }
            }
        }
    };
    if (targets.length) await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, targets);
    return true;
}
export const explodeMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Explode.Label',
    roll: [
        {pass: 'itemPreItemRoll', macro: preItemRoll, priority: 50}
    ]
};
