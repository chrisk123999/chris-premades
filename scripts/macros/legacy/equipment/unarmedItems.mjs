import {actorUtils, dialogUtils, documentUtils, itemUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
export function isUnarmed(workflow, {natural = false} = {}) {
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return false;
    if (workflow.activity.attack?.type?.classification === 'unarmed') return true;
    return natural && workflow.item.system.type?.value === 'natural';
}
function wrapsBonus(item) {
    return {'wraps-of-dyamak-dormant': 1, 'wraps-of-dyamak-awakened': 2, 'wraps-of-dyamak-exalted': 3}[documentUtils.getIdentifier(item)] ?? 0;
}
export async function attackBonus(workflow, bonus) {
    await workflowUtils.bonusAttack(workflow, String(bonus));
}
export async function damageBonus(workflow, bonus) {
    await workflowUtils.bonusDamage(workflow, String(bonus), {damageType: workflow.defaultDamageType});
    for (const roll of workflow.damageRolls) roll.options.properties = Array.from(new Set([...(roll.options.properties ?? []), 'mgc']));
}
async function insigniaAttack({document: item, workflow}) {
    if (itemUtils.getEquipmentState(item) && isUnarmed(workflow, {natural: true})) await attackBonus(workflow, 1);
}
async function insigniaDamage({document: item, workflow}) {
    if (itemUtils.getEquipmentState(item) && isUnarmed(workflow, {natural: true})) await damageBonus(workflow, 1);
}
async function clawAttack({document: item, workflow}) {
    if (itemUtils.getEquipmentState(item) && isUnarmed(workflow)) await attackBonus(workflow, 1);
}
async function clawDamage({document: item, workflow}) {
    if (itemUtils.getEquipmentState(item) && isUnarmed(workflow)) await damageBonus(workflow, 1);
}
async function wrapsAttack({document: item, workflow}) {
    if (!itemUtils.getEquipmentState(item) || !isUnarmed(workflow)) return;
    await attackBonus(workflow, wrapsBonus(item));
}
async function wrapsCritical({document: item, workflow}) {
    if (!itemUtils.getEquipmentState(item) || !isUnarmed(workflow) || !workflow.isCritical) return;
    const target = workflow.targets.documents[0];
    if (!target || !tokenUtils.isEnemy(workflow.token.document, target)) return;
    const spent = ['crimson-mist', 'ravenous-strike'].map(identifier => itemUtils.getActivityByIdentifier(item, identifier)).filter(activity => activity?.uses.spent);
    for (const activity of spent) await documentUtils.update(activity, {'uses.spent': 0});
}
async function wrapsDamage({document: item, workflow}) {
    if (!itemUtils.getEquipmentState(item) || !isUnarmed(workflow) || !workflow.hitTargets.count) return;
    const ravenous = itemUtils.getActivityByIdentifier(item, 'ravenous-strike');
    if (ravenous?.uses.value && await dialogUtils.confirmUseItem(ravenous)) {
        await workflowUtils.bonusDamage(workflow, '6d6', {damageType: 'necrotic'});
        workflowUtils.setWorkflowProperty(workflow, 'ravenousStrike', true);
        await workflowUtils.syntheticActivityRoll(ravenous, [workflow.token.document], {consumeUsage: true, consumeResources: true});
    }
    await damageBonus(workflow, wrapsBonus(item));
}
async function wrapsHeal({workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'ravenousStrike')) return;
    const necrotic = (workflow.damageList ?? []).flatMap(entry => entry.damageDetail ?? []).filter(detail => detail.type === 'necrotic').reduce((total, detail) => total + detail.value, 0);
    if (necrotic) await workflowUtils.applyDamage([workflow.token.document], necrotic, 'healing');
}
async function wrapsRest({document: item}) {
    if (!itemUtils.getEquipmentState(item)) return;
    const ki = actorUtils.getItemByIdentifier(item.actor, 'ki');
    const temp = Number(ki?.system.uses.max) || 0;
    if (temp > (item.actor.system.attributes.hp.temp ?? 0)) await documentUtils.update(item.actor, {'system.attributes.hp.temp': temp});
}
export const insigniaOfClaws = {
    name: 'Insignia of Claws',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {pass: 'actorAttackRollBonuses', macro: insigniaAttack, priority: 50},
        {pass: 'actorDamageRollComplete', macro: insigniaDamage, priority: 50}
    ]
};
export const eldritchClawTattoo = {
    name: 'Eldritch Claw Tattoo',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {pass: 'actorAttackRollBonuses', macro: clawAttack, priority: 50},
        {pass: 'actorDamageRollComplete', macro: clawDamage, priority: 50}
    ]
};
export const wrapsOfDyamak = {
    name: 'Wraps of Dyamak',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {pass: 'actorAttackRollBonuses', macro: wrapsAttack, priority: 50},
        {pass: 'actorAttackRollComplete', macro: wrapsCritical, priority: 50},
        {pass: 'actorDamageRollComplete', macro: wrapsDamage, priority: 50},
        {pass: 'actorRollFinished', macro: wrapsHeal, priority: 50}
    ],
    rest: [
        {pass: 'actorShort', macro: wrapsRest, priority: 50}
    ]
};
