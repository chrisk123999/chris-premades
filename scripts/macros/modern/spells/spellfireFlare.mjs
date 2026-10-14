import {tokenUtils, workflowUtils} from '../../../proxy.mjs';
function attack({workflow}) {
    const targetToken = workflow.targets.first();
    if (!targetToken) return;
    const cover = tokenUtils.checkCover(workflow.token.document, targetToken.document, {activity: workflow.activity});
    if (![2, 5].includes(cover)) return;
    workflowUtils.addAttackRollPart(workflow, cover);
}
export const spellfireFlare = {
    name: 'Spellfire Flare',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'activityAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ]
};
