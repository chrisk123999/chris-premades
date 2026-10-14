import {actorUtils, dialogUtils, itemUtils, Logging, queryUtils, rollUtils, workflowUtils} from '../../../../proxy.mjs';
async function damaged({document: activity, ditem, targetToken}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    let effect = actorUtils.getEffectByIdentifier(activity.actor, 'rage');
    if (!effect || !effect.active) return;
    const userId = queryUtils.firstOwner(activity.actor, true);
    if (!await dialogUtils.confirmUseItem(activity.item, {userId})) return;
    const save = await workflowUtils.completeActivityUse(activity, [targetToken]);
    if (save.failedSaveUuids?.length || save.failedSaves?.size) return;
    const heal = itemUtils.getActivityByIdentifier(activity.item, 'heal');
    if (!heal) return Logging.addMacroWarning('CPR', 'relentless-rage', 'Heal activity not found!', {notify: 'warn'});
    const hp = (await rollUtils.rollDice(heal.healing.formula, {document: activity})).total;
    const change = ditem.oldHP - hp;
    if (change < 0) await workflowUtils.completeActivityUse(heal, [targetToken]);
    ditem.hpDamage = ditem.oldHP - (change > 0) * hp;
    ditem.totalDamage = ditem.hpDamage + ditem.oldTempHP;
    ditem.newHP = hp;
    ditem.newTempHP = 0;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
}
export const relentlessRage = {
    name: 'Relentless Rage',
    version: '2.0.2',
    rules: 'all',
    notes: 'The formula in the heal activity can be adjusted, but non-deterministic values may not function properly.',
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: damaged,
            priority: 400
        }
    ]
};
