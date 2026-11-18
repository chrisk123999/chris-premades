import {activityUtils, actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function isWarding(item) {
    if (!itemUtils.getEquipmentState(item)) return false;
    if (item.type === 'weapon') return CONFIG.DND5E.weaponTypeMap[item.system.type.value] === 'melee';
    return item.type === 'equipment' && item.system.type.value === 'shield';
}
async function ward({document: item, workflow}) {
    if (!workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const actor = item.actor;
    const token = actorUtils.getFirstToken(actor);
    if (!token || actorUtils.hasUsedReaction(actor) || actor.statuses.has('incapacitated')) return;
    const activity = item.system.activities.contents[0];
    if (!activity || !activityUtils.checkCosts(activity) || !actor.items.some(isWarding)) return;
    const target = workflow.hitTargets.documents.find(other => other === token || (other.actor && !tokenUtils.isEnemy(token, other) && tokenUtils.isWithinDistance(token, other, 5) && tokenUtils.canSee(token, other)));
    if (!target) return;
    const userId = queryUtils.firstOwner(actor, true);
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.WardingManeuver.Use', {name: target.name}), {userId})) return;
    const wardWorkflow = await workflowUtils.completeActivityUse(activity, [target], {userId});
    const bonus = rollUtils.getRollsTotal(wardWorkflow?.utilityRolls ?? []);
    if (workflow.attackTotal < target.actor.system.attributes.ac.value + bonus) {
        workflow.hitTargets.delete(target);
        const data = workflow.hitDisplayData[target.uuid];
        if (data) {
            data.isHit = false;
            data.hitClass = 'failure';
            data.hitSymbol = 'fa-xmark';
            data.acIcons.push({icon: 'fas fa-shield', tooltip: item.name, cssClass: 'midi-qol-ac-icon-fa'});
        }
        await workflow.displayHits(workflow.whisperAttackCard);
        return;
    }
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: item.name,
        img: item.img,
        origin: activity.uuid,
        specialDuration: ['damaged'],
        changes: [{key: 'system.traits.dr.value', type: 'add', value: 'ALL', phase: 'initial', priority: 20}]
    });
    await effectUtils.createEffects(target.actor, [effectData]);
}
export const wardingManeuver = {
    name: 'Maneuvers: Warding Maneuver',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'sceneAttackRollComplete',
            macro: ward,
            priority: 100
        }
    ]
};
