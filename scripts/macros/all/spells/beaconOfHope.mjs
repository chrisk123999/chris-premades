import {rollUtils, workflowUtils} from '../../../proxy.mjs';
async function maximize({workflow, ditem, actor}) {
    if (!workflow.activity.healing || !actor || ditem.hpDamage >= 0) return;
    const rolls = (workflow.damageRolls ?? []).filter(roll => roll.options.type === 'healing');
    if (!rolls.length) return;
    const healing = rollUtils.getRollsTotal(await Promise.all(rolls.map(rollUtils.maximizeRoll)));
    const hp = actor.system.attributes.hp;
    const missing = Math.max(0, (hp.effectiveMax ?? hp.max) - ditem.oldHP);
    workflowUtils.setDamageItemDamage(ditem, -Math.min(healing, missing));
}
export const beaconOfHope = {
    name: 'Beacon of Hope',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'targetDamageComplete', macro: maximize, priority: 250}
    ]
};
