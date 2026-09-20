import {workflowUtils} from '../../../../../proxy.mjs';
async function late({document, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageList) return;
    if (!workflow.damageList.some(damage => damage.oldHP > 0 && damage.newHP === 0)) return;
    await workflowUtils.completeItemUse(document, [workflow.token.document]);
}
export const darkOnesBlessing = {
    name: 'Dark One\'s Blessing',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorRollFinished', macro: late, priority: 50}
    ]
};
