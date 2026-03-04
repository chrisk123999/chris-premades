import {dialogUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || item.system.uses.value == 0 || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item, {}, {configureDialog: false});
    genericUtils.setProperty(workflow, 'chris-premades.savageAttacker', true);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow?.['chris-premades']?.savageAttacker) return;
    let numWeaponDamageRolls = workflow.activity.damage.parts.length;
    let trueOld = [];
    let trueNew = [];
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        let currRoll = workflow.damageRolls[i];
        trueOld.push(currRoll);
        trueNew.push(await new CONFIG.Dice.DamageRoll(currRoll.formula, currRoll.data, currRoll.options).evaluate());
    }    
    let oldTotal = trueOld.reduce((acc, i) => acc + i.total, 0);
    let newTotal = trueNew.reduce((acc, i) => acc + i.total, 0);
    let highRolls = oldTotal < newTotal ? trueNew : trueOld;
    let lowRolls = oldTotal < newTotal ? trueOld : trueNew;
    for(let i = 0; i < highRolls.length; i++) {
        let highRoll = highRolls[i];
        let lowRoll = lowRolls[i];
        for (let j = 0; j < highRoll.terms.length; j++) {
            let term = highRoll.terms[j];
            if (term.isDeterministic) continue;
            let lowTerm = lowRoll.terms[j];
            for (let result of lowTerm.results) {
                result.active = false;
                result.hidden = true;
                result.rerolled = true;
                term.results.push(result);
            }
        }
    }
    let newDamageRolls = workflow.damageRolls;
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        newDamageRolls[i] = highRolls[i];
    }
    await workflow.setDamageRolls(newDamageRolls);
}
export let savageAttacker = {
    name: 'Savage Attacker',
    version: '1.5.10',
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
    }
};
