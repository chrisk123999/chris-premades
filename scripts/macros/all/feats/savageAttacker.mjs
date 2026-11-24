import {dialogUtils, documentUtils, itemUtils, Logging, workflowUtils} from '../../../proxy.mjs';
function canUse(item, workflow) {
    if (!item.system.uses.value || !workflow.token || !workflow.hitTargets.count) return false;
    return workflowUtils.isAttackType(workflow, documentUtils.getRules(item) === '2014' ? 'meleeWeaponAttack' : 'weaponAttack');
}
function count({document: item, workflow}) {
    if (!canUse(item, workflow)) return;
    workflowUtils.setWorkflowProperty(workflow, 'savageAttackerRolls', workflow.damageRolls?.length ?? 0);
}
async function damage({document: item, workflow}) {
    const rollCount = workflowUtils.getWorkflowProperty(workflow, 'savageAttackerRolls');
    if (!rollCount || !canUse(item, workflow)) return;
    const rolls = workflow.damageRolls.slice(0, rollCount);
    if (!rolls.some(roll => roll.dice.length)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'savage-attacker');
    if (!activity) return Logging.addMacroWarning('chris-premades', 'savage-attacker', 'Missing the savage-attacker activity.', {notify: 'warn'});
    const legacy = documentUtils.getRules(item) === '2014';
    if (legacy) {
        const total = rolls.reduce((sum, roll) => sum + roll.total, 0);
        const average = Math.ceil(rolls.reduce((sum, roll) => sum + (new Roll(roll.formula, roll.data).evaluateSync({minimize: true}).total + new Roll(roll.formula, roll.data).evaluateSync({maximize: true}).total) / 2, 0));
        if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.SavageAttacker.Use', {name: item.name, total, average}))) return;
    } else if (!await dialogUtils.confirmUseItem(item)) return;
    const inCombat = workflow.token.document.inCombat;
    await workflowUtils.completeActivityUse(activity, [], {consumeResources: inCombat});
    await workflowUtils.rerollKeepDamage(workflow, item, {keep: legacy ? 'higher' : '', count: rollCount});
}
export const savageAttacker = {
    name: 'Savage Attacker',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: count,
            priority: 10
        },
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 300
        }
    ]
};
