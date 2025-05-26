import {combatUtils, constants, dialogUtils, genericUtils, workflowUtils} from '../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || !constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    if (!combatUtils.perTurnCheck(item, 'savageAttacker')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
    await combatUtils.setTurnCheck(item, 'savageAttacker');
    genericUtils.setProperty(workflow, 'chris-premades.savageAttacker', true);
}
async function damage({trigger, workflow}) {
    if (!workflow?.['chris-premades']?.savageAttacker) return;
    let numWeaponDamageRolls = workflow.activity.damage.parts.length;
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
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 200
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 25
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