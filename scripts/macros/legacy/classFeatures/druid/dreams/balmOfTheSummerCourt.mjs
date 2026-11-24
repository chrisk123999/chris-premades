import {workflowUtils} from '../../../../../proxy.mjs';
async function use({workflow}) {
    if (workflow.activity.identifier !== 'balm' || !workflow.targets.size) return;
    const dice = workflow.damageRolls?.[0]?.dice?.reduce((total, die) => total + die.number, 0);
    if (dice) await workflowUtils.applyDamage(workflow.targets.documents, dice, 'temphp');
}
export const balmOfTheSummerCourt = {
    name: 'Balm of the Summer Court',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
