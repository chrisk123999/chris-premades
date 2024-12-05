import {tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targets = tokenUtils.findNearby(workflow.targets.first(), 5, 'ally');
    if (!targets.length) return;
    let defaultDamageType = workflow.defaultDamageType;
    await workflowUtils.applyDamage(targets, workflow.damageTotal, defaultDamageType);
}
export let maddeningHex = {
    name: 'Eldritch Invocations: Maddening Hex',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};