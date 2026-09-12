import {actorUtils, workflowUtils} from '../../proxy.mjs';
async function macroConditions({workflow}) {
    workflowUtils.addMacroConditions(workflow, 'prone');
}
async function fail({workflow}) {
    await Promise.all(workflow.failedSaves.map(async token => {
        if (!token.actor) return;
        await actorUtils.applyConditions(token.actor, ['prone']);
    }));
}
export const proneOnFail = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: macroConditions,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: fail,
            priority: 50
        }
    ]
};
