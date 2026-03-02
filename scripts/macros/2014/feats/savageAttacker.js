import {combatUtils, dialogUtils, genericUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || item.system.uses.value == 0 || !workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    let numWeaponDamageRolls = workflow.activity.damage.parts.length;
    let damageTotal = 0;
    let damageAverage = 0;
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        damageTotal += workflow.damageRolls[i].total;
        const minRoll = await Roll.create(workflow.damageRolls[i].formula).evaluate({ minimize: true });
        const maxRoll = await Roll.create(workflow.damageRolls[i].formula).evaluate({ maximize: true });
        damageAverage += ((await minRoll).total + (await maxRoll).total) / 2;
    }
    damageAverage = Math.ceil(damageAverage);
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseWeaponDamageTotalWithAverage', {itemName: item.name, damageTotal: damageTotal, damageAverage: damageAverage}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [], {consumeResources: combatUtils.inCombat(), consumeUsage: combatUtils.inCombat()});
    let trueOld = [];
    let trueNew = [];
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        let currRoll = workflow.damageRolls[i];
        trueOld.push(currRoll);
        trueNew.push(await rollUtils.damageRoll(currRoll.formula, workflow.activity, currRoll.options));
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
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};