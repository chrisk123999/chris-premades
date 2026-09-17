import {automationUtils, rollUtils, tokenUtils} from '../../proxy.mjs';
async function fail({document: activity, workflow}) {
    const formula = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'pushOnFail', 'distance');
    const distance = (await rollUtils.rollDice(formula, {document: activity}))?.total ?? 5;
    await Promise.all(workflow.failedSaves.map(async token => {
        if (token.actor) await tokenUtils.slideToken(token.document, {distance, sourceToken: workflow.token.document});
    }));
}
export const pushOnFail = {
    rules: 'all',
    version: '2.0.3',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: fail,
            priority: 50
        }
    ],
    genericConfig: {
        distance: {
            default: '5',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance'
        }
    }
};
