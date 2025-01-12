import {dialogUtils, genericUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger, workflow}) {
    let selection = await dialogUtils.selectHitDie(workflow.actor, workflow.item.name, 'CHRISPREMADES.Macros.ArcaneVigor.Choose', {max: workflow.castData.castLevel});
    let formula = '';
    await Promise.all(selection.map(async i => {
        if (!i.amount) return;
        formula += i.amount + i.document.system.hitDice;
        await genericUtils.update(i.document, {'system.hitDiceUsed': i.document.system.hitDiceUsed + i.amount});
    }));
    let roll = await rollUtils.damageRoll(formula, workflow.actor, workflow.damageRolls[0].options);
    await workflow.setDamageRolls([roll]);
}
export let arcaneVigor = {
    name: 'Arcane Vigor',
    version: '1.1.12',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};