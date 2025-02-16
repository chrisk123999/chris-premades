import {genericUtils, tokenUtils} from '../../../../../utils.js';

async function early({workflow}) {
    if (tokenUtils.getLightLevel(workflow.token) !== 'bright') return;
    workflow.aborted = true;
    genericUtils.notify('CHRISPREMADES.Macros.OneWithShadows.Bright', 'info');
}
export let oneWithShadows = {
    name: 'Eldritch Invocations: One with Shadows',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: early,
                priority: 50
            }
        ]
    }
};