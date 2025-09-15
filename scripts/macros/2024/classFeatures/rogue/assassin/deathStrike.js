import {itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow['chris-premades']?.deathStrike) return;
    let deathStrikeWorkflow = await workflowUtils.syntheticItemRoll(item, [workflow.targets.first()]);
    if (!deathStrikeWorkflow.failedSaves.size) return;
    let multiplier = itemUtils.getConfig(item, 'multiplier');
    workflow.damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        let formula = '(' + roll.formula + ') * ' + multiplier;
        return await rollUtils.damageRoll(formula, workflow.activity, roll.options);
    }));
}
export let deathStrike = {
    name: 'Death Strike',
    version: '1.3.56',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 1000
            }
        ]
    },
    config: [
        {
            value: 'multiplier',
            label: 'CHRISPREMADES.Config.Multiplier',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        }
    ]
};