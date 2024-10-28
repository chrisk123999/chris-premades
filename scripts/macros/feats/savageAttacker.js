import {combatUtils, dialogUtils, genericUtils, workflowUtils} from '../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || workflow.item.system.actionType !== 'mwak') return;
    if (!combatUtils.perTurnCheck(item, 'savageAttacker')) return;
    let numWeaponDamageRolls = workflow.item.system.damage.parts.length;
    let damageTotal = 0;
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        damageTotal += workflow.damageRolls[i].total;
    }
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseWeaponDamageTotal', {itemName: item.name, damageTotal: damageTotal}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
    await combatUtils.setTurnCheck(item, 'savageAttacker');
    let trueOld = [];
    let trueNew = [];
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        let currRoll = workflow.damageRolls[i];
        trueOld.push(currRoll);
        trueNew.push(await new CONFIG.Dice.DamageRoll(currRoll.formula, currRoll.data, currRoll.options).evaluate());
    }
    if (trueOld.reduce((acc, i) => acc + i.total, 0) >= trueNew.reduce((acc, i) => acc + i.total, 0)) return;
    let newDamageRolls = workflow.damageRolls;
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        newDamageRolls[i] = trueNew[i];
    }
    await workflow.setDamageRolls(newDamageRolls);
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'savageAttacker', true);
}
export let savageAttacker = {
    name: 'Savage Attacker',
    version: '0.12.70',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};