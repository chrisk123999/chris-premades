import {tokenUtils} from '../../../../proxy.mjs';
async function moved({workflow}) {
    if (!workflow.token) return;
    for (const target of workflow.hitTargets.documents) await tokenUtils.displaceToken(target, {sourceToken: workflow.token.document, range: 5});
}
export const combatMasteryBrutal = {
    name: 'Combat Mastery: Brutal',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: moved,
            priority: 50
        }
    ]
};
