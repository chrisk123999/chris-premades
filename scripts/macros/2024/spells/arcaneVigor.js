import {activityUtils, dialogUtils, genericUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger, workflow}) {
    let selection = await dialogUtils.selectHitDie(workflow.actor, workflow.item.name, 'CHRISPREMADES.Macros.ArcaneVigor.Choose', {max: workflowUtils.getCastLevel(workflow)});
    let formula = '';
    await Promise.all(selection.map(async i => {
        if (!i.amount) return;
        if (formula.length) formula += ' + ';
        formula += i.amount + i.document.system.hd.denomination;
        await genericUtils.update(i.document, {'system.hd.spent': i.document.system.hd.spent + i.amount});
    }));
    if (formula.length) formula += ' + ';
    formula += activityUtils.getMod(workflow.activity);
    let roll = await rollUtils.damageRoll(formula, workflow.activity, workflow.damageRolls[0].options);
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