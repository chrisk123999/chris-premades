import {dialogUtils, workflowUtils} from '../../../../utils.js';
async function context({trigger}) {
    return {label: 'CHRISPREMADES.Macros.GreaterSanguineCurse.Sunlight', type: 'disadvantage'};
}
async function early({trigger: {entity: item}, workflow}) {
    if (workflow.disadvantage) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.GreaterSanguineCurse.Attack', {buttons: 'yesNo'});
    if (!selection) return;
    workflow.tracker.disadvantage.add(item.name, item.name);
}
export let greaterSanguineCurse = {
    name: 'Stage 2 Flaw: Greater Sanguine Curse',
    version: '1.5.4',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
                macro: early,
                priority: 50
            }
        ]
    },
    check: [
        {
            pass: 'context',
            macro: context,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'context',
            macro: context,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'context',
            macro: context,
            priority: 50
        }
    ],
    toolCheck: [
        {
            pass: 'context',
            macro: context,
            priority: 50
        }
    ]
};