import {actorUtils, dialogUtils, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function save({document: item, actor, roll}) {
    if (roll.isSuccess !== false) return;
    const userId = queryUtils.firstOwner(actor, true);
    const selection = await dialogUtils.selectHitDie(actor, item.name, _loc('CHRISPREMADES.Macros.Legacy.BloodPrice.Prompt', {itemName: item.name, rollTotal: roll.total}), {userId});
    if (!selection?.some(entry => entry.amount)) return;
    const spent = await actorUtils.spendHitDice(actor, selection);
    if (!spent.roll) return;
    const newRoll = await rollUtils.addToRoll(roll, spent.roll.total);
    await workflowUtils.completeItemUse(item, [], {consumeUsage: false, consumeResources: false});
    if (!actor.flags['chris-premades']?.bloodPrice?.retaliate) return newRoll;
    const token = actorUtils.getFirstToken(actor);
    const enemies = token ? tokenUtils.findNearby(token, 10, {disposition: 'enemy'}).filter(enemy => enemy.actor?.system.attributes.hp.value > 0 && tokenUtils.canSee(token, enemy)) : [];
    const target = enemies.length ? (await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Legacy.BloodPrice.Retaliate', enemies, {userId}))?.result : undefined;
    if (target) await workflowUtils.applyDamage([target], spent.roll.total, 'none');
    return newRoll;
}
export const bloodPrice = {
    name: 'Blood Price',
    version: '2.1.10',
    rules: '2014',
    notes: 'Actor flag chris-premades.bloodPrice.retaliate (set by Infernal Majesty) also damages an enemy within 10 feet by the Hit Die roll.',
    save: [
        {
            pass: 'actorBonus',
            macro: save,
            priority: 100
        }
    ]
};
