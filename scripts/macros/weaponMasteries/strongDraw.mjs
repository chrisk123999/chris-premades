import {itemUtils, workflowUtils} from '../../proxy.mjs';
function attack({workflow}) {
    if (workflow.actor.system.abilities.str.value >= 13) return;
    workflow.tracker.disadvantage.add('strongdraw', itemUtils.getMasteryLabel('strongdraw'));
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls?.length) return;
    const ability = workflow.attackRoll?.options?.ability ?? workflow.activity.ability;
    const bonus = ['str', 'dex'].filter(key => key !== ability).reduce((total, key) => total + workflow.actor.system.abilities[key].mod, 0);
    if (bonus) await workflowUtils.bonusDamage(workflow, String(bonus), {ignoreCrit: true});
}
export const strongDrawMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.StrongDraw.Label',
    roll: [
        {pass: 'itemAttackRollConfig', macro: attack, priority: 50},
        {pass: 'itemDamageRoll', macro: damage, priority: 50}
    ]
};
