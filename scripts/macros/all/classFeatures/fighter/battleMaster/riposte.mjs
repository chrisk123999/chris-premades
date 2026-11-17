import {activityUtils, actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function strike({workflow}) {
    const activity = workflow.activity;
    const target = workflow.targets.documents[0];
    const actor = activity.actor;
    if (!target?.actor || !actor) return;
    const weapons = actor.items.filter(item => item.type === 'weapon' && itemUtils.getEquipmentState(item) && item.system.activities.getByType('attack').some(attack => attack.actionType === 'mwak'));
    if (!weapons.length) return;
    const userId = queryUtils.firstOwner(actor, true);
    const weapon = weapons.length > 1 ? await dialogUtils.selectDocumentDialog(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.Weapon', weapons, {userId}) : weapons[0];
    if (!weapon) return;
    const amount = String(rollUtils.getRollsTotal(workflow.utilityRolls ?? []));
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.uuid,
        duration: {value: 1, units: 'turns'},
        specialDuration: ['1Attack'],
        changes: [{key: 'system.bonuses.mwak.damage', type: 'add', value: amount, phase: 'initial', priority: 20}]
    });
    const [effect] = await effectUtils.createEffects(actor, [effectData]) ?? [];
    await workflowUtils.completeActivityUse(weapon.system.activities.getByType('attack').find(attack => attack.actionType === 'mwak'), [target], {userId});
    if (effect) await documentUtils.deleteDocument(effect);
}
async function missed({document: item, workflow}) {
    const token = actorUtils.getFirstToken(item.actor);
    if (!token || !workflow.token || !workflow.targets.has(token) || workflow.hitTargets.has(token) || !workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    if (actorUtils.hasUsedReaction(item.actor) || item.actor.statuses.has('incapacitated')) return;
    const activity = item.system.activities.getByType('utility').find(candidate => activityUtils.checkCosts(candidate));
    if (!activity) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await workflowUtils.completeActivityUse(activity, [workflow.token.document]);
}
export const riposte = {
    name: 'Maneuvers: Riposte',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: strike,
            priority: 50
        },
        {
            pass: 'targetAttackRollComplete',
            macro: missed,
            priority: 50
        }
    ]
};
export const brace = {
    name: 'Maneuvers: Brace',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: strike,
            priority: 50
        }
    ]
};
